import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Goal } from '../types';

import {
  ACTIVITY_PLUGIN_MAX_LAZY_CHUNK_KB_GZIP,
  ACTIVITY_OUTCOME_SCHEMA_VERSION,
  activityPluginRegistry,
  defineActivityPlugin,
  evaluateActivityGoal,
  getActivityPlugin,
  normaliseActivityOutcome,
  seededChoicePlugin,
} from './index';
import { shuffleForSeed } from './reference/seeded';
import type { ActivityPlugin } from './contracts';
import type { SeededChoiceProps } from './reference/seeded-choice';

describe('ActivityPlugin contract (#41)', () => {
  it('normalises a serialisable, versioned, deterministic activity outcome', () => {
    const first = normaliseActivityOutcome({
      completed: true,
      values: { '/z': ['one', 'two'], '/a': 4 },
      events: [{ sequence: 0, type: 'attempted', values: { '/z': ['one', 'two'] } }],
    });
    const second = normaliseActivityOutcome({
      completed: true,
      values: { '/a': 4, '/z': ['one', 'two'] },
      events: [{ sequence: 0, type: 'attempted', values: { '/z': ['one', 'two'] } }],
    });

    expect(first.schemaVersion).toBe(ACTIVITY_OUTCOME_SCHEMA_VERSION);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.values)).toBe(true);
    expect(Object.isFrozen(first.events)).toBe(true);
    expect(Object.keys(first.values)).toEqual(['/a', '/z']);
    expect(() =>
      normaliseActivityOutcome({
        completed: false,
        events: [{ sequence: 1, type: 'attempted' }],
      }),
    ).toThrow(/contiguous sequence/);
    expect(() =>
      normaliseActivityOutcome({ completed: false, values: { '/not-json': Number.NaN } }),
    ).toThrow(/JSON serialisable/);
  });

  it('keeps every evaluator pure and applies its documented exact marking semantics', () => {
    const outcome = normaliseActivityOutcome({
      completed: true,
      values: { '/number': 3, '/set': ['b', 'a'], '/text': 'bridge repaired' },
    });
    const cases: readonly [Goal, boolean][] = [
      [{ operator: 'activity-complete' }, true],
      [{ operator: 'equals', path: '/number', value: 3 }, true],
      [{ operator: 'in-range', path: '/number', minimum: 3, maximum: 3 }, true],
      [{ operator: 'set-equals', path: '/set', values: ['a', 'b'] }, true],
      [{ operator: 'set-equals', path: '/set', values: ['a', 'a'] }, false],
      [{ operator: 'regex-match', path: '/text', pattern: '^bridge' }, true],
      [{ operator: 'regex-match', path: '/text', pattern: '[' }, false],
    ];

    for (const [goal, expected] of cases) {
      expect(evaluateActivityGoal(goal, outcome)).toBe(expected);
    }
  });

  it('requires an a11y declaration for every keyboard, focus, announcement, motion, touch, label, and contrast concern', () => {
    const a11y = seededChoicePlugin.accessibility;
    expect(a11y.keyboard.instructions).not.toHaveLength(0);
    expect(a11y.keyboard.shortcuts).toContain('Tab');
    expect(a11y.focus.visibleIndicator).toBe(true);
    expect(a11y.announcements.completion).not.toHaveLength(0);
    expect(a11y.reducedMotion.alternative).not.toHaveLength(0);
    expect(a11y.touch.minimumTargetSizePx).toBe(44);
    expect(a11y.touch.gestureAlternative).not.toHaveLength(0);
    expect(a11y.labels.activity).not.toHaveLength(0);
    expect(a11y.labels.controls).toContain('Submit answer');
    expect(a11y.contrast.minimumRatio).toBe(4.5);
  });

  it('requires an enforceable lazy loading strategy and chunk budget for every plugin', () => {
    expect(seededChoicePlugin.performance).toEqual({
      loading: 'lazy',
      lazyChunkBudgetKbGzip: ACTIVITY_PLUGIN_MAX_LAZY_CHUNK_KB_GZIP,
    });
    expect(Object.isFrozen(seededChoicePlugin.performance)).toBe(true);

    const missingPerformance = {
      ...seededChoicePlugin,
      performance: undefined,
    } as unknown as ActivityPlugin<SeededChoiceProps>;
    expect(() => defineActivityPlugin(missingPerformance)).toThrow(/lazy loading strategy/);

    const eagerPerformance = {
      ...seededChoicePlugin,
      performance: { ...seededChoicePlugin.performance, loading: 'eager' },
    } as unknown as ActivityPlugin<SeededChoiceProps>;
    expect(() => defineActivityPlugin(eagerPerformance)).toThrow(/lazy loading strategy/);

    const oversizedPerformance = {
      ...seededChoicePlugin,
      performance: {
        ...seededChoicePlugin.performance,
        lazyChunkBudgetKbGzip: ACTIVITY_PLUGIN_MAX_LAZY_CHUNK_KB_GZIP + 1,
      },
    } as unknown as ActivityPlugin<SeededChoiceProps>;
    expect(() => defineActivityPlugin(oversizedPerformance)).toThrow(/lazy chunk budget/);
  });

  it('registers a lazy reference plugin with authoring metadata, fixture, and no persistence writer', () => {
    expect(getActivityPlugin('seeded-choice')).toBe(seededChoicePlugin);
    expect(activityPluginRegistry['seeded-choice']).toBe(seededChoicePlugin);
    expect(seededChoicePlugin.previewFixtures[0]?.expectedOutcome.completed).toBe(true);
    expect(seededChoicePlugin.persistence).toEqual({
      mode: 'none',
      explanation:
        'Selection is local UI state only; a failed attempt is reset by the SceneRunner.',
    });
    expect((seededChoicePlugin.component as { $$typeof?: symbol }).$$typeof).toBe(
      Symbol.for('react.lazy'),
    );
    expect(shuffleForSeed(['a', 'b', 'c'], 'same-seed')).toEqual(
      shuffleForSeed(['a', 'b', 'c'], 'same-seed'),
    );
  });

  it('renders the lazy reference plugin with native keyboard/touch controls and reports a normalised outcome', async () => {
    const user = userEvent.setup();
    const reportOutcome = vi.fn();
    render(
      <Suspense fallback={<p>Loading activity</p>}>
        <seededChoicePlugin.component
          props={seededChoicePlugin.previewFixtures[0]!.props}
          context={{ seed: 'reference-choice-1', activityInstanceId: 'reference', attempt: 0 }}
          disabled={false}
          reportOutcome={reportOutcome}
        />
      </Suspense>,
    );

    await user.click(await screen.findByRole('radio', { name: 'Safe route' }));
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    expect(reportOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaVersion: 1,
        completed: true,
        values: { '/answer': 'safe' },
      }),
    );
    expect(screen.getByRole('radiogroup', { name: 'Answer choices' })).toBeInTheDocument();
  });
});
