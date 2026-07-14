import { DiagnoseRepairActivity } from '../templates/DiagnoseRepairActivity';
import type { ActivityPluginRenderProps } from '../plugins/contracts';

import type { DiagnoseRepairActivityProps } from './diagnose-repair-plugin';

/** Lazy bridge from the reusable repair template to the v2 activity boundary. */
export default function DiagnoseRepairPluginActivity({
  props,
  disabled,
  reportOutcome,
}: ActivityPluginRenderProps<DiagnoseRepairActivityProps>) {
  return <DiagnoseRepairActivity template={props} disabled={disabled} onOutcome={reportOutcome} />;
}
