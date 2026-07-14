// A bounded, deterministic cross-course session over the existing review scheduler.
// The session snapshot is deliberately browser-local: progress remains owned by
// `recordReview`, and a grade alone is not treated as mastery evidence.

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';

import { recordReview, useDueReviewItems } from '../../progress';
import type { ReviewGrade, ReviewState } from '../../progress';
import { Button, Card, Spinner } from '../../ui';
import { getActivityPlugin } from '../../experience/plugins';
import {
  currentMixedReviewItem,
  hydrateMixedReviewSession,
  loadReviewCatalogue,
  planMixedReviewGrade,
  resumeMixedReviewSession,
  saveMixedReviewSession,
  selectMixedReviewSession,
  skipMixedReviewItem,
} from '../../review';
import type { MixedReviewSession, MixedReviewSessionItem, ReviewCatalogueItem } from '../../review';
import { Breadcrumb } from '../shared';
import { useAsyncData } from '../useAsyncData';

const CRUMBS = [{ label: 'Catalogue', to: '/' }, { label: 'Review' }];

function timeAgo(ms: number): string {
  const diffSec = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} h ago`;
  const diffDay = Math.round(diffHour / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}

function LegacyReview({ item, onGrade, disabled }: { item: MixedReviewSessionItem; onGrade: (grade: ReviewGrade) => void; disabled: boolean }) {
  const live = item as MixedReviewSessionItem & Partial<ReviewState>;
  return (
    <Card>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Module: <span className="font-medium text-slate-900 dark:text-slate-100">{item.ownerId}</span>
        {' · '}Item: <span className="font-medium text-slate-900 dark:text-slate-100">{item.itemId}</span>
      </p>
      <p className="mt-2">
        <Link to={`/module/${item.ownerId}`} className="rounded font-medium text-indigo-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-300">
          Go to module
        </Link>
      </p>
      {typeof live.easinessFactor === 'number' ? (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Also shows: {live.easinessFactor.toFixed(2)} EF, {live.repetitions ?? 0} reps, last graded {timeAgo(live.lastReviewedAt ?? item.dueAt)}.
        </p>
      ) : null}
      <GradeButtons disabled={disabled} onGrade={onGrade} />
    </Card>
  );
}

function GradeButtons({ onGrade, disabled }: { onGrade: (grade: ReviewGrade) => void; disabled: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button variant="danger" disabled={disabled} onClick={() => onGrade('again')}>Again</Button>
      <Button variant="primary" disabled={disabled} onClick={() => onGrade('good')}>Good</Button>
    </div>
  );
}

function StandaloneReview({ item, onGrade, onSkip, disabled }: {
  item?: ReviewCatalogueItem;
  onGrade: (grade: ReviewGrade) => void;
  onSkip: () => void;
  disabled: boolean;
}) {
  const [outcomeRecorded, setOutcomeRecorded] = useState(false);
  useEffect(() => setOutcomeRecorded(false), [item?.ownerId, item?.id]);
  if (!item) {
    return (
      <Card role="alert">
        <h2 className="font-semibold">This review item is no longer available</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Its source content may have changed. You can skip it and continue this session.</p>
        <Button className="mt-3" onClick={onSkip} disabled={disabled}>Skip unavailable item</Button>
      </Card>
    );
  }
  const plugin = getActivityPlugin(item.activity.key);
  const Activity = plugin?.component;
  const activityAvailable = Boolean(Activity);
  return (
    <Card>
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{item.title}</p>
      <p className="mt-3 whitespace-pre-wrap">{item.standaloneContext}</p>
      <p className="mt-3 font-medium">{item.prompt}</p>
      {!Activity ? (
        <div role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
          This review activity is unavailable in this version of LearnLab.
          <Button className="mt-3" onClick={onSkip} disabled={disabled}>Skip unavailable item</Button>
        </div>
      ) : (
        <Suspense fallback={<Spinner label="Loading review activity…" />}>
          <Activity
            props={item.activity.props}
            context={{ seed: `review:${item.ownerId}:${item.id}`, activityInstanceId: item.id, attempt: 0 }}
            disabled={disabled}
            reportOutcome={() => setOutcomeRecorded(true)}
          />
        </Suspense>
      )}
      {activityAvailable && !outcomeRecorded ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Complete the activity before grading your recall.</p> : null}
      {outcomeRecorded ? <p aria-live="polite" className="mt-3 text-sm font-medium">Attempt recorded. Grade your recall:</p> : null}
      {activityAvailable ? <GradeButtons disabled={disabled || !outcomeRecorded} onGrade={onGrade} /> : null}
    </Card>
  );
}

function ReviewSession({ session, onSessionChange }: { session: MixedReviewSession; onSessionChange: (session: MixedReviewSession) => void }) {
  const item = currentMixedReviewItem(session);
  const [submitting, setSubmitting] = useState(false);
  const submittedKeys = useRef(new Set<string>());
  if (!item) return null;
  const position = session.currentIndex + 1;
  const grade = (grade: ReviewGrade) => {
    const key = `${item.ownerId}\u0000${item.itemId}`;
    if (submittedKeys.current.has(key)) return;
    const plan = planMixedReviewGrade(session, grade);
    if (!plan.shouldSchedule || !plan.item || !plan.grade) return;
    submittedKeys.current.add(key);
    onSessionChange(plan.session);
    setSubmitting(true);
    void recordReview(plan.item.ownerId, plan.item.itemId, plan.grade).finally(() => setSubmitting(false));
  };
  const skip = () => onSessionChange(skipMixedReviewItem(session));
  return (
    <div>
      <p role="status" aria-live="polite" className="mb-4 text-sm font-medium">Reviewing {position} of {session.items.length} mixed items</p>
      {item.ownerId.startsWith('v2:')
        ? <StandaloneReview item={item.catalogueItem} onGrade={grade} onSkip={skip} disabled={submitting} />
        : <LegacyReview item={item} onGrade={grade} disabled={submitting} />}
    </div>
  );
}

export default function ReviewPage() {
  const dueItems = useDueReviewItems();
  const catalogue = useAsyncData(loadReviewCatalogue, 'review-catalogue');
  const [session, setSession] = useState<MixedReviewSession>();
  const dueKey = useMemo(() => dueItems?.map((item) => `${item.moduleId}\u0000${item.itemId}\u0000${item.dueAt}`).sort().join('|'), [dueItems]);

  useEffect(() => {
    if (!dueItems) return;
    setSession((existing) => {
      // A running (or completed) bounded session keeps its chosen order even as the
      // scheduler removes graded rows from the live due queue.
      if (existing) {
        const hydrated = catalogue.status === 'ready' ? hydrateMixedReviewSession(existing, catalogue.data) : existing;
        if (hydrated !== existing) saveMixedReviewSession(hydrated);
        return hydrated;
      }
      if (dueItems.length === 0) return undefined;
      const restored = resumeMixedReviewSession(dueItems);
      const next = restored ?? selectMixedReviewSession(dueItems, catalogue.status === 'ready' ? catalogue.data : undefined);
      const hydrated = catalogue.status === 'ready' ? hydrateMixedReviewSession(next, catalogue.data) : next;
      saveMixedReviewSession(hydrated);
      return hydrated;
    });
  }, [catalogue, dueItems, dueKey]);

  const updateSession = (next: MixedReviewSession) => {
    setSession(next);
    saveMixedReviewSession(next.currentIndex >= next.items.length ? undefined : next);
  };
  const complete = session && session.currentIndex >= session.items.length;

  return (
    <div>
      <Breadcrumb crumbs={CRUMBS} />
      <h1 className="mb-5 text-2xl font-bold">Review</h1>
      {dueItems === undefined ? <Spinner label="Loading review queue…" /> : null}
      {dueItems !== undefined && complete ? (
        <Card>
          <h2 className="font-semibold">Review session complete</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Your scheduling updates are saved. Review grades are not treated as new mastery evidence.</p>
          <Link className="mt-3 inline-block font-medium text-indigo-700 underline dark:text-indigo-300" to="/">Return to learning</Link>
        </Card>
      ) : null}
      {dueItems !== undefined && !complete && session ? <ReviewSession session={session} onSessionChange={updateSession} /> : null}
      {dueItems !== undefined && !complete && !session && dueItems.length === 0 ? (
        <Card><p className="text-slate-600 dark:text-slate-300">Nothing due for review right now — nice work!</p></Card>
      ) : null}
    </div>
  );
}
