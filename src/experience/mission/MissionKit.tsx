import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

import { cx } from '../../ui';

import type {
  DerivedMissionCapability,
  DerivedMissionObjectiveStage,
  DerivedWorldMeter,
  MissionCheckpoint,
} from './types';

export interface MissionObjectivePanelProps {
  stages: readonly DerivedMissionObjectiveStage[];
  title?: string;
}

/** Timer-free staged goals, with text labels rather than colour-only state. */
export function MissionObjectivePanel({ stages, title = 'Mission objectives' }: MissionObjectivePanelProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
      <h2 id={headingId} className="text-lg font-bold text-slate-950 dark:text-white">{title}</h2>
      <ol className="mt-3 space-y-3">
        {stages.map((stage) => (
          <li key={stage.id} className="flex gap-3">
            <span className={cx(
              'mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-bold',
              stage.status === 'complete' && 'bg-emerald-700 text-white',
              stage.status === 'current' && 'bg-indigo-700 text-white',
              stage.status === 'locked' && 'bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-white',
            )} aria-hidden="true">
              {stage.status === 'complete' ? '✓' : stage.status === 'current' ? '•' : '–'}
            </span>
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">
                <span className="sr-only">{stage.status}: </span>{stage.label}
              </p>
              {stage.description ? <p className="text-sm text-slate-700 dark:text-slate-200">{stage.description}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export interface WorldMeterPanelProps {
  meters: readonly DerivedWorldMeter[];
  title?: string;
}

export function WorldMeterPanel({ meters, title = 'World status' }: WorldMeterPanelProps) {
  const headingId = useId();
  return (
    <aside aria-labelledby={headingId} className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
      <h2 id={headingId} className="text-lg font-bold text-slate-950 dark:text-white">{title}</h2>
      <dl className="mt-3 space-y-4">
        {meters.map((meter) => (
          <div key={meter.id}>
            <dt className="font-semibold text-slate-900 dark:text-white">{meter.label}</dt>
            <dd className="mt-1">
              {meter.value === null || meter.percentage === null ? (
                <span className="text-slate-700 dark:text-slate-200">{meter.text}</span>
              ) : (
                <>
                  <progress aria-label={meter.label} className="h-3 w-full accent-indigo-700" value={meter.value - meter.minimum} max={meter.maximum - meter.minimum}>
                    {meter.text}
                  </progress>
                  <span className="mt-1 block text-sm text-slate-700 dark:text-slate-200">{meter.text}{meter.rangeLabel ? ` (${meter.rangeLabel})` : ''}</span>
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

export interface MissionCapabilitiesProps {
  capabilities: readonly DerivedMissionCapability[];
  title?: string;
}

export function MissionCapabilities({ capabilities, title = 'Tools and capabilities' }: MissionCapabilitiesProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="rounded-xl border border-slate-300 p-4 dark:border-slate-600">
      <h2 id={headingId} className="text-lg font-bold text-slate-950 dark:text-white">{title}</h2>
      <ul className="mt-3 space-y-2">
        {capabilities.map((capability) => (
          <li key={capability.id}>
            <p className="font-semibold text-slate-900 dark:text-white">
              <span className="sr-only">{capability.unlocked ? 'Unlocked: ' : 'Locked: '}</span>
              {capability.label} <span aria-hidden="true">({capability.unlocked ? 'Unlocked' : 'Locked'})</span>
            </p>
            {capability.description ? <p className="text-sm text-slate-700 dark:text-slate-200">{capability.description}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export interface MissionCheckpointPanelProps {
  checkpoint?: MissionCheckpoint;
  /** The runtime owns navigation; this button emits a request only. */
  onResetToCheckpoint?: (checkpoint: MissionCheckpoint) => void;
}

/**
 * Shows a persisted checkpoint. It does not apply effects or manufacture a
 * new run event, which prevents UI-only reset clicks from duplicating rewards.
 */
export function MissionCheckpointPanel({ checkpoint, onResetToCheckpoint }: MissionCheckpointPanelProps) {
  if (!checkpoint) return null;
  return (
    <section aria-label="Mission checkpoint" className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
      <h2 className="font-bold text-slate-950 dark:text-white">Checkpoint saved</h2>
      <p className="mt-1 text-slate-700 dark:text-slate-200">{checkpoint.label ?? `Resume from ${checkpoint.nodeId}.`}</p>
      {onResetToCheckpoint ? (
        <button type="button" className="mt-3 rounded-md bg-amber-700 px-3 py-2 font-semibold text-white" onClick={() => onResetToCheckpoint(checkpoint)}>
          Return to checkpoint
        </button>
      ) : null}
    </section>
  );
}

export interface MissionOutcomeBannerProps {
  outcomeKey: string;
  children: ReactNode;
  title?: string;
  announcement?: string;
}

/**
 * An outcome announces only when its persisted boundary/event key changes.
 * Its first render is intentionally silent, including after resume.
 */
export function MissionOutcomeBanner({ outcomeKey, children, title = 'Mission update', announcement }: MissionOutcomeBannerProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousKey = useRef(outcomeKey);
  const changed = previousKey.current !== outcomeKey;
  useEffect(() => {
    if (previousKey.current !== outcomeKey) {
      previousKey.current = outcomeKey;
      headingRef.current?.focus();
    }
  }, [outcomeKey]);

  return (
    <section className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/40">
      <h2 ref={headingRef} tabIndex={-1} className="text-lg font-bold outline-none text-slate-950 dark:text-white">{title}</h2>
      <div className="mt-1 text-slate-800 dark:text-slate-100">{children}</div>
      {changed ? <p aria-live="polite" className="sr-only">{announcement ?? `${title}.`}</p> : null}
    </section>
  );
}
