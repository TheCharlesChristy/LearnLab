import { useMemo, useState } from 'react';

import { Button } from '../../../ui';
import { normaliseActivityOutcome } from '../contracts';
import type { ActivityPluginRenderProps } from '../contracts';
import { shuffleForSeed } from './seeded';
import type { SeededChoiceProps } from './seeded-choice';

/** Minimal C1 reference activity: a seeded, keyboard-native single choice. */
export default function SeededChoiceActivity({
  props,
  context,
  disabled,
  reportOutcome,
}: ActivityPluginRenderProps<SeededChoiceProps>) {
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('Choose one answer, then submit it.');
  const options = useMemo(() => shuffleForSeed(props.options, context.seed), [context.seed, props.options]);

  function submit() {
    if (!selected || disabled) return;
    const correct = selected === props.correctId;
    setMessage(correct ? 'Correct answer submitted.' : 'Answer submitted. Try again if needed.');
    reportOutcome(
      normaliseActivityOutcome({
        completed: correct,
        values: { '/answer': selected },
        events: [
          { sequence: 0, type: 'interaction', values: { '/answer': selected } },
          { sequence: 1, type: 'attempted', values: { '/answer': selected } },
        ],
      }),
    );
  }

  return (
    <section aria-label="Seeded choice activity" aria-describedby="seeded-choice-instructions">
      <p id="seeded-choice-instructions">{props.prompt}</p>
      <div className="mt-3 space-y-2" role="radiogroup" aria-label="Answer choices">
        {options.map((option) => (
          <label key={option.id} className="flex min-h-11 items-center gap-2">
            <input
              type="radio"
              name={`seeded-choice-${context.activityInstanceId}`}
              value={option.id}
              checked={selected === option.id}
              disabled={disabled}
              onChange={() => setSelected(option.id)}
            />
            {option.label}
          </label>
        ))}
      </div>
      <Button className="mt-4" disabled={!selected || disabled} onClick={submit}>
        Submit answer
      </Button>
      <p className="sr-only" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
