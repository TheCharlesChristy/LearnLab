import { useRef } from 'react';

import { MarkdownLesson } from '../../markdown';
import type { MarkdownLessonProps } from '../../markdown';
import { ReadAloudControl } from '../../tts';
import { Button } from '../../ui';

export interface LegacyMarkdownExperienceProps extends MarkdownLessonProps {
  title?: string;
  /** Lets a v2 shell suppress duplicate controls while retaining semantic content. */
  controls?: boolean;
}

/**
 * A legacy document experience deliberately reuses the established Markdown
 * renderer. It therefore keeps directive support, safe HTML handling, print
 * CSS, search-index source text, and DOM-based read aloud intact.
 */
export function LegacyMarkdownExperience({
  markdown,
  pyItemRenderer,
  title,
  controls = true,
}: LegacyMarkdownExperienceProps) {
  const documentRef = useRef<HTMLElement>(null);
  return (
    <article ref={documentRef} className="lesson-article" aria-label={title ?? 'Legacy lesson'}>
      {title ? <h1 className="mb-4 text-2xl font-bold">{title}</h1> : null}
      {controls ? (
        <div className="mb-4 flex flex-wrap gap-2 print:hidden">
          <ReadAloudControl targetRef={documentRef} resetKey={title ?? markdown} />
          <Button variant="secondary" onClick={() => window.print()}>
            Print this lesson
          </Button>
        </div>
      ) : null}
      <MarkdownLesson markdown={markdown} pyItemRenderer={pyItemRenderer} />
    </article>
  );
}
