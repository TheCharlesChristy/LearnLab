// Renderable review items (D-033). The review queue (src/progress,
// `reviewState`) stores only (moduleId, itemId) plus a schedule; the resolver
// (./resolve.ts) turns each row back into the actual question, so a review
// session asks the learner to *retrieve* the answer instead of self-grading
// an opaque id.

/** Where a review item came from — the context header on its card. */
export interface ReviewItemSource {
  moduleId: string;
  moduleTitle: string;
  courseTitle: string;
  /** The lesson it came from, when it came from a lesson (not an assessment). */
  lessonTitle?: string;
  /** App route back to the source (lesson or module page). */
  href: string;
}

/** Pick-one or pick-all-that-apply (quiz mcq/multi, tap-choice screens). */
export interface ChoiceCard {
  kind: 'choice';
  prompt: string;
  choices: string[];
  /** Indices of the correct choice(s); length 1 unless `multi`. */
  correct: number[];
  multi: boolean;
  /** Per-choice misconception feedback, when the source has it (tap-choice). */
  choiceFeedback?: (string | undefined)[];
  explanation?: string;
}

/** Generation: numeric or short text (quiz numeric/text, entry and faded-step screens). */
export interface EntryCard {
  kind: 'entry';
  prompt: string;
  /** Worked steps shown above the prompt (faded-step screens). */
  context?: string;
  inputMode: 'numeric' | 'text';
  answer?: number;
  tolerance?: number;
  unit?: string;
  accept?: string[];
  caseSensitive?: boolean;
  /** Human-readable model answer, when one can be derived. */
  displayAnswer?: string;
  explanation?: string;
}

/** Free recall then self-grade (flashcards, flash-recall screens). */
export interface RecallCard {
  kind: 'recall';
  front: string;
  back: string;
}

/** Match every left item to its right partner (sort-match screens). */
export interface MatchCard {
  kind: 'match';
  prompt: string;
  pairs: { left: string; right: string }[];
  explanation?: string;
}

export type ReviewCardContent = ChoiceCard | EntryCard | RecallCard | MatchCard;

export interface ResolvedReviewItem {
  moduleId: string;
  itemId: string;
  source: ReviewItemSource;
  card: ReviewCardContent;
}

/** The row's content no longer exists (removed module/lesson/question) or failed to load. */
export interface UnresolvedReviewItem {
  moduleId: string;
  itemId: string;
  missing: true;
  reason: 'not-found' | 'load-error';
}

export type ReviewItemResolution = ResolvedReviewItem | UnresolvedReviewItem;
