import { useRef, useState } from 'react';

import { PyItem } from '../../python';
import type { JsonObject, ProgressPayload } from '../../python';
import { normaliseActivityOutcome } from '../plugins/contracts';
import type { ActivityPluginRenderProps } from '../plugins/contracts';

import type { PythonItemActivityProps } from './python-item-plugin';

/**
 * Rejects remote, data and traversal paths before the Python host is mounted.
 * The worker still has no DOM/progress access; this is a second, adapter-level
 * guard so a course-pack activity cannot turn `sourceUrl` into a network hole.
 */
export function isSafePythonItemSourceUrl(sourceUrl: string): boolean {
  const rawPath = sourceUrl.split(/[?#]/)[0];
  if (!rawPath || rawPath.split('/').includes('..')) return false;
  try {
    const url = new URL(sourceUrl, window.location.origin);
    return (
      url.origin === window.location.origin &&
      url.pathname.includes('/content/') &&
      url.pathname.endsWith('.py') &&
      !url.pathname.split('/').includes('..')
    );
  } catch {
    return false;
  }
}

function outcomeValues(progress: ProgressPayload): Record<`/${string}`, string | number> {
  return {
    '/progress-kind': progress.kind,
    ...(progress.score === undefined ? {} : { '/score': progress.score }),
    ...(progress.maxScore === undefined ? {} : { '/max-score': progress.maxScore }),
  };
}

/** Lazy ActivityPlugin bridge for the existing JSON-only PyItem host/worker protocol. */
export default function PythonItemActivity({
  props,
  context,
  disabled,
  reportOutcome,
}: ActivityPluginRenderProps<PythonItemActivityProps>) {
  const [resumeNotice, setResumeNotice] = useState<string | null>(null);
  const reported = useRef(false);

  if (!isSafePythonItemSourceUrl(props.sourceUrl)) {
    return (
      <section
        aria-label="Python item activity"
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-950"
      >
        This Python activity has an unsafe source path and cannot be opened.
      </section>
    );
  }

  function onProgress(progress: ProgressPayload) {
    if (disabled || reported.current) return;
    reported.current = true;
    const values = outcomeValues(progress);
    reportOutcome(
      normaliseActivityOutcome({
        completed:
          progress.kind === 'completed' ||
          (progress.maxScore !== undefined && progress.score === progress.maxScore),
        values,
        events: [{ sequence: 0, type: 'attempted', values }],
      }),
    );
  }

  return (
    <section aria-label="Python item activity">
      <PyItem
        itemId={props.itemId}
        sourceUrl={props.sourceUrl}
        params={props.params as JsonObject | undefined}
        height={props.height}
        seed={
          props.seed ??
          context.seed
            .split('')
            .reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261) >>>
            0
        }
        savedState={props.savedState as JsonObject | undefined}
        title={props.title}
        onProgress={onProgress}
        onPersist={() =>
          setResumeNotice('Python item state is ready for the caller-owned resume store.')
        }
      />
      {resumeNotice ? (
        <p aria-live="polite" className="sr-only">
          {resumeNotice}
        </p>
      ) : null}
    </section>
  );
}
