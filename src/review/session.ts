// Review-session planning (D-033) — pure.
//
// Three evidence-based choices:
// 1. Most-at-risk first: when more is due than one session holds, take the
//    items with the lowest predicted recall (FSRS retrievability) — the ones
//    closest to being forgotten gain the most from retrieval now.
// 2. A bounded session: a short, finishable session beats an open-ended
//    backlog. Anki users' "review debt" is a well-known cause of abandonment;
//    whatever doesn't fit stays due and leads the next session.
// 3. Interleaving: items are dealt round-robin across modules so consecutive
//    questions come from different topics. Mixed practice forces the learner
//    to identify *which* idea applies, the skill blocked practice never
//    exercises (Brunmair & Richter 2019 meta-analysis: g = 0.42 overall,
//    g = 0.34 for maths).

import type { ReviewState } from '../progress';
import { MS_PER_DAY, retrievability } from '../progress';

export const DEFAULT_SESSION_SIZE = 12;

/** Predicted recall right now for a queue row (FSRS memory, or its SM-2 interval as a stand-in). */
export function predictedRecall(row: ReviewState, now: number): number {
  const stability = row.stability ?? Math.max(0.5, row.intervalDays);
  return retrievability((now - row.lastReviewedAt) / MS_PER_DAY, stability);
}

/** Deal items round-robin by module, preserving each module's internal order. */
export function interleaveByModule<T extends { moduleId: string }>(items: readonly T[]): T[] {
  const queues = new Map<string, T[]>();
  for (const item of items) {
    const q = queues.get(item.moduleId);
    if (q) q.push(item);
    else queues.set(item.moduleId, [item]);
  }
  const out: T[] = [];
  const lanes = [...queues.values()];
  while (out.length < items.length) {
    for (const lane of lanes) {
      const next = lane.shift();
      if (next) out.push(next);
    }
  }
  return out;
}

/** Choose and order one session's items from the rows currently due. */
export function planSession(
  due: readonly ReviewState[],
  now: number,
  size: number = DEFAULT_SESSION_SIZE,
): ReviewState[] {
  const atRiskFirst = [...due].sort(
    (a, b) => predictedRecall(a, now) - predictedRecall(b, now) || a.dueAt - b.dueAt,
  );
  return interleaveByModule(atRiskFirst.slice(0, size));
}
