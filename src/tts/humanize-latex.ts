// Converts a LaTeX source string (as embedded verbatim in every KaTeX node's
// `annotation[encoding="application/x-tex"]` tag) into a short, speakable
// phrase for the read-aloud feature. Intentionally limited — this is a
// pattern-matching humanizer for the maths actually shipped in LearnLab
// content, not a computer-algebra-to-speech engine. Unrecognised commands
// are stripped to bare text rather than left as raw LaTeX syntax, so the
// worst case is a garbled-but-readable approximation, never braces and
// backslashes read aloud literally.

/** Ordered command replacements — order matters (longer/more specific first). */
const COMMAND_WORDS: [RegExp, string][] = [
  [/\\left|\\right/g, ''],
  [/\\times/g, ' times '],
  [/\\cdot/g, ' times '],
  [/\\div/g, ' divided by '],
  [/\\pm/g, ' plus or minus '],
  [/\\le(q)?/g, ' less than or equal to '],
  [/\\ge(q)?/g, ' greater than or equal to '],
  [/\\neq/g, ' not equal to '],
  [/\\approx/g, ' approximately '],
  [/\\to/g, ' approaches '],
  [/\\infty/g, ' infinity '],
  [/\\pi/g, ' pi '],
  [/\\theta/g, ' theta '],
  [/\\lambda/g, ' lambda '],
  [/\\alpha/g, ' alpha '],
  [/\\beta/g, ' beta '],
  [/\\lim/g, ' the limit '],
  [/\\sum/g, ' the sum '],
  [/\\int/g, ' the integral '],
  [/\\mathrm|\\text|\\operatorname/g, ''],
  [/\\dfrac|\\frac/g, '__FRAC__'],
  [/\\sqrt/g, '__SQRT__'],
];

/** Matches a balanced `{...}` group starting at `openIndex` (which must be `{`). Returns the group's inner text and the index just past the closing `}`, or null if unbalanced. */
function readGroup(s: string, openIndex: number): { inner: string; next: number } | null {
  if (s[openIndex] !== '{') return null;
  let depth = 0;
  for (let i = openIndex; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') {
      depth--;
      if (depth === 0) return { inner: s.slice(openIndex + 1, i), next: i + 1 };
    }
  }
  return null;
}

/** Expands every `__FRAC__{a}{b}` marker (from COMMAND_WORDS) into "a over b". */
function expandFractions(s: string): string {
  let out = '';
  let i = 0;
  while (i < s.length) {
    if (s.startsWith('__FRAC__', i)) {
      let cursor = i + '__FRAC__'.length;
      while (s[cursor] === ' ') cursor++;
      const num = readGroup(s, cursor);
      if (num) {
        let next = num.next;
        while (s[next] === ' ') next++;
        const den = readGroup(s, next);
        if (den) {
          out += `${humanizeInline(num.inner)} over ${humanizeInline(den.inner)}`;
          i = den.next;
          continue;
        }
      }
      out += 'a fraction';
      i += '__FRAC__'.length;
      continue;
    }
    out += s[i];
    i++;
  }
  return out;
}

/** Expands every `__SQRT__{a}` marker into "the square root of a". */
function expandSqrt(s: string): string {
  let out = '';
  let i = 0;
  while (i < s.length) {
    if (s.startsWith('__SQRT__', i)) {
      let cursor = i + '__SQRT__'.length;
      while (s[cursor] === ' ') cursor++;
      const group = readGroup(s, cursor);
      if (group) {
        out += `the square root of ${humanizeInline(group.inner)}`;
        i = group.next;
        continue;
      }
      out += 'the square root of';
      i += '__SQRT__'.length;
      continue;
    }
    out += s[i];
    i++;
  }
  return out;
}

/** Expands `^2`/`^{2}` (squared), `^3`/`^{3}` (cubed), `^n`/`^{...}` (to the power of n), and `_x`/`_{...}` (sub x). */
function expandSupSub(s: string): string {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '^' || ch === '_') {
      let cursor = i + 1;
      let exponent: string;
      if (s[cursor] === '{') {
        const group = readGroup(s, cursor);
        exponent = group ? humanizeInline(group.inner) : '';
        cursor = group ? group.next : cursor + 1;
      } else {
        exponent = s[cursor] ?? '';
        cursor += 1;
      }
      if (ch === '^') {
        if (exponent.trim() === '2') out += ' squared ';
        else if (exponent.trim() === '3') out += ' cubed ';
        else out += ` to the power of ${exponent} `;
      } else {
        out += ` sub ${exponent} `;
      }
      i = cursor;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/** Applies the full pipeline to an inner (already brace-stripped) expression. */
function humanizeInline(latex: string): string {
  let s = latex;
  for (const [pattern, replacement] of COMMAND_WORDS) s = s.replace(pattern, replacement);
  s = expandFractions(s);
  s = expandSqrt(s);
  s = expandSupSub(s);
  // Strip any remaining LaTeX punctuation/backslash-commands rather than
  // speaking them literally.
  s = s.replace(/\\[a-zA-Z]+/g, ' ').replace(/[{}\\]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/** Convert one LaTeX source string (display or inline, `$…$`/`$$…$$` delimiters already stripped by the caller) into a speakable phrase. Never throws. */
export function humanizeLatex(latex: string): string {
  try {
    return humanizeInline(latex);
  } catch {
    // Pattern-matching on unanticipated input is best-effort; fall back to a
    // generic announcement rather than crashing the read-aloud feature.
    return 'a mathematical expression';
  }
}
