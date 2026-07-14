import { V1ScreenActivityAdapter } from './v1-screens';
import type { ActivityPluginRenderProps } from '../plugins/contracts';
import type { V1ScreenActivityProps } from './v1-screen-plugin';

/** Lazy activity entry point; keeps v1 render code out of the core plugin chunk. */
export default function V1ScreenActivity({
  props,
  disabled,
  reportOutcome,
}: ActivityPluginRenderProps<V1ScreenActivityProps>) {
  return (
    <V1ScreenActivityAdapter
      props={props}
      disabled={disabled}
      // The adapter intentionally emits no values/events: the old screen's
      // own gate is the evidence and v2 owns the durable boundary.
      reportOutcome={() =>
        reportOutcome({ schemaVersion: 1, completed: true, values: {}, events: [] })
      }
    />
  );
}
