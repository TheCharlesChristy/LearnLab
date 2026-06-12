import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./content-api', async () => (await import('./__tests__/fixtures')).contentApiMock());
vi.mock('../progress', async () => (await import('./__tests__/fixtures')).progressMock());

import App from './App';

describe('App', () => {
  it('boots the shell with header, nav and the catalogue route', async () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'LearnLab' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Progress' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Skip to content')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Mathematics' })).toBeInTheDocument();
  });
});
