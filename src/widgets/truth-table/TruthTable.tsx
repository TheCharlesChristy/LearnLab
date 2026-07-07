// `truth-table` implementation — a boolean **expression string** rendered as
// its full truth table (SRS §5.3 roadmap row, BUILD_PLAN.md D-024).
// Complementary to `logic-gate-sim` (which derives a truth table from a
// wired circuit JSON): this widget has no circuit/diagram at all, just a
// plain expression typed by the content author, e.g. "A AND (B OR NOT C)".
//
// Parsing/evaluation is pure and lives in ./expression.ts; this file is
// rendering only. A parse failure (unbalanced parens, unknown token,
// invalid variable name, empty expression, too many distinct variables)
// renders an inline error card naming the exact problem — the widget never
// crashes and never renders a blank/garbled table (FR-CONT-007 spirit).
//
// A real semantic <table> with <th scope="col"> headers is the accessible
// representation of tabular data (NFR-A11Y-001) — no supplementary ARIA is
// needed beyond that baseline.

import { useMemo } from 'react';

import { evaluate, parseExpression } from './expression';

import type { TruthTableProps } from './index';

function bitLabel(v: boolean): string {
  return v ? '1' : '0';
}

export default function TruthTable({ expr, maxInputs = 6 }: TruthTableProps) {
  const result = useMemo(() => parseExpression(expr, maxInputs), [expr, maxInputs]);

  if (!result.ok) {
    return (
      <div role="alert" className="my-4 rounded-lg border border-red-300 p-4">
        <p className="font-medium">Invalid expression</p>
        <p className="mt-1 text-sm opacity-80">
          {expr}: {result.error}
        </p>
      </div>
    );
  }

  const { ast, variables } = result;
  const n = variables.length;
  const rowCount = 2 ** n;

  // Row order = standard binary counting over `variables` (first-appearance,
  // left-to-right order): variables[0] is the most-significant bit — the
  // same convention `logic-gate-sim`'s truth-table panel uses over its
  // `inputs` array, e.g. for [A, B] the rows go A=0,B=0 / A=0,B=1 / A=1,B=0
  // / A=1,B=1.
  const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
    const assignment: Record<string, boolean> = {};
    variables.forEach((name, bitPos) => {
      const bit = (rowIndex >> (n - 1 - bitPos)) & 1;
      assignment[name] = bit === 1;
    });
    const value = evaluate(ast, assignment);
    return { rowIndex, assignment, value };
  });

  return (
    <div className="my-4 rounded-lg border p-4">
      <p className="font-mono text-sm">{expr}</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {variables.map((name) => (
                <th key={name} scope="col" className="border-b px-2 py-1 text-left font-mono">
                  {name}
                </th>
              ))}
              <th scope="col" className="border-b px-2 py-1 text-left font-mono">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ rowIndex, assignment, value }) => (
              <tr key={rowIndex}>
                {variables.map((name) => (
                  <td key={name} className="px-2 py-1 font-mono">
                    {bitLabel(assignment[name] ?? false)}
                  </td>
                ))}
                <td className="px-2 py-1 font-mono">{bitLabel(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
