import type { ReactNode } from 'react';

import { cx } from './cx';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
  accent: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100',
  success: 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100',
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
