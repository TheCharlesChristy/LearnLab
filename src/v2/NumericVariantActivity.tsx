import { useState } from 'react';
import { parseNumericInput } from '../quiz/marking';
import { numericQuestion } from './numeric-variant';
import type { NumericVariantActivity as NumericVariantContract } from './numeric-variant';
import type { NodeMemory } from './run';

export default function NumericVariantActivity({
  activity,
  memory,
  disabled,
  onAnswer,
}: {
  activity: NumericVariantContract;
  memory: NodeMemory;
  disabled: boolean;
  onAnswer: (value: string, unit: string) => void;
}) {
  const [value, setValue] = useState(memory.numericValue ?? '');
  const [unit, setUnit] = useState(memory.numericUnit ?? activity.units[0]!.symbol);
  const [inputError, setInputError] = useState('');
  const passed = memory.numericCorrect === true;
  return (
    <div className="space-y-3">
      <p className="font-semibold">{numericQuestion(activity, memory.numericVariant!)}</p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (parseNumericInput(value) === null) {
            setInputError('Enter a finite number, such as 0.5 or 5e-1.');
            return;
          }
          setInputError('');
          onAnswer(value.trim(), unit);
        }}
      >
        <label className="grid w-full min-w-0 gap-1 sm:w-auto sm:flex-1">
          Your answer
          <input
            className="lab-numeric-control w-full min-w-0 max-w-full min-h-11 rounded border p-2"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={value}
            maxLength={32}
            disabled={disabled || passed}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <label className="grid gap-1">
          Unit
          <select
            className="lab-numeric-control min-h-11 rounded border p-2"
            value={unit}
            disabled={disabled || passed}
            onChange={(event) => setUnit(event.target.value)}
          >
            {activity.units.map((option) => <option key={option.symbol} value={option.symbol}>{option.symbol}</option>)}
          </select>
        </label>
        <button className="lab-choice min-h-11" type="submit" disabled={disabled || passed}>Check answer</button>
      </form>
      {inputError && <p role="alert" className="lab-feedback">{inputError}</p>}
      {memory.attempts > 0 && (
        <p role="status" className="lab-feedback">
          {passed
            ? `Answer checked using ${memory.numericUnit}. Explain why the quantities have this relationship before continuing.`
            : `Not yet. Check the relation and unit conversion, then try again. Your last answer was ${memory.numericValue} ${memory.numericUnit}.`}
        </p>
      )}
    </div>
  );
}
