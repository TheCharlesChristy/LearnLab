// `quiz` widget component — inline quiz embed (SRS §5.3 table, §5.4).
// Fetches a module-relative quiz JSON and renders the native quiz engine with
// kind 'inline-quiz'; attempts record with itemId = the loaded quiz's id
// (the engine uses quiz.id). Fetch failures show a retry card (FR-CONT-007).

import { useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { LessonContext } from '../../content/lesson-context';
import { MarkdownInline } from '../../markdown';
import { QuizEngine } from '../../quiz';
import type { Quiz } from '../../quiz';

// Question text/explanations can contain Markdown + maths (§4.6); without
// this the engine falls back to raw text, so authored LaTeX like
// `$1000\,\text{W}$` renders literally instead of typeset (the bug this
// widget was shipped with — AssessmentPage wires the equivalent renderer,
// this embed didn't).
function renderQuizMarkdown(md: string): ReactNode {
  return <MarkdownInline markdown={md} />;
}

export interface QuizWidgetProps {
  /** Module-relative quiz JSON path (required). */
  src: string;
  /** Overrides the quiz file's `pick` (§5.3). */
  pick?: number;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; quiz: Quiz };

function isQuizShaped(value: unknown): value is Quiz {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && Array.isArray(v.questions) && v.questions.length > 0;
}

export default function QuizWidget({ src, pick }: QuizWidgetProps) {
  const lessonCtx = useContext(LessonContext);
  const url = `${lessonCtx?.moduleBaseUrl ?? ''}${src}`;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    void (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: unknown = await res.json();
        if (!isQuizShaped(data)) throw new Error('file is not a valid quiz');
        if (!cancelled) setState({ status: 'ready', quiz: data });
      } catch (err) {
        console.error(`[quiz widget] failed to load ${url}`, err);
        if (!cancelled) {
          setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, reloadToken]);

  if (state.status === 'loading') {
    return (
      <div role="status" className="rounded-lg border p-4 text-sm opacity-80">
        Loading quiz…
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div role="alert" className="rounded-lg border border-red-300 p-4">
        <p className="font-medium">Couldn’t load quiz</p>
        <p className="mt-1 text-sm opacity-80">
          {src}: {state.message}
        </p>
        <button
          type="button"
          onClick={() => setReloadToken((t) => t + 1)}
          className="mt-2 rounded bg-blue-600 px-3 py-1 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <QuizEngine
      quiz={state.quiz}
      attemptNumber={attemptNumber}
      kind="inline-quiz"
      pickOverride={pick}
      onRetry={() => setAttemptNumber((n) => n + 1)}
      renderMarkdown={renderQuizMarkdown}
    />
  );
}
