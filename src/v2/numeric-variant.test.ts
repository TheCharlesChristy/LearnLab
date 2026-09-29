import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseLaboratoryPack } from './pack';
import { createPreviewRun } from './author-preview';
import {
  markNumericVariant, numericAnswer, numericQuestion, numericVariantIndex,
  numericVariants, validateNumericVariant,
} from './numeric-variant';
import type { NumericVariantActivity } from './numeric-variant';
import { appendEvent, projectRun } from './run';
import type { LaboratoryRun } from './run';

const activity = JSON.parse(readFileSync('tests/fixtures/numeric-variant-activity.json', 'utf8')) as NumericVariantActivity;

const fixture = () => {
  const raw = JSON.parse(readFileSync('public/laboratory/research-station/pack.json', 'utf8'));
  raw.capabilities['numeric-variant'] = '0.1.0';
  const node = raw.episodes[0].nodes.find((candidate: { id: string }) => candidate.id === 'fresh-fault');
  node.activity = structuredClone(activity);
  node.title = 'Calibrate the current meter';
  node.prompt = 'Use an ideal source and one resistor. Predict the current from the source voltage and resistance, then enter a number with units.';
  node.hints = ['Use the relationship I = V/R.', 'Convert milliamps to amps before comparing with the model.'];
  node.workedExample = 'For 6 V across 2 Ω, the current is 6 ÷ 2 = 3 A.';
  node.mechanism = 'In this ideal DC model, current equals potential difference divided by resistance.';
  return parseLaboratoryPack(raw);
};

describe('bounded numeric variants', () => {
  it('enumerates scenarios, accepts alternative units and includes the tolerance boundary', () => {
    validateNumericVariant(activity, 'sample');
    const variants = numericVariants(activity);
    expect(variants).toHaveLength(9);
    expect(numericQuestion(activity, 0)).toContain('6 V');
    expect(numericAnswer(activity, variants[0]!)).toBe(3);
    expect(markNumericVariant(activity, 0, '3', 'A')).toBe(true);
    expect(markNumericVariant(activity, 0, '3e3', 'mA')).toBe(true);
    expect(markNumericVariant(activity, 0, '3.01', 'A')).toBe(true);
    expect(markNumericVariant(activity, 0, '3.011', 'A')).toBe(false);
    expect(markNumericVariant(activity, 0, '3', 'V')).toBe(false);
    expect(markNumericVariant(activity, 0, 'Infinity', 'A')).toBe(false);
    const first = numericVariantIndex(activity, 1234, 'fresh-fault', 0);
    expect(numericVariantIndex(activity, 1234, 'fresh-fault', 0)).toBe(first);
    expect(numericVariantIndex(activity, 1234, 'fresh-fault', 1)).toBe((first + 1) % 9);
  });

  it('rejects incorrect hand checks, degenerate draws, unsafe formulas and ambiguous tolerance', () => {
    expect(() => validateNumericVariant({ ...activity, checks: activity.checks.map((check, i) =>
      i === 1 ? { ...check, answer: 100 } : check) }, 'bad')).toThrow('hand-derived');
    const zeroDenominator = structuredClone(activity);
    zeroDenominator.variables[1]!.values = [0, 3, 5];
    expect(() => validateNumericVariant(zeroDenominator, 'bad')).toThrow('near-zero');
    const wrongName = structuredClone(activity);
    wrongName.answer = { kind: 'variable', name: 'mystery' };
    expect(() => validateNumericVariant(wrongName, 'bad')).toThrow('Unknown numeric variable');
    const irrelevant = structuredClone(activity);
    irrelevant.answer = { kind: 'variable', name: 'voltage' };
    expect(() => validateNumericVariant(irrelevant, 'bad')).toThrow('resistance does not materially change');
    expect(() => validateNumericVariant({ ...activity, tolerance: 0.4 }, 'bad')).toThrow('overlaps');
  });

  it('replays wrong and correct responses without treating a corrected transfer as independent', () => {
    const pack = fixture();
    const episode = pack.episodes[0]!;
    const node = episode.nodes.find((candidate) => candidate.id === 'fresh-fault')!;
    expect(node.role).toBe('transfer');
    const previewFixture = {
      formatVersion: 1, kind: 'learnlab-author-preview', pack, episodeId: episode.id, nodeId: node.id,
      seed: 5, hints: 0, worked: false, branchPreference: 'passed',
    } as const;
    const preview = createPreviewRun(previewFixture);
    expect(createPreviewRun(previewFixture)).toEqual(preview);
    const seed = { ...preview, priorExposure: [] };
    expect(projectRun(pack, episode, seed).current).toBe(node.id);
    const index = numericVariantIndex(activity, seed.startedAt, node.id, 0);
    const answer = numericAnswer(activity, numericVariants(activity)[index]!);
    let run: LaboratoryRun = seed;
    run = appendEvent(pack, episode, run, { type: 'numeric-answer', node: node.id, value: '999', unit: 'A', at: seed.startedAt });
    expect(projectRun(pack, episode, run).memory[node.id]?.numericCorrect).toBe(false);
    run = appendEvent(pack, episode, run, { type: 'numeric-answer', node: node.id, value: String(answer), unit: 'A', at: seed.startedAt });
    run = appendEvent(pack, episode, run, { type: 'advance', node: node.id, outcome: 'passed', at: seed.startedAt });
    expect(projectRun(pack, episode, run).evidence.at(-1)).toMatchObject({
      node: node.id, outcome: 'passed', independent: false, attempts: 2,
    });
    expect(() => appendEvent(pack, episode, seed, {
      type: 'numeric-answer', node: node.id, value: '3', unit: 'V', at: seed.startedAt,
    })).toThrow('unavailable');
  });
});
