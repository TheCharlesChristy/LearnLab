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

## `logic-gate-sim`

Interactive AND/OR/NOT/XOR/NAND/NOR circuit simulator. Fetches a module-relative JSON file describing input pins, gates, and declared outputs; renders one toggle per input, live gate/output values that update immediately on every toggle (no reload), and a truth-table side panel covering every input combination.

Gate type is a **closed set** — `AND`, `OR`, `NOT`, `XOR`, `NAND`, `NOR` — any other value is a malformed-file error. A gate's `inputs` array may reference only input pin names or an **earlier** gate's `id` (array order = evaluation order), which makes the circuit acyclic by construction; a gate referencing a later gate, itself, or an unknown name is a malformed-file error caught at load time, not at click time. (§5.3 describes the source as "circuit JSON: nodes, wires" illustratively — the actual field names are `inputs`/`gates`/`outputs` as shown below.)

Data file shape:

```json
{
  "inputs": ["A", "B"],
  "gates": [
    { "id": "g1", "type": "AND", "inputs": ["A", "B"] },
    { "id": "g2", "type": "NOT", "inputs": ["g1"] }
  ],
  "outputs": ["g2"]
}
```

`inputs`: non-empty array of unique pin name strings. `gates`: non-empty array; `type` one of the six above; `inputs` has exactly 1 reference for `NOT`, exactly 2 for all others. `outputs`: non-empty array of gate ids or input names whose live values are displayed and used for the truth table.

The truth table shows all 2^N rows (inputs capped at 6 — beyond that a message is shown instead of the table). Row and column order follows the `inputs` array order via standard binary counting (`inputs[0]` = most-significant bit): for `["A","B"]` the rows are `00, 01, 10, 11`. Columns are all input columns (in `inputs` order) followed by all output columns (in `outputs` order). The row matching the current live toggle state is visually highlighted.

Toggles are real `role="switch"` elements — keyboard-operable, with visible focus and `prefers-reduced-motion`-aware transitions (NFR-A11Y-001).

### Props

| Prop  | Type   | Required | Default | Description                                       |
| ----- | ------ | -------- | ------- | -------------------------------------------------- |
| `src` | string | yes      | —       | Module-relative path to the circuit JSON file.      |

### Example

```markdown
::widget{type="logic-gate-sim" src="circuits/xor-from-primitives.json"}
```

### Validation behaviour

`parseProps` (`src/widgets/logic-gate-sim/index.ts`) errors:

- missing/empty `src` → `src: required — a path to a circuit JSON file, e.g. src="circuits/and-or.json"`

At render time, a fetched file that doesn't match the shape above shows an inline error card naming the exact problem, e.g. `gates[1].type: must be one of AND, OR, NOT, XOR, NAND, NOR (got "MAYBE")`, `gates[0].inputs[1]: references unknown pin/gate "x1"`, or `gates[0].inputs: NOT requires exactly 1 input (got 2)`. A fetch failure shows a retry card (FR-CONT-007 spirit).

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

Interactive 2D geometry construction: points, lines and circles defined by a small JSON scene file, with `draggable` points that recompute any lines/circles defined in terms of them live. y-axis points up (maths convention, same as `vector-field`). Fetches a module-relative scene JSON file, resolved the same way as `flashcards`'/`logic-gate-sim`'s `src` prop.

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

## `circuit-sim`

A simple analog DC circuit calculator: one voltage source plus resistors wired in series and/or parallel, computing and displaying the current through and voltage across each resistor via Ohm's law, plus total circuit resistance and current. This is the analog counterpart to `logic-gate-sim`'s digital gate circuits — deliberately restricted to a series/parallel **tree** (not a general SPICE-like solver), so the maths stays exact and unambiguous.

Data file shape (a recursive tree: a `"series"`/`"parallel"` node's `elements` are either resistor leaves or further nested `"series"`/`"parallel"` nodes):

```json
{
  "voltage": 12,
  "circuit": {
    "type": "series",
    "elements": [
      { "type": "resistor", "id": "R1", "ohms": 10 },
      {
        "type": "parallel",
        "elements": [
          { "type": "resistor", "id": "R2", "ohms": 20 },
          { "type": "resistor", "id": "R3", "ohms": 30 }
        ]
      }
    ]
  }
}
```

`voltage`: required, `> 0`. Every resistor `id` must be a non-empty string, unique across the whole tree; `ohms > 0`; at least one resistor must exist in the circuit. A `"series"` node's combined resistance is the sum of its elements' combined resistances (recursively); a `"parallel"` node's is `1 / Σ(1/Rᵢ)` (recursively). Current is constant along a series path; a parallel group's branches all drop the same voltage (`incomingCurrent × combinedResistanceOfGroup`) and each branch's current is that voltage divided by the branch's own combined resistance. For the example above (V=12V): total resistance = 10 + 1/(1/20+1/30) = 22 Ω, total current ≈ 0.545 A (flowing entirely through R1); the parallel group drops ≈6.545 V, giving I(R2) ≈ 0.327 A and I(R3) ≈ 0.218 A (summing back to ≈0.545 A, as current conservation requires).

### Props

| Prop  | Type   | Required | Default | Description                                    |
| ----- | ------ | -------- | ------- | ------------------------------------------------ |
| `src` | string | yes      | —       | Module-relative path to a circuit JSON file.      |

### Example

```markdown
::widget{type="circuit-sim" src="circuits/series-parallel.json"}
```

### Validation behaviour

`parseProps` (`src/widgets/circuit-sim/index.ts`) errors:

- missing/empty `src` → `src: required — a path to a circuit JSON file, e.g. src="circuits/series-parallel.json"`

At render time, a fetched file that doesn't match the shape above shows an inline error card naming the exact problem (e.g. a non-positive `voltage`, a duplicate resistor id, an invalid node `type`, or an `elements` array that isn't a non-empty array); a fetch failure shows a retry card (FR-CONT-007 spirit). The results table (resistor id, ohms, current, voltage, plus a total-resistance/total-current summary line) is a real `<table>` with `<th>` headers (NFR-A11Y-001); an accompanying schematic-style diagram carries `role="img"` with a summarising `aria-label` (e.g. "R1 in series with R2 parallel R3").

Screenshot: TODO

---

## `truth-table`

Renders the full truth table for a boolean **expression string** typed by the content author — no circuit/diagram, no data file. Complementary to `logic-gate-sim` (which derives its truth table from a wired circuit JSON of gates and connections): this widget parses and evaluates a plain expression directly, e.g. `"A AND (B OR NOT C)"`.

Operators are a closed set, case-insensitive keywords, reusing `logic-gate-sim`'s gate vocabulary: `AND`, `OR`, `NOT`, `XOR`, `NAND`, `NOR`, plus parentheses for grouping and `NOT` as a unary prefix. Variables are identifiers matching `[A-Z][A-Z0-9]*` (uppercase only — lowercase is rejected with a clear error). Precedence, tightest to loosest: `NOT` > `AND`/`NAND` > `XOR` > `OR`/`NOR`; all binary operators are 2-operand and left-associative (`A XOR B XOR C` = `(A XOR B) XOR C`). No `eval`/`new Function` (NFR-SEC-002 spirit, same rationale as `logic-gate-sim`'s closed gate set) — a hand-written tokenizer, recursive-descent parser, and tree-walking evaluator.

The truth table shows all 2^N rows (variables capped at `maxInputs`, default 6 — mirrors `logic-gate-sim`'s own cap and rationale: row explosion beyond that). Row and column order follows the variables' first-appearance, left-to-right order in the expression via standard binary counting (the first variable encountered = most-significant bit) — the same convention as `logic-gate-sim`'s truth table. Columns are each variable (in that order) followed by a final "Result" column. Cells show `0`/`1`, matching `logic-gate-sim`'s convention.

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

---

## `eigen-playground`

Interactive eigen-decomposition of a symmetric 2x2 matrix `[[a,b],[b,c]]` (a covariance-matrix shape). `a` and `c` are fixed per-instance (the axis variances); the learner drags a single scalar `b` (the off-diagonal/covariance term) along a slider and watches the principal eigenvector's angle, both eigenvalues, and the 1-standard-deviation ellipse update live. Solved in closed form (the exact formula for a symmetric 2x2 matrix) — no iterative eigensolver (NFR-PERF-001). The `b` handle is a focusable `role="slider"`, draggable by pointer and movable with arrow keys, mirroring `function-grapher`'s tangent-point pattern; the angle/eigenvalue readout lives in an `aria-live` region (NFR-A11Y-001).

### Props

| Prop         | Type    | Required | Default              | Description                                                                 |
| ------------ | ------- | -------- | --------------------- | ---------------------------------------------------------------------------- |
| `a`          | number  | no       | `2`                    | Fixed variance along x (diagonal entry). Must be `> 0`.                      |
| `c`          | number  | no       | `1`                    | Fixed variance along y (diagonal entry). Must be `> 0`.                      |
| `bMin`       | number  | no       | `-1.5`                 | Lower bound of the draggable off-diagonal term `b`. Must be `< bMax`.        |
| `bMax`       | number  | no       | `1.5`                  | Upper bound of the draggable off-diagonal term `b`.                          |
| `bInit`      | number  | no       | midpoint of `[bMin,bMax]` | Starting value of `b`. Must lie within `[bMin, bMax]`.                    |
| `showPoints` | boolean | no       | `true`                 | Show a scatter cloud of sample points drawn from the implied covariance.     |

### Example

```markdown
::widget{type="eigen-playground" a=2 c=1 bMin=-1.3 bMax=1.3 bInit=0}
```

### Validation behaviour

`parseProps` (`src/widgets/eigen-playground/index.ts`) collects **all** errors before failing:

- non-numeric `a`/`c`/`bMin`/`bMax`/`bInit` → `<name>: must be a finite number (got <value>)`
- `a <= 0` or `c <= 0` → `<name>: must be greater than 0 (got <value>)`
- `bMin >= bMax` → `bMin: must be less than bMax (got bMin=…, bMax=…)`
- `bInit` outside `[bMin, bMax]` → `bInit: must be within [bMin, bMax] (got bInit=…, range=[…, …])`

At render time, a `b` value that makes the matrix indefinite (`a·c < b²`, not a valid covariance matrix) shows the slider readout naming the problem instead of drawing the ellipse/eigenvectors — authors should choose `bMin`/`bMax` inside `(-√(a·c), √(a·c))` so every reachable position stays valid.

Screenshot: TODO

---

## `signal-scope`

Time-domain + frequency-domain signal viewer. Samples a mathjs-compiled expression in `t` (seconds) and a learner-adjustable parameter `f` (e.g. a hidden carrier frequency), optionally adds deterministic pseudo-random Gaussian noise, and renders the waveform alongside its magnitude spectrum. The spectrum is computed with an in-repo iterative radix-2 FFT (the sampled window is zero-padded to the next power of two) — no new runtime dependency (NFR-PERF-001). The `f` handle is a focusable `role="slider"`, draggable by pointer and movable with arrow keys, mirroring `function-grapher`'s tangent-point pattern; the frequency/spectral-peak readout lives in an `aria-live` region (NFR-A11Y-001).

### Props

| Prop            | Type    | Required | Default                  | Description                                                                    |
| --------------- | ------- | -------- | -------------------------- | --------------------------------------------------------------------------------- |
| `expr`          | string  | yes      | —                          | Expression in `t` and `f`, e.g. `"sin(2*pi*f*t)"`. Parsed by mathjs `compile`.     |
| `sampleRate`    | number  | no       | `64`                        | Samples per second. Must be `> 0`.                                                |
| `duration`      | number  | no       | `4`                         | Window length in seconds. Must be `> 0`.                                          |
| `noiseAmount`   | number  | no       | `0`                         | Standard deviation of additive Gaussian noise (`0` = none). Must be `>= 0`.       |
| `freqMin`       | number  | no       | `0.5`                       | Lower bound of the draggable frequency parameter `f`. Must be `< freqMax`.        |
| `freqMax`       | number  | no       | `8`                         | Upper bound of the draggable frequency parameter `f`.                            |
| `freqInit`      | number  | no       | midpoint of `[freqMin,freqMax]` | Starting value of `f`. Must lie within `[freqMin, freqMax]`.               |
| `showSpectrum`  | boolean | no       | `true`                      | Show the magnitude-spectrum panel alongside the waveform.                        |

### Example

```markdown
::widget{type="signal-scope" expr="sin(2*pi*f*t)" sampleRate=64 duration=4 noiseAmount=0.6 freqMin=0.5 freqMax=8}
```

### Validation behaviour

`parseProps` (`src/widgets/signal-scope/index.ts`) collects **all** errors before failing:

- missing/empty `expr` → `expr: required — a non-empty expression in t and f, e.g. expr="sin(2*pi*f*t)"`
- non-numeric numeric props → `<name>: must be a finite number (got <value>)`
- `sampleRate <= 0` / `duration <= 0` → `<name>: must be greater than 0 (got <value>)`
- `noiseAmount < 0` → `noiseAmount: must be zero or greater (got <value>)`
- `freqMin >= freqMax` → `freqMin: must be less than freqMax (got freqMin=…, freqMax=…)`
- `freqInit` outside `[freqMin, freqMax]` → `freqInit: must be within [freqMin, freqMax] (got freqInit=…, range=[…, …])`

An `expr` that passes the prop guard but fails to compile, or never evaluates to a number across the sampled window, renders an inline error card naming the expression at render time.

Screenshot: TODO
