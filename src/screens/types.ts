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

export type Screen = PredictScreen | TapChoiceScreen | EntryScreen | ManipulableTargetScreen;

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
  /** Phase 1 supports one goal kind on one widget; more join as later phases wrap more explorables. */
  kind: 'tangent-gradient-in-range';
  min: number;
  max: number;
  /** Learner-facing statement of the goal, shown alongside the widget. */
  description: string;
}

/**
 * Wraps an existing explorable widget with a goal to hit instead of a bare
 * manipulable (target spec #4: interaction first, formalism second). Phase 1
 * wraps `function-grapher` only.
 */
export interface ManipulableTargetScreen {
  type: 'manipulable-target';
  id: string;
  prompt: string;
  widget: 'function-grapher';
  widgetProps: {
    expr: string;
    xmin?: number;
    xmax?: number;
    ymin?: number;
    ymax?: number;
    tangent?: boolean;
    grid?: boolean;
  };
  goal: ManipulableTargetGoal;
  successFeedback?: string;
  hints?: string[];
}
