// Stable storage-growth fixture for Experience Runtime v2 / issue #64.
// It exercises the real persistence/export boundary rather than duplicating
// its caps in a mock.  It deliberately keeps event payloads representative;
// the per-event byte cap is covered by the run-state boundary tests.

import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { db, experienceRunEventCount, getExperienceRun } from '../progress/db';
import {
  eraseExperienceRuns,
  RUN_EVENT_MAX_PER_RUN,
  startExperienceRun,
  appendRunBoundary,
} from './run-state';
import { exportProgress, importProgress } from '../progress/export';

const LONG_RUN_EXPORT_BUDGET_BYTES = 2 * 1024 * 1024;

beforeEach(async () => {
  await db.open();
  await Promise.all(db.tables.map((table) => table.clear()));
});

afterEach(async () => {
  await db.close();
});

describe('v2 quality storage budget (#64)', () => {
  it('bounds a long synthetic run, exports it, and fully cleans it up', async () => {
    const runId = 'quality-long-run';
    await startExperienceRun({
      runId,
      eventId: 'start',
      packId: 'quality-pack',
      experienceId: 'quality-experience',
      packVersion: '1.0.0',
      experienceVersion: '1.0.0',
      stateVersion: '1.0.0',
      entryNodeId: 'scene-0',
      initialVariables: {},
      occurredAt: 1,
    });

    // One start event plus the maximum permitted number of subsequent
    // boundaries proves that unbounded diagnostic growth cannot sneak in.
    for (let sequence = 1; sequence < RUN_EVENT_MAX_PER_RUN; sequence += 1) {
      await appendRunBoundary(runId, {
        eventId: `quality-${sequence}`,
        nodeId: `scene-${sequence}`,
        effects: [],
        nextNodeId: `scene-${sequence + 1}`,
        occurredAt: sequence + 1,
        telemetry: { attempts: sequence % 3, responseTimeMs: 120 + (sequence % 10) },
      });
    }

    // The start event counts toward the same per-run limit, so the final
    // append is rejected and neither event nor projection grows further.
    await expect(
      appendRunBoundary(runId, {
        eventId: 'over-cap',
        nodeId: 'scene-over-cap',
        effects: [],
      }),
    ).rejects.toThrow(/event cap/);
    expect(await experienceRunEventCount(runId)).toBe(RUN_EVENT_MAX_PER_RUN);

    const exported = await exportProgress();
    const bytes = new TextEncoder().encode(JSON.stringify(exported)).byteLength;
    expect(bytes).toBeLessThan(LONG_RUN_EXPORT_BUDGET_BYTES);
    expect(exported.tables.experienceEvents).toHaveLength(RUN_EVENT_MAX_PER_RUN);
    expect(exported.tables.experienceRuns).toHaveLength(1);

    await eraseExperienceRuns();
    expect(await getExperienceRun(runId)).toBeUndefined();
    expect(await experienceRunEventCount(runId)).toBe(0);

    await expect(importProgress(exported)).resolves.toMatchObject({
      imported: RUN_EVENT_MAX_PER_RUN + 1,
    });
    expect(await experienceRunEventCount(runId)).toBe(RUN_EVENT_MAX_PER_RUN);
  }, 30_000);
});
