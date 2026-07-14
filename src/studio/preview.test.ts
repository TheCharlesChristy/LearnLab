import { describe, expect, it } from 'vitest';
import { studioPluginFormFields } from './preview';

describe('Studio D3 preview helpers (#47)', () => {
  it('derives form fields from generated plugin metadata', () => {
    expect(studioPluginFormFields('seeded-choice').map((field) => field.name)).toContain('prompt');
  });
});
