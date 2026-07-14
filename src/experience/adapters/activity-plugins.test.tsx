import { Suspense } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityPlugin } from '../plugins/contracts';

import {
  eigenPlaygroundActivityPlugin,
  functionGrapherActivityPlugin,
  signalScopeActivityPlugin,
} from './explorable-plugins';
import PythonItemActivity, { isSafePythonItemSourceUrl } from './PythonItemActivity';

const pyItemSpy = vi.fn();

vi.mock('../../python', () => ({
  PyItem: (props: {
    sourceUrl: string;
    savedState?: Record<string, unknown>;
    onProgress?: (progress: {
      itemId: string;
      kind: 'scored';
      score: number;
      maxScore: number;
    }) => void;
    onPersist?: (state: Record<string, unknown>) => void;
  }) => {
    pyItemSpy(props);
    return (
      <button
        type="button"
        onClick={() => {
          props.onPersist?.({ completedStep: 1 });
          props.onProgress?.({ itemId: 'items/example', kind: 'scored', score: 1, maxScore: 1 });
        }}
      >
        Submit Python result
      </button>
    );
  },
}));

async function renderPreview<Props>(plugin: ActivityPlugin<Props>) {
  const fixture = plugin.previewFixtures[0];
  if (!fixture) throw new Error(`${plugin.key} has no preview fixture`);
  const reportOutcome = vi.fn();
  const Activity = plugin.component;
  render(
    <Suspense fallback={<p>Loading plugin</p>}>
      <Activity
        props={fixture.props}
        context={{ seed: fixture.seed, activityInstanceId: fixture.id, attempt: 0 }}
        disabled={false}
        reportOutcome={reportOutcome}
      />
    </Suspense>,
  );
  return { reportOutcome };
}

describe('C4 explorable and Python ActivityPlugin adapters (#44)', () => {
  it('captures a changed function tangent through keyboard input before allowing an observation', async () => {
    const user = userEvent.setup();
    const { reportOutcome } = await renderPreview(functionGrapherActivityPlugin);
    const slider = await screen.findByRole('slider', { name: 'Tangent point' }, { timeout: 5_000 });
    expect(screen.getByRole('button', { name: 'Record observation' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Need a hint?' }));
    expect(screen.getByText('Hint: Use the arrow keys on the tangent point.')).toBeInTheDocument();
    slider.focus();
    await user.keyboard('{End}');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Record observation' })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: 'Record observation' }));
    expect(reportOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        completed: true,
        values: expect.objectContaining({ '/x': 4, '/gradient': expect.any(Number) }),
        events: expect.arrayContaining([expect.objectContaining({ type: 'hint-requested' })]),
      }),
    );
  });

  it('captures signal and eigen observations from their keyboard-operable sliders', async () => {
    const user = userEvent.setup();
    const signal = await renderPreview(signalScopeActivityPlugin);
    const signalSlider = await screen.findByRole('slider', { name: 'Frequency parameter f' });
    signalSlider.focus();
    await user.keyboard('{End}');
    await user.click(screen.getByRole('button', { name: 'Record observation' }));
    expect(signal.reportOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.objectContaining({ '/frequency': 8, '/peak-frequency': expect.any(Number) }),
      }),
    );

    const eigen = await renderPreview(eigenPlaygroundActivityPlugin);
    const eigenSlider = await screen.findByRole('slider', {
      name: 'Off-diagonal covariance term b',
    });
    eigenSlider.focus();
    await user.keyboard('{End}');
    await user.click(screen.getAllByRole('button', { name: 'Record observation' }).at(-1)!);
    expect(eigen.reportOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.objectContaining({ '/covariance': 1, '/angle-degrees': expect.any(Number) }),
      }),
    );
  });

  it('uses the existing isolated worker protocol, accepts caller-owned resume state, and reports only a JSON progress summary', async () => {
    const user = userEvent.setup();
    const reportOutcome = vi.fn();
    render(
      <PythonItemActivity
        props={{
          itemId: 'items/example',
          sourceUrl: '/content/physics/example/items/example.py',
          savedState: { completedStep: 0 },
          title: 'Example',
        }}
        context={{ seed: 'python-preview', activityInstanceId: 'python', attempt: 0 }}
        disabled={false}
        reportOutcome={reportOutcome}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Submit Python result' }));
    expect(pyItemSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceUrl: '/content/physics/example/items/example.py',
        savedState: { completedStep: 0 },
      }),
    );
    expect(reportOutcome).toHaveBeenCalledWith({
      schemaVersion: 1,
      completed: true,
      values: { '/max-score': 1, '/progress-kind': 'scored', '/score': 1 },
      events: [
        {
          schemaVersion: 1,
          sequence: 0,
          type: 'attempted',
          values: { '/max-score': 1, '/progress-kind': 'scored', '/score': 1 },
        },
      ],
    });
    expect(
      screen.getByText('Python item state is ready for the caller-owned resume store.'),
    ).toHaveAttribute('aria-live', 'polite');
  });

  it('fails closed for remote, data, traversal, and non-Python source paths', () => {
    expect(isSafePythonItemSourceUrl('/content/physics/example/items/example.py')).toBe(true);
    expect(isSafePythonItemSourceUrl('https://example.test/item.py')).toBe(false);
    expect(isSafePythonItemSourceUrl('data:text/plain,print(1)')).toBe(false);
    expect(isSafePythonItemSourceUrl('/content/physics/../secrets.py')).toBe(false);
    expect(isSafePythonItemSourceUrl('/content/physics/example/item.txt')).toBe(false);
  });

  it('keeps plugin adapters out of progress and run-state implementation modules', () => {
    const root = resolve(import.meta.dirname);
    for (const file of [
      'explorable-plugins.tsx',
      'ExplorableActivity.tsx',
      'python-item-plugin.tsx',
      'PythonItemActivity.tsx',
    ]) {
      const source = readFileSync(resolve(root, file), 'utf8');
      expect(source).not.toMatch(/from ['"](?:\.\.\/)+progress(?:\/|['"])/);
      expect(source).not.toMatch(/from ['"](?:\.\.\/)+run-state(?:\/|['"])/);
    }
  });
});
