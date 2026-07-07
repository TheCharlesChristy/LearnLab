import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../content-api', async () => (await import('./fixtures')).contentApiMock());
vi.mock('../../progress', async () => (await import('./fixtures')).progressMock());
vi.mock('../../markdown', async () => (await import('./fixtures')).markdownMock());

import AppLayout from '../AppLayout';
import { RouteErrorPage } from '../RouteErrorPage';

import { renderRoute } from './helpers';

describe('routes (FR-SHELL-001)', () => {
  it('renders the course page', async () => {
    renderRoute('/course/alevel-pure');
    expect(
      await screen.findByRole('heading', { name: 'A-level Pure Mathematics' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /1\. Differentiation I/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /2\. Proof/ })).toBeInTheDocument();
  });

  it('renders the module page with breadcrumb (FR-SHELL-007)', async () => {
    renderRoute('/module/diff-1');
    expect(
      await screen.findByRole('heading', { name: 'Differentiation I' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /1\. Gradients/ })).toBeInTheDocument();
  });

  it('renders the lesson page content', async () => {
    renderRoute('/module/diff-1/lesson/l1');
    expect(await screen.findByTestId('markdown-lesson')).toHaveTextContent(
      'The slope of a curve.',
    );
    expect(screen.getByRole('button', { name: 'Mark lesson complete' })).toBeInTheDocument();
  });

  it('renders the not-found page with a link home for unknown routes', async () => {
    renderRoute('/definitely/not/a/route');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the catalogue' })).toBeInTheDocument();
  });

  it('shows a not-found body when a module id does not resolve', async () => {
    renderRoute('/module/nope');
    expect(await screen.findByText(/Module “nope” does not exist/)).toBeInTheDocument();
  });

  it('catches route render errors in an error boundary (FR-SHELL-006)', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Boom(): never {
      throw new Error('kaboom-test-error');
    }
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <AppLayout />,
          errorElement: <RouteErrorPage />,
          children: [{ index: true, element: <Boom />, errorElement: <RouteErrorPage /> }],
        },
      ],
      { initialEntries: ['/'] },
    );
    render(<RouterProvider router={router} />);

    expect(await screen.findByText('kaboom-test-error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    // The shell did not white-screen: the header is still there.
    expect(screen.getByRole('link', { name: 'LearnLab' })).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
