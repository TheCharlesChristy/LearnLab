// Display components — SRS §6.7 (Text, Markdown, Image, Alert, Table,
// CodeBlock, Badge, ProgressBar). All read-only; no events.
//
// Markdown reuses src/markdown's public MarkdownInline (NOT a new renderer):
// same GFM + KaTeX + skipHtml pipeline as lessons, minus directives (§6.7 note
// "no recursion"). No raw HTML anywhere here.

import { MarkdownInline } from '../../markdown';
import type { PyComponentProps } from '../py-render-context';

import { arr, bool, cellText, num, optNum, optStr, str, strList } from './props';

// ---------------------------------------------------------------------------
// Text — size ∈ {sm,md,lg,xl}; weight; optional color; mono.

const TEXT_SIZE: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};
const TEXT_WEIGHT: Record<string, string> = {
  thin: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export const Text: React.FC<PyComponentProps> = ({ node }) => {
  const size = TEXT_SIZE[str(node.props, 'size', 'md')] ?? TEXT_SIZE['md']!;
  const weight = TEXT_WEIGHT[str(node.props, 'weight', 'normal')] ?? TEXT_WEIGHT['normal']!;
  const mono = bool(node.props, 'mono', false);
  // `color` is an author-supplied CSS colour (trusted content) applied via
  // inline style only — never injected as HTML. Falls back to a token class.
  const color = optStr(node.props, 'color');
  const colorClass = color === undefined ? 'text-slate-800 dark:text-slate-100' : '';
  return (
    <span
      className={`${size} ${weight} ${mono ? 'font-mono' : ''} ${colorClass}`}
      style={color === undefined ? undefined : { color }}
    >
      {str(node.props, 'text')}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Markdown — reuse the public inline renderer (§6.7).

export const Markdown: React.FC<PyComponentProps> = ({ node }) => (
  <div className="prose prose-slate max-w-none dark:prose-invert">
    <MarkdownInline markdown={str(node.props, 'text')} />
  </div>
);

// ---------------------------------------------------------------------------
// Image — src module-relative or data URI; required alt.

export const Image: React.FC<PyComponentProps> = ({ node }) => {
  const width = optNum(node.props, 'width');
  return (
    <img
      src={str(node.props, 'src')}
      alt={str(node.props, 'alt')}
      width={width}
      loading="lazy"
      className="h-auto max-w-full rounded"
    />
  );
};

// ---------------------------------------------------------------------------
// Alert — kind ∈ {info,success,warning,error}. role=status/alert + aria-live.

const ALERT_STYLE: Record<string, { box: string; role: 'status' | 'alert' }> = {
  info: {
    box: 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-100',
    role: 'status',
  },
  success: {
    box: 'border-green-300 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-100',
    role: 'status',
  },
  warning: {
    box: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100',
    role: 'alert',
  },
  error: {
    box: 'border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100',
    role: 'alert',
  },
};

export const Alert: React.FC<PyComponentProps> = ({ node }) => {
  const style = ALERT_STYLE[str(node.props, 'kind', 'info')] ?? ALERT_STYLE['info']!;
  return (
    <div
      role={style.role}
      aria-live={style.role === 'alert' ? 'assertive' : 'polite'}
      className={`rounded-md border px-3 py-2 text-sm ${style.box}`}
    >
      {str(node.props, 'text')}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Table — headers + rows of scalar cells.

export const Table: React.FC<PyComponentProps> = ({ node }) => {
  const headers = strList(node.props, 'headers');
  const rows = arr(node.props, 'rows');
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        {headers.length > 0 && (
          <thead>
            <tr className="border-b border-slate-300 dark:border-slate-600">
              {headers.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, r) => {
            const cells = Array.isArray(row) ? row : [row];
            return (
              <tr
                key={r}
                className="border-b border-slate-200 last:border-0 dark:border-slate-700"
              >
                {cells.map((cell, c) => (
                  <td key={c} className="px-3 py-2 text-slate-700 dark:text-slate-200">
                    {cellText(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ---------------------------------------------------------------------------
// CodeBlock — read-only; plain <pre><code> (no editing, no raw HTML).

export const CodeBlock: React.FC<PyComponentProps> = ({ node }) => {
  const language = str(node.props, 'language', 'python');
  return (
    <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 text-sm text-slate-100 dark:bg-slate-950">
      <code data-language={language} className="font-mono">
        {str(node.props, 'code')}
      </code>
    </pre>
  );
};

// ---------------------------------------------------------------------------
// Badge — kind ∈ {neutral,info,success,warning,error} (neutral default).

const BADGE_STYLE: Record<string, string> = {
  neutral: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
  info: 'bg-sky-200 text-sky-900 dark:bg-sky-800 dark:text-sky-100',
  success: 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100',
  warning: 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100',
  error: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
};

export const Badge: React.FC<PyComponentProps> = ({ node }) => {
  const style = BADGE_STYLE[str(node.props, 'kind', 'neutral')] ?? BADGE_STYLE['neutral']!;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {str(node.props, 'text')}
    </span>
  );
};

// ---------------------------------------------------------------------------
// ProgressBar — value/max, optional label. role=progressbar + aria-value*.

export const ProgressBar: React.FC<PyComponentProps> = ({ node }) => {
  const max = num(node.props, 'max', 1);
  const value = num(node.props, 'value', 0);
  const safeMax = max > 0 ? max : 1;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const pct = Math.round((clamped / safeMax) * 100);
  const label = optStr(node.props, 'label');
  return (
    <div className="flex flex-col gap-1">
      {label !== undefined && label !== '' && (
        <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label === undefined || label === '' ? 'Progress' : label}
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
      >
        <div
          className="h-full rounded-full bg-indigo-600 motion-safe:transition-[width] dark:bg-indigo-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
