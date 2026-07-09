// Shared generation-answer marking for `entry` and `faded-step` — both reuse
// src/quiz/marking.ts's numeric/text semantics verbatim (target spec #8).

import { markNumeric, markText, parseNumericInput } from '../quiz/marking';
import type { NumericQuestion, TextQuestion } from '../quiz/types';

export interface GenerationAnswerFields {
  id: string;
  inputMode: 'numeric' | 'text';
  answer?: number;
  tolerance?: number;
  accept?: string[];
  caseSensitive?: boolean;
}

export function checkGenerationAnswer(screen: GenerationAnswerFields, raw: string): boolean {
  if (screen.inputMode === 'numeric') {
    const value = parseNumericInput(raw);
    if (value === null) return false;
    const question: NumericQuestion = {
      type: 'numeric',
      id: screen.id,
      text: '',
      answer: screen.answer ?? 0,
      tolerance: screen.tolerance ?? 0,
      explanation: '',
    };
    return markNumeric(question, value);
  }
  const question: TextQuestion = {
    type: 'text',
    id: screen.id,
    text: '',
    accept: screen.accept ?? [],
    caseSensitive: screen.caseSensitive,
    explanation: '',
  };
  return markText(question, raw);
}
