// Interactive playground for the /widgets explorer (WidgetsPage.tsx): lets
// a user edit a widget's props and see it re-render live, reusing the exact
// parseProps -> DirectiveErrorCard | <Widget/> flow the real lesson markdown
// pipeline uses (src/markdown/directives.tsx's WidgetDirective). The page
// mounts this directly (key={widgetKey}) for whichever widget is currently
// selected — only one is ever mounted at a time, so no lazy-open guard is
// needed here.
// No LessonContext.Provider is mounted anywhere here — every widget is
// written and tested to degrade gracefully with a null context, and it's
// required for correctness: quiz's fetch collapses moduleBaseUrl to '' with
// no provider, which is what lets a blob: URL `src` work unmodified.
import { useEffect, useMemo, useRef, useState, Suspense } from 'react';

import { DirectiveErrorCard } from '../markdown/directives';
import { widgetRegistry, type RawWidgetProps } from '../widgets/registry';
import { Button } from '../ui';

import type { WidgetDoc, WidgetPropRow } from './widgetDocs';
import { parseExampleAttrs, SRC_JSON_SAMPLES } from './widgetPlaygroundData';

const DEBOUNCE_MS = 300;

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function PlaygroundSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading widget"
      className="my-3 min-h-24 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800"
    />
  );
}

type PropKind = 'boolean' | 'number' | 'text';

function propKind(type: string): PropKind {
  const t = type.toLowerCase();
  if (t.includes('boolean')) return 'boolean';
  if (t.includes('number') || t.includes('integer')) return 'number';
  return 'text';
}

function toDirectiveSnippet(widgetKey: string, raw: RawWidgetProps): string {
  const parts = [`type="${widgetKey}"`];
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'boolean') parts.push(`${key}=${value ? 'true' : 'false'}`);
    else if (typeof value === 'number') parts.push(`${key}=${value}`);
    else parts.push(`${key}="${String(value).replace(/"/g, '\\"')}"`);
  }
  return `::widget{${parts.join(' ')}}`;
}

interface FormState {
  values: Record<string, string>;
  booleans: Record<string, boolean>;
  srcUrlText: string;
}

function buildInitialState(doc: WidgetDoc): FormState {
  const seed = parseExampleAttrs(doc.example);
  const values: Record<string, string> = {};
  const booleans: Record<string, boolean> = {};
  for (const prop of doc.props) {
    if (prop.name === 'src') continue;
    const seedVal = seed[prop.name];
    if (propKind(prop.type) === 'boolean') {
      booleans[prop.name] = typeof seedVal === 'boolean' ? seedVal : seedVal === 'true';
    } else {
      values[prop.name] = seedVal === undefined ? '' : String(seedVal);
    }
  }
  const srcSeed = seed.src;
  return { values, booleans, srcUrlText: typeof srcSeed === 'string' ? srcSeed : '' };
}

function PropField({
  prop,
  value,
  onChange,
}: {
  prop: WidgetPropRow;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}) {
  const id = `widget-playground-${prop.name}`;
  const kind = propKind(prop.type);
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium">
        {prop.name}
        <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">
          ({prop.type}{prop.required === 'yes' ? ', required' : ''})
        </span>
      </label>
      {kind === 'boolean' ? (
        <input
          id={id}
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 focus-visible:outline-2 focus-visible:outline-indigo-600"
        />
      ) : kind === 'number' ? (
        <input
          id={id}
          type="number"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:bg-slate-800"
        />
      ) : (
        <textarea
          id={id}
          rows={2}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:bg-slate-800"
        />
      )}
    </div>
  );
}

/** Handles the `src` prop for the 8 widgets that fetch a JSON data file:
 * lets the user paste/edit sample JSON instead of hosting a real file, by
 * turning it into a blob: URL — every fetching widget's own isAbsoluteUrl
 * guard already treats blob: as absolute, so this works unmodified. */
function JsonSrcField({ widgetKey, onResolved }: { widgetKey: string; onResolved: (src: string | undefined) => void }) {
  const [mode, setMode] = useState<'json' | 'url'>('json');
  const [urlText, setUrlText] = useState('');
  const [jsonText, setJsonText] = useState(SRC_JSON_SAMPLES[widgetKey] ?? '');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const debouncedJson = useDebounced(jsonText, DEBOUNCE_MS);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (mode !== 'json') return;
    try {
      JSON.parse(debouncedJson);
      setJsonError(null);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
      onResolved(undefined);
      return;
    }
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const url = URL.createObjectURL(new Blob([debouncedJson], { type: 'application/json' }));
    blobUrlRef.current = url;
    onResolved(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, debouncedJson]);

  useEffect(() => {
    if (mode === 'url') onResolved(urlText.trim() === '' ? undefined : urlText.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, urlText]);

  useEffect(
    () => () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    },
    [],
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="block text-xs font-medium">src (data file)</span>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('json')}
            className={`rounded px-2 py-0.5 ${mode === 'json' ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Inline JSON
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`rounded px-2 py-0.5 ${mode === 'url' ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}
          >
            URL
          </button>
        </div>
      </div>
      {mode === 'json' ? (
        <>
          <textarea
            rows={6}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            aria-label="Inline JSON data for the src prop"
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:bg-slate-800"
          />
          {jsonError && <p className="mt-1 text-xs text-red-700 dark:text-red-400">{jsonError}</p>}
        </>
      ) : (
        <input
          type="text"
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
          placeholder="https://example.com/data.json"
          aria-label="Absolute URL for the src prop"
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:bg-slate-800"
        />
      )}
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        The playground has no lesson module, so a relative path won&rsquo;t resolve — only an
        absolute URL, or inline JSON (turned into a temporary blob URL), works here.
      </p>
    </div>
  );
}

/** Handles figure's `src`: an image, not JSON — offer a file picker too. */
function ImageSrcField({ onResolved }: { onResolved: (src: string | undefined) => void }) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlText, setUrlText] = useState('');
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (mode === 'url') onResolved(urlText.trim() === '' ? undefined : urlText.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, urlText]);

  useEffect(
    () => () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    },
    [],
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="block text-xs font-medium">src (image)</span>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`rounded px-2 py-0.5 ${mode === 'upload' ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`rounded px-2 py-0.5 ${mode === 'url' ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}
          >
            URL
          </button>
        </div>
      </div>
      {mode === 'upload' ? (
        <input
          type="file"
          accept="image/*"
          aria-label="Upload an image for the src prop"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
            if (!file) {
              blobUrlRef.current = null;
              onResolved(undefined);
              return;
            }
            const url = URL.createObjectURL(file);
            blobUrlRef.current = url;
            onResolved(url);
          }}
          className="mt-1 w-full text-xs"
        />
      ) : (
        <input
          type="text"
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
          placeholder="https://example.com/image.png"
          aria-label="Absolute URL for the src prop"
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:bg-slate-800"
        />
      )}
    </div>
  );
}

export default function WidgetPlayground({ widgetKey, doc }: { widgetKey: string; doc: WidgetDoc }) {
  const initial = useMemo(() => buildInitialState(doc), [doc]);
  const [values, setValues] = useState(initial.values);
  const [booleans, setBooleans] = useState(initial.booleans);
  const [srcValue, setSrcValue] = useState<string | undefined>(undefined);
  const [srcResetNonce, setSrcResetNonce] = useState(0);

  const hasSrcProp = doc.props.some((p) => p.name === 'src');
  const nonSrcProps = doc.props.filter((p) => p.name !== 'src');

  const rawProps = useMemo(() => {
    const raw: RawWidgetProps = {};
    for (const prop of nonSrcProps) {
      if (propKind(prop.type) === 'boolean') {
        raw[prop.name] = booleans[prop.name] ?? false;
      } else {
        const v = values[prop.name];
        if (v !== undefined && v.trim() !== '') raw[prop.name] = v;
      }
    }
    if (hasSrcProp && srcValue !== undefined) raw.src = srcValue;
    return raw;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, booleans, srcValue, hasSrcProp]);

  const debouncedRawProps = useDebounced(rawProps, DEBOUNCE_MS);

  const def = widgetRegistry[widgetKey];
  const parsed = useMemo(() => def?.parseProps(debouncedRawProps), [def, debouncedRawProps]);

  const [copied, setCopied] = useState(false);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-3">
        {nonSrcProps.map((prop) => (
          <PropField
            key={prop.name}
            prop={prop}
            value={propKind(prop.type) === 'boolean' ? (booleans[prop.name] ?? false) : (values[prop.name] ?? '')}
            onChange={(value) => {
              if (propKind(prop.type) === 'boolean') {
                setBooleans((prev) => ({ ...prev, [prop.name]: value as boolean }));
              } else {
                setValues((prev) => ({ ...prev, [prop.name]: value as string }));
              }
            }}
          />
        ))}
        {hasSrcProp &&
          (widgetKey === 'figure' ? (
            <ImageSrcField key={srcResetNonce} onResolved={setSrcValue} />
          ) : (
            <JsonSrcField key={srcResetNonce} widgetKey={widgetKey} onResolved={setSrcValue} />
          ))}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="secondary"
            onClick={() => {
              setValues(initial.values);
              setBooleans(initial.booleans);
              setSrcResetNonce((n) => n + 1);
            }}
          >
            Reset to example
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              void navigator.clipboard.writeText(toDirectiveSnippet(widgetKey, debouncedRawProps));
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? 'Copied!' : 'Copy directive'}
          </Button>
        </div>
        {hasSrcProp && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            If you used inline JSON, save it as a real file and swap the copied{' '}
            <code>src</code> for its path before using this in lesson content.
          </p>
        )}
      </div>
      <div className="min-w-0">
        {!parsed ? null : !parsed.ok ? (
          <DirectiveErrorCard
            title={`Widget "${widgetKey}" has invalid props.`}
            details={parsed.errors}
            inline
          />
        ) : def ? (
          <Suspense fallback={<PlaygroundSkeleton />}>
            <def.component {...parsed.props} />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}
