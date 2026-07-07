// Shiki highlighter — only ever loaded via dynamic import from CodeBlock so
// it stays out of the entry chunk AND out of the main markdown chunk
// (FR-CONT-004: syntax highlighting lazy-loaded). Fine-grained shiki/core
// imports keep the bundled language set small: ts, js, python, json, bash.

import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { ThemedToken } from 'shiki/types';

export const HIGHLIGHT_LANGS = ['typescript', 'javascript', 'python', 'json', 'bash'] as const;
export type HighlightLang = (typeof HIGHLIGHT_LANGS)[number];

const THEME = 'github-dark';

let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    themes: [import('shiki/dist/themes/github-dark.mjs')],
    langs: [
      import('shiki/dist/langs/typescript.mjs'),
      import('shiki/dist/langs/javascript.mjs'),
      import('shiki/dist/langs/python.mjs'),
      import('shiki/dist/langs/json.mjs'),
      import('shiki/dist/langs/bash.mjs'),
    ],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });
  return highlighterPromise;
}

/** Tokenise `code`; lines of themed tokens (rendered as React spans — no innerHTML). */
export async function highlight(code: string, lang: HighlightLang): Promise<ThemedToken[][]> {
  const highlighter = await getHighlighter();
  return highlighter.codeToTokens(code, { lang, theme: THEME }).tokens;
}
