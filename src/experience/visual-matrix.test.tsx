import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  MissionCapabilities,
  MissionCheckpointPanel,
  MissionObjectivePanel,
  MissionOutcomeBanner,
  WorldMeterPanel,
} from './mission/MissionKit';
import { deriveCapabilities, deriveObjectiveStages, deriveWorldMeters } from './mission/derive';
import { MISSION_KIT_FIXTURES } from './mission/fixtures';
import { SceneError, SceneShell } from './presentation/ScenePresentation';

type Viewport = 'narrow' | 'wide';
type Theme = 'light' | 'dark';
type Motion = 'full' | 'reduced';

interface VisualCase {
  name: string;
  fixtureId: (typeof MISSION_KIT_FIXTURES)[number]['id'];
  viewport: Viewport;
  theme: Theme;
  motion: Motion;
  error?: boolean;
}

// The matrix is deliberately small but covers each state the release contract
// promises: normal/recoverable/branch/terminal content, both layout breakpoints,
// both themes, reduced motion, and a learner-safe error card.
const CASES: readonly VisualCase[] = [
  { name: 'success-wide-light-motion', fixtureId: 'success', viewport: 'wide', theme: 'light', motion: 'full' },
  { name: 'success-narrow-dark-reduced', fixtureId: 'success', viewport: 'narrow', theme: 'dark', motion: 'reduced' },
  { name: 'recoverable-wide-dark-reduced', fixtureId: 'recoverable-failure', viewport: 'wide', theme: 'dark', motion: 'reduced', error: true },
  { name: 'recoverable-narrow-light-motion', fixtureId: 'recoverable-failure', viewport: 'narrow', theme: 'light', motion: 'full', error: true },
  { name: 'branch-wide-light-reduced', fixtureId: 'branch', viewport: 'wide', theme: 'light', motion: 'reduced' },
  { name: 'branch-narrow-dark-motion', fixtureId: 'branch', viewport: 'narrow', theme: 'dark', motion: 'full' },
  { name: 'terminal-wide-dark-motion', fixtureId: 'terminal-payoff', viewport: 'wide', theme: 'dark', motion: 'full' },
  { name: 'terminal-narrow-light-reduced', fixtureId: 'terminal-payoff', viewport: 'narrow', theme: 'light', motion: 'reduced' },
];

function VisualFixture({ fixture, error }: { fixture: (typeof MISSION_KIT_FIXTURES)[number]; error?: boolean }) {
  const objectives = deriveObjectiveStages(fixture.objective, fixture.run);
  const meters = deriveWorldMeters(fixture.meters, fixture.run);
  const capabilities = deriveCapabilities(fixture.capabilities, fixture.run);
  return (
    <SceneShell sceneLabel="Visual regression fixture" resetKey={fixture.outcomeKey}>
      <MissionObjectivePanel stages={objectives} />
      <WorldMeterPanel meters={meters} />
      <MissionCapabilities capabilities={capabilities} />
      <MissionCheckpointPanel checkpoint={fixture.run.checkpoint} onResetToCheckpoint={() => undefined} />
      <MissionOutcomeBanner outcomeKey={`${fixture.outcomeKey}:next`} title={fixture.outcomeTitle}>
        {fixture.outcome}
      </MissionOutcomeBanner>
      {error ? <SceneError>The saved reading could not be restored. Try again from the checkpoint.</SceneError> : null}
    </SceneShell>
  );
}

describe('Experience visual regression matrix (#65)', () => {
  for (const entry of CASES) {
    it(entry.name, () => {
      const fixture = MISSION_KIT_FIXTURES.find((candidate) => candidate.id === entry.fixtureId);
      if (!fixture) throw new Error(`Missing visual fixture ${entry.fixtureId}`);
      const { container } = render(
        <div
          className={entry.theme === 'dark' ? 'dark bg-slate-950 p-4' : 'bg-white p-4'}
          data-motion={entry.motion}
          data-viewport={entry.viewport}
          style={{ width: entry.viewport === 'narrow' ? 390 : 1280 }}
        >
          <VisualFixture fixture={fixture} error={entry.error} />
        </div>,
      );

      // The snapshot includes the Tailwind responsive/theme/reduced-motion
      // contracts. Browser screenshots become meaningful once v2 is mounted
      // on a learner route; until then this is the deterministic visual
      // component harness, not an unreachable production-only route.
      expect(container.firstElementChild).toMatchSnapshot();
    });
  }
});
