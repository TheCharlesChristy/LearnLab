# Screen-Sequence Catalogue

Every screen type registered in `src/screens/registry.ts` has a section in this file. **CI enforces this**, the same way it enforces `WIDGETS.md`'s coverage of the widget registry (FR-WID-002): for each registered screen `type` there must be a heading of the exact form `` ## `<type>` ``. If you add a screen type without a matching section here, the build fails.

This is the primary authoring format (`docs/BRILLIANT_REWRITE_PLAN.md`) — a screen-sequence lesson is a Brilliant.org-style ordered list of gated interactive screens, not Markdown prose with embedded widgets. The Markdown + directives format described in `AUTHORING.md` §3 still exists and still works for lessons already written in it, but new lessons should be authored as screens.

## How a screen-sequence lesson file is authored

A screen-sequence lesson is `NN-slug.screens.json`, referenced from `module.json` with `"kind": "screens"`:

```json
{ "id": "gradients", "title": "Gradients of curves", "file": "01-gradients.screens.json", "kind": "screens", "estMinutes": 20 }
```

The file itself (`schemas/screen-sequence.schema.json`):

```json
{
  "schemaVersion": 1,
  "id": "gradients",
  "title": "Gradients of curves",
  "screens": [ /* ordered array of screen objects, ≥ 1 */ ]
}
```

Every screen object is a discriminated union on `type` — see the sections below for the exact fields each type requires. A learner sees exactly one screen at a time; the engine (`ScreenSequenceEngine`) will not show a "Continue"/"Finish" affordance as enabled until the screen itself reports genuine completion — there is no screen type that is prose plus a bare Next button. Framing prose lives in string fields (`prompt`, `body`, `reveal`, …) and is Markdown, rendered through the same KaTeX/GFM pipeline as everything else in the app — write maths as `$inline$` / `$$display$$` exactly as in a Markdown lesson.

**Closed set.** There are exactly eight registered screen types, listed below. If a task needs a ninth, that is a `src/`-level engine change — stop and hand it to the **learnlab-extend-platform** skill rather than inventing a `type` value; an unrecognised `type` fails schema validation, it does not degrade gracefully.

**No separate keys file to check.** Unlike widgets (whose `::widget type=` is a free-form Markdown attribute string cross-checked at build time against `schemas/widget-keys.json`), a screen's `type` is a first-class JSON Schema field validated directly by Ajv's `oneOf`/`discriminator` against `schemas/screen-sequence.schema.json` — there is nothing to keep in sync beyond that schema file and this doc.

---

## `predict`

The signature move: pose a question the learner cannot yet confidently answer, make them commit to a choice, then reveal the mechanism. This is the default screen type for opening a lesson or introducing a new concept — it is the engine-native version of the hook patterns in `learnlab-lesson-pedagogy`. Gating: Continue stays disabled until a choice is tapped; the reveal appears immediately on commit (never worded as pass/fail — a "wrong" guess is productive, not a failure).

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique within the sequence. |
| `prompt` | string (Markdown) | yes | The question, posed before any teaching. |
| `choices` | string[] | yes | 2-4 prediction options. |
| `correctChoiceIndex` | integer | no | Omit for an open prediction with no single "right" guess — the reveal narrates the truth without marking the commit right/wrong. |
| `reveal` | string (Markdown) | yes | Shown immediately after commit: the mechanism + resolution. |

### Example

```json
{
  "type": "predict",
  "id": "predict-steepness",
  "prompt": "A straight line has the exact same steepness everywhere along it. Does a curve like $y = x^2$ have the same steepness everywhere too?",
  "choices": ["Yes — a curve's steepness is the same everywhere, just like a line's", "No — a curve's steepness changes from point to point"],
  "correctChoiceIndex": 1,
  "reveal": "Near $x=0$ the curve is almost flat; further out it rises steeply. We define the **gradient at a point** as the gradient of the tangent there."
}
```

---

## `tap-choice`

A full-screen mcq. Reuses `src/quiz/marking.ts`'s `markMcq` semantics verbatim — same correctness rule as a quiz `mcq` question. Gating: the learner must land on the correct choice themselves to advance; a wrong tap shows that choice's own misconception-targeted `feedback` and, from the first miss onward, the next rung of `hints` — the ladder never bottoms out in the answer.

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Unique within the sequence. |
| `prompt` | string (Markdown) | yes | |
| `choices` | `{text, feedback?}[]` | yes | 2-4 choices. `feedback` (Markdown) is misconception-targeted — it names the specific error that choice represents, shown when it's tapped. |
| `correctIndex` | integer | yes | Index into `choices`. |
| `successFeedback` | string (Markdown) | no | Reinforcement shown on the correct pick. |
| `hints` | string[] | no | ≤ 3. Ladder: nudge → subgoal → setup. Revealed one at a time on each wrong attempt. Never the answer. |

### Example

```json
{
  "type": "tap-choice",
  "id": "meaning-of-gradient",
  "prompt": "What does the tangent's gradient at a point actually tell you?",
  "choices": [
    { "text": "The curve's steepness at that exact point" },
    { "text": "The average steepness over the whole curve", "feedback": "That's closer to what a chord between two far-apart points gives you — not the gradient at one exact point." }
  ],
  "correctIndex": 0,
  "successFeedback": "Exactly — the derivative gives steepness at one exact point, never an average."
}
```

### Validation behaviour

`correctIndex` must be a valid index into `choices` — this is not schema-checked (an out-of-range index is a content bug, not a shape error), so hand-verify it the same way you'd verify a quiz `answer` index.

---

## `entry`

A generation-format checkpoint: numeric or text, reusing `src/quiz/marking.ts`'s `markNumeric`/`markText`/`parseNumericInput` verbatim — identical marking rules to a quiz `numeric`/`text` question (absolute tolerance for numeric; full-match regex, case-insensitive by default, for text). Gating: the learner must submit a correct value; a wrong submission surfaces the next rung of `hints`.

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | |
| `prompt` | string (Markdown) | yes | |
| `inputMode` | `"numeric"` \| `"text"` | yes | |
| `answer` | number | if numeric | |
| `tolerance` | number ≥ 0 | if numeric | Absolute, like the quiz `numeric` type. |
| `unit` | string | no | Numeric only, display only. |
| `accept` | string[] | if text | ECMAScript regex sources, full-match. |
| `caseSensitive` | boolean | no | Text only, default `false`. |
| `successFeedback` | string | no | |
| `hints` | string[] | no | ≤ 3, same ladder discipline as `tap-choice`. |

### Example

```json
{
  "type": "entry",
  "id": "gradient-at-x3",
  "prompt": "Using the pattern — gradient of $y=x^2$ at $x$ is $2x$ — what is the gradient at $x=3$?",
  "inputMode": "numeric",
  "answer": 6,
  "tolerance": 0.01,
  "hints": ["At $x=2$ the gradient was $4=2\\times2$.", "Apply the same rule at $x=3$: $2\\times3$."]
}
```

---

## `manipulable-target`

Wraps an existing explorable widget with a goal to hit, instead of a bare manipulable — interaction first, formalism second. Gating: Continue stays disabled until the live value the learner is manipulating satisfies `goal`.

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | |
| `prompt` | string (Markdown) | yes | The task — what to make happen. |
| `widget` | `"function-grapher"` | yes | Currently the only wrapped widget. |
| `widgetProps` | object | yes | `{ expr (required), xmin?, xmax?, ymin?, ymax?, grid? }` — same meanings as the `function-grapher` widget's own props (`docs/WIDGETS.md`). `tangent` is forced on by the screen; don't set it. |
| `goal` | object | yes | `{ kind: "tangent-gradient-in-range", min, max, description }`. |
| `successFeedback` | string | no | |
| `hints` | string[] | no | ≤ 3. Shown via a manual "Need a hint?" affordance (there's no discrete submit to gate the ladder on, unlike `tap-choice`/`entry`). |

### Validation behaviour — the tolerance/keyboard-step trap

`function-grapher`'s keyboard control moves the tangent point in fixed steps of `(xmax - xmin) / 50`. **`goal.max - goal.min` must be comfortably wider than that step** (at least 2× it), or a keyboard-only learner may never be able to land inside the window at all — the achievable keyboard positions are spaced `step` apart, so a goal window narrower than `step` can fall entirely *between* two reachable points. This is not a hypothetical: the first shipped screens lesson (`differentiation-1/01-gradients.screens.json`) originally used a ±0.1 gradient tolerance on a range where the keyboard step corresponded to a gradient step of ~0.32, and had to be widened to ±0.4 after testing. Compute the step for your `xmin`/`xmax` before picking `min`/`max`, and test with the keyboard, not just a mouse.

### Example

```json
{
  "type": "manipulable-target",
  "id": "find-gradient-4",
  "prompt": "Drag the point along $y=x^2$ until the tangent line's gradient reads 4.",
  "widget": "function-grapher",
  "widgetProps": { "expr": "x^2", "xmin": -4, "xmax": 4, "grid": true },
  "goal": { "kind": "tangent-gradient-in-range", "min": 3.6, "max": 4.4, "description": "Target: tangent gradient = 4." }
}
```

---

## `faded-step`

Backward-faded worked example: `worked` shows the already-solved steps, `prompt` blanks the final one for the learner to supply. Marking is identical to `entry` (same `checkGenerationAnswer` helper, `src/screens/marking-helpers.ts`) — the only difference is presentational: worked context precedes the blanked prompt. This is the engine-native form of `learnlab-lesson-pedagogy`'s worked-example-pair pattern's *faded companion* half.

### Fields

Same as `entry`, plus `worked` (string, Markdown, required) in place of nothing — `worked` replaces the "full worked example" that used to be a separate `:::reveal` block; `prompt` is the blanked final step.

### Example

```json
{
  "type": "faded-step",
  "id": "evaluate-polynomial-derivative",
  "worked": "Differentiate $f(x)=3x^4-5x^2+2$ term by term:\n\n$$\nf'(x)=12x^3-10x.\n$$",
  "prompt": "So $f'(x)=12x^3-10x$. What is $f'(2)$?",
  "inputMode": "numeric",
  "answer": 76,
  "tolerance": 0.01,
  "hints": ["Substitute $x=2$ into $12x^3-10x$.", "$12\\times8-10\\times2=96-20$."]
}
```

---

## `sort-match`

Click-to-select matching (never native drag-and-drop, for keyboard/screen-reader parity — same interaction-model precedent as the `matching-pairs` widget, D-028), generalized into one gated screen. Gating: Continue stays disabled until every pair is matched.

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | |
| `prompt` | string (Markdown) | yes | |
| `pairs` | `{left, right}[]` | yes | 2-6 pairs (Markdown strings). The right column is shuffled, seeded on the screen's `id` (stable across reloads). |
| `successFeedback` | string | no | |

### Example

```json
{
  "type": "sort-match",
  "id": "match-terms",
  "prompt": "Match each term to its definition.",
  "pairs": [
    { "left": "Derivative", "right": "The gradient of the tangent at a point" },
    { "left": "Chord", "right": "A straight line joining two points on a curve" }
  ]
}
```

---

## `flash-recall`

A single retrieval-practice card, generalizing the `flashcards` widget's flip/self-grade loop to one gated screen. Gating is two-part: the learner must commit to "I've got an answer — show me" (an attempt, not a skip) before `back` is revealed, then self-grade before Continue — attempt-before-reveal, the same family as `predict`.

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | |
| `front` | string (Markdown) | yes | The prompt/question. |
| `back` | string (Markdown) | yes | The answer. |

### Example

```json
{
  "type": "flash-recall",
  "id": "recall-power-rule",
  "front": "State the power rule for $\\frac{d}{dx}(ax^n)$.",
  "back": "$anx^{n-1}$ — multiply by the power, then reduce the power by one."
}
```

---

## `reveal-mechanism`

A worked mechanism with a **mandatory self-explanation prompt** — never a passive reveal. The learner must write something in their own words before the model self-explanation and Continue become available. The self-explanation isn't graded (it's generation, not a checkable fact) — genuine input is required, correctness of that input is not assessed.

### Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | |
| `body` | string (Markdown) | yes | The worked content up to the self-explanation point. |
| `selfExplainPrompt` | string (Markdown) | yes | "Why does X happen?"-style question. |
| `selfExplainAnswer` | string (Markdown) | yes | The model self-explanation, shown once the learner has answered. |

### Example

```json
{
  "type": "reveal-mechanism",
  "id": "why-h-vanishes",
  "body": "$$\\frac{(x+h)^2-x^2}{h}=2x+h.$$ Taking the limit as $h\\to0$ leaves $f'(x)=2x$.",
  "selfExplainPrompt": "As $h\\to0$, the '+h' term disappears but '2x' doesn't. Why not?",
  "selfExplainAnswer": "The '+h' term contains $h$, so it shrinks to $0$. The '2x' term has no $h$ in it, so letting $h\\to0$ doesn't touch it."
}
```
