// The experience runtime deliberately owns no Dexie tables. All persistence
// crosses the public progress-subsystem boundary in ../progress/db.

import {
  appendExperienceRunBoundary,
  eraseExperienceRunData,
  replayExperienceRun,
  startExperienceRun as startProgressExperienceRun,
} from '../../progress/db';
import type { ExperienceRun, RunBoundaryInput, StartExperienceRunInput } from './types';

export function startExperienceRun(input: StartExperienceRunInput): Promise<ExperienceRun> {
  return startProgressExperienceRun(input);
}

export function appendRunBoundary(
  runId: string,
  input: RunBoundaryInput,
): Promise<ExperienceRun> {
  return appendExperienceRunBoundary(runId, input);
}

export function replayStoredRun(runId: string): Promise<ExperienceRun> {
  return replayExperienceRun(runId);
}

export function eraseExperienceRuns(): Promise<void> {
  return eraseExperienceRunData();
}
