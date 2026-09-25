// Choice-button state styling shared by tap-choice/predict screens and review
// cards. Exactly one border/background pair is emitted per state: `cx` is a
// plain joiner (no tailwind-merge), so combining a neutral `border-slate-300`
// with a state colour lets whichever utility Tailwind emits *later* win —
// which silently hid the green/red answer borders (D-034).

export type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong';

const BASE =
  'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors motion-safe:duration-150 disabled:cursor-default';

const STATE: Record<ChoiceState, string> = {
  idle: 'border-slate-300 hover:bg-indigo-50 dark:border-slate-600 dark:hover:bg-slate-700',
  selected: 'border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/40',
  correct: 'border-emerald-600 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/30',
  wrong: 'border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-950/30',
};

export function choiceClassName(state: ChoiceState): string {
  return `${BASE} ${STATE[state]}`;
}
