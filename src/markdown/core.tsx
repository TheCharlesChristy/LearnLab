// Shared pipeline pieces for MarkdownLesson and MarkdownInline (FR-CONT-004).
// KaTeX CSS is imported HERE so it lands in the lazy markdown chunk, not the
// app entry. Raw HTML is always skipped (skipHtml — FR-CONT-005/NFR-SEC-002);
// rehype-raw is never used.

import 'katex/dist/katex.min.css';

import type { Element, ElementContent } from 'hast';
import { useContext } from 'react';
import type { Components, ExtraProps } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { PluggableList } from 'unified';

import { LessonContext } from '../content/lesson-context';

import { CodeBlock } from './CodeBlock';

// Frontmatter is parsed and IGNORED (module.json is authoritative, §4.5);
// remark-frontmatter just keeps it from rendering as text.
export const BASE_REMARK_PLUGINS: PluggableList = [remarkFrontmatter, remarkGfm, remarkMath];

// §3.2: KaTeX MathML output alongside HTML for accessibility (NFR-A11Y-001).
export const REHYPE_PLUGINS: PluggableList = [[rehypeKatex, { output: 'htmlAndMathml' }]];

// ---------------------------------------------------------------------------
// Images: resolve module-relative src against the lesson context (§4.5).

export function resolveImageSrc(
  src: string | undefined,
  moduleBaseUrl: string | undefined,
): string | undefined {
  if (src === undefined || src === '' || moduleBaseUrl === undefined) return src;
  // Absolute URLs, root-relative paths, fragments and data:/blob: pass through.
  if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(src)) return src;
  return moduleBaseUrl + src.replace(/^\.\//, '');
}

type ImgProps = React.JSX.IntrinsicElements['img'] & ExtraProps;

function MarkdownImg(props: ImgProps) {
  // Context may be absent (tests, quiz inline text) — fall back to raw src.
  const ctx = useContext(LessonContext);
  const { node, src, alt, ...rest } = props;
  void node; // hast node — not forwarded to the DOM
  const rawSrc = typeof src === 'string' ? src : undefined;
  return (
    <img
      {...rest}
      src={resolveImageSrc(rawSrc, ctx?.moduleBaseUrl)}
      alt={alt ?? ''}
      loading="lazy"
    />
  );
}

// ---------------------------------------------------------------------------
// Fenced code blocks: read the raw text + language off the hast node.

function hastText(nodes: ElementContent[]): string {
  let out = '';
  for (const child of nodes) {
    if (child.type === 'text') out += child.value;
    else if (child.type === 'element') out += hastText(child.children);
  }
  return out;
}

function extractCode(node: Element | undefined): { code: string; lang?: string } | null {
  if (!node) return null;
  const codeEl = node.children.find(
    (c): c is Element => c.type === 'element' && c.tagName === 'code',
  );
  if (!codeEl) return null;
  const classNames = codeEl.properties.className;
  let lang: string | undefined;
  if (Array.isArray(classNames)) {
    for (const cls of classNames) {
      const match = /^language-(\S+)$/.exec(String(cls));
      if (match) {
        lang = match[1];
        break;
      }
    }
  }
  // Trim the single trailing newline mdast keeps on code blocks.
  return { code: hastText(codeEl.children).replace(/\n$/, ''), lang };
}

type PreProps = React.JSX.IntrinsicElements['pre'] & ExtraProps;

function MarkdownPre(props: PreProps) {
  const { node, children, ...rest } = props;
  const info = extractCode(node);
  if (info === null) return <pre {...rest}>{children}</pre>;
  return <CodeBlock code={info.code} lang={info.lang} />;
}

export const BASE_COMPONENTS: Components = {
  img: MarkdownImg,
  pre: MarkdownPre,
};
