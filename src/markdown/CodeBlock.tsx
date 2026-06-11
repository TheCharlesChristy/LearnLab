// Fenced code block renderer (FR-CONT-004). Shiki is loaded with a dynamic
// import on the first code block; until then (or for unknown languages) we
// render a plain <pre><code> fallback. Tokens are rendered as React spans —
// no innerHTML anywhere (NFR-SEC-002).

import { useEffect, useState } from 'react';
import type { ThemedToken } from 'shiki/types';

import type { HighlightLang } from './highlighter';

const LANG_ALIASES: Record<string, HighlightLang> = {
  ts: 'typescript',
  typescript: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  javascript: 'javascript',
  jsx: 'javascript',
  py: 'python',
  python: 'python',
  json: 'json',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
};

export function normalizeLang(lang: string | undefined): HighlightLang | undefined {
  if (lang === undefined) return undefined;
  return LANG_ALIASES[lang.toLowerCase()];
}

const PRE_CLASS =
  'my-4 overflow-x-auto rounded-md bg-slate-900 p-4 text-sm text-slate-100';

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const resolved = normalizeLang(lang);
  const [tokens, setTokens] = useState<ThemedToken[][] | null>(null);

  useEffect(() => {
    if (resolved === undefined) return;
    let cancelled = false;
    // Separate dynamic import keeps shiki out of the markdown chunk.
    import('./highlighter')
      .then((m) => m.highlight(code, resolved))
      .then((t) => {
        if (!cancelled) setTokens(t);
      })
      .catch(() => {
        // Highlighting is progressive enhancement; keep the plain fallback.
      });
    return () => {
      cancelled = true;
    };
  }, [code, resolved]);

  if (tokens === null) {
    return (
      <pre className={PRE_CLASS} data-language={lang}>
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <pre className={PRE_CLASS} data-language={lang} data-highlighted="true">
      <code>
        {tokens.map((line, i) => (
          <span key={i}>
            {line.map((token, j) => (
              <span key={j} style={token.color !== undefined ? { color: token.color } : undefined}>
                {token.content}
              </span>
            ))}
            {'\n'}
          </span>
        ))}
      </code>
    </pre>
  );
}
