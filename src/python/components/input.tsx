// Input components — SRS §6.7. All are CONTROLLED by node.props
// (value/checked/values), emit their handler token on change via
// usePyRender().emit(token, value), and are keyboard-operable and labelled
// (NFR-A11Y-001). Native form controls are used throughout, so focus order,
// arrow-key behaviour and screen-reader semantics come for free.

import { useId } from 'react';

import type { JsonValue } from '../protocol';
import type { PyComponentProps } from '../py-render-context';
import { usePyRender } from '../py-render-context';

import { bool, handler, num, optNum, optStr, str, strList } from './props';

// Shared control styling (visible focus ring, 4.5:1 contrast, both themes).
const FIELD =
  'rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-600 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus-visible:outline-indigo-300';
const LABEL = 'text-sm font-medium text-slate-700 dark:text-slate-200';

// ---------------------------------------------------------------------------
// Button — kind ∈ {primary,secondary,danger,ghost}; on_click(value=None).

const BUTTON_KIND: Record<string, string> = {
  primary:
    'bg-indigo-700 text-white hover:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-400',
  secondary:
    'bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
  danger: 'bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700',
};

export const Button: React.FC<PyComponentProps> = ({ node }) => {
  const { emit } = usePyRender();
  const token = handler(node.props, 'on_click');
  const disabled = bool(node.props, 'disabled', false);
  const kind = BUTTON_KIND[str(node.props, 'kind', 'primary')] ?? BUTTON_KIND['primary']!;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => token !== undefined && emit(token, null)}
      className={
        'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ' +
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ' +
        'disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors ' +
        'dark:focus-visible:outline-indigo-300 ' +
        kind
      }
    >
      {str(node.props, 'label')}
    </button>
  );
};

// ---------------------------------------------------------------------------
// Slider — emits on input (host throttles, §6.7); on_change(value: float).

export const Slider: React.FC<PyComponentProps> = ({ node }) => {
  const { emit } = usePyRender();
  const id = useId();
  const token = handler(node.props, 'on_change');
  const min = num(node.props, 'min', 0);
  const max = num(node.props, 'max', 100);
  const step = num(node.props, 'step', 1);
  const value = num(node.props, 'value', min);
  const label = str(node.props, 'label');
  const showValue = bool(node.props, 'show_value', true);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={LABEL}>
        {label}
        {showValue && <span className="ml-2 font-mono text-slate-500">{value}</span>}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => token !== undefined && emit(token, Number(e.target.value))}
        className="accent-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:accent-indigo-400"
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// NumberInput — on_change(value: float | None); accepts scientific notation.
// We use a text input (type=number rejects intermediate "1e" states); parse
// with Number() which accepts "1.2e3"/"-3.5"; empty/invalid → null.

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export const NumberInput: React.FC<PyComponentProps> = ({ node }) => {
  const { emit } = usePyRender();
  const id = useId();
  const token = handler(node.props, 'on_change');
  const value = optNum(node.props, 'value');
  const unit = optStr(node.props, 'unit');
  const min = optNum(node.props, 'min');
  const max = optNum(node.props, 'max');
  const step = optNum(node.props, 'step');
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={LABEL}>
        {str(node.props, 'label')}
      </label>
      <span className="flex items-center gap-1">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value === undefined ? '' : String(value)}
          min={min}
          max={max}
          step={step}
          onChange={(e) => token !== undefined && emit(token, parseNumber(e.target.value))}
          className={FIELD}
        />
        {unit !== undefined && unit !== '' && (
          <span className="text-sm text-slate-500 dark:text-slate-400">{unit}</span>
        )}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// TextInput — on_change(str); Enter triggers on_submit(str) (§6.7).

export const TextInput: React.FC<PyComponentProps> = ({ node }) => {
  const { emit } = usePyRender();
  const id = useId();
  const changeToken = handler(node.props, 'on_change');
  const submitToken = handler(node.props, 'on_submit');
  const value = str(node.props, 'value');
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={LABEL}>
        {str(node.props, 'label')}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={str(node.props, 'placeholder')}
        onChange={(e) => changeToken !== undefined && emit(changeToken, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && submitToken !== undefined) {
            e.preventDefault();
            emit(submitToken, e.currentTarget.value);
          }
        }}
        className={FIELD}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Select — on_change(value: str).

export const Select: React.FC<PyComponentProps> = ({ node }) => {
  const { emit } = usePyRender();
  const id = useId();
  const token = handler(node.props, 'on_change');
  const options = strList(node.props, 'options');
  const value = str(node.props, 'value');
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={LABEL}>
        {str(node.props, 'label')}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => token !== undefined && emit(token, e.target.value)}
        className={FIELD}
      >
        {options.map((opt, i) => (
          <option key={i} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

// ---------------------------------------------------------------------------
// RadioGroup — on_change(index: int). value is the selected option STRING;
// we emit its index (§6.7). Rendered as a labelled <fieldset> radiogroup.

export const RadioGroup: React.FC<PyComponentProps> = ({ node }) => {
  const { emit } = usePyRender();
  const name = useId();
  const token = handler(node.props, 'on_change');
  const options = strList(node.props, 'options');
  const value = str(node.props, 'value');
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className={LABEL}>{str(node.props, 'label')}</legend>
      {options.map((opt, i) => (
        <label key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="radio"
            name={name}
            checked={opt === value}
            onChange={() => token !== undefined && emit(token, i)}
            className="accent-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:accent-indigo-400"
          />
          {opt}
        </label>
      ))}
    </fieldset>
  );
};

// ---------------------------------------------------------------------------
// Checkbox — on_change(checked: bool).

export const Checkbox: React.FC<PyComponentProps> = ({ node }) => {
  const { emit } = usePyRender();
  const id = useId();
  const token = handler(node.props, 'on_change');
  const checked = bool(node.props, 'checked', false);
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => token !== undefined && emit(token, e.target.checked)}
        className="accent-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:accent-indigo-400"
      />
      {str(node.props, 'label')}
    </label>
  );
};

// ---------------------------------------------------------------------------
// CheckboxGroup — values: list[int] (selected indices); on_change(list[int]).

export const CheckboxGroup: React.FC<PyComponentProps> = ({ node }) => {
  const { emit } = usePyRender();
  const token = handler(node.props, 'on_change');
  const options = strList(node.props, 'options');
  const rawValues = node.props['values'];
  const selected = new Set<number>(
    Array.isArray(rawValues)
      ? rawValues.filter((v): v is number => typeof v === 'number')
      : [],
  );

  const toggle = (index: number) => {
    if (token === undefined) return;
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    const out: JsonValue = [...next].sort((a, b) => a - b);
    emit(token, out);
  };

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className={LABEL}>{str(node.props, 'label')}</legend>
      {options.map((opt, i) => (
        <label key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={selected.has(i)}
            onChange={() => toggle(i)}
            className="accent-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:accent-indigo-400"
          />
          {opt}
        </label>
      ))}
    </fieldset>
  );
};
