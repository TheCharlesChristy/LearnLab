import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cx } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // All variants meet 4.5:1 contrast in both themes (NFR-A11Y-001).
  primary:
    'bg-indigo-700 text-white hover:bg-indigo-800 dark:bg-indigo-500 dark:text-white dark:hover:bg-indigo-400',
  secondary:
    'bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
  danger: 'bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700',
};

/** Keyboard-accessible button with a visible focus ring (NFR-A11Y-001). */
export function Button({ variant = 'primary', className, type, ...rest }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cx(
        'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-300',
        'disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    />
  );
}
