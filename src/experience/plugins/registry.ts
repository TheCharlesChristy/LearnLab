import type { AnyActivityPlugin } from './contracts';
import {
  adapterActivityPluginRegistry,
  coreActivityPluginRegistry,
  diagnoseRepairActivityPluginRegistry,
  experimentInferActivityPluginRegistry,
  explorableActivityPluginRegistry,
  pythonActivityPluginRegistry,
} from '../adapters';
import { seededChoicePlugin } from './reference/seeded-choice';

/** C1's small explicit registry; C2 will derive build schemas/docs from it. */
export const activityPluginRegistry: Readonly<Record<string, AnyActivityPlugin>> = Object.freeze({
  [seededChoicePlugin.key]: seededChoicePlugin as unknown as AnyActivityPlugin,
  ...coreActivityPluginRegistry,
  ...diagnoseRepairActivityPluginRegistry,
  ...adapterActivityPluginRegistry,
  ...explorableActivityPluginRegistry,
  ...pythonActivityPluginRegistry,
  ...experimentInferActivityPluginRegistry,
});

export function getActivityPlugin(key: string): AnyActivityPlugin | undefined {
  return activityPluginRegistry[key];
}
