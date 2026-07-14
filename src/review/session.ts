import type { ReviewGrade, ReviewState } from '../progress';

import type { ReviewCatalogue, ReviewCatalogueItem } from './catalogue';

export const MIXED_REVIEW_SESSION_SCHEMA_VERSION = 1 as const;
export const MIXED_REVIEW_SESSION_MAX_ITEMS = 8;
export const MIXED_REVIEW_SESSION_STORAGE_KEY = 'learnlab:mixed-review-session:v1';

export interface MixedReviewSessionItem {
  ownerId: string;
  itemId: string;
  dueAt: number;
  catalogueItem?: ReviewCatalogueItem;
}

export interface MixedReviewSession {
  schemaVersion: typeof MIXED_REVIEW_SESSION_SCHEMA_VERSION;
  id: string;
  items: readonly MixedReviewSessionItem[];
  currentIndex: number;
  submittedKeys: readonly string[];
}

export interface GradePlan {
  session: MixedReviewSession;
  grade?: ReviewGrade;
  item?: MixedReviewSessionItem;
  shouldSchedule: boolean;
}

function itemKey(item: Pick<MixedReviewSessionItem, 'ownerId' | 'itemId'>): string {
  return `${item.ownerId}\u0000${item.itemId}`;
}

function stableRows(rows: readonly ReviewState[]): ReviewState[] {
  return [...rows].sort((left, right) =>
    left.dueAt - right.dueAt || left.moduleId.localeCompare(right.moduleId) || left.itemId.localeCompare(right.itemId),
  );
}

function lookup(catalogue: ReviewCatalogue | undefined, row: ReviewState): ReviewCatalogueItem | undefined {
  return catalogue?.items.find((item) => item.ownerId === row.moduleId && item.id === row.itemId);
}

function sharesSkill(left: MixedReviewSessionItem, right: MixedReviewSessionItem): boolean {
  const leftSkills = left.catalogueItem?.skillIds ?? [];
  const rightSkills = new Set(right.catalogueItem?.skillIds ?? []);
  return leftSkills.some((skill) => rightSkills.has(skill));
}

/** Deterministically interleave due items, preferring a new owner and skill set each turn. */
export function selectMixedReviewSession(
  dueItems: readonly ReviewState[],
  catalogue?: ReviewCatalogue,
  maximum = MIXED_REVIEW_SESSION_MAX_ITEMS,
): MixedReviewSession {
  const remaining = stableRows(dueItems).map((row) => ({
    ownerId: row.moduleId,
    itemId: row.itemId,
    dueAt: row.dueAt,
    ...(lookup(catalogue, row) ? { catalogueItem: lookup(catalogue, row) } : {}),
  }));
  const items: MixedReviewSessionItem[] = [];
  while (remaining.length > 0 && items.length < maximum) {
    const previous = items.at(-1);
    const bestIndex = remaining.findIndex((candidate) =>
      !previous || (candidate.ownerId !== previous.ownerId && !sharesSkill(candidate, previous)),
    );
    const ownerIndex = remaining.findIndex((candidate) => !previous || candidate.ownerId !== previous.ownerId);
    const index = bestIndex >= 0 ? bestIndex : ownerIndex >= 0 ? ownerIndex : 0;
    const [next] = remaining.splice(index, 1);
    if (next) items.push(next);
  }
  const id = items.map(itemKey).join('|');
  return {
    schemaVersion: MIXED_REVIEW_SESSION_SCHEMA_VERSION,
    id,
    items,
    currentIndex: 0,
    submittedKeys: [],
  };
}

export function currentMixedReviewItem(session: MixedReviewSession): MixedReviewSessionItem | undefined {
  return session.items[session.currentIndex];
}

/**
 * Advances locally before the scheduler call. Repeating the same grade click
 * returns shouldSchedule=false, so callers cannot double-schedule an item.
 */
export function planMixedReviewGrade(
  session: MixedReviewSession,
  grade: ReviewGrade,
): GradePlan {
  const item = currentMixedReviewItem(session);
  if (!item) return { session, grade, shouldSchedule: false };
  const key = itemKey(item);
  if (session.submittedKeys.includes(key)) return { session, grade, item, shouldSchedule: false };
  return {
    grade,
    item,
    shouldSchedule: true,
    session: {
      ...session,
      currentIndex: Math.min(session.currentIndex + 1, session.items.length),
      submittedKeys: [...session.submittedKeys, key],
    },
  };
}

/** Drops an unavailable activity from this browser-local session without writing a review grade. */
export function skipMixedReviewItem(session: MixedReviewSession): MixedReviewSession {
  const item = currentMixedReviewItem(session);
  if (!item) return session;
  const key = itemKey(item);
  if (session.submittedKeys.includes(key)) return session;
  return {
    ...session,
    currentIndex: Math.min(session.currentIndex + 1, session.items.length),
    submittedKeys: [...session.submittedKeys, key],
  };
}

/** Adds current catalogue metadata to a saved session without changing its selection or order. */
export function hydrateMixedReviewSession(
  session: MixedReviewSession,
  catalogue: ReviewCatalogue | undefined,
): MixedReviewSession {
  if (!catalogue) return session;
  let changed = false;
  const items = session.items.map((item) => {
    const catalogueItem = catalogue.items.find(
      (candidate) => candidate.ownerId === item.ownerId && candidate.id === item.itemId,
    );
    if (!catalogueItem || catalogueItem === item.catalogueItem) return item;
    changed = true;
    return { ...item, catalogueItem };
  });
  if (!changed) return session;
  return {
    ...session,
    items,
  };
}

function validSession(value: unknown): value is MixedReviewSession {
  if (typeof value !== 'object' || value === null) return false;
  const session = value as Partial<MixedReviewSession>;
  return session.schemaVersion === MIXED_REVIEW_SESSION_SCHEMA_VERSION
    && typeof session.id === 'string'
    && Array.isArray(session.items)
    && Number.isInteger(session.currentIndex)
    && Array.isArray(session.submittedKeys);
}

/** Browser-local resume; failure to access storage simply starts a fresh session. */
export function loadMixedReviewSession(): MixedReviewSession | undefined {
  try {
    const raw = window.localStorage.getItem(MIXED_REVIEW_SESSION_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    return validSession(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function saveMixedReviewSession(session: MixedReviewSession | undefined): void {
  try {
    if (!session) window.localStorage.removeItem(MIXED_REVIEW_SESSION_STORAGE_KEY);
    else window.localStorage.setItem(MIXED_REVIEW_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Session remains usable for the current page even in restricted storage.
  }
}

/** Restores only a session whose selected items are still due; otherwise safely starts over. */
export function resumeMixedReviewSession(
  dueItems: readonly ReviewState[],
  saved = loadMixedReviewSession(),
): MixedReviewSession | undefined {
  if (!saved) return undefined;
  const due = new Set(dueItems.map((item) => `${item.moduleId}\u0000${item.itemId}`));
  if (saved.items.some((item) => !due.has(itemKey(item)) && !saved.submittedKeys.includes(itemKey(item)))) {
    return undefined;
  }
  return saved;
}
