import { useEffect, useId, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';

import { ReadAloudControl } from '../../tts';
import { cx } from '../../ui';

/**
 * A visual container for an experience scene. It deliberately has no advance,
 * completion, or persistence API: an activity remains the only place that can
 * report a genuine learner outcome to SceneRunner.
 */
export interface SceneShellProps {
  children: ReactNode;
  /** A short, decorative scene marker. It is not included in read-aloud text. */
  sceneLabel?: string;
  className?: string;
  /** Changes here stop any in-progress read-aloud utterance. */
  resetKey?: string | number;
}

export function SceneShell({ children, sceneLabel, className, resetKey }: SceneShellProps) {
  const readableRef = useRef<HTMLDivElement>(null);

  return (
    <section
      aria-label="Experience scene"
      className={cx(
        'mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-surface-dark',
        className,
      )}
    >
      {sceneLabel ? (
        <p
          aria-hidden="true"
          data-tts-exclude
          className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300"
        >
          {sceneLabel}
        </p>
      ) : null}
      <div ref={readableRef} className="space-y-6" data-testid="scene-shell-readable">
        {children}
      </div>
      <ReadAloudControl
        targetRef={readableRef}
        resetKey={resetKey}
        className="mt-6 border-t border-slate-200 pt-4 print:hidden dark:border-slate-700"
      />
    </section>
  );
}

export interface SceneBriefingProps {
  title: string;
  children: ReactNode;
  eyebrow?: string;
}

/** The scene's single h1 and its immediate narrative setup. */
export function SceneBriefing({ title, children, eyebrow }: SceneBriefingProps) {
  return (
    <div className="border-b border-slate-200 pb-5 dark:border-slate-700">
      {eyebrow ? (
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{eyebrow}</p>
      ) : null}
      <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">{title}</h1>
      <div className="mt-3 max-w-3xl whitespace-pre-wrap text-slate-700 dark:text-slate-200">
        {children}
      </div>
    </div>
  );
}

export interface SceneObjectiveProps {
  children: ReactNode;
  title?: string;
}

/** States the learner's immediate goal before the activity begins. */
export function SceneObjective({ children, title = 'Objective' }: SceneObjectiveProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border-l-4 border-indigo-600 bg-indigo-50 p-4 dark:border-indigo-400 dark:bg-indigo-950/40"
    >
      <h2 id={headingId} className="text-base font-bold text-slate-950 dark:text-white">
        {title}
      </h2>
      <div className="mt-1 text-slate-800 dark:text-slate-100">{children}</div>
    </section>
  );
}

export interface SceneActivityProps {
  children: ReactNode;
  title?: string;
}

/**
 * Labels the interactive work without supplying controls of its own. The
 * supplied activity must retain its own real-interaction gate.
 */
export function SceneActivity({ children, title = 'Activity' }: SceneActivityProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-slate-300 bg-white p-4 sm:p-5 dark:border-slate-600 dark:bg-surface-dark-muted"
    >
      <h2 id={headingId} className="text-lg font-bold text-slate-950 dark:text-white">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export interface SceneDialogueProps {
  speaker: string;
  children: ReactNode;
}

/** A quoted utterance with an explicit speaker, rather than colour-only attribution. */
export function SceneDialogue({ speaker, children }: SceneDialogueProps) {
  return (
    <figure className="border-l-4 border-violet-600 pl-4 dark:border-violet-400">
      <blockquote className="whitespace-pre-wrap text-lg leading-relaxed text-slate-800 dark:text-slate-100">
        {children}
      </blockquote>
      <figcaption className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {speaker}
      </figcaption>
    </figure>
  );
}

export interface SceneCaptionProps {
  children: ReactNode;
}

/** Use as the caption child of a semantic <figure>. */
export function SceneCaption({ children }: SceneCaptionProps) {
  return <figcaption className="mt-2 text-sm text-slate-600 dark:text-slate-300">{children}</figcaption>;
}

export interface EnvironmentalStatusItem {
  label: string;
  value: ReactNode;
}

export interface EnvironmentalStatusProps {
  items: readonly EnvironmentalStatusItem[];
  title?: string;
}

/** A compact, textual status readout: values are never conveyed by colour alone. */
export function EnvironmentalStatus({ items, title = 'Environmental status' }: EnvironmentalStatusProps) {
  const headingId = useId();
  return (
    <aside
      aria-labelledby={headingId}
      className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800"
    >
      <h2 id={headingId} className="text-sm font-bold text-slate-950 dark:text-white">
        {title}
      </h2>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              {item.label}
            </dt>
            <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{item.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function useEnteredFocus(
  visible: boolean,
  target: RefObject<HTMLElement | null>,
): void {
  const wasVisible = useRef(visible);
  useEffect(() => {
    if (visible && !wasVisible.current) target.current?.focus();
    wasVisible.current = visible;
  }, [target, visible]);
}

export interface SceneConsequenceProps {
  children: ReactNode;
  /** Set false until an activity's genuine outcome reveals this consequence. */
  revealed?: boolean;
  title?: string;
  announce?: string;
}

/**
 * A revealed outcome. On a false-to-true reveal, focus moves to the outcome
 * heading and a concise, non-duplicating live announcement is made.
 */
export function SceneConsequence({
  children,
  revealed = true,
  title = 'Consequence',
  announce,
}: SceneConsequenceProps) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEnteredFocus(revealed, headingRef);
  if (!revealed) return null;
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 motion-safe:animate-reveal-in motion-reduce:animate-none dark:border-emerald-700 dark:bg-emerald-950/40"
    >
      <h2 ref={headingRef} id={headingId} tabIndex={-1} className="text-lg font-bold text-slate-950 outline-none dark:text-white">
        {title}
      </h2>
      <div className="mt-2 text-slate-800 dark:text-slate-100">{children}</div>
      <p aria-live="polite" data-tts-exclude className="sr-only">
        {announce ?? `${title} revealed.`}
      </p>
    </section>
  );
}

export interface SceneTransitionProps {
  children: ReactNode;
  /** Set false until a genuine activity outcome makes the next decision available. */
  active?: boolean;
  title?: string;
  announce?: string;
}

/**
 * Describes the next decision; it does not navigate or make an activity
 * complete. When activated after being hidden, it receives focus.
 */
export function SceneTransition({
  children,
  active = true,
  title = 'Next decision',
  announce,
}: SceneTransitionProps) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEnteredFocus(active, headingRef);
  if (!active) return null;
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-indigo-300 bg-indigo-50 p-4 motion-safe:animate-reveal-in motion-reduce:animate-none dark:border-indigo-700 dark:bg-indigo-950/40"
    >
      <h2 ref={headingRef} id={headingId} tabIndex={-1} className="text-lg font-bold text-slate-950 outline-none dark:text-white">
        {title}
      </h2>
      <div className="mt-2 text-slate-800 dark:text-slate-100">{children}</div>
      <p aria-live="polite" data-tts-exclude className="sr-only">
        {announce ?? `${title} available.`}
      </p>
    </section>
  );
}

export interface SceneDebriefProps {
  children: ReactNode;
  title?: string;
}

/** A calm, printable end-of-scene reflection or summary. */
export function SceneDebrief({ children, title = 'Debrief' }: SceneDebriefProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="border-t border-slate-300 pt-5 dark:border-slate-600">
      <h2 id={headingId} className="text-xl font-bold text-slate-950 dark:text-white">
        {title}
      </h2>
      <div className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-200">{children}</div>
    </section>
  );
}

export interface SceneErrorProps {
  children: ReactNode;
  visible?: boolean;
  title?: string;
}

/** A learner-safe failure state with an assertive announcement and entered-state focus. */
export function SceneError({ children, visible = true, title = 'Something needs attention' }: SceneErrorProps) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEnteredFocus(visible, headingRef);
  if (!visible) return null;
  return (
    <section
      role="alert"
      aria-labelledby={headingId}
      className="rounded-xl border border-red-400 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950/40"
    >
      <h2 ref={headingRef} id={headingId} tabIndex={-1} className="font-bold outline-none">
        {title}
      </h2>
      <div className="mt-1">{children}</div>
    </section>
  );
}
