import { describe, expect, it } from 'vitest';
import { chooseHomeActions } from './home-actions';
describe('learner home actions (#49)', () => {
  it('gives a new learner a recommended start and review without a Continue action', () => { const actions = chooseHomeActions([], 'physics'); expect(actions.map((item) => item.id)).toEqual(['review', 'recommended']); });
  it('gives a returning learner one most-recent Continue action', () => { const actions = chooseHomeActions([{ moduleId: 'old', courseId: 'c', subject: 's', status: 'in-progress', updatedAt: 1, lessonsDone: 0, lessonsTotal: 1 }, { moduleId: 'recent', courseId: 'c', subject: 's', status: 'in-progress', updatedAt: 2, lessonsDone: 0, lessonsTotal: 1 }]); expect(actions.filter((item) => item.id === 'continue')).toEqual([expect.objectContaining({ href: '/module/recent' })]); });
  it('states due and empty review status truthfully', () => { expect(chooseHomeActions([], undefined, 2).find((item) => item.id === 'review')!.reason).toContain('2 practice items ready'); expect(chooseHomeActions([], undefined, 0).find((item) => item.id === 'review')!.reason).toContain('No practice items are due'); });
  it('falls back safely when progress is absent or corrupt', () => { expect(chooseHomeActions([], undefined)).toEqual([expect.objectContaining({ id: 'review', href: '/review' })]); });
});
