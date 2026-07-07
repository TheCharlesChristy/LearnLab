// Behaviour tests for the TruthTable component: correct row/column rendering
// for a simple expression, the inline error card on malformed input, and
// `maxInputs` enforcement.

import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup);

import TruthTable from './TruthTable';

describe('TruthTable — renders a correct table', () => {
  it('renders header columns and 2^n rows for a 2-variable expression, with correct AND semantics', () => {
    render(<TruthTable expr="A AND B" />);

    const table = screen.getByRole('table');
    const headerCells = within(table.querySelector('thead')!).getAllByRole('columnheader');
    expect(headerCells.map((c) => c.textContent)).toEqual(['A', 'B', 'Result']);

    const rows = within(table).getAllByRole('row');
    // header + 4 data rows for 2 variables.
    expect(rows).toHaveLength(5);

    // Row order = binary counting on [A, B]: 00, 01, 10, 11.
    const [row00, row01, row10, row11] = rows.slice(1) as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    expect(within(row00).getAllByRole('cell').map((c) => c.textContent)).toEqual(['0', '0', '0']);
    expect(within(row01).getAllByRole('cell').map((c) => c.textContent)).toEqual(['0', '1', '0']);
    expect(within(row10).getAllByRole('cell').map((c) => c.textContent)).toEqual(['1', '0', '0']);
    // Only A=1,B=1 yields Result=1 for AND.
    expect(within(row11).getAllByRole('cell').map((c) => c.textContent)).toEqual(['1', '1', '1']);
  });

  it('renders columns in first-appearance order for a 3-variable expression', () => {
    render(<TruthTable expr="C OR (A AND NOT B)" />);
    const table = screen.getByRole('table');
    const headerCells = within(table.querySelector('thead')!).getAllByRole('columnheader');
    expect(headerCells.map((c) => c.textContent)).toEqual(['C', 'A', 'B', 'Result']);
    // 2^3 = 8 data rows + 1 header row.
    expect(within(table).getAllByRole('row')).toHaveLength(9);
  });
});

describe('TruthTable — error handling', () => {
  it('renders an inline error card for a malformed expression, never a table', () => {
    render(<TruthTable expr="A AND (" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Invalid expression');
    expect(alert).toHaveTextContent(/unbalanced parentheses/);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders an inline error card for a lowercase variable', () => {
    render(<TruthTable expr="a AND B" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/invalid variable name "a"/);
  });
});

describe('TruthTable — maxInputs', () => {
  it('accepts an expression within a custom smaller maxInputs', () => {
    render(<TruthTable expr="A AND B" maxInputs={2} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('rejects an expression exceeding a custom smaller maxInputs', () => {
    render(<TruthTable expr="A AND B AND C" maxInputs={2} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/too many variables: found 3/);
    expect(alert).toHaveTextContent(/max is 2/);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('rejects the default-cap-exceeding 7-variable expression when maxInputs is left at its default', () => {
    render(<TruthTable expr="A AND B AND C AND D AND E AND F AND G" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/too many variables: found 7/);
    expect(alert).toHaveTextContent(/max is 6/);
  });
});
