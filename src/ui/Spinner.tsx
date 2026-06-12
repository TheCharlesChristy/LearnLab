import { Loader2 } from 'lucide-react';

import { cx } from './cx';

/**
 * Loading indicator. Announced via the visible label; the icon itself is
 * decorative. Spin animation is suppressed under prefers-reduced-motion.
 */
export function Spinner({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <p
      role="status"
      className={cx(
        'flex items-center gap-2 py-8 text-sm text-slate-600 dark:text-slate-300',
        className,
      )}
    >
      <Loader2 aria-hidden className="h-4 w-4 motion-safe:animate-spin" />
      {label}
    </p>
  );
}
