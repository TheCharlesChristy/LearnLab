// Behaviour tests for the Figure implementation (SRS §5.3 row): lazy-loaded
// captioned <figure>, module-relative src resolution via LessonContext.

import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup); // vitest globals are off, so RTL auto-cleanup is too

import { LessonContext } from '../../content/lesson-context';
import type { LessonContextValue } from '../../content/lesson-context';

import Figure from './Figure';

function withLesson(children: ReactNode, moduleBaseUrl = '/content/modules/algebra/') {
  const value: LessonContextValue = {
    moduleId: 'algebra',
    moduleBaseUrl,
    recordAttempt: async () => {},
    getItemState: async () => null,
    setItemState: async () => {},
    recordReview: async () => {},
    seedReviewItem: async () => {},
  };
  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

describe('Figure', () => {
  it('renders figure > img with lazy loading and the given alt', () => {
    render(<Figure src="/img/cell.png" alt="A plant cell" />);
    const img = screen.getByRole('img', { name: 'A plant cell' });
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img.closest('figure')).not.toBeNull();
  });

  it('renders a figcaption when caption is given, none otherwise', () => {
    const { rerender } = render(<Figure src="/a.png" alt="x" caption="Figure 1: a cell" />);
    expect(screen.getByText('Figure 1: a cell').tagName).toBe('FIGCAPTION');
    rerender(<Figure src="/a.png" alt="x" />);
    expect(document.querySelector('figcaption')).toBeNull();
  });

  it('applies the width prop to the img', () => {
    render(<Figure src="/a.png" alt="x" width={320} />);
    expect(screen.getByRole('img')).toHaveAttribute('width', '320');
  });

  it('resolves relative src against moduleBaseUrl when lesson context is present', () => {
    render(withLesson(<Figure src="images/cell.png" alt="cell" />));
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      '/content/modules/algebra/images/cell.png',
    );
  });

  it('strips a leading ./ before resolving', () => {
    render(withLesson(<Figure src="./images/cell.png" alt="cell" />));
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      '/content/modules/algebra/images/cell.png',
    );
  });

  it('leaves root-relative and absolute URLs untouched even inside a lesson', () => {
    const { rerender } = render(withLesson(<Figure src="/static/logo.png" alt="logo" />));
    expect(screen.getByRole('img')).toHaveAttribute('src', '/static/logo.png');
    rerender(withLesson(<Figure src="https://example.com/x.png" alt="ext" />));
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/x.png');
    rerender(withLesson(<Figure src="data:image/png;base64,AAAA" alt="inline" />));
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,AAAA');
  });

  it('falls back to the raw src when no lesson context is present', () => {
    render(<Figure src="images/cell.png" alt="cell" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'images/cell.png');
  });
});
