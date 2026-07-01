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

**itemState note:** the widget's itemId is `` `flashcards:${src}` `` (D-012). Persisted state maps each card's index to its most recent grade: `{ [cardIndex]: { grade: "again" | "good", reviewedAt: <epoch ms> } }`. On mount, prior grades are restored and the session resumes on the first card not yet graded "good"; a "Graded X/N" indicator (counting "good" grades) is always shown. Once every card has been graded "good" the widget shows a "Deck complete" state with a "Review again" control that resets the browsing position without discarding stored grades. This is a simple grade-tracking widget, not a spaced-repetition scheduler — SM-2-style scheduling is tracked separately on the roadmap (§13).

Screenshot: TODO
