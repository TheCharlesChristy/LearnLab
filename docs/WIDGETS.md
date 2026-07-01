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

## Widgets planned but not yet implemented

The SRS §5.3 v1 widget set also schedules `logic-gate-sim` and `flashcards` (Should, P2). These are **TODO(P2)** — they do not exist in the registry yet and will gain sections here when they land.
