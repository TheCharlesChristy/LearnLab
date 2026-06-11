# Python Items Guide (Tier 2)

> **Python items ship in P1; this document records the committed API contract.** The runtime (Pyodide worker), `learnsdk`, and `courselib` do not exist in the repository yet. Everything below marked **TODO(P1)** will be filled in when the implementation lands; the sections that are written in full (the package policy and the two reference examples) are already decided and normative per the SRS (§6).

A Python item is **one `.py` file** that defines a class named `Item` subclassing `learnsdk.LearningItem`. You write Python only — no JavaScript, no React, no knowledge of the worker protocol. The UI is declarative (Elm-style): you hold state, `render()` returns a component tree, event handlers mutate state, and the framework re-renders.

Items are embedded in lessons with the leaf directive (see [`AUTHORING.md`](AUTHORING.md)):

```markdown
::py{src="items/power-rule-quiz.py" params='{"questions": 4}'}
```

## Quickstart

TODO(P1) — the intended flow (FR-AUTH-002, FR-PYDX-001):

1. Scaffold: `npm run new:item -- --kind quiz|simulation|plot|blank` generates `items/<name>.py` from a template (templates match the reference examples below, including the `saved_state` guard).
2. Run `npm run dev` and open the lesson embedding the item. Edits to the `.py` file hot-reload the item in under 2 seconds.
3. Tracebacks render in the item's error card with real filenames/line numbers; `print()` output appears in the browser console prefixed `[py:<itemId>]`.

## API reference

### `LearningItem` — core API (§6.6)

The base class of every item: class-level configuration (`title`, `requires`, `wants_tick`, `tick_hz`), framework-injected fields (`params`, `saved_state`, `rng`, `item_id`), the lifecycle overrides (`setup`, `render`, `tick`, `get_state`), and the services you call (`update`, `persist`, `complete`, `log`).

Contract highlights (already fixed by the SRS):

- The file MUST define `class Item(learnsdk.LearningItem)` — that name is the entry point.
- Authors SHALL NOT define `__init__`; the framework owns construction (doing so is a load error).
- `setup()` SHALL restore from `self.saved_state` when it is not `None`.
- `render()` must be a pure function of item state (convention).
- `self.rng` is the only sanctioned randomness.

TODO(P1) — full signatures, parameter docs, and examples.

### Component library (§6.7)

Layout (`Column`, `Row`, `Card`, `Divider`, `Spacer`), display (`Text`, `Markdown`, `Math`, `Image`, `Alert`, `Table`, `CodeBlock`, `Badge`, `ProgressBar`), inputs (`Button`, `Slider`, `NumberInput`, `TextInput`, `Select`, `RadioGroup`, `Checkbox`, `CheckboxGroup`), and visualisation (`Plot`, `FunctionPlot`, `Canvas` + the eight `learnsdk.draw` command constructors).

TODO(P1) — per-component constructor signatures, events, and rendered appearance.

### Base item classes (§6.8)

`QuizItem` (generated/randomised quizzes — override `questions()`), `SimulationItem` (`wants_tick` preset with `start()/pause()/reset_sim()` and a standard transport row), `PlotExplorerItem` (slider-driven function plots from a `controls` list), and `MultiStepItem` (guided derivations; Should-priority).

TODO(P1) — behaviour details, question-type constructors (`MCQ`, `Multi`, `Numeric`, `TextAnswer`, `Expression`), and custom `check()` marking.

### Utility modules (§6.9)

`learnsdk.checking` (`approx`, `sig_figs`, `within`, `vector_equal`, `sympy_equiv`, `Result`), `learnsdk.rand` (`derive_rng`, `nice_numbers`), and `courselib` (shared domain helpers for maths/physics/cs/ai that grow with the content).

TODO(P1) — full signatures and examples.

### State persistence (§6.10)

Persistence is opt-in: override `get_state()` (return a JSON-safe dict) and call `self.persist()`; the framework also flushes automatically on page hide/unmount. `saved_state` round-trips through JSON (lists come back, tuples do not). State versioning is the author's concern — templates include `{"_v": 1}` and a guard.

TODO(P1) — worked persistence guide with the JSON round-trip gotchas spelled out.

## Worked examples (normative — §6.13)

These two items ship in the repo as templates and are the reference for the scaffolder. They are reproduced verbatim from the SRS.

**(a) Generated quiz, ~30 lines** — `items/power-rule-quiz.py`:

```python
from learnsdk import QuizItem, Numeric, MCQ

class Item(QuizItem):
    title = "Check: the power rule"
    pass_mark = 0.75

    def questions(self):
        qs = []
        for _ in range(self.params.get("questions", 4)):
            a = self.rng.randint(2, 9)
            n = self.rng.randint(2, 5)
            x0 = self.rng.randint(1, 3)
            qs.append(Numeric(
                text=f"If $f(x) = {a}x^{{{n}}}$, find $f'({x0})$.",
                answer=a * n * x0 ** (n - 1),
                tolerance=0.01,
                explanation=(f"$f'(x) = {a*n}x^{{{n-1}}}$, so "
                             f"$f'({x0}) = {a*n*x0**(n-1)}$."),
            ))
        qs.append(MCQ(
            text="The derivative of a constant is…",
            choices=["undefined", "the constant itself", "0", "1"],
            answer=2,
            explanation="A constant doesn't change, so its rate of change is 0.",
        ))
        return qs
```

**(b) Canvas simulation with state** — `items/projectile.py`:

```python
import math
from learnsdk import (SimulationItem, Column, Row, Slider, Button,
                      Canvas, Text, draw)
from courselib.physics import G

W, H, SCALE = 640, 320, 6  # px, px, px per metre

class Item(SimulationItem):
    title = "Projectile motion"
    tick_hz = 30

    def setup(self):
        s = self.saved_state or {}
        self.angle = s.get("angle", self.params.get("angle", 45))
        self.speed = s.get("speed", 20.0)
        self.best_range = s.get("best_range", 0.0)
        self.path: list[tuple[float, float]] = []
        self.sim_time = 0.0

    def get_state(self):
        return {"_v": 1, "angle": self.angle, "speed": self.speed,
                "best_range": self.best_range}

    def launch(self, _=None):
        self.path, self.sim_time = [], 0.0
        self.start()

    def tick(self, dt):
        self.sim_time += dt
        vx = self.speed * math.cos(math.radians(self.angle))
        vy = self.speed * math.sin(math.radians(self.angle))
        x = vx * self.sim_time
        y = vy * self.sim_time - 0.5 * G * self.sim_time ** 2
        if y < 0:
            self.pause()
            self.best_range = max(self.best_range, x)
            self.persist()
            self.complete()
        else:
            self.path.append((x, y))

    def render(self):
        cmds = [draw.clear("#0b1220"), draw.grid(SCALE * 5),
                draw.line(0, H - 1, W, H - 1, "#475569", 2)]
        for x, y in self.path:
            cmds.append(draw.circle(x * SCALE, H - y * SCALE, 2, fill="#7dd3fc"))
        return Column(
            Row(
                Slider("Angle (°)", 10, 80, 1, self.angle,
                       on_change=lambda v: setattr(self, "angle", v)),
                Slider("Speed (m/s)", 5, 40, 1, self.speed,
                       on_change=lambda v: setattr(self, "speed", v)),
                Button("Launch", on_click=self.launch),
                Button("Reset", on_click=lambda _: self.setup(), kind="secondary"),
            ),
            Canvas(W, H, cmds),
            Text(f"t = {self.sim_time:.2f} s   ·   best range: "
                 f"{self.best_range:.1f} m", mono=True),
        )
```

## Persistence guide

TODO(P1) — full guide. The contract (§6.10): persist iff you override `get_state()` and call `self.persist()`; automatic flush on `visibilitychange`/unmount; `saved_state` is exactly what `get_state()` returned, after a JSON round trip; version your state dict.

## Package policy (§6.11 — decided)

- Items declare package needs via the class attribute `requires`, e.g. `requires = ["numpy"]`. Any package shipped in the pinned Pyodide distribution is available on demand this way.
- **Blessed and documented:** `numpy` and `sympy`. These are the only packages content may use without further approval.
- Any other Pyodide-shipped package needs **maintainer sign-off** (a size/cold-start review) before use, and the decision is recorded here:

  | Package | Status  | Decision / notes        |
  | ------- | ------- | ----------------------- |
  | numpy   | Blessed | Core numeric workhorse. |
  | sympy   | Blessed | Symbolic marking (`Expression` questions, `sympy_equiv`). |

- **micropip and any runtime network installs are PROHIBITED.** They would break the offline guarantee (FR-PWA-003) and the CSP (NFR-SEC-001).
- `learnsdk` itself depends only on the Python standard library.

## Troubleshooting

TODO(P1) — the top-10 expected errors and fixes (FR-PYDX-004). Skeleton:

| Symptom | Likely cause | Fix |
| ------- | ------------ | --- |
| "load error: file must define class Item(LearningItem)" | Wrong class name or missing subclass | TODO(P1) |
| "load error: Item defines __init__" | Author-defined constructor | TODO(P1) — move initialisation to `setup()` |
| `SerializationError` naming a prop/path | Non-JSON-safe value in the render tree | TODO(P1) |
| Item stuck on "Loading Python runtime…" | Pyodide CDN unreachable / unsupported browser | TODO(P1) |
| State not restored after reload | `get_state()` not overridden or `saved_state` ignored in `setup()` | TODO(P1) |
| TODO(P1) | TODO(P1) | TODO(P1) |

## SDK versioning

`learnsdk` is semver'd (`learnsdk.__version__`). Breaking API changes require a major version bump **plus a migration note in this file** (§6.1). No migrations yet.
