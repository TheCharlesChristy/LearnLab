# Native Widget Catalogue

Every native widget registered in `src/widgets/registry.ts` has a section in this file. **CI enforces this** (FR-WID-002): for each registry key there must be a heading of the exact form `` ## `<key>` ``. If you add a widget without a matching section here, the build fails.

Widgets are mounted from lesson Markdown with the leaf directive form (§4.5 of the SRS):

```markdown
::widget{type="<registry-key>" prop1="value" prop2=3 prop3=true}
```

## How directive attributes become props

Attribute values reach a widget's `parseProps` guard verbatim as strings (a bare attribute like `{tangent}` means `true`). Each widget interprets its own props — numeric props accept numeric strings (`xmin=-4`, `tolerance=1e-3`), boolean props accept `true`/`false` — per §4.5: "each widget validates its own props" (see DECISIONS.md D-004).

Each widget validates with a hand-rolled guard (no Zod — FR-WID-001). On failure the widget renders an inline error card naming each bad prop: in dev builds the card lists the full messages; in production it shows a brief "This block could not be displayed." notice (FR-WID-003). An unknown `type` renders a visible "Unknown widget: X" card — it never silently vanishes (FR-CONT-006).

---

## `function-grapher`

Plots `y = f(x)` as a responsive SVG (fixed height 320 px). The expression is compiled with a number-only **mathjs subset** via `compile` — nothing is ever `eval`'d (NFR-SEC-002). Supports an optional draggable tangent point with a live gradient readout; the tangent handle is a focusable `role="slider"`, movable by pointer drag or arrow keys, with the readout announced via an `aria-live` region (NFR-A11Y-001).

### Props

| Prop      | Type    | Required | Default | Description                                                                  |
| --------- | ------- | -------- | ------- | ---------------------------------------------------------------------------- |
| `expr`    | string  | yes      | —       | Expression in `x`, e.g. `"x^2"`, `"sin(x)/x"`. Parsed by mathjs `compile`.    |
| `xmin`    | number  | no       | `-10`   | Left edge of the x-range. Must be `< xmax`.                                   |
| `xmax`    | number  | no       | `10`    | Right edge of the x-range.                                                    |
| `ymin`    | number  | no       | auto    | Lower y-bound. Auto-derived from sampled values when absent. Must be `< ymax`.|
| `ymax`    | number  | no       | auto    | Upper y-bound. Auto-derived when absent.                                      |
| `tangent` | boolean | no       | `false` | Show a draggable tangent point with gradient readout.                         |
| `grid`    | boolean | no       | `true`  | Show the background grid.                                                     |

### Example

```markdown
::widget{type="function-grapher" expr="x^2" tangent=true xmin=-4 xmax=4}
```

### Validation behaviour

`parseProps` (`src/widgets/function-grapher/index.ts`) collects **all** errors before failing:

- missing/empty `expr` → `expr: required — a non-empty expression in x, e.g. expr="x^2"`
- non-numeric `xmin`/`xmax`/`ymin`/`ymax` → `<name>: must be a finite number (got <value>)`
- `xmin >= xmax` → `xmin: must be less than xmax (got xmin=…, xmax=…)` (only checked when both bounds passed numeric validation)
- `ymin >= ymax` (both given) → `ymin: must be less than ymax (got ymin=…, ymax=…)`
- non-boolean `tangent`/`grid` → `<name>: must be true or false (got <value>)`

An `expr` that passes the prop guard but fails to compile, or never evaluates to a number across the sampled range, renders an inline error card naming the expression at render time.

Screenshot: TODO

---

## `figure`

A captioned image. `alt` text is **enforced by validation** (NFR-A11Y-001): a figure without alternative text will not render. A relative `src` resolves against the current module's folder (via the lesson context's `moduleBaseUrl`).

### Props

| Prop      | Type   | Required | Default | Description                                       |
| --------- | ------ | -------- | ------- | ------------------------------------------------- |
| `src`     | string | yes      | —       | Image path (module-relative) or URL.              |
| `alt`     | string | yes      | —       | Alternative text for screen-reader users.         |
| `caption` | string | no       | —       | Visible caption beneath the image.                |
| `width`   | number | no       | —       | Rendered width in CSS pixels. Must be `> 0`.      |

### Example

```markdown
::widget{type="figure" src="images/tangent-line.png" alt="A curve with a tangent line touching it at one point" caption="The tangent touches the curve at exactly one point." width=480}
```

### Validation behaviour

`parseProps` (`src/widgets/figure/index.ts`) errors:

- missing/empty `src` → `src: required — an image path or URL, e.g. src="images/circuit.png"`
- missing/empty `alt` → `alt: required — describe the image for screen-reader users (NFR-A11Y-001)`
- non-string `caption` → `caption: must be a string (got <value>)`
- non-positive or non-numeric `width` → `width: must be a positive number of pixels (got <value>)`

Screenshot: TODO

---

## `quiz`

Inline quiz embed. Fetches a module-relative quiz JSON file (schema §4.6, `schemas/quiz.schema.json`) and renders the native quiz engine (§5.4) in place: one question at a time, immediate feedback with explanations, then a summary with a retry button. Completed runs record an `attempts` row with `kind: 'inline-quiz'` and `itemId` equal to the loaded quiz file's `id`.

While the file loads, a "Loading quiz…" status is shown; a fetch or parse failure shows a "Couldn't load quiz" card with the path, the reason, and a **Retry** button (FR-CONT-007).

### Props

| Prop   | Type    | Required | Default | Description                                                            |
| ------ | ------- | -------- | ------- | ---------------------------------------------------------------------- |
| `src`  | string  | yes      | —       | Module-relative path to the quiz JSON file. Trimmed before use.         |
| `pick` | integer | no       | —       | Overrides the quiz file's own `pick` (number of questions per attempt). Must be a positive integer. |

### Example

```markdown
::widget{type="quiz" src="practice-quiz.json" pick=5}
```

### Validation behaviour

`parseProps` (`src/widgets/quiz/index.ts`) errors:

- missing/empty `src` → `src: required string (module-relative quiz JSON path)`
- `pick` not a positive integer (zero, negative, decimal, or non-numeric) → `pick: must be a positive integer`

Screenshot: TODO

---

## `code-runner`

Learner-typed Python, executed in the **same Pyodide worker sandbox** as everything else (C-6, FR-PY-001) — never `eval`'d on the main thread (NFR-SEC-002). A CodeMirror 6 editor (lazy-loaded, NFR-PERF-001) plus a Run button; stdout/stderr and any traceback are shown in an output panel.

Runs use a 5 s **soft** timeout: if a run hasn't resolved by then, a "still running…" notice appears with a **Restart Python runtime** button (`PyHost.restart()`) — the primary recovery mechanism. `SharedArrayBuffer`-based interrupt is feature-detected and mentioned in the notice text when available, but is best-effort only; restart is what actually recovers a wedged worker.

If `solutionTest` is given, it runs (with its own 5 s soft timeout) immediately after a successful learner run; if it completes without raising, the widget shows a "✓ Complete" state and calls `onComplete`. The widget never imports `src/progress` (§3.5) — `onComplete` is a hook the app shell may wire to record progress later.

### Props

| Prop           | Type    | Required | Default    | Description                                                                 |
| -------------- | ------- | -------- | ---------- | ---------------------------------------------------------------------------- |
| `language`     | string  | yes      | —          | Must be `"python"` — v1 supports Python only.                                |
| `starter`      | string  | no       | —          | Initial editor contents.                                                     |
| `solutionTest` | string  | no       | —          | Python snippet run after a successful learner run; passing (no raise) marks the widget complete. |
| `rows`         | integer | no       | `10`       | Editor height in text rows. Must be a positive integer.                      |

### Example

```markdown
::widget{type="code-runner" language="python" starter="print('hello')" rows=8}
```

### Validation behaviour

`parseProps` (`src/widgets/code-runner/index.ts`) errors:

- `language` not exactly `"python"` → `language: must be "python" (v1 supports python only) — got <value>`
- non-string `starter`/`solutionTest` (when provided) → `<name>: must be a string if provided — got <value>`
- `rows` not a positive integer → `rows: must be a positive integer — got <value>`

Screenshot: TODO

---

## `step-reveal`

Multi-step worked-solution disclosure. Fetches a module-relative JSON file and reveals one step at a time via a real `<button>` ("Show next step"); each step's body renders as Markdown (no directives — same inline renderer used elsewhere, skipHtml applies). Once every step has been revealed, an `aria-live="polite"` note announces "All steps revealed" and the widget's root carries `data-step-reveal-complete="true"` — a visual/DOM completion signal only; the widget never imports `src/progress` (§3.5).

Data file shape: `{ "steps": [{ "title": "...", "body": "...markdown..." }, ... ] }` (non-empty array).

### Props

| Prop  | Type   | Required | Default | Description                                    |
| ----- | ------ | -------- | ------- | ----------------------------------------------- |
| `src` | string | yes      | —       | Module-relative path to the steps JSON file.     |

### Example

```markdown
::widget{type="step-reveal" src="steps/simplification.json"}
```

### Validation behaviour

`parseProps` (`src/widgets/step-reveal/index.ts`) errors:

- missing/empty `src` → `src: required — a path to a steps JSON file, e.g. src="steps/solution.json"`

At render time, a fetched file that doesn't match the shape above (not an object with a non-empty `steps` array of `{title, body}` objects) shows an inline error card naming the exact problem (e.g. `steps[2].title: must be a non-empty string`); a fetch failure shows a retry card (FR-CONT-007 spirit).

Screenshot: TODO

---

## `data-plot`

Static data chart (line, bar, or scatter) rendered with Recharts (lazy-loaded, NFR-PERF-001). Fetches a module-relative JSON file describing the chart.

Data file shape: `{ "kind": "line"|"bar"|"scatter", "series": [{ "name": "...", "points": [[x,y], ...] }, ...], "xLabel"?: "...", "yLabel"?: "..." }` (`series` non-empty; each series' `points` a non-empty array of finite `[x, y]` pairs).

### Props

| Prop  | Type   | Required | Default | Description                                     |
| ----- | ------ | -------- | ------- | ------------------------------------------------ |
| `src` | string | yes      | —       | Module-relative path to the chart JSON file.      |

### Example

```markdown
::widget{type="data-plot" src="data/growth.json"}
```

### Validation behaviour

`parseProps` (`src/widgets/data-plot/index.ts`) errors:

- missing/empty `src` → `src: required — a path to a chart JSON file, e.g. src="data/growth.json"`

At render time, a fetched file failing the shape above shows an inline error card naming the exact problem (e.g. `kind: must be "line", "bar" or "scatter" (got "pie")`, `series[0].points[2]: must be a pair of finite numbers [x, y]`); a fetch failure shows a retry card (FR-CONT-007 spirit).

Screenshot: TODO

---

## `flashcards`

Spaced-recall cards within a lesson: one card at a time, flip to reveal the back, then self-grade "Again" or "Good". Grades persist via the lesson's itemState (§5.5) so progress survives reloads — the widget never imports `src/progress` directly (§3.5); it goes through `LessonContext`'s `getItemState`/`setItemState` (D-012).

Data file shape:

```json
{
  "cards": [
    { "front": "What is **2 + 2**?", "back": "4" },
    { "front": "Capital of France?", "back": "Paris" }
  ]
}
```

`front` and `back` are Markdown strings (rendered via the same inline renderer used elsewhere — raw HTML is stripped). Both are required non-empty strings on every card, and `cards` must be a non-empty array.

### Props

| Prop  | Type   | Required | Default | Description                                    |
| ----- | ------ | -------- | ------- | ------------------------------------------------ |
| `src` | string | yes      | —       | Module-relative path to a cards JSON file.        |

### Example

```markdown
::widget{type="flashcards" src="cards/key-terms.json"}
```

### Validation behaviour

`parseProps` (`src/widgets/flashcards/index.ts`) errors:

- missing/empty `src` → `src: required — a path to a cards JSON file, e.g. src="cards/unit1.json"`

At render time, a fetched file that doesn't match the shape above (missing `cards`, an empty array, or a card missing `front`/`back`) shows an inline error card naming the exact problem (e.g. `cards[0].back: must be a non-empty string`); a fetch failure shows a retry card (FR-CONT-007 spirit).

**itemState note:** the widget's itemId is `` `flashcards:${src}` `` (D-012). Persisted state maps each card's index to its most recent grade: `{ [cardIndex]: { grade: "again" | "good", reviewedAt: <epoch ms> } }`. On mount, prior grades are restored and the session resumes on the first card not yet graded "good"; a "Graded X/N" indicator (counting "good" grades) is always shown. Once every card has been graded "good" the widget shows a "Deck complete" state with a "Review again" control that resets the browsing position without discarding stored grades.

**Review-queue note (§13 roadmap, D-021):** each grade is ALSO fed into the spaced-repetition review queue via `LessonContext.recordReview`, per-card (itemId `` `${itemId}:${cardIndex}` ``, distinct from the per-deck itemId above) — the SM-2-lite algorithm schedules when that specific card should resurface, independent of this deck's own linear per-session progress. See the `#/review` page.

Screenshot: TODO

---

## `matching-pairs`

A click/tap-to-select matching game: pick a term on the left, then its match on the right (or vice versa). Deliberately **not** HTML5 drag-and-drop (D-028) — native drag-and-drop isn't keyboard- or screen-reader-operable without substantial extra ARIA/live-region engineering, while click-to-select gets full keyboard/AT support for free from ordinary `<button>` semantics. Built on the shared game-widget kit (`src/widgets/game-kit/`) — see `docs/ARCHITECTURE.md` "Building a new game widget" if you're adding another one.

The right column's display order is shuffled, seeded on the widget's `src` (same determinism precedent as quiz question order, FR-QUIZ-002), so layout is stable across reloads and only reshuffles on an explicit "Play again". Unlike `flashcards`, this widget is **deliberately not persisted** via `LessonContext.getItemState`/`setItemState` — a matching game is meant to be replayed, not tracked for mastery, so the board simply resets each time the widget mounts. On completion it reports the milestone through `LessonContext.notifyEngagement({ kind: 'game-complete' })` — the widget never imports `src/progress` directly (§3.5).

Data file shape:

```json
{
  "title": "Match the terms",
  "instructions": "Select a term, then its definition.",
  "pairs": [
    { "left": "Derivative", "right": "Rate of change" },
    { "left": "Integral", "right": "Area under a curve" }
  ]
}
```

`title` and `instructions` are optional Markdown-lite strings (rendered via the same inline renderer used elsewhere — raw HTML is stripped); if `instructions` is omitted a default "Select a term, then its match." is shown. `pairs` is required, at least 2 entries, each a non-empty `{ left, right }` string pair.

### Props

| Prop  | Type   | Required | Default | Description                                       |
| ----- | ------ | -------- | ------- | --------------------------------------------------- |
| `src` | string | yes      | —       | Module-relative path to a matching-pairs JSON file.  |

### Example

```markdown
::widget{type="matching-pairs" src="cards/key-terms.json"}
```

### Validation behaviour

`parseProps` (`src/widgets/matching-pairs/index.ts`) errors:

- missing/empty `src` → `src: required — a path to a matching-pairs JSON file, e.g. src="cards/key-terms.json"`

At render time, a fetched file that doesn't match the shape above (missing `pairs`, fewer than 2 entries, or a pair missing `left`/`right`) shows an inline error card naming the exact problem (e.g. `pairs[0].right: must be a non-empty string`); a fetch failure shows a retry card (FR-CONT-007 spirit).

Screenshot: TODO

---

## `vector-field`

Plots a 2D vector field as a responsive SVG (up to 480×480, scaled to the aspect ratio of the plotted range, y-axis pointing **up** per maths convention). Two expressions, `fx(x,y)` and `fy(x,y)`, are compiled with the same mathjs `compile` used by `function-grapher` — nothing is ever `eval`'d (NFR-SEC-002) — and evaluated at every point of a `step`-spaced grid over `[xmin,xmax] × [ymin,ymax]`. Each grid point draws a small arrow whose direction comes from `(fx, fy)` at that point; arrow length is auto-normalized against the field's largest sampled magnitude so arrows never overlap regardless of the expressions' raw scale, then multiplied by `scale`. A point where `fx = fy = 0` (a critical point) renders as a small dot rather than a zero-length arrow. A point where evaluation throws (e.g. division by zero) or yields a non-finite number is simply skipped, leaving a gap in the grid rather than crashing the widget.

The generated plot has no text alternative of its own, so the `<svg>` carries `role="img"` and a descriptive `aria-label` summarising the field and range (NFR-A11Y-001).

### Props

| Prop    | Type    | Required | Default | Description                                                                                |
| ------- | ------- | -------- | ------- | -------------------------------------------------------------------------------------------- |
| `fx`    | string  | yes      | —       | Expression in `x`, `y` for the field's x-component, e.g. `"y"`. Parsed by mathjs `compile`.   |
| `fy`    | string  | yes      | —       | Expression in `x`, `y` for the field's y-component, e.g. `"-x"`. Parsed by mathjs `compile`.  |
| `xmin`  | number  | no       | `-5`    | Left edge of the x-range. Must be `< xmax`.                                                   |
| `xmax`  | number  | no       | `5`     | Right edge of the x-range.                                                                    |
| `ymin`  | number  | no       | `-5`    | Lower edge of the y-range. Must be `< ymax`.                                                  |
| `ymax`  | number  | no       | `5`     | Upper edge of the y-range.                                                                    |
| `step`  | number  | no       | `1`     | Grid spacing between arrows. Must be `> 0` and give at least a 2×2 grid on both axes.         |
| `scale` | number  | no       | `1`     | Visual arrow-length multiplier applied on top of the auto-normalized size. Must be `> 0`.     |
| `grid`  | boolean | no       | `true`  | Show the background gridlines.                                                                |

### Example

```markdown
::widget{type="vector-field" fx="y" fy="-x" xmin=-4 xmax=4 ymin=-4 ymax=4 step=0.5 scale=1.2}
```

### Validation behaviour

`parseProps` (`src/widgets/vector-field/index.ts`) collects all errors before failing:

- missing/empty `fx` → `fx: required — a non-empty expression in x, y, e.g. fx="y"`
- missing/empty `fy` → `fy: required — a non-empty expression in x, y, e.g. fy="-x"`
- non-finite `xmin`/`xmax`/`ymin`/`ymax`/`step`/`scale` → `<name>: must be a finite number (got <value>)`
- `xmin >= xmax` → `xmin: must be less than xmax (got xmin=<v>, xmax=<v>)`; same pattern for `ymin`/`ymax`
- `step <= 0` → `step: must be greater than 0 (got <value>)`
- `step` too coarse for the range → `step: too large — must give at least 2 grid points across x (got step=<v>, x range=<v>)` (and the y-axis equivalent)
- `scale <= 0` → `scale: must be greater than 0 (got <value>)`
- `grid` not `true`/`false` → `grid: must be true or false (got <value>)`

At render time, if every grid point fails to evaluate (e.g. an expression that compiles but always throws), an inline error state is shown instead of a blank plot.

Screenshot: TODO

---

## `geometry-canvas`

Interactive 2D geometry construction: points, lines and circles defined by a small JSON scene file, with `draggable` points that recompute any lines/circles defined in terms of them live. y-axis points up (maths convention, same as `vector-field`). Fetches a module-relative scene JSON file, resolved the same way as `flashcards`'s `src` prop.

Data file shape:

```json
{
  "bounds": { "xmin": -5, "xmax": 5, "ymin": -5, "ymax": 5 },
  "points": [
    { "id": "A", "x": 0, "y": 0, "label": "A", "draggable": true },
    { "id": "B", "x": 3, "y": 0, "label": "B", "draggable": true },
    { "id": "C", "x": 0, "y": 3, "draggable": false }
  ],
  "lines": [ { "from": "A", "to": "B" }, { "from": "B", "to": "C" }, { "from": "C", "to": "A" } ],
  "circles": [ { "center": "A", "throughPoint": "B" } ]
}
```

`bounds`: required, `xmin < xmax` and `ymin < ymax`. `points`: non-empty array; `id` unique non-empty string; `x`/`y` finite numbers; `label` optional non-empty string (defaults to `id`); `draggable` optional boolean (defaults to `false`). `lines`: optional array of `{ from, to }` referencing existing point ids. `circles`: optional array of `{ center, throughPoint }` referencing existing point ids — a circle's radius is the **live** distance from `center` to `throughPoint`, so dragging either point resizes/repositions it every render. Bounds are mapped to `width`×`height` pixels with a single uniform scale (not independent x/y stretch), letterboxed and centred, so circles always render as true circles regardless of the width/height aspect ratio.

### Props

| Prop     | Type   | Required | Default | Description                                            |
| -------- | ------ | -------- | ------- | -------------------------------------------------------- |
| `src`    | string | yes      | —       | Module-relative path to the geometry scene JSON file.    |
| `width`  | number | no       | `480`   | Rendered width in CSS pixels. Must be `> 0`.             |
| `height` | number | no       | `480`   | Rendered height in CSS pixels. Must be `> 0`.            |

### Example

```markdown
::widget{type="geometry-canvas" src="scenes/triangle.json" width=480 height=480}
```

### Validation behaviour

`parseProps` (`src/widgets/geometry-canvas/index.ts`) errors:

- missing/empty `src` → `src: required — a path to a geometry scene JSON file, e.g. src="scenes/triangle.json"`
- non-positive or non-numeric `width`/`height` → `<name>: must be a positive number of pixels (got <value>)`

At render time, a fetched file that doesn't match the scene shape above shows an inline error card naming the exact problem (e.g. `bounds: xmin must be less than xmax`, a duplicate point id, or a line/circle referencing an unknown point); a fetch failure shows a retry card (FR-CONT-007 spirit).

**Keyboard operability (NFR-A11Y-001):** every `draggable` point is a focusable control (an invisible HTML button overlaid on the purely-visual SVG, since SVG focus/ARIA support is inconsistent across browsers) with `aria-label` `` Point <label>, draggable, currently at (x, y) ``, draggable by pointer and nudgeable by arrow keys (step = 5% of the larger bounds axis), clamped to `bounds`. Non-draggable points render with no interactive control and never move.

Screenshot: TODO

---

---

## `truth-table`

Renders the full truth table for a boolean **expression string** typed by the content author — no circuit/diagram, no data file. This widget parses and evaluates a plain expression directly, e.g. `"A AND (B OR NOT C)"`.

Operators are a closed set, case-insensitive keywords: `AND`, `OR`, `NOT`, `XOR`, `NAND`, `NOR`, plus parentheses for grouping and `NOT` as a unary prefix. Variables are identifiers matching `[A-Z][A-Z0-9]*` (uppercase only — lowercase is rejected with a clear error). Precedence, tightest to loosest: `NOT` > `AND`/`NAND` > `XOR` > `OR`/`NOR`; all binary operators are 2-operand and left-associative (`A XOR B XOR C` = `(A XOR B) XOR C`). No `eval`/`new Function` (NFR-SEC-002 spirit) — a hand-written tokenizer, recursive-descent parser, and tree-walking evaluator.

The truth table shows all 2^N rows (variables capped at `maxInputs`, default 6 — row explosion beyond that). Row and column order follows the variables' first-appearance, left-to-right order in the expression via standard binary counting (the first variable encountered = most-significant bit). Columns are each variable (in that order) followed by a final "Result" column. Cells show `0`/`1`.

A real semantic `<table>` with `<th scope="col">` headers is the accessible representation of tabular data (NFR-A11Y-001) — no supplementary ARIA is needed.

### Props

| Prop        | Type    | Required | Default | Description                                                                        |
| ----------- | ------- | -------- | ------- | ------------------------------------------------------------------------------------ |
| `expr`      | string  | yes      | —       | Boolean expression, e.g. `"A AND (B OR NOT C)"`.                                     |
| `maxInputs` | integer | no       | `6`     | Safety cap on distinct variables (2^`maxInputs` rows). Must be a positive integer.    |

### Example

```markdown
::widget{type="truth-table" expr="A AND (B OR NOT C)"}
```

### Validation behaviour

`parseProps` (`src/widgets/truth-table/index.ts`) errors:

- missing/empty `expr` → `expr: required — a non-empty boolean expression, e.g. expr="A AND (B OR NOT C)"`
- `maxInputs` not a positive integer → `maxInputs: must be a positive integer — got <value>`

At render time, `expr` is parsed by `src/widgets/truth-table/expression.ts`; a malformed expression shows an inline error card naming the exact problem (e.g. an empty expression, an unbalanced parenthesis, an unknown token, a lowercase/invalid variable name, or more than `maxInputs` distinct variables).

Screenshot: TODO
