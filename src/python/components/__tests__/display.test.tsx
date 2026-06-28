// Display components (§6.7): Text, Markdown, Image, Alert, Table, CodeBlock,
// Badge, ProgressBar.

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';

import {
  Alert,
  Badge,
  CodeBlock,
  Image,
  Markdown,
  ProgressBar,
  Table,
  Text,
} from '../display';
import { makeNode, renderComponent } from './harness';

afterEach(cleanup);

describe('display', () => {
  it('Text renders text, size/weight classes, mono and inline color', () => {
    const { result } = renderComponent(
      Text,
      makeNode('Text', { text: 'Hello', size: 'lg', weight: 'bold', mono: true, color: '#ff0000' }),
    );
    const span = screen.getByText('Hello');
    expect(span.className).toContain('text-lg');
    expect(span.className).toContain('font-bold');
    expect(span.className).toContain('font-mono');
    expect(span.getAttribute('style')).toContain('color');
    void result;
  });

  it('Markdown renders maths via KaTeX with MathML (NFR-A11Y-001)', () => {
    const { result } = renderComponent(Markdown, makeNode('Markdown', { text: '$x^2$' }));
    expect(result.container.querySelector('.katex')).not.toBeNull();
    expect(result.container.querySelector('math')).not.toBeNull();
  });

  it('Image sets src, required alt and lazy loading', () => {
    renderComponent(Image, makeNode('Image', { src: 'pic.png', alt: 'a picture', width: 100 }));
    const img = screen.getByRole('img', { name: 'a picture' });
    expect(img).toHaveAttribute('src', 'pic.png');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('Alert uses role=alert + aria-live for error kind', () => {
    renderComponent(Alert, makeNode('Alert', { text: 'boom', kind: 'error' }));
    const el = screen.getByRole('alert');
    expect(el).toHaveTextContent('boom');
    expect(el).toHaveAttribute('aria-live', 'assertive');
  });

  it('Alert uses role=status for info kind', () => {
    renderComponent(Alert, makeNode('Alert', { text: 'fyi', kind: 'info' }));
    expect(screen.getByRole('status')).toHaveTextContent('fyi');
  });

  it('Table renders headers and scalar rows', () => {
    renderComponent(
      Table,
      makeNode('Table', {
        headers: ['x', 'y'],
        rows: [
          [1, 2],
          ['a', 3.5],
        ],
      }),
    );
    expect(screen.getByRole('columnheader', { name: 'x' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveTextContent('3.5');
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 data rows
  });

  it('CodeBlock renders read-only pre/code with the language', () => {
    const { result } = renderComponent(
      CodeBlock,
      makeNode('CodeBlock', { code: 'print(1)', language: 'python' }),
    );
    const code = result.container.querySelector('code');
    expect(code).not.toBeNull();
    expect(code).toHaveTextContent('print(1)');
    expect(code).toHaveAttribute('data-language', 'python');
  });

  it('Badge renders text', () => {
    renderComponent(Badge, makeNode('Badge', { text: 'new', kind: 'success' }));
    expect(screen.getByText('new')).toBeInTheDocument();
  });

  it('ProgressBar exposes role=progressbar with clamped aria values', () => {
    renderComponent(ProgressBar, makeNode('ProgressBar', { value: 0.5, max: 1, label: 'Loading' }));
    const bar = screen.getByRole('progressbar', { name: 'Loading' });
    expect(bar).toHaveAttribute('aria-valuenow', '0.5');
    expect(bar).toHaveAttribute('aria-valuemax', '1');
  });
});
