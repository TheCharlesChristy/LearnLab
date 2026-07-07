// Search page (D-022, SRS §13 roadmap / FR-CONT-009): client-side search
// over lesson content, backed by the build-time content/search-index.json
// and the dependency-free ranking in src/search/query.ts.

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import { Card, Spinner } from '../../ui';
import { loadSearchIndex, searchLessons } from '../../search';
import type { SearchResult } from '../../search';
import { Breadcrumb, RetryCard } from '../shared';
import { useAsyncData } from '../useAsyncData';

const DEBOUNCE_MS = 200;
const RESULT_LIMIT = 20;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Wraps occurrences of any `tokens` entry in `text` with `<mark>`. Plain text if there's nothing to highlight. */
function highlight(text: string, tokens: string[]): ReactNode {
  const escaped = tokens.map(escapeRegExp).filter((t) => t.length > 0);
  if (escaped.length === 0) return text;
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const tokenSet = new Set(tokens.map((t) => t.toLowerCase()));
  const parts = text.split(regex);
  return parts.map((part, i) =>
    tokenSet.has(part.toLowerCase()) ? (
      <mark key={i} className="rounded bg-amber-200 px-0.5 dark:bg-amber-700/70 dark:text-inherit">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function ResultItem({ result, tokens }: { result: SearchResult; tokens: string[] }) {
  return (
    <Card>
      <h3 className="font-semibold">
        <Link
          to={`/module/${result.moduleId}/lesson/${result.lessonId}`}
          // The highlighted title below is built from several text-node
          // fragments (one per matched/unmatched run); the accessible-name
          // algorithm trims and concatenates each fragment with no
          // separator, which would announce e.g. "Thequadraticformula" to
          // assistive tech. Pin the real title explicitly instead.
          aria-label={result.lessonTitle}
          className="rounded underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600"
        >
          {highlight(result.lessonTitle, tokens)}
        </Link>
      </h3>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        {result.courseTitle} › {result.moduleTitle}
      </p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {highlight(result.excerpt, tokens)}
      </p>
    </Card>
  );
}

export default function SearchPage() {
  const [raw, setRaw] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(raw), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [raw]);

  const index = useAsyncData(loadSearchIndex, 'search-index');

  const tokens = useMemo(
    () => debounced.trim().toLowerCase().split(/\s+/).filter((t) => t.length > 0),
    [debounced],
  );

  const results = useMemo(() => {
    if (index.status !== 'ready' || tokens.length === 0) return [];
    return searchLessons(index.data, debounced, RESULT_LIMIT);
  }, [index, debounced, tokens]);

  return (
    <div>
      <Breadcrumb crumbs={[{ label: 'Catalogue', to: '/' }, { label: 'Search' }]} />
      <h1 className="mb-4 text-2xl font-bold">Search</h1>

      <label htmlFor="search-input" className="block text-sm font-medium">
        Search lesson content
      </label>
      <input
        id="search-input"
        type="search"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="e.g. quadratic formula, photosynthesis, binary search"
        className="mt-1 w-full max-w-md rounded border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:bg-slate-800"
        autoComplete="off"
      />

      {/* FR-A11Y-001-style live region: result count announced politely, region
          exists before content (mirrors src/quiz/QuizEngine.tsx's feedback region). */}
      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-slate-600 dark:text-slate-300">
        {index.status === 'ready' &&
          tokens.length > 0 &&
          `${results.length} ${results.length === 1 ? 'result' : 'results'} found`}
      </p>

      <div className="mt-4">
        {index.status === 'loading' && <Spinner label="Loading search index…" />}
        {index.status === 'error' && (
          <RetryCard what="the search index" error={index.error} onRetry={index.retry} />
        )}
        {index.status === 'ready' && tokens.length === 0 && (
          <p className="text-slate-600 dark:text-slate-300">
            Start typing to search lesson titles and content across every course.
          </p>
        )}
        {index.status === 'ready' && tokens.length > 0 && results.length === 0 && (
          <p className="text-slate-600 dark:text-slate-300">
            No lessons matched “{debounced.trim()}”. Try a different word or a shorter phrase.
          </p>
        )}
        {index.status === 'ready' && results.length > 0 && (
          <ul className="flex flex-col gap-3">
            {results.map((result) => (
              <li key={result.lessonId}>
                <ResultItem result={result} tokens={tokens} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
