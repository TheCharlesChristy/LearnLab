// Review page (§13 roadmap, D-021): lists the spaced-repetition queue items
// that are due now and lets the learner grade them one at a time,
// Anki/flashcards-style. This is a scheduling queue, not a content viewer —
// it has no access to lesson/card markup, so each item is shown as a plain
// `moduleId`/`itemId` label with a link back to the source module.

import { useRef } from 'react';
import { Link } from 'react-router';

import { recordReview, useDueReviewItems } from '../../progress';
import type { ReviewGrade, ReviewState } from '../../progress';
import { Button, Card, Spinner } from '../../ui';
import { Breadcrumb } from '../shared';

const CRUMBS = [{ label: 'Catalogue', to: '/' }, { label: 'Review' }];

/** Coarse "just now" / "N units ago" formatter — no i18n needed for this small note. */
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

function ReviewSession({
  item,
  remaining,
  sessionTotal,
}: {
  item: ReviewState;
  remaining: number;
  sessionTotal: number;
}) {
  // Position within the session: how many of the session's original items
  // have been cleared so far (+1 for the one currently shown).
  const position = Math.min(sessionTotal, Math.max(1, sessionTotal - remaining + 1));

  function grade(g: ReviewGrade) {
    // Fire-and-forget: the progress layer surfaces write failures via its
    // own toast (NFR-REL-001); `useDueReviewItems` re-renders this page with
    // the next due item once the write lands, so there's nothing more to do
    // here.
    void recordReview(item.moduleId, item.itemId, g);
  }

  return (
    <div>
      <p role="status" aria-live="polite" className="mb-4 text-sm font-medium">
        Reviewing {position} of {sessionTotal} due
      </p>

      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Module: <span className="font-medium text-slate-900 dark:text-slate-100">{item.moduleId}</span>
          {' · '}
          Item: <span className="font-medium text-slate-900 dark:text-slate-100">{item.itemId}</span>
        </p>
        <p className="mt-2">
          <Link
            to={`/module/${item.moduleId}`}
            className="rounded font-medium text-indigo-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-300"
          >
            Go to module
          </Link>
        </p>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Also shows: {item.easinessFactor.toFixed(2)} EF, {item.repetitions} reps, last graded{' '}
          {timeAgo(item.lastReviewedAt)}.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="danger" onClick={() => grade('again')}>
            Again
          </Button>
          <Button variant="primary" onClick={() => grade('good')}>
            Good
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function ReviewPage() {
  const dueItems = useDueReviewItems();

  // Captures "M" (session total) once per session: it's bumped up whenever
  // the live due-count exceeds the current session total (a fresh session,
  // or more items becoming due mid-session), and reset once the queue
  // empties so the next session starts fresh. Mutating a ref during render
  // like this is safe here — the update is idempotent for a given
  // `dueItems` snapshot and never triggers a re-render itself.
  const sessionTotalRef = useRef(0);
  if (dueItems !== undefined) {
    if (dueItems.length === 0) {
      sessionTotalRef.current = 0;
    } else if (dueItems.length > sessionTotalRef.current) {
      sessionTotalRef.current = dueItems.length;
    }
  }

  return (
    <div>
      <Breadcrumb crumbs={CRUMBS} />
      <h1 className="mb-5 text-2xl font-bold">Review</h1>

      {dueItems === undefined ? (
        <Spinner label="Loading review queue…" />
      ) : dueItems.length === 0 ? (
        <Card>
          <p className="text-slate-600 dark:text-slate-300">
            Nothing due for review right now — nice work!
          </p>
        </Card>
      ) : (
        <ReviewSession
          item={dueItems[0]!}
          remaining={dueItems.length}
          sessionTotal={sessionTotalRef.current}
        />
      )}
    </div>
  );
}
