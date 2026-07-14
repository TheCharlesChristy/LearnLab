import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  experienceRunEventCount,
  getExperienceRun,
} from '../../progress/db';
import { eraseAll, exportProgress, importProgress } from '../../progress/export';
import { applyEffects } from './effects';
import { projectRunStart } from './projection';
import {
  appendRunBoundary,
  eraseExperienceRuns,
  replayStoredRun,
  startExperienceRun,
} from './persistence';
import { RUN_EVENT_MAX_BYTES } from './limits';
import type { StartExperienceRunInput } from './types';

const START: StartExperienceRunInput = {
  runId: 'run-1',
  eventId: 'created-1',
  packId: 'bridge-pack',
  experienceId: 'repair-bridge',
  packVersion: '1.0.0',
  experienceVersion: '1.0.0',
  stateVersion: '1.0.0',
  entryNodeId: 'inspect',
  initialVariables: { '/bridge/repaired': false, '/score': 1, '/tools': ['spanner'] },
  occurredAt: 1_000,
};

beforeEach(async () => {
  await eraseAll();
});

afterEach(() => vi.restoreAllMocks());

describe('typed, schema-validated pure effects', () => {
  it('projects every registered operator deterministically without evaluating content code', () => {
    const result = applyEffects(
      projectRunStart(START),
      [
        { operator: 'set', path: '/bridge/repaired', value: true },
        { operator: 'increment', path: '/score', by: 2 },
        { operator: 'append', path: '/tools', value: 'rope' },
        { operator: 'unlock-capability', capabilityId: 'bridge-access' },
        {
          operator: 'emit-evidence',
          skillId: 'force-balance',
          outcome: 'success',
          independence: 'independent',
          confidence: 'sure',
        },
        { operator: 'checkpoint', label: 'repair complete' },
        { operator: 'celebrate', milestoneId: 'first-repair' },
      ],
      { eventId: 'boundary-1', nodeId: 'repair' },
    );
    expect(result.variables).toMatchObject({
      '/bridge/repaired': true,
      '/score': 3,
      '/tools': ['spanner', 'rope'],
    });
    expect(result.unlockedCapabilityIds).toEqual(['bridge-access']);
    expect(result.evidence[0]).toMatchObject({ skillId: 'force-balance', eventId: 'boundary-1' });
    expect(result.checkpoint).toEqual({
      nodeId: 'repair',
      eventId: 'boundary-1',
      label: 'repair complete',
    });
    expect(result.celebrations).toEqual(['first-repair']);
  });

  it('rejects an unregistered/malformed effect before a handler can run', () => {
    expect(() =>
      applyEffects(projectRunStart(START), [{ operator: 'eval', source: 'alert(1)' }] as never, {
        eventId: 'bad',
        nodeId: 'inspect',
      }),
    ).toThrow(/Effect rejected by the v2 schema/);
  });
});

describe('Dexie projection and append-only event log', () => {
  it('writes only at a boundary, atomically projects it, and replays it exactly', async () => {
    await startExperienceRun(START);
    const next = await appendRunBoundary('run-1', {
      eventId: 'boundary-1',
      nodeId: 'inspect',
      nextNodeId: 'repair',
      effects: [
        { operator: 'set', path: '/bridge/repaired', value: true },
        { operator: 'checkpoint', label: 'inspection' },
      ],
      telemetry: { attempts: 1, responseTimeMs: 750 },
      occurredAt: 2_000,
    });
    expect(next.currentNodeId).toBe('repair');
    expect(next.eventCount).toBe(2);
    expect(await experienceRunEventCount('run-1')).toBe(2);
    await expect(replayStoredRun('run-1')).resolves.toEqual(next);

    // Retry with the same id is idempotent; it never mutates the append-only log.
    await appendRunBoundary('run-1', { eventId: 'boundary-1', nodeId: 'inspect', effects: [] });
    expect(await experienceRunEventCount('run-1')).toBe(2);
  });

  it('rejects an oversized/corrupt boundary without a partial write', async () => {
    await startExperienceRun(START);
    await expect(
      appendRunBoundary('run-1', {
        eventId: 'too-large',
        nodeId: 'inspect',
        effects: [{ operator: 'set', path: '/note', value: 'x'.repeat(RUN_EVENT_MAX_BYTES) }],
      }),
    ).rejects.toThrow(/storage cap/);
    expect(await experienceRunEventCount('run-1')).toBe(1);
    expect((await getExperienceRun('run-1'))!.eventCount).toBe(1);
  });

  it('explicitly erases only v2 run data through the progress boundary', async () => {
    await startExperienceRun(START);
    await eraseExperienceRuns();
    expect(await getExperienceRun('run-1')).toBeUndefined();
    expect(await experienceRunEventCount('run-1')).toBe(0);
  });
});

describe('v4 safe export/import', () => {
  it('round-trips a replayable v2 run and accepts historic v1/v2-shaped exports', async () => {
    await startExperienceRun(START);
    await appendRunBoundary('run-1', {
      eventId: 'boundary-1',
      nodeId: 'inspect',
      nextNodeId: 'ending',
      ending: 'complete',
      effects: [{ operator: 'celebrate', milestoneId: 'repair' }],
      occurredAt: 2_000,
    });
    const exported = await exportProgress();
    expect(exported.exportVersion).toBe(4);
    await eraseExperienceRuns();
    await importProgress(JSON.parse(JSON.stringify(exported)));
    expect((await replayStoredRun('run-1')).ending).toBe('complete');

    await expect(
      importProgress({
        app: 'learnlab',
        exportVersion: 2,
        exportedAt: new Date().toISOString(),
        tables: {
          moduleState: [],
          lessonProgress: [],
          attempts: [],
          itemState: [],
          kv: [],
          reviewState: [],
        },
      }),
    ).resolves.toEqual({ imported: 0, skipped: 0 });
  });

  it('rejects a corrupted event stream before touching existing rows', async () => {
    await startExperienceRun(START);
    const exported = await exportProgress();
    const corrupt = JSON.parse(JSON.stringify(exported));
    corrupt.tables.experienceEvents[0].sequence = 1;
    const before = await getExperienceRun('run-1');
    await expect(importProgress(corrupt)).rejects.toThrow(/corrupt experience run/);
    expect(await getExperienceRun('run-1')).toEqual(before);
  });
});
