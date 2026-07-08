// Shared chrome for game-style widgets (matching-pairs and future additions)
// — SRS §5.3/§3.5: widgets never import src/progress; a game reports
// completion via LessonContext.notifyEngagement itself (see matching-pairs
// for the pattern), not through this shell. GameShell owns only presentation:
// a title/instructions header, an aria-live event region (mirrors the
// flashcards `announcement` pattern), and a completion banner with a
// "Play again" reset — the game-specific board goes in `children`.

import { useId, type ReactNode } from 'react';

export interface GameShellProps {
  /** Optional heading, usually from the data file's own "title" field. */
  title?: string;
  /** Optional short instructions shown under the title. */
  instructions?: string;
  /** aria-live="polite" text — announce game events (match, mismatch, complete) here. */
  announcement: string;
  /** True once the game is won; shows the completion banner + "Play again". */
  complete: boolean;
  completeLabel: string;
  onPlayAgain: () => void;
  children: ReactNode;
}

export function GameShell({
  title,
  instructions,
  announcement,
  complete,
  completeLabel,
  onPlayAgain,
  children,
}: GameShellProps) {
  const titleId = useId();
  return (
    <section
      className="my-4 rounded-lg border p-4"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : 'Game'}
    >
      {title && (
        <h3 id={titleId} className="font-medium">
          {title}
        </h3>
      )}
      {instructions && <p className="mt-1 text-sm opacity-80">{instructions}</p>}

      <div className="mt-3">{children}</div>

      <p
        role="status"
        aria-live="polite"
        className="mt-3 min-h-5 text-sm font-medium text-green-700 dark:text-green-400"
      >
        {announcement}
      </p>

      {complete && (
        <div className="mt-3 motion-safe:animate-pop rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
          <p className="font-medium">{completeLabel}</p>
          <button
            type="button"
            onClick={onPlayAgain}
            className="mt-2 rounded bg-blue-600 px-3 py-1 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Play again
          </button>
        </div>
      )}
    </section>
  );
}
