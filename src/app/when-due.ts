// Coarse, friendly phrasing for when a review comes due (D-033). Shared by
// the review page, home "Today" panel and lesson debrief.

/** "now" / "within the hour" / "later today" / "tomorrow" / "in 4 days". */
export function whenDue(at: number, now: number = Date.now()): string {
  const hours = (at - now) / 3_600_000;
  if (hours <= 0) return 'now';
  if (hours < 1) return 'within the hour';
  if (new Date(at).toDateString() === new Date(now).toDateString()) return 'later today';
  if (new Date(at).toDateString() === new Date(now + 86_400_000).toDateString()) return 'tomorrow';
  return `in ${Math.round(hours / 24)} days`;
}

/** Rough minutes for a review session of `n` items (~25 s each). */
export function reviewMinutes(n: number): number {
  return Math.max(1, Math.round((n * 25) / 60));
}
