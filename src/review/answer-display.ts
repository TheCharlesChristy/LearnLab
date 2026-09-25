// Best-effort human-readable model answer for a regex-marked text answer.
// Text answers are marked by author-written ECMAScript regex sources
// (§4.6), e.g. `7\s*(√|sqrt)\s*2` or `counter-?example` — fine for marking,
// unreadable as feedback. This strips the common whitespace/optional/
// alternation idioms authors actually use; anything more exotic returns null
// and the card falls back to the item's explanation.

/** First alternative of a top-level-or-grouped alternation, e.g. `(√|sqrt)` → `√`. */
function firstAlternatives(src: string): string {
  let out = src;
  // Innermost groups first, repeatedly, until none remain.
  const group = /\((?:\?:)?([^()]*)\)/;
  for (let guard = 0; guard < 20 && group.test(out); guard++) {
    out = out.replace(group, (_, inner: string) => inner.split('|')[0] ?? '');
  }
  return out.split('|')[0] ?? '';
}

export function displayTextAnswer(accept: readonly string[] | undefined): string | null {
  const src = accept?.[0];
  if (!src) return null;
  const OPT = '\uE000'; // "optional whitespace" marker, resolved below
  let s = src;
  s = s.replace(/\\s[*?]/g, OPT).replace(/\\s\+/g, ' ');
  s = s.replace(/\\[()]\?/g, ''); // optional literal parens, e.g. \(? … \)?
  s = s.replace(/[^\\\uE000]\?/g, ''); // any other optional single char, e.g. counter-?example
  s = firstAlternatives(s);
  s = s.replace(/\\([+*.?()[\]{}^$|/\\-])/g, '$1'); // unescape literals
  if (/[[\]{}^$*]|\\[a-zA-Z]/.test(s)) return null; // still regex-shaped: give up
  // Optional whitespace becomes a real space only between two word characters
  // ("2 or x"), and disappears elsewhere ("7√2").
  s = s.replace(/(.?)\uE000+(.?)/g, (_, before: string, after: string) =>
    /\w/.test(before) && /\w/.test(after) ? `${before} ${after}` : before + after,
  );
  // Space binary operators; a minus is binary only after an operand.
  s = s.replace(/\s*([+/=<>])\s*/g, ' $1 ');
  s = s.replace(/([\w)])\s*-\s*/g, '$1 - ');
  s = s.replace(/ {2,}/g, ' ').trim();
  return s.length > 0 ? s : null;
}
