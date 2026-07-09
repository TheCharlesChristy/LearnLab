// Widget explorer (#/widgets/:widgetKey?): a sidebar lists every widget in
// src/widgets/registry.ts (dynamically — adding one via the existing runbook,
// docs/ARCHITECTURE.md §4, requires no changes here); picking one shows its
// playground immediately, with docs/WIDGETS.md documentation collapsed
// behind a "Show documentation" toggle.
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, useParams } from 'react-router';

import { WIDGET_KEYS } from '../../widgets/registry';
import { Card, cx } from '../../ui';
import { LazyMarkdownInline } from '../shared';
import WidgetPlayground from '../WidgetPlayground';
import type { WidgetDoc, WidgetPropRow } from '../widgetDocs';
import { getWidgetDoc } from '../widgetDocs';

const SEARCH_DEBOUNCE_MS = 200;

function InlineMarkdown({ markdown }: { markdown: string }) {
  return (
    <Suspense fallback={<span>{markdown}</span>}>
      <LazyMarkdownInline markdown={markdown} />
    </Suspense>
  );
}

function PropsTable({ props }: { props: WidgetPropRow[] }) {
  if (props.length === 0) return null;
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th scope="col" className="py-1 pr-3 font-semibold">
              Prop
            </th>
            <th scope="col" className="py-1 pr-3 font-semibold">
              Type
            </th>
            <th scope="col" className="py-1 pr-3 font-semibold">
              Required
            </th>
            <th scope="col" className="py-1 pr-3 font-semibold">
              Default
            </th>
            <th scope="col" className="py-1 font-semibold">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr
              key={prop.name}
              className="border-b border-slate-100 align-top dark:border-slate-800"
            >
              <td className="py-1.5 pr-3 font-mono text-xs">{prop.name}</td>
              <td className="py-1.5 pr-3 text-xs text-slate-600 dark:text-slate-300">
                {prop.type}
              </td>
              <td className="py-1.5 pr-3 text-xs text-slate-600 dark:text-slate-300">
                {prop.required}
              </td>
              <td className="py-1.5 pr-3 text-xs text-slate-600 dark:text-slate-300">
                {prop.default}
              </td>
              <td className="py-1.5 text-xs text-slate-600 dark:text-slate-300">
                <InlineMarkdown markdown={prop.description} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Description/props/example — collapsed by default so the playground is
 * the only thing shown until a user explicitly asks for documentation.
 * Content is only rendered after the first open (not just CSS-hidden while
 * closed), matching the on-demand-disclosure idiom this page already uses
 * for the playground panel. */
function WidgetDocs({ doc }: { doc: WidgetDoc }) {
  const [hasOpened, setHasOpened] = useState(false);
  return (
    <details
      className="mt-4 rounded-md border border-slate-200 dark:border-slate-700"
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open) setHasOpened(true);
      }}
    >
      <summary className="cursor-pointer select-none rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-indigo-600">
        Show documentation
      </summary>
      {hasOpened && (
        <div className="border-t border-slate-200 p-3 dark:border-slate-700">
          <div className="text-sm text-slate-700 dark:text-slate-200">
            <InlineMarkdown markdown={doc.description} />
          </div>
          <PropsTable props={doc.props} />
          {doc.example && (
            <pre className="mt-3 overflow-x-auto rounded-md bg-slate-100 p-3 text-xs dark:bg-slate-800">
              <code>{doc.example}</code>
            </pre>
          )}
        </div>
      )}
    </details>
  );
}

/** Case-insensitive substring match against a widget's key, description and
 * prop names — a small in-memory list, so no shared search infra is needed
 * (src/search/query.ts is a closed subsystem for the lesson search index). */
function matchesQuery(key: string, doc: WidgetDoc | undefined, query: string): boolean {
  if (query === '') return true;
  const haystack = [key, doc?.description ?? '', ...(doc?.props.map((p) => p.name) ?? [])]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'block rounded-md px-3 py-1.5 font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
    isActive
      ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100'
      : 'text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700',
  );

export default function WidgetsPage() {
  const { widgetKey: paramKey } = useParams<{ widgetKey?: string }>();
  const keys = useMemo(() => [...WIDGET_KEYS].sort((a, b) => a.localeCompare(b)), []);

  const [raw, setRaw] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebounced(raw), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [raw]);

  const query = debounced.trim().toLowerCase();
  const visibleKeys = useMemo(
    () => keys.filter((key) => matchesQuery(key, getWidgetDoc(key), query)),
    [keys, query],
  );

  if (!paramKey) {
    return <Navigate to={`/widgets/${keys[0]}`} replace />;
  }

  const selectedKey = keys.includes(paramKey) ? paramKey : undefined;
  const doc = selectedKey ? getWidgetDoc(selectedKey) : undefined;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Widgets</h1>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        Pick a widget to configure and preview it live ({keys.length} available), read directly
        from the widget registry and its documentation.
      </p>

      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <div className="min-w-0">
          <label htmlFor="widget-search-input" className="block text-sm font-medium">
            Search widgets
          </label>
          <input
            id="widget-search-input"
            type="search"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="e.g. quiz, tangent, boolean"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:bg-slate-800"
            autoComplete="off"
          />
          <p aria-live="polite" className="mb-2 mt-2 min-h-5 text-xs text-slate-600 dark:text-slate-300">
            {`${visibleKeys.length} of ${keys.length} widgets`}
          </p>
          {visibleKeys.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No widgets matched &ldquo;{debounced.trim()}&rdquo;.
            </p>
          ) : (
            <nav aria-label="Widgets">
              <ul className="space-y-0.5">
                {visibleKeys.map((key) => (
                  <li key={key}>
                    <NavLink to={`/widgets/${key}`} end className={sidebarLinkClass}>
                      {key}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        <div className="min-w-0">
          {!doc ? (
            <Card className="min-w-0">
              <h2 className="font-semibold">Unknown widget: {paramKey}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                That widget doesn&rsquo;t exist. Pick one from the list to the side.
              </p>
            </Card>
          ) : (
            <>
              <h2 className="font-mono text-lg font-semibold">{doc.key}</h2>
              <div className="mt-3">
                <WidgetPlayground key={doc.key} widgetKey={doc.key} doc={doc} />
              </div>
              <WidgetDocs doc={doc} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
