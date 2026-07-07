import type { HTMLAttributes } from 'react';

import { cx } from './cx';

/** Plain surface card. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-surface-dark-muted',
        className,
      )}
      {...rest}
    />
  );
}
