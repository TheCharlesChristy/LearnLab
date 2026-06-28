// Layout components (§6.7): Column, Row, Card, Divider, Spacer.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';

import { Card, Column, Divider, Row, Spacer } from '../layout';
import { makeNode, renderComponent } from './harness';

afterEach(cleanup);

const child = makeNode('Text', { text: 'hi' });

describe('layout', () => {
  it('Column renders children in a vertical flex with the gap class', () => {
    const { result } = renderComponent(Column, makeNode('Column', { gap: 3 }, [child]));
    const root = result.container.firstChild as HTMLElement;
    expect(root.className).toContain('flex-col');
    expect(root.className).toContain('gap-3');
    expect(screen.getByTestId('child-Text')).toBeInTheDocument();
  });

  it('Row honours wrap=false and align', () => {
    const { result } = renderComponent(
      Row,
      makeNode('Row', { gap: 2, wrap: false, align: 'start' }, [child]),
    );
    const root = result.container.firstChild as HTMLElement;
    expect(root.className).toContain('flex-row');
    expect(root.className).toContain('flex-nowrap');
    expect(root.className).toContain('items-start');
  });

  it('Card renders a title heading and children', () => {
    renderComponent(Card, makeNode('Card', { title: 'My card' }, [child]));
    expect(screen.getByRole('heading', { name: 'My card' })).toBeInTheDocument();
    expect(screen.getByTestId('child-Text')).toBeInTheDocument();
  });

  it('Card omits the heading when no title', () => {
    renderComponent(Card, makeNode('Card', {}, [child]));
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('Divider renders an <hr>', () => {
    const { result } = renderComponent(Divider, makeNode('Divider'));
    expect(result.container.querySelector('hr')).not.toBeNull();
  });

  it('Spacer maps size to a height class', () => {
    const { result } = renderComponent(Spacer, makeNode('Spacer', { size: 4 }));
    expect((result.container.firstChild as HTMLElement).className).toContain('h-4');
  });
});
