import type { ReviewItem } from '../experience';

export const REVIEW_CATALOGUE_SCHEMA_VERSION = 1 as const;

export interface ReviewCatalogueItem extends ReviewItem {
  /** Stable namespace used by the existing local review scheduler. */
  ownerId: string;
  contentVersion: string;
}

export interface ReviewCatalogue {
  schemaVersion: typeof REVIEW_CATALOGUE_SCHEMA_VERSION;
  items: readonly ReviewCatalogueItem[];
}

export class ReviewCatalogueLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewCatalogueLoadError';
  }
}

export function reviewCatalogueUrl(): string {
  return `${import.meta.env.BASE_URL}content/review-catalogue.json`;
}

let cached: Promise<ReviewCatalogue> | null = null;

export function clearReviewCatalogueCache(): void {
  cached = null;
}

/** A v2 pack's scheduler namespace; never overload a legacy module id. */
export function reviewOwnerId(packId: string): string {
  return `v2:${packId}`;
}

export function findReviewItem(
  catalogue: ReviewCatalogue,
  ownerId: string,
  itemId: string,
): ReviewCatalogueItem | undefined {
  return catalogue.items.find((item) => item.ownerId === ownerId && item.id === itemId);
}

export function loadReviewCatalogue(): Promise<ReviewCatalogue> {
  if (cached) return cached;
  const url = reviewCatalogueUrl();
  cached = fetch(url)
    .then(async (response) => {
      if (!response.ok)
        throw new ReviewCatalogueLoadError(
          `Could not load the review catalogue (HTTP ${response.status}).`,
        );
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || !('schemaVersion' in data)) {
        throw new ReviewCatalogueLoadError(
          'The review catalogue is malformed. Refresh after updating LearnLab.',
        );
      }
      const version = (data as { schemaVersion: unknown }).schemaVersion;
      if (version !== REVIEW_CATALOGUE_SCHEMA_VERSION) {
        throw new ReviewCatalogueLoadError(
          `The review catalogue uses unsupported schemaVersion ${String(version)}. Refresh after updating LearnLab.`,
        );
      }
      if (!Array.isArray((data as { items?: unknown }).items)) {
        throw new ReviewCatalogueLoadError('The review catalogue has no usable items.');
      }
      return data as ReviewCatalogue;
    })
    .catch((error: unknown) => {
      cached = null;
      throw error instanceof ReviewCatalogueLoadError
        ? error
        : new ReviewCatalogueLoadError(
            'Could not load the review catalogue. Check your connection and retry.',
          );
    });
  return cached;
}
