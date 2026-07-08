// Directive renderers for the four §4.5 forms plus the shared error cards
// (FR-CONT-006, FR-WID-003). Widgets resolve through the registry only
// (SRS §5.3); nothing here imports quiz/progress/app (§3.5).

import { Info, KeyRound, Lightbulb, TriangleAlert, ChevronRight } from 'lucide-react';
import { Suspense, useId, useState, type ReactNode } from 'react';

import { widgetRegistry, type RawWidgetProps } from '../widgets/registry';

import type { DirectiveErrorReason } from './remark-lift-directives';

// ---------------------------------------------------------------------------
// Shared cards

export function DirectiveErrorCard({
  title,
  details,
  inline = false,
}: {
  title: string;
  details?: string[];
  inline?: boolean;
}) {
  const dev = import.meta.env.DEV;
  const body = (
    <>
      <strong className="font-semibold">{title}</strong>
      {dev && details && details.length > 0 ? (
        <ul className="mt-1 list-disc pl-5 text-sm">
          {details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ) : null}
      {!dev && details && details.length > 0 ? (
        <span className="mt-1 block text-sm">This block could not be displayed.</span>
      ) : null}
    </>
  );
  const className =
    'rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-900 ' +
    'dark:border-red-800 dark:bg-red-950 dark:text-red-200';
  return inline ? (
    <span role="note" data-directive-error="" className={className}>
      {body}
    </span>
  ) : (
    <div role="note" data-directive-error="" className={`my-4 ${className}`}>
      {body}
    </div>
  );
}

/** Mapped from `directive-error` nodes produced by remarkLiftDirectives. */
export function DirectiveErrorNode(props: { name?: string; reason?: string; form?: string }) {
  const name = props.name ?? 'unknown';
  const reason = (props.reason ?? 'unknown') as DirectiveErrorReason;
  const inline = props.form === 'textDirective';
  let title: string;
  switch (reason) {
    case 'nested':
      title = `Nested container directive: "${name}" — containers cannot contain containers.`;
      break;
    case 'form':
      title = `Directive "${name}" used with the wrong form (see §4.5).`;
      break;
    default:
      title = `Unknown directive: ${name}`;
  }
  return <DirectiveErrorCard title={title} inline={inline} />;
}

// ---------------------------------------------------------------------------
// ::widget

/** Parse the JSON the remark plugin packed into the `attrs` hProperty. */
export function parseDirectiveAttrs(attrs: unknown): Record<string, string | null> {
  if (typeof attrs !== 'string') return {};
  try {
    const parsed: unknown = JSON.parse(attrs);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, string | null>;
    }
  } catch {
    // fall through to empty
  }
  return {};
}

/**
 * Directive attribute values are passed to parseProps verbatim as strings —
 * §4.5: "each widget validates its own props", so type interpretation
 * (numbers, booleans) is each widget's job. Pre-coercing here corrupted
 * string props that look numeric (e.g. expr="2", alt="42") — DECISIONS.md
 * D-004. Bare attributes (`{tangent}`) arrive as null/'' and mean `true`
 * (the one case with no string representation).
 */
export function coerceRawProps(raw: Record<string, string | null>): RawWidgetProps {
  const out: RawWidgetProps = {};
  for (const [key, value] of Object.entries(raw)) {
    out[key] = value === null || value === '' ? true : value;
  }
  return out;
}

function WidgetSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading widget"
      className="my-4 min-h-24 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800"
    />
  );
}

export function WidgetDirective(props: { attrs?: string }) {
  const raw = parseDirectiveAttrs(props.attrs);
  const { type, ...rest } = raw;

  if (typeof type !== 'string' || type === '') {
    return <DirectiveErrorCard title="Widget directive is missing its type attribute." />;
  }

  const def = widgetRegistry[type];
  if (!def) {
    // FR-CONT-006: never silently vanish.
    return <DirectiveErrorCard title={`Unknown widget: ${type}`} />;
  }

  const parsed = def.parseProps(coerceRawProps(rest));
  if (!parsed.ok) {
    // FR-WID-003: dev lists details; prod shows a brief notice.
    return <DirectiveErrorCard title={`Widget "${type}" has invalid props.`} details={parsed.errors} />;
  }

  const Widget = def.component;
  return (
    <Suspense fallback={<WidgetSkeleton />}>
      <Widget {...parsed.props} />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// ::py

export interface PyItemRendererProps {
  src: string;
  params?: Record<string, unknown>;
  height?: number;
}

export type PyItemRenderer = (props: PyItemRendererProps) => ReactNode;

export function PyDirective(props: { attrs?: string; pyItemRenderer?: PyItemRenderer }) {
  const raw = parseDirectiveAttrs(props.attrs);

  const src = typeof raw.src === 'string' && raw.src !== '' ? raw.src : undefined;
  if (src === undefined) {
    return <DirectiveErrorCard title="Python item directive is missing its src attribute." />;
  }

  let height: number | undefined;
  if (typeof raw.height === 'string' && raw.height !== '') {
    const n = Number(raw.height);
    if (Number.isFinite(n)) height = n;
  }

  let params: Record<string, unknown> | undefined;
  if (typeof raw.params === 'string' && raw.params !== '') {
    try {
      const parsed: unknown = JSON.parse(raw.params);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return <DirectiveErrorCard title={`Python item "${src}": params must be a JSON object.`} />;
      }
      params = parsed as Record<string, unknown>;
    } catch {
      return <DirectiveErrorCard title={`Python item "${src}": params is not valid JSON.`} />;
    }
  }

  if (props.pyItemRenderer) {
    return <>{props.pyItemRenderer({ src, params, height })}</>;
  }

  // P0 contract: the Python runtime lands in P1. Reserve layout space
  // (§4.5: height default auto, min 240) to prevent CLS.
  const minHeight = Math.max(height ?? 240, 240);
  return (
    <div
      data-py-placeholder=""
      className="my-4 flex items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
      style={{ minHeight: `${minHeight}px` }}
    >
      Python item: {src} (runtime not loaded)
    </div>
  );
}

// ---------------------------------------------------------------------------
// :::callout

const CALLOUT_KINDS = {
  info: {
    icon: Info,
    label: 'Info',
    className:
      'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100',
    iconClassName: 'text-sky-600 dark:text-sky-400',
  },
  tip: {
    icon: Lightbulb,
    label: 'Tip',
    className:
      'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    icon: TriangleAlert,
    label: 'Warning',
    className:
      'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
    iconClassName: 'text-amber-600 dark:text-amber-400',
  },
  key: {
    icon: KeyRound,
    label: 'Key idea',
    className:
      'border-violet-300 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-100',
    iconClassName: 'text-violet-600 dark:text-violet-400',
  },
} as const;

type CalloutKind = keyof typeof CALLOUT_KINDS;

function isCalloutKind(kind: string): kind is CalloutKind {
  return kind in CALLOUT_KINDS;
}

export function CalloutDirective(props: { kind?: string; children?: ReactNode }) {
  const requested = props.kind ?? '';
  const valid = isCalloutKind(requested);
  // Invalid/missing kind: treat as info (§4.5 task contract).
  const kind: CalloutKind = valid ? requested : 'info';
  const { icon: Icon, label, className, iconClassName } = CALLOUT_KINDS[kind];
  return (
    <aside
      role="note"
      data-callout={kind}
      className={`motion-safe:animate-reveal-in my-4 flex gap-3 rounded-md border px-4 py-3 ${className}`}
    >
      <Icon aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${iconClassName}`} />
      <div className="min-w-0 flex-1">
        <span className="sr-only">{label}: </span>
        {!valid && import.meta.env.DEV ? (
          <span
            data-callout-kind-warning=""
            className="mb-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200"
          >
            Unknown callout kind: {requested === '' ? '(missing)' : requested}
          </span>
        ) : null}
        {props.children}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// :::reveal

export function RevealDirective(props: { title?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const title =
    typeof props.title === 'string' && props.title.trim() !== '' ? props.title : 'Reveal';
  return (
    <div className="my-4 rounded-md border border-slate-300 dark:border-slate-700">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      >
        <ChevronRight
          aria-hidden="true"
          className={`size-4 shrink-0 transition-transform motion-reduce:transition-none ${open ? 'rotate-90' : ''}`}
        />
        {title}
      </button>
      {open ? (
        <div
          id={contentId}
          className="motion-safe:animate-reveal-in border-t border-slate-200 px-4 py-3 dark:border-slate-800"
        >
          {props.children}
        </div>
      ) : null}
    </div>
  );
}
