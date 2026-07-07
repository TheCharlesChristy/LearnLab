import { cx } from './cx';

export interface ProgressBarProps {
  /** 0–100. */
  value: number;
  label: string;
  className?: string;
  showPercent?: boolean;
}

/** Accessible determinate progress bar. */
export function ProgressBar({ value, label, className, showPercent = false }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cx('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
      >
        <div
          className="h-full rounded-full bg-indigo-600 motion-safe:transition-[width] dark:bg-indigo-400"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showPercent && (
        <span className="text-xs tabular-nums text-slate-600 dark:text-slate-300">{clamped}%</span>
      )}
    </div>
  );
}
