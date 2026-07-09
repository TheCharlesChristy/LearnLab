// Pure-logic helpers for the /widgets playground (src/app/WidgetPlayground.tsx).
// No React here so this stays trivially unit-testable.
import type { RawWidgetProps } from '../widgets/registry';

/**
 * Extracts `key="value"`/`key=value` pairs from a `::widget{...}` directive
 * string (docs/WIDGETS.md's "### Example" snippets), seeding a playground
 * form from the widget's own documented example instead of a second
 * hand-maintained defaults list. Every current example uses only this
 * simple attribute syntax — no directive-grade parser is needed.
 */
export function parseExampleAttrs(example: string): RawWidgetProps {
  const braceStart = example.indexOf('{');
  const braceEnd = example.lastIndexOf('}');
  if (braceStart === -1 || braceEnd === -1 || braceEnd <= braceStart) return {};
  const body = example.slice(braceStart + 1, braceEnd);

  const raw: RawWidgetProps = {};
  const pattern = /(\w+)=(?:"([^"]*)"|(\S+))/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body))) {
    const [, key, quoted, bare] = match;
    if (!key || key === 'type') continue;
    const value = quoted ?? bare ?? '';
    if (value === 'true') raw[key] = true;
    else if (value === 'false') raw[key] = false;
    else raw[key] = value;
  }
  return raw;
}

/** Minimal valid starter JSON per `src`-taking widget, matching each widget's
 * documented data-file shape (docs/WIDGETS.md). Not derivable from the doc
 * prose, so hand-written here as playground fixtures — not documentation. */
export const SRC_JSON_SAMPLES: Partial<Record<string, string>> = {
  flashcards: JSON.stringify(
    { cards: [{ front: 'What is **2 + 2**?', back: '4' }] },
    null,
    2,
  ),
  'matching-pairs': JSON.stringify(
    {
      title: 'Match the terms',
      instructions: 'Select a term, then its match.',
      pairs: [
        { left: 'Derivative', right: 'Rate of change' },
        { left: 'Integral', right: 'Area under a curve' },
      ],
    },
    null,
    2,
  ),
  quiz: JSON.stringify(
    {
      schemaVersion: 1,
      id: 'sample-quiz',
      title: 'Sample quiz',
      questions: [
        {
          type: 'mcq',
          id: 'q1',
          text: 'What is 2 + 2?',
          choices: ['3', '4', '5'],
          answer: 1,
          explanation: '2 + 2 = 4.',
        },
      ],
    },
    null,
    2,
  ),
  'step-reveal': JSON.stringify(
    {
      steps: [
        { title: 'Step 1', body: 'First, do this.' },
        { title: 'Step 2', body: 'Then, do that.' },
      ],
    },
    null,
    2,
  ),
  'data-plot': JSON.stringify(
    {
      kind: 'line',
      series: [{ name: 'Series A', points: [[0, 0], [1, 2], [2, 4]] }],
      xLabel: 'x',
      yLabel: 'y',
    },
    null,
    2,
  ),
  'geometry-canvas': JSON.stringify(
    {
      bounds: { xmin: -5, xmax: 5, ymin: -5, ymax: 5 },
      points: [
        { id: 'A', x: 0, y: 0, label: 'A', draggable: true },
        { id: 'B', x: 3, y: 0, label: 'B', draggable: true },
      ],
      lines: [{ from: 'A', to: 'B' }],
    },
    null,
    2,
  ),
};
