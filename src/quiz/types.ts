// Quiz schema types — normative per SRS §4.6 (closed set of question types).
// Pinned by the orchestrator (T0.C). Do not add question types or fields.

export interface Quiz {
  schemaVersion: 1;
  id: string;
  title: string;
  shuffleQuestions?: boolean; // default true
  shuffleChoices?: boolean; // default true (mcq/multi)
  pick?: number;
  questions: Question[];
}

export type Question = McqQuestion | MultiQuestion | NumericQuestion | TextQuestion;

export interface McqQuestion {
  type: 'mcq';
  id: string;
  text: string; // Markdown + maths
  choices: string[]; // 2–6
  answer: number; // index
  explanation: string;
}
export interface MultiQuestion {
  type: 'multi';
  id: string;
  text: string;
  choices: string[];
  answers: number[]; // ≥ 1; exact-set marking, no partial credit in v1
  explanation: string;
}
export interface NumericQuestion {
  type: 'numeric';
  id: string;
  text: string;
  answer: number;
  tolerance: number; // absolute, ≥ 0
  unit?: string; // display only
  explanation: string;
}
export interface TextQuestion {
  type: 'text';
  id: string;
  text: string;
  accept: string[]; // ECMAScript regex sources, full-match
  caseSensitive?: boolean; // default false
  explanation: string;
}
