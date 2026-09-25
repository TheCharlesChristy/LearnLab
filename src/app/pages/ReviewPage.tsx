// Review page (D-033; originally the D-021 scheduling queue). A real,
// bounded retrieval session over everything the learner has met — lesson
// checkpoints, quiz and assessment questions, flashcards:
//
//   1. Plan: at most DEFAULT_SESSION_SIZE of the due items, most-at-risk
//      first, interleaved across modules (src/review/session.ts).
//   2. Ask: each item is resolved back to its actual question and asked for
//      real — the learner retrieves, then locks in with a confidence level
//      (src/review/ReviewCard.tsx).
//   3. Relearn: a miss comes back once at the end of the session, so every
//      item ends the session answered correctly — successive relearning
//      (Rawson & Dunlosky 2022). The second pass is recorded as a same-day
//      review, which FSRS deliberately credits far less than a spaced one.
//   4. Debrief: recall rate, confident errors caught, calibration, and when
//      the next items come due.

import { BrainCircuit, CalendarClock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import {
  calibrationInsight,
  dueReviewItems,
  recordCalibration,
  recordEngagementEvent,
  recordReview,
  removeReviewItem,
  useCalibration,
  useReviewForecast,
} from '../../progress';
import { planSession, resolveReviewItem, ReviewCard } from '../../review';
import type { CardResult, ResolvedReviewItem } from '../../review';
import { Button, Card, ProgressBar, Spinner, celebrate } from '../../ui';
import { describeEngagementEvent } from '../engagement-copy';
import { Breadcrumb } from '../shared';
import { reviewMinutes as minutesFor, whenDue } from '../when-due';

const CRUMBS = [{ label: 'Catalogue', to: '/' }, { label: 'Review' }];

interface QueueEntry {
  item: ResolvedReviewItem;
  relearning: boolean;
}

interface SessionStats {
  reviewed: number;
  recalled: number;
  confidentErrors: number;
}

type Phase =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'intro'; queue: QueueEntry[]; backlog: number; removed: number }
  | { kind: 'active'; queue: QueueEntry[]; position: number; backlog: number }
  | { kind: 'done'; stats: SessionStats; backlog: number };

async function prepareSession(): Promise<Phase> {
  const now = Date.now();
  const due = await dueReviewItems(now);
  if (due.length === 0) return { kind: 'empty' };
  const planned = planSession(due, now);
  const resolved = await Promise.all(planned.map((r) => resolveReviewItem(r.moduleId, r.itemId)));
  const queue: QueueEntry[] = [];
  let removed = 0;
  for (const r of resolved) {
    if ('missing' in r) {
      // Content that no longer exists can never be reviewed again; a load
      // error (offline, flaky host) just sits this session out.
      if (r.reason === 'not-found') {
        removed += 1;
        void removeReviewItem(r.moduleId, r.itemId);
      }
    } else {
      queue.push({ item: r, relearning: false });
    }
  }
  const backlog = due.length - planned.length;
  if (queue.length === 0) return { kind: 'empty' };
  return { kind: 'intro', queue, backlog, removed };
}

function EmptyState() {
  const forecast = useReviewForecast();
  if (!forecast) return <Spinner label="Checking your review queue…" />;
  if (forecast.total === 0) {
    return (
      <Card>
        <h2 className="text-lg font-semibold">Your review queue fills up as you learn</h2>
        <p className="mt-2 text-slate-700 dark:text-slate-300">
          Every checkpoint you answer in a lesson, and every quiz question, comes back here just as
          you&rsquo;re about to forget it. Retrieving it then is what turns “I followed that” into
          “I know that”.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 dark:bg-indigo-500"
        >
          Find a lesson
        </Link>
      </Card>
    );
  }
  return (
    <Card>
      <div className="flex items-start gap-3">
        <CalendarClock aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-indigo-600 dark:text-indigo-300" />
        <div>
          <h2 className="text-lg font-semibold">All caught up</h2>
          <p className="mt-1 text-slate-700 dark:text-slate-300">
            Nothing is due right now.
            {forecast.nextDueAt !== null && <> Your next review is due {whenDue(forecast.nextDueAt)}.</>}
            {forecast.dueThisWeek > 0 && <> {forecast.dueThisWeek} items come due this week.</>}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Reviewing early feels productive but helps less: memory gains most when a little
            forgetting has set in first. You&rsquo;re tracking {forecast.total} items; predicted
            recall is {Math.round((forecast.recall ?? 0) * 100)}% right now.
          </p>
        </div>
      </div>
    </Card>
  );
}

function Intro({
  count,
  backlog,
  removed,
  onStart,
}: {
  count: number;
  backlog: number;
  removed: number;
  onStart: () => void;
}) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <BrainCircuit aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-indigo-600 dark:text-indigo-300" />
        <div>
          <h2 className="text-lg font-semibold">
            {count} {count === 1 ? 'item' : 'items'} to review · about {minutesFor(count)} min
          </h2>
          <p className="mt-2 text-slate-700 dark:text-slate-300">
            A mix from across your modules, weakest first. Some will feel hard to pull back up —
            that effort is the point. Struggling to recall something strengthens it far more than
            re-reading it would.
          </p>
          {backlog > 0 && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {backlog} more are due; they&rsquo;ll lead your next session. Short, regular sessions
              beat one long catch-up.
            </p>
          )}
          {removed > 0 && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {removed} {removed === 1 ? 'item was' : 'items were'} removed because the content no longer exists.
            </p>
          )}
          <Button className="mt-4" onClick={onStart}>
            Start review
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Debrief({ stats, backlog, onMore }: { stats: SessionStats; backlog: number; onMore: () => void }) {
  const forecast = useReviewForecast();
  const calibration = useCalibration();
  const insight = calibration ? calibrationInsight(calibration) : null;
  const pct = stats.reviewed > 0 ? Math.round((stats.recalled / stats.reviewed) * 100) : 0;
  return (
    <Card>
      <h2 className="text-lg font-semibold">Session complete</h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-600 dark:text-slate-400">Recalled first time</dt>
          <dd className="text-2xl font-bold tabular-nums">
            {stats.recalled}/{stats.reviewed}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-600 dark:text-slate-400">Recall rate</dt>
          <dd className="text-2xl font-bold tabular-nums">{pct}%</dd>
        </div>
        {stats.confidentErrors > 0 && (
          <div>
            <dt className="text-xs text-slate-600 dark:text-slate-400">Confident mistakes fixed</dt>
            <dd className="text-2xl font-bold tabular-nums">{stats.confidentErrors}</dd>
          </div>
        )}
      </dl>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
        {stats.reviewed > stats.recalled && (
          <li>Everything you missed was relearned before the end — those items come back tomorrow.</li>
        )}
        {stats.confidentErrors > 0 && (
          <li>
            The {stats.confidentErrors === 1 ? 'mistake' : 'mistakes'} you were sure about{' '}
            {stats.confidentErrors === 1 ? 'is' : 'are'} often the ones people remember best once
            corrected.
          </li>
        )}
        {insight && <li>{insight}</li>}
        {forecast && forecast.dueNow === 0 && forecast.nextDueAt !== null && (
          <li>Next review due {whenDue(forecast.nextDueAt)}.</li>
        )}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to="/"
          className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 dark:bg-indigo-500"
        >
          Back to learning
        </Link>
        {backlog > 0 && (
          <Button variant="secondary" onClick={onMore}>
            Review {Math.min(backlog, 12)} more
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function ReviewPage() {
  const [params] = useSearchParams();
  const autoStart = params.get('start') === '1';
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const [stats, setStats] = useState<SessionStats>({ reviewed: 0, recalled: 0, confidentErrors: 0 });
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setPhase({ kind: 'loading' });
    void prepareSession().then((p) => {
      if (cancelled) return;
      if (p.kind === 'intro' && (autoStart || sessionKey > 0)) {
        setStats({ reviewed: 0, recalled: 0, confidentErrors: 0 });
        setPhase({ kind: 'active', queue: p.queue, position: 0, backlog: p.backlog });
      } else {
        setPhase(p);
      }
    });
    return () => {
      cancelled = true;
    };
    // autoStart is read once per session load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

  function start() {
    if (phase.kind !== 'intro') return;
    setStats({ reviewed: 0, recalled: 0, confidentErrors: 0 });
    setPhase({ kind: 'active', queue: phase.queue, position: 0, backlog: phase.backlog });
  }

  function handleResult(result: CardResult) {
    if (phase.kind !== 'active') return;
    const entry = phase.queue[phase.position];
    if (!entry) return;
    const { moduleId, itemId } = entry.item;
    // Fire-and-forget writes; failures surface via the progress layer's toast.
    void recordReview(moduleId, itemId, result.grade);
    if (result.confidence) void recordCalibration(result.confidence, result.correct);

    let nextStats = stats;
    if (!entry.relearning) {
      nextStats = {
        reviewed: stats.reviewed + 1,
        recalled: stats.recalled + (result.correct ? 1 : 0),
        confidentErrors:
          stats.confidentErrors + (!result.correct && result.confidence === 'sure' ? 1 : 0),
      };
      setStats(nextStats);
    }
    const queue =
      !result.correct && !entry.relearning
        ? [...phase.queue, { item: entry.item, relearning: true }]
        : phase.queue;
    const position = phase.position + 1;
    if (position < queue.length) {
      setPhase({ ...phase, queue, position });
      return;
    }
    setPhase({ kind: 'done', stats: nextStats, backlog: phase.backlog });
    const event = {
      kind: 'review-session-complete' as const,
      recalled: nextStats.recalled,
      reviewed: nextStats.reviewed,
    };
    void recordEngagementEvent(event).then((r) => {
      if (r) celebrate({ message: describeEngagementEvent(event, r) });
    });
  }

  return (
    <div>
      <Breadcrumb crumbs={CRUMBS} />
      <h1 className="mb-5 text-2xl font-bold">Review</h1>
      <div className="mx-auto max-w-xl">
        {phase.kind === 'loading' && <Spinner label="Preparing your review…" />}
        {phase.kind === 'empty' && <EmptyState />}
        {phase.kind === 'intro' && (
          <Intro
            count={phase.queue.length}
            backlog={phase.backlog}
            removed={phase.removed}
            onStart={start}
          />
        )}
        {phase.kind === 'active' && (() => {
          const entry = phase.queue[phase.position]!;
          const firstPassTotal = phase.queue.filter((e) => !e.relearning).length;
          const { source } = entry.item;
          return (
            <section aria-label="Review item" className="flex flex-col gap-4">
              <ProgressBar
                value={(phase.position / phase.queue.length) * 100}
                label={`Item ${phase.position + 1} of ${phase.queue.length}`}
              />
              <p role="status" aria-live="polite" className="text-sm font-medium">
                {entry.relearning
                  ? 'Second pass — you missed this one earlier'
                  : `Item ${Math.min(phase.position + 1, firstPassTotal)} of ${firstPassTotal}`}
              </p>
              <div className="rounded-lg border border-slate-200 bg-surface p-4 dark:border-slate-700 dark:bg-surface-dark">
                <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
                  {source.lessonTitle ? `${source.lessonTitle} · ` : ''}
                  {source.moduleTitle}
                </p>
                <ReviewCard
                  key={`${entry.item.moduleId}|${entry.item.itemId}|${entry.relearning}`}
                  item={entry.item}
                  attempt={entry.relearning ? 1 : 0}
                  relearning={entry.relearning}
                  onDone={handleResult}
                />
              </div>
            </section>
          );
        })()}
        {phase.kind === 'done' && (
          <Debrief
            stats={phase.stats}
            backlog={phase.backlog}
            onMore={() => setSessionKey((k) => k + 1)}
          />
        )}
      </div>
    </div>
  );
}
