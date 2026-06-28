import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TreeRenderer } from './tree-renderer';
import { pyComponentRegistry } from './component-registry';
import { usePyRender, type PyComponentProps } from './py-render-context';
import type { PyNode } from './component-tree';

const FIXTURES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../tests/protocol-fixtures',
);
function treeFixture(name: string): PyNode {
  return JSON.parse(readFileSync(path.join(FIXTURES, name), 'utf8')) as PyNode;
}

// Track keys we add so we can clean the shared registry between tests.
const added: string[] = [];
function registerMock(type: string, Impl: React.FC<PyComponentProps>) {
  pyComponentRegistry[type] = Impl;
  added.push(type);
}
afterEach(() => {
  for (const k of added) delete pyComponentRegistry[k];
  added.length = 0;
});

describe('TreeRenderer', () => {
  it('renders an "Unknown component" card naming a type not in the registry (§6.4 rule 1)', () => {
    // A fabricated type that is not in COMPONENT_TYPES / the registry.
    const tree = {
      type: 'Frobnicator',
      key: 'root',
      props: {},
      children: [],
    };
    render(<TreeRenderer tree={tree} emit={() => undefined} />);
    expect(screen.getByText(/Unknown component:/)).toBeInTheDocument();
    expect(screen.getByText('Frobnicator')).toBeInTheDocument();
  });

  it('renders registered components and keys children by node.key', () => {
    // Minimal Column/Text/Slider/Button implementations using the context.
    const Column: React.FC<PyComponentProps> = ({ node }) => {
      const { renderChildren } = usePyRender();
      return <div data-testid="column">{renderChildren(node.children)}</div>;
    };
    const Text: React.FC<PyComponentProps> = ({ node }) => <p>{String(node.props.text)}</p>;
    const Slider: React.FC<PyComponentProps> = ({ node }) => {
      const { emit } = usePyRender();
      const h = node.props.on_change as { __h: string };
      return (
        <input
          aria-label="slider"
          type="range"
          onChange={(e) => emit(h.__h, Number(e.target.value))}
        />
      );
    };
    const Button: React.FC<PyComponentProps> = ({ node }) => {
      const { emit } = usePyRender();
      const h = node.props.on_click as { __h: string };
      return <button onClick={() => emit(h.__h, null)}>{String(node.props.label)}</button>;
    };
    registerMock('Column', Column);
    registerMock('Text', Text);
    registerMock('Slider', Slider);
    registerMock('Button', Button);

    const emit = vi.fn();
    const tree = treeFixture('tree-basic.json');
    render(<TreeRenderer tree={tree} emit={emit} />);
    expect(screen.getByTestId('column')).toBeInTheDocument();
    expect(screen.getByText('Angle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Launch' })).toBeInTheDocument();
  });

  it('handler wiring fires emit with the token (tree-basic on_click h1)', async () => {
    const Button: React.FC<PyComponentProps> = ({ node }) => {
      const { emit } = usePyRender();
      const h = node.props.on_click as { __h: string };
      return <button onClick={() => emit(h.__h, null)}>{String(node.props.label)}</button>;
    };
    registerMock('Button', Button);
    const emit = vi.fn();
    const tree: PyNode = {
      type: 'Button',
      key: 'launch',
      props: { label: 'Launch', on_click: { __h: 'h1' } },
      children: [],
    };
    render(<TreeRenderer tree={tree} emit={emit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Launch' }));
    expect(emit).toHaveBeenCalledWith('h1', null);
  });
});
