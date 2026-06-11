// Markdown subsystem barrel (SRS §3.5) — consumers should React.lazy() this
// module so KaTeX CSS and the markdown pipeline stay out of the entry chunk.
// Only side effect: KaTeX CSS (imported via ./core).

export { MarkdownLesson, type MarkdownLessonProps } from './MarkdownLesson';
export { MarkdownInline, type MarkdownInlineProps } from './MarkdownInline';
export type { PyItemRenderer, PyItemRendererProps } from './directives';
