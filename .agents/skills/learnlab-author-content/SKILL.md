---
name: learnlab-author-content
description: Author new LearnLab lessons, modules, or courses under public/content/ — scaffolding a module, writing screen-sequence lessons (the primary format) or legacy Markdown lessons, building assessment.json quizzes, meeting the Minimum Viable Content (MVC) bar, and validating with build-content.mjs --strict. Use for "add a module", "write a lesson", "create a course", "new LearnLab content", or any task touching public/content/**. Always pair with the learnlab-lesson-pedagogy skill, which governs what to write; this skill governs the mechanics of writing it.
---

# Authoring LearnLab content

For v2 packs, use registered activity keys and generated prop contracts in
`docs/ACTIVITY_PLUGINS.md`; do not invent props. Release/demonstration rules are in
`docs/V2_RELEASE_GATES.md`.

LearnLab content is data, not code: courses are folders of JSON and (for legacy lessons)
Markdown, plus Python for Tier 2 items, under `public/content/`. The full reference is
`docs/AUTHORING.md` — read it before you start; this skill covers what that guide doesn't spell
out: how the tooling actually behaves, the tacit process knowledge from three-plus phases of
shipping ~90 real modules, and the exact verbatim shapes to copy from. Never touch `src/` to add
or edit content — that is a hard architectural invariant (C-5) and `--strict` plus the PR lane
both assume it. (If a task genuinely requires a `src/` change — a new widget, a new question
type, a new screen type — that's the **learnlab-extend-platform** skill's territory, not this
one's.)

**New lessons are screen sequences, not Markdown.** LearnLab's engine (`docs/BRILLIANT_REWRITE_PLAN.md`)
renders a lesson as an ordered sequence of gated interactive screens — the learner sees one at a
time and cannot advance without a real interaction. This is now the default and primary authoring
format; the older Markdown + directives format (§"Legacy format" below) still works and still
renders, but new lessons should use screens unless there's a specific reason not to.

## The four closed sets — never silently extend

LearnLab has exactly four enumerable vocabularies. If a task seems to need a fifth directive, a
fifth question type, a ninth screen type, or a widget that isn't registered, that is a
`src/`-level engine change, not a content-authoring task — stop and say so rather than inventing
syntax that will fail validation.

1. **Screen types (exactly 8, `docs/SCREENS.md`):** `predict`, `tap-choice`, `entry`,
   `manipulable-target`, `faded-step`, `sort-match`, `flash-recall`, `reveal-mechanism`. Validated
   directly by `schemas/screen-sequence.schema.json`'s discriminator — an unrecognised `type`
   fails schema validation.
2. **Legacy directive forms (exactly 4, SRS §4.5):** `::widget`, `::py` (leaf forms), `:::callout`,
   `:::reveal` (container forms). Nothing else parses. Only relevant when editing an existing
   Markdown lesson.
3. **Question types (exactly 4, SRS §4.6):** `mcq`, `multi`, `numeric`, `text`. These back both
   `assessment.json` (every module, regardless of lesson format) and, under the hood, the
   `tap-choice`/`entry` screen types' marking.
4. **The widget registry — check it fresh every time, it evolves.** Read `src/widgets/keys.json`
   (a flat JSON array) to see the *current* live set — don't trust this document or your memory,
   since new widgets land over time. Every key has a matching `` ## `<key>` `` section in
   `docs/WIDGETS.md` (CI-enforced, FR-WID-002) — that section is the prop contract, and it still
   matters for screens: `manipulable-target` screens wrap a native widget (currently
   `function-grapher`), so its prop contract is exactly the widget's own.

## Scaffold first, always

Never hand-create a module folder. Run the scaffolder — it produces output that passes validation
immediately, so you start from green instead of debugging schema errors from scratch:

```sh
node scripts/new-module.mjs \
  --subject maths --course alevel-pure \
  --id differentiation-2 --title "Differentiation II" \
  --description "Product rule, quotient rule, and chain rule." \
  --minutes 90 --prereqs "differentiation-1" \
  [--course-title "A-level Pure Mathematics"] [--level alevel] \
  [--root <content-root>]
```

Required flags: `--subject` (`maths|physics|cs|ai`), `--course`, `--id`, `--title`, `--description`,
`--minutes`. `--prereqs` is comma-separated module ids (empty for none). `--course-title`/`--level`
only matter when the course doesn't exist yet (`level` is one of `gcse|as|a2|alevel|foundation`,
default `alevel`). `--root` overrides the content root — use this whenever you're authoring at
scale into an isolated temp directory (see the orchestration section below) instead of directly
into `public/content/`. Omit flags to get an interactive prompt (only works with a TTY).

It generates, and appends the `ModuleRef` to `course.json` (creating the course file fresh if
`--course` doesn't exist yet):

- `<module-dir>/module.json` — valid schema, but with `TODO` objectives and a single
  `introduction` lesson (`"kind": "screens"`). You must replace both.
- `01-introduction.screens.json` — one placeholder `predict` screen and one placeholder
  `tap-choice` screen, both schema-valid but full of `TODO` text. Replace them; this is a
  template, not real teaching content. (JSON has no comment syntax, so unlike the old Markdown
  template these ship as real screens rather than commented-out examples.)
- `assessment.json` — two placeholder questions (one `mcq`, one `numeric`). You must replace both
  and add at least 6 more real questions.

IDs are lowercase kebab-case (`^[a-z0-9]+(-[a-z0-9]+)*$`), ≤ 64 chars. Module ids are globally
unique across the *entire* content tree (not just the course) — check for collisions if you're
unsure a name is free.

## The MVC bar (SRS §8.6) — your PR-readiness checklist

`build-content.mjs --strict` enforces every ◆ rule below. A module that fails any of them fails CI
on a content PR:

- ◆ At least 3 lessons.
- ◆ At least 1 interactive item: a native widget *other than* `figure`, a Python item (`::py`), or
  **any `"kind": "screens"` lesson** — every screen gates on a real interaction by construction, so
  a module with at least one screens-format lesson clears this automatically. A module with only
  prose and `figure`s (legacy format, zero screens lessons) does not meet MVC even if it has ten
  lessons.
- ◆ `assessment.json` with ≥ 8 questions spanning ≥ 2 of the 4 question types.
- ◆ `prerequisites` and `objectives` both declared in `module.json`. Prerequisites are advisory
  only — the UI recommends, never locks — but every id listed must resolve to a real module
  somewhere in the tree, or `--strict` fails it as a dangling reference.
- ◆ `estMinutes` set on the module *and* on every individual lesson.
- (SHOULD, not CI-enforced) every concept lesson includes a full worked example with a backward-
  faded companion — `:::reveal` in the legacy format, `reveal-mechanism` + `faded-step` screens in
  the primary format.

The **house bar** is higher than the CI bar: the learnlab-lesson-pedagogy skill's final self-check
(prediction hook, checkpoint format mix and placement, faded worked-example pair, misconception
distractors, cumulative review question — now expressed as screen types) applies to every module
on top of the ◆ rules above. CI passing does not mean the module is done.

One sharp edge worth knowing (D-018): `build-content.mjs` **silently skips** full MVC checking for
any module folder not yet referenced by its course's `course.json` — it only prints a
`WARN ... not referenced by course.json`. An orphan folder that "passes `--strict`" may just never
have been checked. Always add the `ModuleRef` to the real `course.json` before trusting a green
`--strict` run as meaning the module is actually valid.

## Pedagogy is its own skill — read it before drafting

Everything about *what* to write — hooks and the banned openers, journey structure, the level dial
for GCSE/A-level/adult tone, screen sequencing, checkpoint format mix, worked-example fading,
self-explanation prompts, the load-bearing-narrative deletion test, misconception-based
distractors, feedback voice — lives in the **learnlab-lesson-pedagogy** skill, now expressed in
screen-sequence terms. Reading it is a required step before writing or substantially revising any
lesson, exactly the way reading `docs/SCREENS.md`/`docs/WIDGETS.md` is required before writing a
screen/widget. Its final self-check and this skill's validation loop are both mandatory; neither
substitutes for the other.

Two platform facts worth knowing so you don't duplicate effort while following it:

- **The engine already carries the celebration layer**, including per-screen completion. Animated
  feedback, streaks, points, and celebratory moments on screen/lesson/quiz/deck/game completion
  all fire automatically — never add markup or content-level reward language for any of that.
- **Building a new *kind* of interactive widget or screen type** is a `src/`-level task per the
  four-closed-sets rule — hand it to the learnlab-extend-platform skill, which knows the
  registration procedure for both.

### Never use dashes that could be misread as a minus sign

Em-dashes (—) and en-dashes (–) must never appear in any user-facing text: lesson Markdown prose,
screen fields (`prompt`, `body`, `reveal`, `hints`, `feedback`, `successFeedback`, and every other
learner-facing string in a `.screens.json` file), `:::callout`/`:::reveal` content, quiz
`text`/`explanation` strings in `assessment.json` (or any inline quiz JSON), widget data files
(flashcard fronts/backs, matching-pairs terms, and similar), and headings. In a subject that's full
of mathematical notation, a dash sitting in running prose is genuinely ambiguous with a minus
sign — this isn't a house-style nitpick, it actively confuses maths and physics content
specifically, and for consistency the rule applies platform-wide, not just to numeric subjects.

Rewrite instead of just deleting the dash — pick whichever of these actually matches what the dash
was doing:

| The dash was doing... | Use instead |
|---|---|
| A parenthetical aside | A comma, or full parentheses |
| Introducing an elaboration or list | A colon |
| Joining two independent clauses | A period (two sentences), or a comma if a lighter connective reads better |

Real before/after examples from this repo's own fixes:

- `'Nice work — quiz passed!'` → `'Nice work, quiz passed!'`
- `'Practice mode — this attempt was not recorded.'` → `'Practice mode: this attempt was not recorded.'`
- `"— written $\operatorname{Re}(z)$."` → `", written $\operatorname{Re}(z)$."`
- `` ` ${streak}-day streak` `` → `` ` streak of ${streak} days` `` (note: even a hyphen directly
  adjacent to a digit in generated text reads badly next to maths — rephrase around it rather than
  just swapping the character)

Check your own draft for `—`/`–` characters before considering a lesson, quiz, or data file done —
`grep -n "—\|–" <file>` over anything you've just written is a fast, cheap check. This rule does
not apply to source code comments (`src/**`), which are not user-facing.

## Authoring a screen sequence, with a real example

`docs/SCREENS.md` is the full per-type field reference — read it before writing your first
sequence, the same way `docs/WIDGETS.md` is required reading before a widget directive. What
follows is the mechanical shape and the discipline specific to screens; don't invent variations on
the field names there.

A screen-sequence lesson file (`NN-slug.screens.json`) is registered in `module.json` exactly like
any other lesson, with `"kind": "screens"`:

```json
{ "id": "gradients", "title": "Gradients of curves", "file": "01-gradients.screens.json", "kind": "screens", "estMinutes": 20 }
```

The file itself — a real, shipped example (`maths/alevel-pure/differentiation-1/01-gradients.screens.json`,
trimmed to its first two screens):

```json
{
  "schemaVersion": 1,
  "id": "gradients",
  "title": "Gradients of curves",
  "screens": [
    {
      "type": "predict",
      "id": "predict-steepness",
      "prompt": "A straight line has the exact same steepness everywhere along it. Does a curve like $y = x^2$ have the same steepness everywhere too?",
      "choices": ["Yes — a curve's steepness is the same everywhere, just like a line's", "No — a curve's steepness changes from point to point"],
      "correctChoiceIndex": 1,
      "reveal": "Near $x = 0$ the curve $y = x^2$ is almost flat; further out it rises steeply. We define the **gradient at a point** as the gradient of the *tangent* — the straight line that just touches the curve at that exact point."
    },
    {
      "type": "manipulable-target",
      "id": "find-gradient-4",
      "prompt": "Drag the point along $y = x^2$ until the tangent line's gradient reads **4**.",
      "widget": "function-grapher",
      "widgetProps": { "expr": "x^2", "xmin": -4, "xmax": 4, "tangent": true, "grid": true },
      "goal": { "kind": "tangent-gradient-in-range", "min": 3.6, "max": 4.4, "description": "Target: tangent gradient = 4." },
      "successFeedback": "That's it — the tangent gradient is 4 right around $x = 2$.",
      "hints": ["Try moving the point toward the right-hand side of the curve, where it's steeper.", "You're looking for the point where $x = 2$.", "At $x = 2$, $y = x^2 = 4$ — land the point there and read the gradient."]
    }
  ]
}
```

Read the whole file (and its two sibling lessons in the same module) end to end before writing
your own — it's a complete, shipped, `--strict`-passing example using six of the eight screen
types.

**Prose fields are Markdown**, rendered through the same KaTeX/GFM pipeline as a legacy lesson —
`$inline$`/`$$display$$` maths, `**bold**`, backtick code, all work identically. Unlike Markdown
lesson files, JSON strings need their own escaping (see below) and can't span raw newlines
directly — use `\n` for a paragraph break inside a string, as `predict-chord-limit`'s `reveal`
field in the real example does for its display-maths block.

**Escaping reminder** (same discipline as `assessment.json` fields): backslashes double, so a
LaTeX `\times` is written `"\\times"` in the JSON source, and `\frac{1}{2}` is written
`"\\frac{1}{2}"`.

**Gating is structural, not something you author.** Every screen type's Continue button is
disabled until the learner does something real — a `tap-choice`/`entry` screen requires the
*correct* answer (not just any answer) before it unlocks, matching the platform's evidence-based
stance that a checkpoint should demand right-with-effort, not just attempted. There is no field
that lets a screen skip this.

### The tolerance/keyboard-step trap in `manipulable-target`

The one screen-specific numeric-correctness pitfall worth knowing up front, because it shipped and
was caught during this format's own first lesson: `function-grapher`'s keyboard control moves the
tangent point in fixed steps of `(xmax - xmin) / 50`. A `goal.min`/`goal.max` window narrower than
roughly 2× that step can fall entirely *between* two keyboard-reachable positions, making the goal
literally unreachable by a keyboard-only learner even though a mouse-dragging learner might land in
it easily. Compute the step for your `xmin`/`xmax` before picking the goal window, and — per the
verification discipline below — actually test the screen with the keyboard, not just a mouse.
`docs/SCREENS.md`'s `manipulable-target` section has the worked numbers.

## Legacy format: Markdown + directives

This is the format every module authored before the screens rewrite uses, and it remains fully
supported — old lessons are unaffected and don't need converting. Only reach for it to edit an
existing Markdown lesson, or in the rare case a screen sequence genuinely doesn't fit (flag that
rather than forcing one). Full syntax reference: `docs/AUTHORING.md` §3a.

**`::widget` (leaf)** — from `differentiation-1/03-power-rule.md`'s Markdown-era predecessor
(now migrated, but the syntax is unchanged elsewhere in the repo) — from
`boolean-algebra-and-logic/03-boolean-laws.md`:

```markdown
::widget{type="step-reveal" src="simplification-steps.json"}
```

Attributes reach the widget's `parseProps` **verbatim as strings** — `xmin=-4` arrives as the
string `"-4"`, `tangent=true` arrives as the string `"true"`, and a bare attribute like `{tangent}`
(no value) means `true` (D-004). Each widget's own `parseProps` coerces and validates; it is not
done for you by the Markdown renderer. This means a typo like `xmin="minus 4"` doesn't fail the
build — it renders an inline "must be a finite number" error card at runtime. Check
`docs/WIDGETS.md`'s per-widget "Validation behaviour" section for the exact prop names and error
strings before shipping, and actually load the lesson in `npm run dev` to see the widget render,
not just the source text.

**`::py` (leaf)** — from `boolean-algebra-and-logic/01-logic-operators.md`:

```markdown
::py{src="items/logic-quiz.py" params='{"questions": 5}'}
```

`src` is a path relative to the module folder and must exist on disk (`--strict` checks this).
`params` is a JSON **object** string — note the single quotes wrapping it so the embedded double
quotes survive Markdown attribute parsing. Python item authoring itself (writing the `.py` file,
the `learnsdk` base classes) is Tier 2 — see `docs/PYTHON_ITEMS.md`. Python items are not yet
integrated into the screens format (`docs/BRILLIANT_REWRITE_PLAN.md`'s explicit scope boundary) —
a lesson that needs one stays in the legacy Markdown format for now.

**`:::callout` (container)** — from `algebra-essentials/02-factorising.md`:

```markdown
:::callout{kind="tip"}
Always check by expanding your answer back out — it should return exactly the expression you started with. $3(2x+3) = 6x + 9$. ✓
:::
```

`kind` is one of `info`, `tip`, `warning`, `key` — nothing else.

**`:::reveal` (container)** — from a shipped legacy lesson:

```markdown
:::reveal{title="Worked example: differentiate and evaluate"}
Let $f(x) = 3x^4 - 5x^2 + 2$. Differentiate term by term using the power rule:

$$
f'(x) = 3 \cdot 4 x^{3} - 5 \cdot 2 x^{1} + 0 = 12x^3 - 10x.
$$
:::
```

**No-nesting rule:** containers may hold Markdown, maths, and *leaf* directives, but never another
container. A `:::reveal` inside a `:::callout` (or vice versa) fails validation with a rendered
error card — there is no partial/best-effort nesting.

## assessment.json — the 4 question types, verbatim

Every module's end-of-module assessment uses this format **regardless of lesson format** — a
module with screens-format lessons still ships one `assessment.json`, unchanged from how it always
worked. Top-level shape (`schemas/quiz.schema.json`): `schemaVersion` (1), `id` (unique within the
module), `title`, optional `shuffleQuestions`/`shuffleChoices` (both default `true`), optional
`pick` (randomly sample this many questions per attempt — module `assessment.json` files commonly
omit it so all questions are used), and `questions` (≥ 1, ≥ 8 and ≥ 2 types for MVC).

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

House-style rules on top of the schema (from learnlab-lesson-pedagogy, stated here because this is
where questions get written):

- **New `mcq` questions default to exactly 3 choices** — the key plus two misconception-based
  distractors — even though the schema allows 2–6 and older shipped questions (like q2 above,
  which predates the rule) use 4. Add a 4th choice only for a third distinct, documented
  misconception. Never "none of the above" / "all of the above"; never double negatives. The same
  3-choice default applies to a `tap-choice` screen's `choices`.
- **Every distractor's `explanation`/`feedback` names the specific error** that leads to it, in
  encouraging voice. Where to find real documented misconceptions: learnlab-research-content's
  misconception-research section.
- **≥ 1/3 of a module assessment's questions should be `numeric` or `text`** (generation beats
  recognition), and **≥ 1 question should be a cumulative review item** requiring a technique from
  a declared prerequisite module, flagged as review in its explanation.

Marking rules to hold yourself to when writing questions (identical for the equivalent screen
fields — `tap-choice` reuses `mcq` marking, `entry`/`faded-step` reuse `numeric`/`text` marking):
**mcq/tap-choice** — the correct choice's index. **multi** — the exact correct index set; there is
**no partial credit**, so don't write a question where a "mostly right" subset feels like it should
score. **numeric/entry/faded-step** — `abs(value - answer) <= tolerance` (tolerance is absolute,
not relative — for an answer like `0.001` a tolerance of `0.001` accepts a huge relative error;
pick tolerance relative to the expected magnitude). **text/entry/faded-step** — the trimmed input
must **full-match** an ECMAScript regex in `accept`, so `"power rule"` will *not* match "the power
rule" typed by a user — write the pattern to cover the phrasing variants you intend to accept, as
the real example above does with `(the )?power rule`. Every question, and every `tap-choice`/`entry`
screen, must carry an explanation of its answer (`explanation` for questions, `successFeedback`/
choice `feedback` for screens) — this is validated for quiz questions and strongly conventional for
screens.

Escaping reminder for JSON `text`/`explanation` strings: backslashes double, so a LaTeX `\times` is
written `"\\times"` and `\frac{1}{2}` is written `"\\frac{1}{2}"` in the JSON source.

## The single most important discipline: verify every answer by hand

Schema validation checks *shape*, not *correctness*. Across this project's real authoring history,
independent re-derivation of every assessment answer caught real formula errors that `--strict`
passed cleanly — e.g. D-020, where an internally-consistent, schema-valid question
(`neural-networks-2-training` q5) asked "which epoch converges" under a definition that actually
implied a different numeric answer than the one stored, because the question text's literal
wording and the stored `answer` had quietly drifted apart during drafting.

Before you consider any assessment, or any screen sequence, done:

- Recompute every `numeric` answer independently (by hand, or by running the actual formula/code —
  e.g. a quick SymPy check for calculus, exact `comb(n,k)` arithmetic for probability) rather than
  trusting that it "looks right" next to the explanation you just wrote. This includes every
  blanked `faded-step`, every `entry` screen's answer, every `predict`/`tap-choice`
  `correctIndex`/`correctChoiceIndex`, and every `manipulable-target` `goal` — each one is held to
  this same bar.
- Re-read every `mcq`/`multi`/`tap-choice` question's text against its explanation/feedback and ask
  whether a domain expert would derive the *stored* answer from the *literal* wording of the
  question — not the wording you meant.
- For `text`/`entry`(text-mode) questions, mentally run a few plausible correct phrasings through
  the regex and confirm they full-match (remember: full-match, not substring).
- For `manipulable-target`, actually drive the screen — with a mouse *and* the keyboard — and
  confirm the goal is reachable both ways (see the tolerance/keyboard-step trap above).

This is not optional polish — it is the one class of error that has actually shipped and been
caught in this repo's history, and the one class schema validation structurally cannot catch.

## Validating

```sh
node scripts/build-content.mjs --strict [--root <content-root>]
```

Runs without `--root` against `public/content/`; `npm run validate -- --strict` is the same thing
via the package script. `npm run dev` runs the same pipeline continuously in watch mode and
additionally serves the app so you can actually look at rendered widgets/callouts/reveals **and
actually drive every screen** — do this before opening a PR, not just the CLI check, since
prop-shape errors at the widget level and a badly-tuned `manipulable-target` goal don't fail the
build (a widget renders an inline error card; an unreachable goal just silently traps a learner).

Read the output literally — every error line names exactly where the problem is:

- Schema/shape errors: `<file>#<json-pointer>: <message>`, e.g.
  `public/content/maths/alevel-pure/vectors/module.json#/objectives: must NOT have fewer than 2 items`.
- Markdown/directive errors: `<file>:<line>: <message>`, e.g. a nested container or an unknown
  directive name (legacy format only).
- File-existence errors: `<file>: <message>` (a missing `Lesson.file`, `assessment.file`, or
  `::py src` target, or a `::widget type` not present in the widget registry).

A `WARN ... not referenced by course.json` line is not an error but means the module isn't being
fully checked yet (see the MVC section above) — don't read that WARN as a pass.

## Authoring at scale: the isolated-temp-root + splice pattern

This is an **orchestration** pattern for when multiple parallel agents are each authoring modules
into the *same* shared `course.json` — not something a single-module task needs. Skip this section
entirely unless you've been asked to author many modules across a course/subject.

The pattern this repo has run successfully across multiple multi-module phases:

1. Each authoring agent scaffolds via `new-module.mjs --root <isolated-temp-dir>` — never directly
   into the real `public/content/` — so N agents editing the same course never race on the same
   `course.json` file.
2. Each agent writes real content and self-validates with
   `build-content.mjs --strict --root <isolated-temp-dir>` before handing back. It hands back only
   its own module folder, never a modified `course.json`.
3. A reviewing orchestrator splices each module's `ModuleRef` into the real `course.json` only
   after reviewing the folder — and does this **immediately as each module lands**, not batched at
   the end of the wave (D-018: batching means `--strict` output during the wave is not
   trustworthy, since un-spliced modules are silently under-checked).
4. Verification scales with numeric/formula risk, not uniformly: subjects prone to silent formula
   errors (mechanics, statistics, physics — anything with continuous numeric answers, and any
   `manipulable-target` goal) get **100% of answers independently re-derived** by the reviewer, not
   sampled. Lower-risk, more-definitional subjects (most of CS) get self-verification from the
   authoring agent plus a reviewer spot-check of at least 3 modules, weighted toward the
   sub-topics with the highest exact-answer risk (e.g. numeric base conversions, not naming
   definitions).
5. Gate the wave on a full-tree `--strict` run across the real content root (not just the temp
   roots) plus a `git diff --stat` audit confirming the change touched only `public/content/**`
   (and this doc set) — a content wave that also diffs `src/` is a signal something leaked outside
   the intended scope.
6. The orchestrator's review of each module includes the learnlab-lesson-pedagogy final
   self-check, not just schema and answer verification — a module can be schema-perfect and
   numerically correct and still fail the house bar (all-`tap-choice` checkpoints, back-loaded
   interactivity, a "Welcome to" opener). Reject those the same way you'd reject a wrong answer.
