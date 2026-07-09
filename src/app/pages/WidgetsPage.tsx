// Widget gallery (#/widgets): dynamically enumerates every widget in
// src/widgets/registry.ts and shows its docs/WIDGETS.md documentation
// (description, props, example). Adding a widget via the existing runbook
// (docs/ARCHITECTURE.md §4) requires no changes here.
import { Suspense } from 'react';

import { WIDGET_KEYS } from '../../widgets/registry';
import { Card } from '../../ui';
import { LazyMarkdownInline } from '../shared';
import type { WidgetDoc, WidgetPropRow } from '../widgetDocs';
import { getWidgetDoc } from '../widgetDocs';

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

function WidgetCard({ widgetKey, doc }: { widgetKey: string; doc: WidgetDoc | undefined }) {
  if (!doc) {
    return (
      <Card className="min-w-0">
        <h2 className="font-mono text-sm font-semibold">{widgetKey}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Documentation unavailable.
        </p>
      </Card>
    );
  }

  return (
    <Card className="min-w-0">
      <h2 className="font-mono text-sm font-semibold">{doc.key}</h2>
      <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
        <InlineMarkdown markdown={doc.description} />
      </div>
      <PropsTable props={doc.props} />
      {doc.example && (
        <pre className="mt-3 overflow-x-auto rounded-md bg-slate-100 p-3 text-xs dark:bg-slate-800">
          <code>{doc.example}</code>
        </pre>
      )}
    </Card>
  );
}

export default function WidgetsPage() {
  const keys = [...WIDGET_KEYS].sort((a, b) => a.localeCompare(b));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Widgets</h1>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
        Every native widget available in lesson content ({keys.length} total), read directly from
        the widget registry and its documentation.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {keys.map((key) => (
          <WidgetCard key={key} widgetKey={key} doc={getWidgetDoc(key)} />
        ))}
      </div>
    </div>
  );
}
