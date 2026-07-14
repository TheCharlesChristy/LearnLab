import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ReviewCatalogueLoadError,
  clearReviewCatalogueCache,
  findReviewItem,
  loadReviewCatalogue,
  reviewOwnerId,
} from './catalogue';

const catalogue = {
  schemaVersion: 1,
  items: [
    {
      ownerId: 'v2:bridge-missions',
      contentVersion: '1.0.0',
      id: 'balanced-force-review',
      title: 'Balanced forces',
      standaloneContext: 'A deck has equal opposing forces.',
      prompt: 'Are they balanced?',
      skillIds: ['force-balance'],
      activity: { key: 'seeded-choice', version: '1.0.0', props: {} },
      goal: { operator: 'activity-complete' },
      feedback: { success: 'Correct.' },
    },
  ],
};

beforeEach(() => clearReviewCatalogueCache());
afterEach(() => {
  vi.unstubAllGlobals();
  clearReviewCatalogueCache();
});

describe('review catalogue', () => {
  it('loads a versioned standalone item and resolves its scheduler namespace', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => catalogue })),
    );
    const loaded = await loadReviewCatalogue();
    expect(reviewOwnerId('bridge-missions')).toBe('v2:bridge-missions');
    expect(
      findReviewItem(loaded, 'v2:bridge-missions', 'balanced-force-review')?.standaloneContext,
    ).toContain('equal opposing');
  });

  it('fails loudly for a newer or malformed catalogue rather than rendering IDs as content', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ schemaVersion: 2, items: [] }),
      })),
    );
    await expect(loadReviewCatalogue()).rejects.toBeInstanceOf(ReviewCatalogueLoadError);
    clearReviewCatalogueCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ schemaVersion: 1 }) })),
    );
    await expect(loadReviewCatalogue()).rejects.toBeInstanceOf(ReviewCatalogueLoadError);
  });
});
