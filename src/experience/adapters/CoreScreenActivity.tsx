import { useRef } from 'react';

import { screenRegistry } from '../../screens';
import type { ScreenInteraction } from '../../screens/screen-def';
import { normaliseActivityOutcome } from '../plugins/contracts';
import type {
  ActivityEvent,
  ActivityOutcomeValue,
  ActivityPluginRenderProps,
} from '../plugins/contracts';

import type { CoreScreenActivityProps } from './core-screen-plugins';

/**
 * Bridges a gated core screen to the C1 outcome boundary without replacing
 * its UI. The original runner still owns keyboard handling, hints, feedback,
 * read aloud, motion, and the real-action gate; this component only records
 * its optional serialisable observation trace until Finish/Continue.
 */
export default function CoreScreenActivity({
  props,
  disabled,
  reportOutcome,
}: ActivityPluginRenderProps<CoreScreenActivityProps>) {
  const advanced = useRef(false);
  const events = useRef<Array<Omit<ActivityEvent, 'schemaVersion'>>>([]);
  const values = useRef<Record<`/${string}`, ActivityOutcomeValue>>({});
  const Runner = screenRegistry[props.screen.type].component;

  function observe(interaction: ScreenInteraction): void {
    if (disabled || advanced.current) return;
    const nextValues = interaction.values
      ? ({ ...interaction.values } as Record<`/${string}`, ActivityOutcomeValue>)
      : undefined;
    if (nextValues) Object.assign(values.current, nextValues);
    events.current.push({
      sequence: events.current.length,
      type: interaction.type,
      ...(nextValues ? { values: nextValues } : {}),
    });
  }

  function advance(): void {
    if (disabled || advanced.current) return;
    advanced.current = true;
    reportOutcome(
      normaliseActivityOutcome({
        completed: true,
        values: values.current,
        events: events.current,
      }),
    );
  }

  return (
    <Runner
      screen={props.screen}
      screenKey={`${props.legacyLessonId}:${props.screen.id}`}
      index={props.index}
      total={props.total}
      onInteraction={observe}
      onAdvance={advance}
    />
  );
}
