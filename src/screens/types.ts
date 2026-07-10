// Screen-sequence lesson data model — Brilliant rewrite Phase 1
// (docs/BRILLIANT_REWRITE_PLAN.md). Hand-written TS twin of
// schemas/screen-sequence.schema.json, same precedent as src/quiz/types.ts
// mirroring schemas/quiz.schema.json. Do not add a screen type here without
// adding its schema branch (and vice versa) — the two must stay in sync.

export interface ScreenSequence {
  schemaVersion: 1;
  id: string;
  title: string;
  screens: Screen[];
}

export type Screen =
  | PredictScreen
  | TapChoiceScreen
  | EntryScreen
  | ManipulableTargetScreen
  | FadedStepScreen
  | SortMatchScreen
  | FlashRecallScreen
  | RevealMechanismScreen;

/**
 * The signature Brilliant move (target spec #3): pose a question the learner
 * cannot yet confidently answer, make them commit, THEN reveal the
 * mechanism. `correctChoiceIndex` is optional — an open prediction with no
 * single "right" guess (e.g. "will it converge or diverge?") omits it, and
 * the reveal narrates the truth without marking the commit right/wrong.
 */
export interface PredictScreen {
  type: 'predict';
  id: string;
  /** Markdown. The question, posed before any teaching. */
  prompt: string;
  /** 2-4 prediction options. */
  choices: string[];
  correctChoiceIndex?: number;
  /** Markdown, shown immediately after commit — the mechanism + resolution. */
  reveal: string;
}

/** Full-screen mcq: reuses src/quiz/marking.ts's markMcq semantics verbatim. */
export interface TapChoiceScreen {
  type: 'tap-choice';
  id: string;
  prompt: string;
  /** 2-4 choices; `feedback` is misconception-targeted, shown on selection. */
  choices: { text: string; feedback?: string }[];
  correctIndex: number;
  successFeedback?: string;
  /** Ladder shown on repeated wrong attempts: nudge -> subgoal -> setup. Never the answer. */
  hints?: string[];
}

/** Generation-format entry: reuses src/quiz/marking.ts's numeric/text semantics verbatim. */
export interface EntryScreen {
  type: 'entry';
  id: string;
  prompt: string;
  inputMode: 'numeric' | 'text';
  answer?: number; // numeric
  tolerance?: number; // numeric
  unit?: string; // numeric, display only
  accept?: string[]; // text, ECMAScript regex sources, full-match
  caseSensitive?: boolean; // text, default false
  successFeedback?: string;
  hints?: string[];
}

export interface ManipulableTargetGoal {
  /** Each widget pairs with exactly one goal kind — see schemas/screen-sequence.schema.json's allOf. */
  kind: 'tangent-gradient-in-range' | 'match-frequency-in-range' | 'eigenvector-angle-in-range';
  min: number;
  max: number;
  /** Learner-facing statement of the goal, shown alongside the widget. */
  description: string;
}

/**
 * Wraps an existing explorable widget with a goal to hit instead of a bare
 * manipulable (target spec #4: interaction first, formalism second).
 * `function-grapher` pairs with `tangent-gradient-in-range`, `signal-scope`
 * with `match-frequency-in-range`, `eigen-playground` with
 * `eigenvector-angle-in-range`.
 */
export interface ManipulableTargetScreen {
  type: 'manipulable-target';
  id: string;
  prompt: string;
  widget: 'function-grapher' | 'signal-scope' | 'eigen-playground';
  widgetProps: {
    expr?: string;
    xmin?: number;
    xmax?: number;
    ymin?: number;
    ymax?: number;
    tangent?: boolean;
    grid?: boolean;
    sampleRate?: number;
    duration?: number;
    noiseAmount?: number;
    freqMin?: number;
    freqMax?: number;
    freqInit?: number;
    showSpectrum?: boolean;
    a?: number;
    c?: number;
    bMin?: number;
    bMax?: number;
    bInit?: number;
    showPoints?: boolean;
  };
  goal: ManipulableTargetGoal;
  successFeedback?: string;
  hints?: string[];
}

/**
 * Backward-faded worked example (target spec #6, extend-platform backlog
 * item 4): `worked` shows the already-solved steps, `prompt` blanks the
 * final one for the learner to supply. Reuses the same numeric/text marking
 * as `entry` — see checkGenerationAnswer in ./marking-helpers.ts.
 */
export interface FadedStepScreen {
  type: 'faded-step';
  id: string;
  /** Markdown: the worked steps already shown, up to the blanked final step. */
  worked: string;
  prompt: string;
  inputMode: 'numeric' | 'text';
  answer?: number;
  tolerance?: number;
  unit?: string;
  accept?: string[];
  caseSensitive?: boolean;
  successFeedback?: string;
  hints?: string[];
}

/** Click-to-select matching, generalizing the `matching-pairs` widget as a single screen. */
export interface SortMatchScreen {
  type: 'sort-match';
  id: string;
  prompt: string;
  /** 2-6 pairs; the right column is shuffled (seeded on screen id). */
  pairs: { left: string; right: string }[];
  successFeedback?: string;
}

/**
 * Single retrieval-practice card: attempt recall of `back` from `front`
 * BEFORE it's revealed (attempt-before-reveal, same family as `predict`),
 * then self-grade. Generalizes the `flashcards` widget's flip/self-grade
 * loop to one gated screen.
 */
export interface FlashRecallScreen {
  type: 'flash-recall';
  id: string;
  front: string; // markdown prompt/question
  back: string; // markdown answer
}

/**
 * A worked mechanism with a MANDATORY self-explanation prompt (target spec
 * #2: never a passive reveal). The learner must write something before the
 * model self-explanation and Continue become available — not graded, but
 * genuine generation is required, not just reading.
 */
export interface RevealMechanismScreen {
  type: 'reveal-mechanism';
  id: string;
  /** Markdown: the worked content up to the self-explanation point. */
  body: string;
  selfExplainPrompt: string;
  /** Markdown: the model self-explanation, shown once the learner has answered. */
  selfExplainAnswer: string;
}
