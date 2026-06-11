// Inline Markdown renderer — same pipeline as MarkdownLesson minus directive
// handling. Used for quiz question text/explanations (§4.6) and the Python
// `Markdown` component (§6.7). GFM + maths + frontmatter-ignored + skipHtml
// (FR-CONT-005) + lazy-highlighted code + lazy images all apply.

import Markdown from 'react-markdown';

import { BASE_COMPONENTS, BASE_REMARK_PLUGINS, REHYPE_PLUGINS } from './core';

export interface MarkdownInlineProps {
  markdown: string;
}

export function MarkdownInline({ markdown }: MarkdownInlineProps) {
  return (
    <Markdown
      remarkPlugins={BASE_REMARK_PLUGINS}
      rehypePlugins={REHYPE_PLUGINS}
      skipHtml
      components={BASE_COMPONENTS}
    >
      {markdown}
    </Markdown>
  );
}
