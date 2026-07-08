---
name: learnlab-author-content
description: Author new LearnLab lessons, modules, or courses under public/content/ — scaffolding a module, writing lesson Markdown with the four directive forms, building assessment.json quizzes, meeting the Minimum Viable Content (MVC) bar, and validating with build-content.mjs --strict. Use for "add a module", "write a lesson", "create a course", "new LearnLab content", or any task touching public/content/**.
---

# Authoring LearnLab content

LearnLab content is data, not code: courses are folders of JSON, Markdown, and
(for Tier 2 items) Python under `public/content/`. The full reference is
`docs/AUTHORING.md` — read it before you start; this skill covers what that
guide doesn't spell out: how the tooling actually behaves, the tacit process
knowledge from three phases of shipping ~90 real modules, and the exact
verbatim shapes to copy from. Never touch `src/` to add or edit content — that
is a hard architectural invariant (C-5) and `--strict` plus the PR lane both
assume it.

## The three closed sets — never silently extend

LearnLab has exactly three enumerable vocabularies. If a task seems to need a
fourth directive, a fifth question type, or a widget that isn't registered,
that is a `src/`-level engine change, not a content-authoring task — stop and
say so rather than inventing syntax that will fail validation.

1. **Directive forms (exactly 4, SRS §4.5):** `::widget`, `::py` (leaf forms),
   `:::callout`, `:::reveal` (container forms). Nothing else parses.
2. **Question types (exactly 4, SRS §4.6):** `mcq`, `multi`, `numeric`, `text`.
3. **The widget registry — check it fresh every time, it evolves.** Read
   `src/widgets/keys.json` (a flat JSON array) to see the *current* live set —
   don't trust this document or your memory, since new widgets land over time.
   At the time this skill was written it was:
   `["function-grapher", "figure", "quiz", "data-plot", "step-reveal", "code-runner", "logic-gate-sim", "flashcards", "matching-pairs", "vector-field", "geometry-canvas", "circuit-sim", "truth-table"]`.
   Every key in that file has a matching `` ## `<key>` `` section in
   `docs/WIDGETS.md` (CI-enforced, FR-WID-002) — that section is the prop
   contract. Read it for the widget you're about to use before writing the
   directive; guessing prop names produces an inline error card, not a build
   failure, so it can silently ship broken.

## Scaffold first, always

Never hand-create a module folder. Run the scaffolder — it produces output
that passes validation immediately, so you start from green instead of
debugging schema errors from scratch:

```sh
node scripts/new-module.mjs \
  --subject maths --course alevel-pure \
  --id differentiation-2 --title "Differentiation II" \
  --description "Product rule, quotient rule, and chain rule." \
  --minutes 90 --prereqs "differentiation-1" \
  [--course-title "A-level Pure Mathematics"] [--level alevel] \
  [--root <content-root>]
```

Required flags: `--subject` (`maths|physics|cs|ai`), `--course`, `--id`,
`--title`, `--description`, `--minutes`. `--prereqs` is comma-separated module
ids (empty for none). `--course-title`/`--level` only matter when the course
doesn't exist yet (`level` is one of `gcse|as|a2|alevel|foundation`, default
`alevel`). `--root` overrides the content root — use this whenever you're
authoring at scale into an isolated temp directory (see the orchestration
section below) instead of directly into `public/content/`. Omit flags to get
an interactive prompt (only works with a TTY).

It generates, and appends the `ModuleRef` to `course.json` (creating the
course file fresh if `--course` doesn't exist yet):

- `<module-dir>/module.json` — valid schema, but with `TODO` objectives and a
  single `introduction` lesson. You must replace both.
- `01-introduction.md` — one **commented-out** example of all 4 directives
  plus one live `::widget{type="quiz" src="assessment.json"}` embed. Delete or
  rewrite this; it is a template, not real teaching content.
- `assessment.json` — two placeholder questions (one `mcq`, one `numeric`).
  You must replace both and add at least 6 more real questions.

IDs are lowercase kebab-case (`^[a-z0-9]+(-[a-z0-9]+)*$`), ≤ 64 chars. Module
ids are globally unique across the *entire* content tree (not just the
course) — check for collisions if you're unsure a name is free.

## The MVC bar (SRS §8.6) — your PR-readiness checklist

`build-content.mjs --strict` enforces every ◆ rule below. A module that fails
any of them fails CI on a content PR:

- ◆ At least 3 lessons.
- ◆ At least 1 interactive item: a native widget *other than* `figure`, or a
  Python item (`::py`). A module with only prose and `figure`s does not meet
  MVC even if it has ten lessons.
- ◆ `assessment.json` with ≥ 8 questions spanning ≥ 2 of the 4 question types.
- ◆ `prerequisites` and `objectives` both declared in `module.json`.
  Prerequisites are advisory only — the UI recommends, never locks — but every
  id listed must resolve to a real module somewhere in the tree, or `--strict`
  fails it as a dangling reference.
- ◆ `estMinutes` set on the module *and* on every individual lesson.
- (SHOULD, not CI-enforced) every concept lesson includes one `:::reveal`
  worked example.

One sharp edge worth knowing (D-018): `build-content.mjs` **silently skips**
full MVC checking for any module folder not yet referenced by its course's
`course.json` — it only prints a `WARN ... not referenced by course.json`.
An orphan folder that "passes `--strict`" may just never have been checked.
Always add the `ModuleRef` to the real `course.json` before trusting a green
`--strict` run as meaning the module is actually valid.

## Writing for play, not just correctness

LearnLab's goal is to make learning fun — to teach through play, not just
deliver correct information. The rendering/quiz/progress layer already
carries a lot of this on its own (animated feedback, streaks, points,
celebratory moments on lesson/quiz/deck/game completion) — you never need to
add markup for any of that; it fires automatically whenever a learner
completes a lesson, quiz, flashcard deck, or game widget. Your job as a
content author is the other half: making the *content itself* worth playing
with.

- **Reach for a genuinely interactive widget before settling for the MVC
  minimum.** A module that hits "≥ 1 interactive item" with a single `figure`-
  adjacent widget bolted on technically passes `--strict`, but a lesson that's
  mostly prose with one perfunctory chart isn't the bar to aim for. Ask what
  in this lesson would be more fun to *do* than to *read*: a term/definition-
  heavy topic is a natural `matching-pairs` game
  (`::widget{type="matching-pairs" src="..."}`, see `docs/WIDGETS.md`); a
  vocabulary or key-facts set is a `flashcards` deck; anything with a tunable
  parameter (a function, a circuit, a distribution) is a natural
  `function-grapher`/`code-runner`/`vector-field`/`circuit-sim` candidate
  where the learner drags a slider and sees the consequence immediately,
  rather than reading a static description of what would happen.
- **Write quiz `explanation` text in an encouraging voice** — the engine
  already varies the surrounding microcopy ("Nice work!", "Keep going —
  you'll get the next one.") but your explanation is the substantive teaching
  moment after an answer. Write it like you're talking a learner through the
  idea, not grading them. This is purely a tone choice — it changes nothing
  about the discipline in "The single most important discipline" below: an
  encouragingly-worded explanation for a factually wrong `answer` is still a
  bug, and still the one class of error `--strict` cannot catch.
- **A `:::callout{kind="tip"}` or a well-placed `:::reveal` worked example
  earns its keep by feeling like a discovery**, not a wall of text — the
  existing house style (short framing prose, one full derivation, one
  held-back worked example) already does this; lean into it rather than
  writing past it.
- If you're asked to build a *new* kind of interactive widget (not just use
  an existing one) — e.g. another game beyond `matching-pairs` — that's a
  `src/`-level task per the "three closed sets" rule above, not a
  content-authoring one. Point whoever's doing that work at
  `src/widgets/game-kit/` and the "Building a new game widget" section of
  `docs/ARCHITECTURE.md`, which document the shared chrome/shuffle/persistence
  pattern so a new game doesn't reinvent it from scratch.

## Directive syntax, with real examples from shipped content

All four forms, pulled verbatim from modules that have shipped and passed
`--strict` — don't invent your own variations on these.

**`::widget` (leaf)** — from `differentiation-1/03-power-rule.md`:

```markdown
::widget{type="function-grapher" expr="x^2" tangent=true xmin=-4 xmax=4}
```

and from `boolean-algebra-and-logic/03-boolean-laws.md`, a widget backed by a
sibling JSON data file:

```markdown
::widget{type="step-reveal" src="simplification-steps.json"}
```

Attributes reach the widget's `parseProps` **verbatim as strings** — `xmin=-4`
arrives as the string `"-4"`, `tangent=true` arrives as the string `"true"`,
and a bare attribute like `{tangent}` (no value) means `true` (D-004). Each
widget's own `parseProps` coerces and validates; it is not done for you by the
Markdown renderer. This means a typo like `xmin="minus 4"` doesn't fail the
build — it renders an inline "must be a finite number" error card at runtime.
Check `docs/WIDGETS.md`'s per-widget "Validation behaviour" section for the
exact prop names and error strings before shipping, and actually load the
lesson in `npm run dev` to see the widget render, not just the source text.

**`::py` (leaf)** — from `boolean-algebra-and-logic/01-logic-operators.md`:

```markdown
::py{src="items/logic-quiz.py" params='{"questions": 5}'}
```

`src` is a path relative to the module folder and must exist on disk
(`--strict` checks this). `params` is a JSON **object** string — note the
single quotes wrapping it so the embedded double quotes survive Markdown
attribute parsing. Python item authoring itself (writing the `.py` file, the
`learnsdk` base classes) is Tier 2 — see `docs/PYTHON_ITEMS.md` if a task
needs a new Python item rather than reusing an existing one.

**`:::callout` (container)** — from `algebra-essentials/02-factorising.md`:

```markdown
:::callout{kind="tip"}
Always check by expanding your answer back out — it should return exactly the expression you started with. $3(2x+3) = 6x + 9$. ✓
:::
```

`kind` is one of `info`, `tip`, `warning`, `key` — nothing else.

**`:::reveal` (container)** — from `differentiation-1/03-power-rule.md`:

```markdown
:::reveal{title="Worked example: differentiate and evaluate"}
Let $f(x) = 3x^4 - 5x^2 + 2$. Differentiate term by term using the power rule:

$$
f'(x) = 3 \cdot 4 x^{3} - 5 \cdot 2 x^{1} + 0 = 12x^3 - 10x.
$$
:::
```

**No-nesting rule:** containers may hold Markdown, maths, and *leaf*
directives, but never another container. A `:::reveal` inside a `:::callout`
(or vice versa) fails validation with a rendered error card — there is no
partial/best-effort nesting.

## assessment.json — the 4 question types, verbatim

Top-level shape (`schemas/quiz.schema.json`): `schemaVersion` (1), `id`
(unique within the module), `title`, optional `shuffleQuestions`/
`shuffleChoices` (both default `true`), optional `pick` (randomly sample this
many questions per attempt — module `assessment.json` files commonly omit it
so all questions are used; the scaffolder's inline quiz template sets `pick`
when only a subset should show per attempt), and `questions` (≥ 1, ≥ 8 and
≥ 2 types for MVC).

Real examples, one per type, from `differentiation-1/assessment.json`:

```json
{
  "id": "q1", "type": "numeric",
  "text": "If $f(x) = 3x^4$, find $f'(2)$.",
  "answer": 96, "tolerance": 0.001,
  "explanation": "By the power rule $f'(x) = 12x^3$, so $f'(2) = 12 \\times 2^3 = 12 \\times 8 = 96$."
}
```

```json
{
  "id": "q2", "type": "mcq",
  "text": "The derivative of a constant is…",
  "choices": ["undefined", "the constant itself", "$0$", "$1$"],
  "answer": 2,
  "explanation": "A constant function has a horizontal graph, so its gradient — and hence its derivative — is $0$ everywhere."
}
```

```json
{
  "id": "q6", "type": "multi",
  "text": "Which of the following functions have derivative equal to $6x$?",
  "choices": ["$x^2$", "$3x^2$", "$6x$", "$3x^2 + 5$"],
  "answers": [1, 3],
  "explanation": "$\\frac{\\mathrm{d}}{\\mathrm{d}x}(3x^2) = 6x$ and $\\frac{\\mathrm{d}}{\\mathrm{d}x}(3x^2 + 5) = 6x$ (the constant $5$ differentiates to $0$). By contrast $\\frac{\\mathrm{d}}{\\mathrm{d}x}(x^2) = 2x$ and $\\frac{\\mathrm{d}}{\\mathrm{d}x}(6x) = 6$."
}
```

```json
{
  "id": "q8", "type": "text",
  "text": "Name the rule used to differentiate a term of the form $ax^n$.",
  "accept": ["(the )?power rule"],
  "caseSensitive": false,
  "explanation": "Differentiating $ax^n$ to get $anx^{n-1}$ is the **power rule**: bring the power down and reduce it by one."
}
```

Marking rules to hold yourself to when writing questions: **mcq** — `answer`
is the correct choice's index (2–6 choices). **multi** — `answers` is the
exact correct index set; there is **no partial credit**, so don't write a
question where a "mostly right" subset feels like it should score. **numeric**
— `abs(value - answer) <= tolerance` (tolerance is absolute, not relative —
for an answer like `0.001` a tolerance of `0.001` accepts a huge relative
error; pick tolerance relative to the expected magnitude). **text** — the
trimmed input must **full-match** an ECMAScript regex in `accept`, so
`"power rule"` will *not* match "the power rule" typed by a user — write the
pattern to cover the phrasing variants you intend to accept, as the real
example above does with `(the )?power rule`. Every question, of every type,
must have an `explanation` — this is validated.

Escaping reminder for JSON `text`/`explanation` strings: backslashes double,
so a LaTeX `\times` is written `"\\times"` and `\frac{1}{2}` is written
`"\\frac{1}{2}"` in the JSON source.

## The single most important discipline: verify every answer by hand

Schema validation checks *shape*, not *correctness*. Across P2/P3 of this
project's real authoring history, the orchestrator's independent
re-derivation of every assessment answer caught real formula errors that
`--strict` passed cleanly — e.g. D-020, where an internally-consistent,
schema-valid question (`neural-networks-2-training` q5) asked "which epoch
converges" under a definition that actually implied a different numeric
answer than the one stored, because the question text's literal wording and
the stored `answer` had quietly drifted apart during drafting.

Before you consider any assessment done:

- Recompute every `numeric` answer independently (by hand, or by running the
  actual formula/code — e.g. a quick SymPy check for calculus, exact
  `comb(n,k)` arithmetic for probability) rather than trusting that it "looks
  right" next to the explanation you just wrote.
- Re-read every `mcq`/`multi` question's `text` against its `explanation` and
  ask whether a domain expert would derive the *stored* answer from the
  *literal* wording of the question — not the wording you meant.
- For `text` questions, mentally run a few plausible correct phrasings through
  the regex and confirm they full-match (remember: full-match, not substring).

This is not optional polish — it is the one class of error that has actually
shipped and been caught in this repo's history, and the one class schema
validation structurally cannot catch.

## Validating

```sh
node scripts/build-content.mjs --strict [--root <content-root>]
```

Runs without `--root` against `public/content/`; `npm run validate -- --strict`
is the same thing via the package script. `npm run dev` runs the same pipeline
continuously in watch mode and additionally serves the app so you can actually
look at rendered widgets/callouts/reveals — do this before opening a PR, not
just the CLI check, since prop-shape errors at the widget level don't fail the
build (they render an inline error card instead).

Read the output literally — every error line names exactly where the problem
is:

- Schema/shape errors: `<file>#<json-pointer>: <message>`, e.g.
  `public/content/maths/alevel-pure/vectors/module.json#/objectives: must NOT have fewer than 2 items`.
- Markdown/directive errors: `<file>:<line>: <message>`, e.g. a nested
  container or an unknown directive name.
- File-existence errors: `<file>: <message>` (a missing `Lesson.file`,
  `assessment.file`, or `::py src` target, or a `::widget type` not present in
  the widget registry).

A `WARN ... not referenced by course.json` line is not an error but means the
module isn't being fully checked yet (see the MVC section above) — don't read
that WARN as a pass.

## Authoring at scale: the isolated-temp-root + splice pattern

This is an **orchestration** pattern for when multiple parallel agents are
each authoring modules into the *same* shared `course.json` — not something a
single-module task needs. Skip this section entirely unless you've been asked
to author many modules across a course/subject.

The pattern this repo has run successfully across three multi-module phases
(P2: 25 modules across 3 maths courses, P3: 22 modules across physics/CS):

1. Each authoring agent scaffolds via `new-module.mjs --root <isolated-temp-dir>`
   — never directly into the real `public/content/` — so N agents editing the
   same course never race on the same `course.json` file.
2. Each agent writes real content and self-validates with
   `build-content.mjs --strict --root <isolated-temp-dir>` before handing
   back. It hands back only its own module folder, never a modified
   `course.json`.
3. A reviewing orchestrator splices each module's `ModuleRef` into the real
   `course.json` only after reviewing the folder — and does this
   **immediately as each module lands**, not batched at the end of the wave
   (D-018: batching means `--strict` output during the wave is not
   trustworthy, since un-spliced modules are silently under-checked).
4. Verification scales with numeric/formula risk, not uniformly: subjects
   prone to silent formula errors (mechanics, statistics, physics — anything
   with continuous numeric answers) get **100% of assessment answers**
   independently re-derived by the reviewer, not sampled. Lower-risk,
   more-definitional subjects (most of CS) get self-verification from the
   authoring agent plus a reviewer spot-check of at least 3 modules, weighted
   toward the sub-topics with the highest exact-answer risk (e.g. numeric
   base conversions, not naming definitions).
5. Gate the wave on a full-tree `--strict` run across the real content root
   (not just the temp roots) plus a `git diff --stat` audit confirming the
   change touched only `public/content/**` (and this doc set) — a content
   wave that also diffs `src/` is a signal something leaked outside the
   intended scope.
