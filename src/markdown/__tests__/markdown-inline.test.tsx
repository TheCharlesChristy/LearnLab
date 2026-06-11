// MarkdownInline tests — same pipeline minus directive handling (used for
// quiz question text/explanations, §4.6, and the §6.7 Markdown component).

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { MarkdownInline } from '../index';

// No vitest globals in this repo, so RTL cannot auto-cleanup between tests.
afterEach(cleanup);

describe('MarkdownInline', () => {
  it('renders maths via KaTeX with MathML output', () => {
    const { container } = render(<MarkdownInline markdown={'If $f(x) = 3x^4$, find $f\'(2)$.'} />);
    expect(container.querySelector('.katex')).not.toBeNull();
    expect(container.querySelector('math')).not.toBeNull();
  });

  it('renders GFM (tables, strikethrough)', () => {
    render(<MarkdownInline markdown={'| a |\n| - |\n| 1 |\n\n~~gone~~'} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('gone').tagName).toBe('DEL');
  });

  it('skips raw HTML (FR-CONT-005)', () => {
    const { container } = render(<MarkdownInline markdown={'<script>window.x = 1;</script>'} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).not.toContain('window.x');
  });

  it('does not process directives — no widget is mounted', () => {
    render(<MarkdownInline markdown={'::widget{type="mock"}'} />);
    expect(screen.queryByTestId('mock-widget')).not.toBeInTheDocument();
    expect(screen.queryByText(/Unknown widget/)).not.toBeInTheDocument();
  });

  it('lazy-loads images', () => {
    render(<MarkdownInline markdown={'![pic](x.png)'} />);
    expect(screen.getByRole('img', { name: 'pic' })).toHaveAttribute('loading', 'lazy');
  });
});
