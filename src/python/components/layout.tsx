// Layout components — SRS §6.7 (Column, Row, Card, Divider, Spacer).
// Pure containers: no events. `gap`/`size` are Tailwind spacing units; we map
// them through a fixed lookup so Tailwind's JIT can see the literal classes
// (dynamic `gap-${n}` strings would be purged).

import type { PyComponentProps } from '../py-render-context';
import { usePyRender } from '../py-render-context';

import { num, optStr, str } from './props';

// Tailwind spacing scale we support for gap/spacer; clamped into this set so
// the classes are statically present in the build.
const GAP_CLASS: Record<number, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
};
const SIZE_CLASS: Record<number, string> = {
  0: 'h-0',
  1: 'h-1',
  2: 'h-2',
  3: 'h-3',
  4: 'h-4',
  5: 'h-5',
  6: 'h-6',
  8: 'h-8',
};
const ALIGN_CLASS: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

function gapClass(n: number): string {
  return GAP_CLASS[n] ?? GAP_CLASS[2]!;
}

export const Column: React.FC<PyComponentProps> = ({ node }) => {
  const { renderChildren } = usePyRender();
  return (
    <div className={`flex flex-col ${gapClass(num(node.props, 'gap', 2))}`}>
      {renderChildren(node.children)}
    </div>
  );
};

export const Row: React.FC<PyComponentProps> = ({ node }) => {
  const { renderChildren } = usePyRender();
  const wrap = node.props['wrap'] === false ? 'flex-nowrap' : 'flex-wrap';
  const align = ALIGN_CLASS[str(node.props, 'align', 'center')] ?? ALIGN_CLASS['center']!;
  return (
    <div className={`flex flex-row ${wrap} ${align} ${gapClass(num(node.props, 'gap', 2))}`}>
      {renderChildren(node.children)}
    </div>
  );
};

export const Card: React.FC<PyComponentProps> = ({ node }) => {
  const { renderChildren } = usePyRender();
  const title = optStr(node.props, 'title');
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {title !== undefined && title !== '' && (
        <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      )}
      <div className="flex flex-col gap-2">{renderChildren(node.children)}</div>
    </section>
  );
};

export const Divider: React.FC<PyComponentProps> = () => (
  <hr className="my-2 border-t border-slate-200 dark:border-slate-700" />
);

export const Spacer: React.FC<PyComponentProps> = ({ node }) => {
  const size = num(node.props, 'size', 2);
  const cls = SIZE_CLASS[size] ?? SIZE_CLASS[2]!;
  return <div aria-hidden="true" className={cls} />;
};
