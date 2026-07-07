// Math component — SRS §6.7. Renders LaTeX via KaTeX with htmlAndMathml output
// (NFR-A11Y-001: MathML for screen readers). KaTeX is imported lazily INSIDE
// this component so it lands in a lazy chunk, not the entry bundle
// (NFR-PERF-001) — markdown's KaTeX CSS is already in the markdown chunk, but
// a Python tree may use Math without any Markdown node, so we self-render.
//
// KaTeX output is self-generated and trusted, so injecting it via
// dangerouslySetInnerHTML is acceptable HERE ONLY (per task brief / §6.7 Math
// note). No author-controlled HTML is ever injected.

import { useEffect, useState } from 'react';

import type { PyComponentProps } from '../../py-render-context';
import { bool, str } from '../props';

export const Math: React.FC<PyComponentProps> = ({ node }) => {
  const latex = str(node.props, 'latex');
  const display = bool(node.props, 'display', false);
  const [html, setHtml] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setErrored(false);
    // Lazy import keeps KaTeX out of the entry chunk (NFR-PERF-001).
    void Promise.all([import('katex'), import('katex/dist/katex.min.css')])
      .then(([katex]) => {
        if (cancelled) return;
        const rendered = katex.default.renderToString(latex, {
          displayMode: display,
          output: 'htmlAndMathml',
          throwOnError: false,
        });
        setHtml(rendered);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      });
    return () => {
      cancelled = true;
    };
  }, [latex, display]);

  if (errored) {
    return (
      <code className="text-sm text-red-700 dark:text-red-300" aria-label="Math render error">
        {latex}
      </code>
    );
  }
  if (html === null) {
    // Pre-load fallback: show the source so layout/SSR/tests have content.
    return (
      <span className={display ? 'block text-center' : 'inline'} aria-busy="true">
        {latex}
      </span>
    );
  }
  return (
    <span
      className={display ? 'block text-center' : 'inline'}
      // Trusted, self-generated KaTeX output only (§6.7) — never author HTML.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
