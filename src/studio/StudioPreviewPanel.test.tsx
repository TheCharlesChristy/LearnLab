import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { seededChoicePlugin } from '../experience/plugins';
import type { CoursePack, ExperienceGraph, SceneNode } from '../experience';
import { StudioPreviewPanel } from './StudioPreviewPanel';

const fixture = seededChoicePlugin.previewFixtures[0]!;
const scene: SceneNode = {
  id: 'start',
  kind: 'scene',
  presentation: { kind: 'briefing', body: 'Start' },
  activity: {
    key: seededChoicePlugin.key,
    version: seededChoicePlugin.version,
    props: fixture.props,
  },
  goal: { operator: 'activity-complete' },
  feedback: { success: 'ok' },
  effects: [
    { operator: 'checkpoint', label: 'Before repair' },
    {
      operator: 'emit-evidence',
      skillId: 'route',
      outcome: 'success',
      independence: 'independent',
    },
  ],
  transitions: { branches: [], fallback: { to: 'end' } },
};
const graph: ExperienceGraph = {
  schemaVersion: 2,
  id: 'episode',
  packId: 'pack',
  version: '1',
  stateVersion: '1',
  entryNodeId: 'start',
  nodes: [
    scene,
    {
      id: 'end',
      kind: 'ending',
      presentation: { kind: 'explanation', body: 'End' },
      termination: { status: 'complete', summary: 'End' },
    },
  ],
};
const pack: CoursePack = {
  schemaVersion: 2,
  id: 'pack',
  version: '1',
  title: 'Pack',
  description: 'Pack',
  audience: { level: 'gcse', summary: 'GCSE' },
  taxonomy: { subjects: ['x'], tags: [] },
  estimatedMinutes: 1,
  engineCapabilities: [],
  state: {
    version: '1',
    declarations: [{ path: '/flag', type: 'boolean', default: false }],
    migrations: [],
  },
  skills: [],
  experiences: [],
  campaigns: [],
  assets: [],
  reviewItems: [],
};

describe('Studio preview panel (#47)', () => {
  it('edits a generated schema field through the caller-owned in-memory graph', async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    render(<StudioPreviewPanel pack={pack} graph={graph} scene={scene} onPropsChange={update} />);
    const prompt = screen.getByLabelText(/prompt/i);
    await user.clear(prompt);
    await user.type(prompt, 'Changed prompt');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ prompt: expect.any(String) }));
  });

  it('edits generated fields, seeds an in-memory run, switches accessible preview modes, and reports real activity outcomes', async () => {
    const user = userEvent.setup();
    const propsChange = (props: Record<string, unknown>) =>
      Object.assign(scene.activity.props, props);
    render(
      <StudioPreviewPanel pack={pack} graph={graph} scene={scene} onPropsChange={propsChange} />,
    );
    const viewport = screen.getByLabelText('Preview viewport');
    expect(viewport).toHaveAttribute('data-preview-size', 'desktop');
    await user.click(screen.getByRole('button', { name: 'Mobile' }));
    await user.click(screen.getByRole('button', { name: 'Dark preview' }));
    await user.click(screen.getByRole('button', { name: /Reduced motion/ }));
    expect(viewport).toHaveAttribute('data-preview-size', 'mobile');
    expect(viewport).toHaveAttribute('data-preview-theme', 'dark');
    expect(viewport).toHaveAttribute('data-preview-reduced-motion', 'true');
    const seed = screen.getByLabelText('Seeded state JSON');
    fireEvent.change(seed, { target: { value: '{"/flag":true}' } });
    expect(screen.getByText(/Seeded state:.*true/)).toBeInTheDocument();
    expect(screen.getByText('On success: checkpoint.')).toBeInTheDocument();
    expect(screen.getByText('On success: emit-evidence.')).toBeInTheDocument();
    const safe = await screen.findByRole('radio', { name: 'Safe route' });
    await user.click(safe);
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByRole('status')).toHaveTextContent('Outcome reported: complete.');
  });
});
