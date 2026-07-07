// Pure expression parser/evaluator for the `truth-table` widget (SRS §5.3
// roadmap row, BUILD_PLAN.md D-024) — no React, no DOM, no npm dependency
// (closed pinned dependency list). Content authors type a plain boolean
// expression string, e.g. "A AND (B OR NOT C)"; this module tokenizes,
// parses to an AST, and evaluates it for a given variable assignment.
//
// This is complementary to `logic-gate-sim` (which takes a wired circuit
// JSON — gates + connections), not a duplicate: same closed gate/operator
// vocabulary (AND, OR, NOT, XOR, NAND, NOR — reused here as case-insensitive
// keywords) and the same truth-table row/column convention, but the input
// here is a single expression string with no circuit diagram at all.
//
// Precedence (tightest to loosest binding), standard boolean-algebra order:
//   NOT  >  AND / NAND  >  XOR  >  OR / NOR
// implemented as a small precedence-climbing recursive-descent parser:
//   orExpr   := xorExpr ( (OR|NOR) xorExpr )*
//   xorExpr  := andExpr ( XOR andExpr )*
//   andExpr  := notExpr ( (AND|NAND) notExpr )*
//   notExpr  := NOT notExpr | atom
//   atom     := VAR | '(' orExpr ')'
// Every binary operator is left-associative and strictly 2-operand: XOR,
// NAND and NOR are NOT gate-arity-generalized here (`A XOR B XOR C` parses
// as `(A XOR B) XOR C`, each node still exactly 2 children) — "A NAND B" is
// NOT(A AND B), "A XOR B" is true iff exactly one of A, B is true, "A NOR B"
// is NOT(A OR B).
//
// No eval / new Function anywhere (NFR-SEC-002 spirit, same rationale as
// logic-gate-sim's closed gate set): this is a hand-written tokenizer plus a
// tree-walking evaluator over plain booleans.
//
// On any malformed input (unbalanced parens, unknown token, invalid variable
// name, empty expression, too many distinct variables) `parseExpression`
// returns `{ ok: false, error }` naming the exact problem — it never throws
// past its own boundary and the widget never crashes on bad input.

export const BINARY_OPS = ['AND', 'OR', 'XOR', 'NAND', 'NOR'] as const;
export type BinaryOp = (typeof BINARY_OPS)[number];

export type Node =
  | { kind: 'var'; name: string }
  | { kind: 'not'; operand: Node }
  | { kind: 'binop'; op: BinaryOp; left: Node; right: Node };

export type ParseResult =
  | { ok: true; ast: Node; variables: string[] }
  | { ok: false; error: string };

const KEYWORDS = ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'] as const;
type Keyword = (typeof KEYWORDS)[number];

type Token =
  | { kind: Keyword; pos: number }
  | { kind: 'LPAREN' | 'RPAREN'; pos: number }
  | { kind: 'VAR'; name: string; pos: number };

/** Variable names: a leading uppercase letter, then uppercase letters/digits. */
const VAR_RE = /^[A-Z][A-Z0-9]*$/;

class ParseError extends Error {}

function tokenText(tok: Token): string {
  if (tok.kind === 'VAR') return tok.name;
  if (tok.kind === 'LPAREN') return '(';
  if (tok.kind === 'RPAREN') return ')';
  return tok.kind;
}

function tokenize(expr: string): { ok: true; tokens: Token[] } | { ok: false; error: string } {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i]!;
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }
    if (ch === '(') {
      tokens.push({ kind: 'LPAREN', pos: i });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'RPAREN', pos: i });
      i++;
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      const start = i;
      let j = i;
      while (j < expr.length && /[A-Za-z0-9]/.test(expr[j]!)) j++;
      const word = expr.slice(start, j);
      i = j;
      const upper = word.toUpperCase();
      if ((KEYWORDS as readonly string[]).includes(upper)) {
        tokens.push({ kind: upper as Keyword, pos: start });
      } else if (VAR_RE.test(word)) {
        tokens.push({ kind: 'VAR', name: word, pos: start });
      } else {
        return {
          ok: false,
          error: `invalid variable name "${word}" at position ${start} — variables must match [A-Z][A-Z0-9]* (uppercase letters/digits, starting with a letter)`,
        };
      }
      continue;
    }
    return { ok: false, error: `unexpected character "${ch}" at position ${i}` };
  }
  return { ok: true, tokens };
}

/**
 * Precedence-climbing recursive-descent parser over the token stream. Also
 * collects distinct variable names in first-appearance, left-to-right order
 * as a side effect of parsing atoms — this determines both the truth
 * table's column order and its binary-counting row order.
 */
class Parser {
  private pos = 0;
  private readonly variables: string[] = [];
  private readonly seenVars = new Set<string>();
  /** Positions of currently-open, not-yet-closed '(' tokens, innermost last. */
  private readonly openParens: number[] = [];

  constructor(private readonly tokens: Token[]) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private advance(): Token | undefined {
    return this.tokens[this.pos++];
  }

  parseProgram(): Node {
    const node = this.parseOr();
    const trailing = this.peek();
    if (trailing) {
      if (trailing.kind === 'RPAREN') {
        throw new ParseError(`unbalanced parentheses — unexpected ")" at position ${trailing.pos}`);
      }
      throw new ParseError(
        `unexpected token "${tokenText(trailing)}" at position ${trailing.pos} — expected an operator (AND, OR, XOR, NAND, NOR) or end of expression`,
      );
    }
    return node;
  }

  private parseOr(): Node {
    let left = this.parseXor();
    for (;;) {
      const tok = this.peek();
      if (tok && (tok.kind === 'OR' || tok.kind === 'NOR')) {
        this.advance();
        const right = this.parseXor();
        left = { kind: 'binop', op: tok.kind, left, right };
      } else {
        break;
      }
    }
    return left;
  }

  private parseXor(): Node {
    let left = this.parseAnd();
    for (;;) {
      const tok = this.peek();
      if (tok && tok.kind === 'XOR') {
        this.advance();
        const right = this.parseAnd();
        left = { kind: 'binop', op: 'XOR', left, right };
      } else {
        break;
      }
    }
    return left;
  }

  private parseAnd(): Node {
    let left = this.parseNot();
    for (;;) {
      const tok = this.peek();
      if (tok && (tok.kind === 'AND' || tok.kind === 'NAND')) {
        this.advance();
        const right = this.parseNot();
        left = { kind: 'binop', op: tok.kind, left, right };
      } else {
        break;
      }
    }
    return left;
  }

  private parseNot(): Node {
    const tok = this.peek();
    if (tok && tok.kind === 'NOT') {
      this.advance();
      const operand = this.parseNot();
      return { kind: 'not', operand };
    }
    return this.parseAtom();
  }

  private parseAtom(): Node {
    const tok = this.advance();
    if (!tok) {
      if (this.openParens.length > 0) {
        const last = this.openParens[this.openParens.length - 1]!;
        throw new ParseError(
          `unbalanced parentheses — expected ")" to close "(" opened at position ${last}, but the expression ended`,
        );
      }
      throw new ParseError('unexpected end of expression — expected a variable, "NOT", or "("');
    }
    if (tok.kind === 'VAR') {
      if (!this.seenVars.has(tok.name)) {
        this.seenVars.add(tok.name);
        this.variables.push(tok.name);
      }
      return { kind: 'var', name: tok.name };
    }
    if (tok.kind === 'LPAREN') {
      this.openParens.push(tok.pos);
      const inner = this.parseOr();
      const close = this.advance();
      this.openParens.pop();
      if (!close || close.kind !== 'RPAREN') {
        throw new ParseError(
          `unbalanced parentheses — expected ")" to close "(" opened at position ${tok.pos}`,
        );
      }
      return inner;
    }
    throw new ParseError(
      `unexpected token "${tokenText(tok)}" at position ${tok.pos} — expected a variable, "NOT", or "("`,
    );
  }

  getVariables(): string[] {
    return this.variables;
  }
}

/**
 * Parse a boolean expression string into an AST plus its distinct variables
 * (first-appearance order). Never throws: every failure mode returns
 * `{ ok: false, error }` with a message naming the exact problem.
 */
export function parseExpression(expr: string, maxInputs = 6): ParseResult {
  if (expr.trim() === '') {
    return {
      ok: false,
      error: 'expression is empty — provide a boolean expression, e.g. "A AND (B OR NOT C)"',
    };
  }

  const tokenized = tokenize(expr);
  if (!tokenized.ok) return { ok: false, error: tokenized.error };
  if (tokenized.tokens.length === 0) {
    return {
      ok: false,
      error: 'expression is empty — provide a boolean expression, e.g. "A AND (B OR NOT C)"',
    };
  }

  const parser = new Parser(tokenized.tokens);
  try {
    const ast = parser.parseProgram();
    const variables = parser.getVariables();
    if (variables.length > maxInputs) {
      return {
        ok: false,
        error: `too many variables: found ${variables.length} (${variables.join(', ')}) — max is ${maxInputs}`,
      };
    }
    return { ok: true, ast, variables };
  } catch (err) {
    if (err instanceof ParseError) return { ok: false, error: err.message };
    throw err;
  }
}

/** Tree-walking evaluator. Missing variables in `assignment` default to false. */
export function evaluate(ast: Node, assignment: Record<string, boolean>): boolean {
  switch (ast.kind) {
    case 'var':
      return assignment[ast.name] ?? false;
    case 'not':
      return !evaluate(ast.operand, assignment);
    case 'binop': {
      const a = evaluate(ast.left, assignment);
      const b = evaluate(ast.right, assignment);
      switch (ast.op) {
        case 'AND':
          return a && b;
        case 'OR':
          return a || b;
        case 'XOR':
          return a !== b;
        case 'NAND':
          return !(a && b);
        case 'NOR':
          return !(a || b);
      }
    }
  }
}
