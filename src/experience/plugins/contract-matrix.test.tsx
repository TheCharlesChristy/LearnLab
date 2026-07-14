import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { activityPluginRegistry } from './registry';
import { normaliseActivityOutcome } from './contracts';
import { validateActivityPluginProps } from './generated';

/**
 * Release matrix for the public activity-plugin boundary. It deliberately
 * iterates the registry: adding a plugin means adding a real preview that can
 * mount and be driven without a pointer-only interaction, not adding one more
 * hand-picked example to a test.
 */
describe('ActivityPlugin release matrix (#65)', () => {
  it('keeps every registered fixture valid, serialisable, accessible, lazy, and previewable', async () => {
    for (const plugin of Object.values(activityPluginRegistry)) {
      expect(plugin.component).toBeDefined();
      expect(plugin.performance.loading).toBe('lazy');
      expect(plugin.performance.lazyChunkBudgetKbGzip).toBeGreaterThan(0);
      expect(plugin.performance.lazyChunkBudgetKbGzip).toBeLessThanOrEqual(150);
      expect(plugin.accessibility.keyboard.instructions).not.toHaveLength(0);
      expect(plugin.accessibility.keyboard.shortcuts).not.toHaveLength(0);
      expect(plugin.accessibility.focus.visibleIndicator).toBe(true);
      expect(plugin.accessibility.announcements.attempt).not.toHaveLength(0);
      expect(plugin.accessibility.announcements.completion).not.toHaveLength(0);
      expect(plugin.accessibility.reducedMotion.alternative).not.toHaveLength(0);
      expect(plugin.accessibility.touch.minimumTargetSizePx).toBe(44);
      expect(plugin.accessibility.touch.gestureAlternative).not.toHaveLength(0);
      expect(plugin.accessibility.labels.activity).not.toHaveLength(0);
      expect(plugin.accessibility.labels.controls).not.toHaveLength(0);
      expect(plugin.accessibility.contrast.minimumRatio).toBeGreaterThanOrEqual(4.5);

      for (const fixture of plugin.previewFixtures) {
        expect(validateActivityPluginProps(plugin.key, fixture.props)).toEqual({
          valid: true,
          errors: [],
        });
        expect(() => normaliseActivityOutcome(fixture.expectedOutcome)).not.toThrow();
        expect(JSON.parse(JSON.stringify(fixture.expectedOutcome))).toEqual(
          fixture.expectedOutcome,
        );

        const reportOutcome = vi.fn();
        const Activity = plugin.component;
        const view = render(
          <Suspense fallback={<p>Loading {plugin.key} preview</p>}>
            <Activity
              props={fixture.props}
              context={{
                seed: fixture.seed,
                activityInstanceId: `preview:${plugin.key}:${fixture.id}`,
                attempt: 0,
              }}
              disabled={false}
              reportOutcome={reportOutcome}
            />
          </Suspense>,
        );

        // A preview must mount a real interactive surface (the legacy/core
        // adapters delegate their outer labels to their wrapped screen runner)
        // and may never depend on native drag-and-drop.
        if (plugin.key === 'v1-screen') {
          await screen.findByText('Choose.');
        } else if (plugin.key.startsWith('core-')) {
          await screen.findByText('Which route is safe?');
        } else {
          await screen.findByLabelText(
            plugin.accessibility.labels.activity,
            {},
            { timeout: 5_000 },
          );
        }
        expect(view.container.firstElementChild).not.toBeNull();
        expect(view.container.querySelector('[draggable="true"]')).not.toBeInTheDocument();
        view.unmount();
      }
    }
  }, 15_000);

  it('drives the reference preview with the keyboard and emits its declared outcome', async () => {
    const user = userEvent.setup();
    const plugin = activityPluginRegistry['seeded-choice'];
    if (!plugin) throw new Error('seeded-choice plugin is not registered');
    const fixture = plugin.previewFixtures[0];
    if (!fixture) throw new Error('seeded-choice preview fixture is missing');
    const reportOutcome = vi.fn();
    const Activity = plugin.component;

    render(
      <Suspense fallback={<p>Loading seeded choice preview</p>}>
        <Activity
          props={fixture.props}
          context={{ seed: fixture.seed, activityInstanceId: 'keyboard-preview', attempt: 0 }}
          disabled={false}
          reportOutcome={reportOutcome}
        />
      </Suspense>,
    );

    const safeRoute = await screen.findByRole('radio', { name: 'Safe route' });
    safeRoute.focus();
    await user.keyboard(' ');
    await user.tab();
    await user.keyboard('{Enter}');

    expect(reportOutcome).toHaveBeenCalledWith(fixture.expectedOutcome);
    expect(screen.getByText('Correct answer submitted.')).toBeInTheDocument();
  });
});
