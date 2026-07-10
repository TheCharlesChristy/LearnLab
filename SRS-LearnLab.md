# Software Requirements Specification

## LearnLab — Interactive Engineering Learning Platform

|Field        |Value                                                                                |
|-------------|-------------------------------------------------------------------------------------|
|Document     |SRS-LearnLab                                                                         |
|Version      |1.0                                                                                  |
|Status       |Draft for implementation                                                             |
|Date         |2026-06-11                                                                           |
|Owner        |Charles (Product Owner / Maintainer)                                                 |
|Working title|**LearnLab** (rename is a find-and-replace; see §10.2 for the single config constant)|

**Requirement language.** The key words SHALL, SHALL NOT, SHOULD, SHOULD NOT, and MAY are to be interpreted as in RFC 2119. Every numbered requirement (`FR-*`, `NFR-*`, `AC-*`) is individually testable. Priorities use MoSCoW: **M** (Must, MVP), **S** (Should, post-MVP), **C** (Could, roadmap).

-----

## 1. Introduction

### 1.1 Purpose

This document is the complete, unambiguous specification for **LearnLab**: a static, client-only web application hosted on GitHub Pages that provides an interactive learning environment for engineers. It is written so that a developer (human or AI coding agent) can implement the system from this document alone, without further product decisions.

### 1.2 Scope

LearnLab:

1. Serves structured courses → modules → lessons with rich interactive content.
1. Provides **two authoring tiers** for new learning content:
- **Tier 1 (declarative):** Markdown lessons + JSON quizzes embedding pre-built native widgets. No programming required.
- **Tier 2 (Python):** bespoke interactive learning items written as single Python files against a stable Python SDK (`learnsdk`), executed in-browser via Pyodide (WebAssembly). No JavaScript required.
1. Stores all learner progress locally in the browser (IndexedDB), with JSON export/import. There is **no backend, no accounts, no telemetry**.
1. Ships with initial course content up to and including A-level standard in **Mathematics, Physics, Computer Science, and AI**, plus a postgrad-level elective in **Signal Processing**.
1. Includes complete in-repo authoring documentation and scaffolding tooling so that adding content requires **zero changes to application source code**.

Out of scope for v1: user accounts, server-side sync, multi-user features, analytics, native mobile apps, internationalisation (English only). See §13.

### 1.3 Definitions and abbreviations

|Term            |Definition                                                                                                                                                           |
|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|Course          |A coherent programme of study in one subject at one level (e.g. *A-level Pure Mathematics*).                                                                         |
|Module          |A self-contained topic within a course (e.g. *Differentiation I*). The unit of progress tracking and prerequisites.                                                  |
|Lesson          |A single page of teaching content within a module. Markdown (default) or a full-page Python item.                                                                    |
|Item            |An interactive element embedded in a lesson: either a **native widget** (built into the app in TypeScript/React) or a **Python item** (a `.py` file run via Pyodide).|
|Native widget   |A React component registered in the widget registry, invoked from Markdown via a directive.                                                                          |
|Python item     |A Python class (`Item`, subclassing `learnsdk.LearningItem`) defining UI declaratively and handling events; rendered by the host.                                    |
|`learnsdk`      |The stable, versioned Python SDK package providing the item framework, component library, and utilities.                                                             |
|`courselib`     |A shared Python package of domain helpers (maths/physics/CS/AI) that content authors grow over time.                                                                 |
|Host            |The TypeScript/React application running on the main thread.                                                                                                         |
|Runtime / Worker|The Web Worker running Pyodide and all Python code.                                                                                                                  |
|Component tree  |The JSON-serialisable UI description produced by a Python item’s `render()` and rendered by the host.                                                                |
|Pyodide         |CPython compiled to WebAssembly, running in the browser.                                                                                                             |
|MVC (content)   |Minimum Viable Content — the floor of lessons/items/quizzes a module must contain (§8.6).                                                                            |

### 1.4 References

- Pyodide documentation: <https://pyodide.org/en/stable/>
- remark-directive syntax: <https://github.com/remarkjs/remark-directive>
- KaTeX: <https://katex.org/>
- Dexie.js: <https://dexie.org/>
- WCAG 2.1: <https://www.w3.org/TR/WCAG21/>
- Prior art (architecture baseline): the owner’s *Finesse* PWA (React 19 + Vite + Tailwind 4 + Dexie + GitHub Pages).

### 1.5 Document overview

§2 describes the product context and constraints. §3 fixes the architecture and repository layout. §4 specifies the content model and every schema. §5 lists functional requirements per subsystem. §6 fully specifies the Python item framework (runtime, protocol, SDK API). §7 specifies authoring tooling and documentation. §8 specifies the initial content. §9 lists non-functional requirements. §10 specifies build/CI/deployment. §11 testing. §12 acceptance criteria. §13 roadmap and exclusions.

-----

## 2. Overall Description

### 2.1 Product perspective

A self-contained single-page application (SPA). All assets — application code, course content, the Python SDK bundle, and (optionally) the Pyodide runtime — are static files served by GitHub Pages. The browser is the entire execution environment. The system is a successor in architecture to the owner’s Finesse app and deliberately reuses its proven stack.

### 2.2 User classes

|Class              |Description                                                                      |Needs                                                                                        |
|-------------------|---------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
|**Learner**        |An engineer (or student) consuming content. No assumed setup; any modern browser.|Fast navigation, clear progress, working offline after first visit, never loses progress.    |
|**Content author** |Writes Tier-1 content (Markdown + JSON). May be non-programmer.                  |Copy-paste scaffolds, a complete widget catalogue, validation that fails loudly before merge.|
|**Item developer** |Writes Tier-2 Python items. Knows Python; need not know JS/React.                |Stable `learnsdk` API, live-reload dev loop, visible tracebacks, shared `courselib` helpers. |
|**Core maintainer**|Maintains the host app, widget registry, SDK, CI.                                |Strict typing, tests, schema validation, documented extension points.                        |

### 2.3 Operating environment

- **Hosting:** GitHub Pages, project site (served under `https://<user>.github.io/<repo>/`). HTTPS only.
- **Browsers (supported matrix):** latest 2 stable versions of Chrome, Edge, Firefox, Safari; iOS Safari ≥ 17. WebAssembly and Web Workers are hard requirements for Python items; the app SHALL detect absence and show a non-blocking banner (Tier-1 content still works).
- **No server-side code of any kind.** No environment variables at runtime; all configuration is build-time.

### 2.4 Design constraints

|ID |Constraint                                                                                                                                                                                                                                                      |
|---|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|C-1|Static hosting only. No APIs, no databases, no auth. All dynamic behaviour is client-side.                                                                                                                                                                      |
|C-2|GitHub repository limits: keep repo well under 1 GB; no single file ≥ 100 MB. Consequence: the Pyodide runtime is loaded from CDN by default (§6.2.4), not vendored.                                                                                            |
|C-3|SPA routing on GitHub Pages SHALL use hash-based routing (`HashRouter`). No 404-redirect hacks.                                                                                                                                                                 |
|C-4|All learner data SHALL remain on-device (IndexedDB). The app SHALL make no network requests except to its own origin and the pinned Pyodide CDN.                                                                                                                |
|C-5|Adding or editing content SHALL never require changes under `src/`. This is the central architectural invariant (verified by AC-01).                                                                                                                            |
|C-6|Python items are **trusted, repo-vetted content** (merged via PR review). They are not arbitrary user uploads. The user-facing code-runner widget (§5.3) is the only place untrusted (learner-typed) code runs, and it runs in the same DOM-less worker sandbox.|

### 2.5 Assumptions and dependencies

- A-1: Learners on iOS/Safari accept the higher Pyodide cold-start cost; Tier-1 content carries no such cost.
- A-2: Pyodide CDN (jsDelivr) availability is acceptable; the service worker caches it after first load (§5.9), and self-hosting remains a documented fallback (§10.4).
- A-3: Content quality control happens through Git PR review; no in-app moderation is needed.

-----

## 3. System Architecture

### 3.1 High-level view

```
┌────────────────────────────────────────────────────────────────────┐
│ Browser                                                            │
│                                                                    │
│  ┌──────────────────────────────┐   postMessage    ┌─────────────┐ │
│  │ Host (main thread)           │◄────────────────►│ Python      │ │
│  │ React 19 SPA                 │  JSON protocol    │ Worker      │ │
│  │ • Router / shell             │  (§6.3)           │ • Pyodide   │ │
│  │ • Content loader (+Ajv)      │                   │ • learnsdk  │ │
│  │ • Markdown renderer          │                   │ • courselib │ │
│  │ • Native widget registry     │                   │ • Item code │ │
│  │ • Python tree renderer       │                   └─────────────┘ │
│  │ • Quiz engine                │                                   │
│  │ • Progress store (Dexie)     │      ┌──────────────────────────┐ │
│  └───────────┬──────────────────┘      │ Service worker (PWA)     │ │
│              │                          │ • app shell precache     │ │
│        IndexedDB                        │ • content SWR cache      │ │
│   (moduleState, lessonProgress,         │ • pyodide cache-first    │ │
│    attempts, itemState, kv)             └──────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
            ▲ static fetch (same origin)
┌───────────┴───────────────────────────────┐   ┌─────────────────────┐
│ GitHub Pages                              │   │ jsDelivr CDN        │
│ /assets (app)  /content/** (courses)      │   │ pyodide vX.Y.Z      │
│ /python-bundle.zip (learnsdk+courselib)   │   │ + numpy, sympy whls │
└───────────────────────────────────────────┘   └─────────────────────┘
```

### 3.2 Technology stack (fixed)

|Concern                |Choice                                                                                                      |Notes                                                       |
|-----------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
|UI framework           |React 19.x                                                                                                  |Function components + hooks only.                           |
|Build                  |Vite (latest stable, pinned in lockfile)                                                                    |`base` set from one constant (§10.2).                       |
|Language               |TypeScript, `strict: true`                                                                                  |No `any` outside `src/python/bridge` boundary guards.       |
|Styling                |Tailwind CSS 4                                                                                              |Design tokens in `@theme`; dark mode `class` strategy.      |
|Routing                |react-router v7, `createHashRouter`                                                                         |C-3.                                                        |
|Markdown               |`react-markdown` + `remark-gfm` + `remark-math` + `remark-directive` + `remark-frontmatter` + `rehype-katex`|Directive handling per §4.5.                                |
|Maths rendering        |KaTeX (CSS bundled)                                                                                         |`output: 'htmlAndMathml'` for accessibility.                |
|Local DB               |Dexie 4 (IndexedDB)                                                                                         |Schema §5.5.                                                |
|Schema validation      |Ajv 8 + JSON Schema draft 2020-12                                                                           |Same schemas in CI and (dev-mode) runtime.                  |
|Python runtime         |Pyodide, exact version pinned in `src/config.ts` (≥ 0.27)                                                   |CPython 3.12 line; loaded in a dedicated Web Worker.        |
|Python packages        |numpy, sympy via `pyodide.loadPackage`, on demand                                                           |§6.11.                                                      |
|PWA                    |`vite-plugin-pwa` (Workbox)                                                                                 |§5.9.                                                       |
|State management       |React context + hooks only                                                                                  |No Redux/Zustand; Dexie `liveQuery` via `dexie-react-hooks`.|
|Charts (native widgets)|Recharts (data plots) + custom SVG/canvas (function grapher, sims)                                          |Recharts already familiar from Finesse.                     |
|Icons                  |lucide-react                                                                                                |                                                            |
|Tests                  |Vitest + React Testing Library; Playwright (e2e); pytest (Python)                                           |§11.                                                        |
|Lint/format            |ESLint + Prettier (TS); ruff + ruff-format (Python)                                                         |CI-enforced.                                                |

### 3.3 Repository layout (normative)

```
learnlab/
├── .github/workflows/
│   ├── ci.yml                  # lint, typecheck, tests, content validation
│   └── deploy.yml              # build + deploy to GitHub Pages
├── public/
│   └── content/                # ALL course content lives here, shipped verbatim
│       ├── maths/
│       │   └── alevel-pure/            # one course
│       │       ├── course.json
│       │       └── differentiation-1/  # one module
│       │           ├── module.json
│       │           ├── 01-power-rule.md
│       │           ├── 02-tangents.md
│       │           ├── assessment.json
│       │           └── items/
│       │               └── power-rule-quiz.py
│       ├── physics/ …
│       ├── cs/ …
│       └── ai/ …
├── python/
│   ├── learnsdk/               # the SDK package (§6.5–6.10)
│   │   ├── __init__.py
│   │   ├── item.py             # LearningItem + lifecycle
│   │   ├── components.py       # component classes
│   │   ├── draw.py             # canvas command helpers
│   │   ├── quiz.py             # QuizItem + question types
│   │   ├── simulation.py       # SimulationItem
│   │   ├── plot.py             # PlotExplorerItem
│   │   ├── checking.py         # answer-checking utilities
│   │   ├── rand.py             # seeded randomness
│   │   └── _bridge.py          # worker-side protocol glue (private)
│   ├── courselib/              # shared domain helpers, grows with content
│   │   ├── __init__.py
│   │   ├── maths.py
│   │   ├── physics.py
│   │   ├── cs.py
│   │   └── ai.py
│   └── tests/                  # pytest for learnsdk + courselib (CPython)
├── schemas/                    # JSON Schemas (draft 2020-12), single source of truth
│   ├── course.schema.json
│   ├── module.schema.json
│   ├── quiz.schema.json
│   └── content-index.schema.json
├── scripts/
│   ├── build-content.mjs       # generates public/content/index.json + validates everything
│   ├── new-module.mjs          # interactive scaffolder (npm run new:module)
│   ├── new-item.mjs            # scaffolds a Python item (npm run new:item)
│   └── build-python-bundle.mjs # zips python/{learnsdk,courselib} → public/python-bundle.zip
├── src/
│   ├── config.ts               # APP_NAME, BASE_PATH, PYODIDE_VERSION, PYODIDE_BASE_URL
│   ├── app/                    # shell: routes, layout, nav, theme, error boundaries
│   ├── content/                # index/course/module loaders, Ajv guards, types
│   ├── markdown/               # MarkdownLesson renderer + directive → widget mapping
│   ├── widgets/                # native widgets + registry.ts
│   ├── quiz/                   # native quiz engine (renders quiz.json)
│   ├── python/                 # PyHost: worker mgmt, protocol types, TreeRenderer
│   │   └── worker.ts           # the Web Worker entry (loads Pyodide)
│   ├── progress/               # Dexie db, hooks, export/import
│   └── ui/                     # shared primitives (Button, Card, ProgressBar…)
├── docs/
│   ├── AUTHORING.md            # Tier-1 authoring guide (§7.3)
│   ├── PYTHON_ITEMS.md         # Tier-2 developer guide (§7.3)
│   ├── WIDGETS.md              # native widget catalogue, auto-checked (§7.3)
│   └── ARCHITECTURE.md         # this architecture, condensed for contributors
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

### 3.4 Runtime data flow

1. App boots → fetches `content/index.json` (generated, §4.2) → renders course catalogue.
1. Opening a course fetches its `course.json`; opening a module fetches `module.json`, then lesson `.md` files on demand.
1. The Markdown renderer maps directives (§4.5) to native widgets or to `<PyItem>` mounts.
1. First `<PyItem>` that scrolls into view triggers `PyHost.ensureRuntime()`: spawn worker → load Pyodide → unpack `python-bundle.zip` into the Pyodide filesystem → `READY`.
1. `PyHost` fetches the item’s `.py` source (same origin), sends `LOAD_ITEM`; the worker executes it, instantiates `Item`, returns the first `RENDER` tree; the host renders it with React.
1. User interaction → host sends `EVENT` → Python handler runs → SDK auto-re-renders → worker sends `RENDER` (new tree) → host reconciles.
1. `PROGRESS` / `PERSIST` messages from items are written to Dexie by the host. Quizzes (native and Python) record attempts identically (§5.5).

### 3.5 The modularity contract (why this scales)

- **Content is data** (C-5): courses are folders of JSON/MD/PY under `public/content/`. The generated `index.json` is the only registry, and it is built by a script, never hand-edited.
- **Widgets are a registry:** one map `widgetRegistry: Record<string, WidgetDef>` in `src/widgets/registry.ts`. A new native widget = one component file + one registry entry + one `WIDGETS.md` section. Nothing else changes.
- **Python items are files:** one `.py` file per item, importing only `learnsdk` (stable, semver) and `courselib` (shared helpers). New interactivity therefore usually costs **zero** host changes.
- **Subsystem boundaries:** `content/`, `widgets/`, `quiz/`, `python/`, `progress/` are import-isolated (enforced by ESLint `import/no-restricted-paths`); each exposes a small `index.ts` API.

-----

## 4. Content Model and Data Specifications

### 4.1 Content hierarchy

```
Subject (folder: maths | physics | cs | ai | signals)
└── Course        (folder + course.json)         e.g. alevel-pure
    └── Module    (folder + module.json)         e.g. differentiation-1
        ├── Lessons (NN-slug.md or NN-slug.py)   ordered teaching pages
        ├── items/  (*.py)                       Python items embedded in lessons
        └── assessment.json                      end-of-module quiz (optional but MVC-required)
```

**ID rules (normative).** All `id` fields: lowercase kebab-case, regex `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤ 64 chars. Module IDs are **globally unique** across the whole content tree (enforced by `build-content.mjs`). Lesson IDs are unique within their module. Course IDs are unique within their subject.

### 4.2 `content/index.json` (generated — never hand-edited)

Produced by `scripts/build-content.mjs` by scanning `public/content/**`. Schema: `schemas/content-index.schema.json`.

|Field                      |Type             |Req|Description                                         |
|---------------------------|-----------------|---|----------------------------------------------------|
|`schemaVersion`            |integer          |✔  |`1`.                                                |
|`generatedAt`              |string (ISO 8601)|✔  |Build timestamp.                                    |
|`subjects`                 |Subject[]        |✔  |Ordered as: maths, physics, cs, ai, signals.         |
|`Subject.id`               |string           |✔  |`"maths" | "physics" | "cs" | "ai" | "signals"`.    |
|`Subject.title`            |string           |✔  |Display name.                                       |
|`Subject.courses`          |CourseRef[]      |✔  |                                                    |
|`CourseRef.id`             |string           |✔  |Course id.                                          |
|`CourseRef.path`           |string           |✔  |e.g. `"maths/alevel-pure"` (relative to `content/`).|
|`CourseRef.title`          |string           |✔  |Copied from `course.json`.                          |
|`CourseRef.level`          |string           |✔  |`"gcse" | "as" | "a2" | "alevel" | "foundation" | "postgrad"`.|
|`CourseRef.moduleCount`    |integer          |✔  |                                                    |
|`CourseRef.totalEstMinutes`|integer          |✔  |Sum of module estimates.                            |

### 4.3 `course.json`

|Field          |Type       |Req|Description                                              |
|---------------|-----------|---|---------------------------------------------------------|
|`schemaVersion`|integer    |✔  |`1`.                                                     |
|`id`           |string     |✔  |Course id.                                               |
|`title`        |string     |✔  |e.g. `"A-level Pure Mathematics"`.                       |
|`subject`      |string     |✔  |One of the subject ids. Must match parent folder.        |
|`level`        |string     |✔  |As in §4.2.                                              |
|`description`  |string     |✔  |1–3 sentences, plain text.                               |
|`accent`       |string     |✖  |Hex colour for course theming, default per-subject token.|
|`modules`      |ModuleRef[]|✔  |**Defines display order.**                               |
|`ModuleRef.id` |string     |✔  |Must equal the module folder’s `module.json` id.         |
|`ModuleRef.dir`|string     |✔  |Folder name relative to the course folder.               |

Example:

```json
{
  "schemaVersion": 1,
  "id": "alevel-pure",
  "title": "A-level Pure Mathematics",
  "subject": "maths",
  "level": "alevel",
  "description": "Core pure mathematics covering proof, algebra, trigonometry, calculus, numerical methods and vectors.",
  "modules": [
    { "id": "proof", "dir": "proof" },
    { "id": "differentiation-1", "dir": "differentiation-1" }
  ]
}
```

### 4.4 `module.json`

|Field                |Type    |Req|Description                                                                                                                                                                           |
|---------------------|--------|---|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`schemaVersion`      |integer |✔  |`1`.                                                                                                                                                                                  |
|`id`                 |string  |✔  |Globally unique module id.                                                                                                                                                            |
|`title`              |string  |✔  |                                                                                                                                                                                      |
|`description`        |string  |✔  |1–3 sentences.                                                                                                                                                                        |
|`estMinutes`         |integer |✔  |Total estimated study time.                                                                                                                                                           |
|`prerequisites`      |string[]|✔  |Module ids (may be empty). Every id must exist somewhere in the content tree (CI-checked). Prerequisites are **advisory**: the UI labels and recommends, it never locks (FR-CONT-008).|
|`objectives`         |string[]|✔  |2–6 learner-facing outcomes.                                                                                                                                                          |
|`tags`               |string[]|✖  |Free-form, for search.                                                                                                                                                                |
|`lessons`            |Lesson[]|✔  |Ordered. ≥ 1.                                                                                                                                                                         |
|`Lesson.id`          |string  |✔  |Unique within module.                                                                                                                                                                 |
|`Lesson.title`       |string  |✔  |                                                                                                                                                                                      |
|`Lesson.file`        |string  |✔  |Filename in the module folder (`*.md`) or, when `kind:"python"`, a `.py` path (e.g. `items/full-sim.py`).                                                                             |
|`Lesson.kind`        |string  |✖  |`"markdown"` (default) or `"python"` (full-page Python item).                                                                                                                         |
|`Lesson.estMinutes`  |integer |✔  |                                                                                                                                                                                      |
|`assessment`         |object  |✖  |Required by MVC (§8.6).                                                                                                                                                               |
|`assessment.file`    |string  |✔* |Usually `"assessment.json"`.                                                                                                                                                          |
|`assessment.passMark`|number  |✔* |0–1 fraction, e.g. `0.7`.                                                                                                                                                             |
|`version`            |string  |✔  |Content semver, starts `"1.0.0"`; bump on meaningful edits.                                                                                                                           |
|`authors`            |string[]|✔  |Names or GitHub handles.                                                                                                                                                              |

Example:

```json
{
  "schemaVersion": 1,
  "id": "differentiation-1",
  "title": "Differentiation I — From Gradients to the Power Rule",
  "description": "What the derivative means, differentiation from first principles, and the power rule.",
  "estMinutes": 90,
  "prerequisites": ["quadratics-and-inequalities", "coordinate-geometry"],
  "objectives": [
    "Interpret the derivative as a rate of change and gradient",
    "Differentiate from first principles for polynomial cases",
    "Apply the power rule to differentiate ax^n"
  ],
  "tags": ["calculus", "derivative", "gradient"],
  "lessons": [
    { "id": "gradients", "title": "Gradients of curves", "file": "01-gradients.md", "estMinutes": 20 },
    { "id": "first-principles", "title": "First principles", "file": "02-first-principles.md", "estMinutes": 30 },
    { "id": "power-rule", "title": "The power rule", "file": "03-power-rule.md", "estMinutes": 25 }
  ],
  "assessment": { "file": "assessment.json", "passMark": 0.7 },
  "version": "1.0.0",
  "authors": ["charles"]
}
```

### 4.5 Lesson Markdown format (normative)

Lessons are CommonMark + GFM with these extensions:

1. **Frontmatter** (YAML, optional — `module.json` is authoritative; frontmatter `title` is ignored if present).
1. **Maths:** `$inline$` and `$$display$$` via remark-math → KaTeX.
1. **Directives** (remark-directive). Exactly four directive forms are recognised; anything else fails content validation:

|Form                |Syntax                                                   |Purpose                                                                                                                                                                                                                    |
|--------------------|---------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|Native widget (leaf)|`::widget{type="<registry-key>" ...props}`               |Mounts a native widget. Props are passed as strings/numbers/booleans; each widget validates its own props with a Zod-free hand-rolled guard and renders an inline error card on bad props (dev) / a fallback notice (prod).|
|Python item (leaf)  |`::py{src="items/<file>.py" params='<json>' height=<px>}`|Mounts a Python item. `src` is relative to the module folder. `params` (optional) is a JSON object string handed to the item. `height` (optional, default `auto`, min 240) reserves layout space to prevent CLS.           |
|Callout (container) |`:::callout{kind="info|tip|warning|key"}` … `:::`        |Styled aside.                                                                                                                                                                                                              |
|Reveal (container)  |`:::reveal{title="Worked solution"}` … `:::`             |Collapsed-by-default disclosure; open/close is keyboard accessible.                                                                                                                                                        |

Directive containers MAY nest Markdown, maths, and leaf directives. Containers SHALL NOT nest containers (validated).

Example lesson:

```markdown
# The power rule

If $f(x) = ax^n$ then $f'(x) = anx^{n-1}$.

::widget{type="function-grapher" expr="x^2" tangent=true xmin=-4 xmax=4}

:::callout{kind="key"}
The derivative at a point is the gradient of the tangent at that point.
:::

:::reveal{title="Why does this work?"}
Start from first principles: $f'(x) = \lim_{h \to 0} \frac{f(x+h)-f(x)}{h}$ …
:::

::py{src="items/power-rule-quiz.py" params='{"questions": 4}'}
```

### 4.6 `assessment.json` / quiz file schema

Used by the native quiz engine (§5.4) for module assessments and for inline `::widget{type="quiz" src="..."}` embeds. Schema: `schemas/quiz.schema.json`.

|Field             |Type      |Req|Description                                          |
|------------------|----------|---|-----------------------------------------------------|
|`schemaVersion`   |integer   |✔  |`1`.                                                 |
|`id`              |string    |✔  |Unique within module.                                |
|`title`           |string    |✔  |                                                     |
|`shuffleQuestions`|boolean   |✖  |Default `true`.                                      |
|`shuffleChoices`  |boolean   |✖  |Default `true` (applies to mcq/multi).               |
|`pick`            |integer   |✖  |If set, randomly select `pick` questions per attempt.|
|`questions`       |Question[]|✔  |≥ 1.                                                 |

Question (discriminated union on `type`):

|`type`     |Fields                                                                                                                           |Marking rule                                                                                           |
|-----------|---------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
|`"mcq"`    |`id`, `text` (Markdown+maths), `choices: string[]` (2–6), `answer: integer` (index), `explanation`                               |Correct iff selected index = `answer`.                                                                 |
|`"multi"`  |`id`, `text`, `choices`, `answers: integer[]` (≥1), `explanation`                                                                |Correct iff selected set equals `answers` exactly. No partial credit in v1.                            |
|`"numeric"`|`id`, `text`, `answer: number`, `tolerance: number` (absolute, ≥0), `unit?: string` (display only), `explanation`                |Correct iff `abs(value − answer) ≤ tolerance`. Input accepts decimal and scientific notation (`1.2e3`).|
|`"text"`   |`id`, `text`, `accept: string[]` (ECMAScript regex sources, full-match), `caseSensitive?: boolean` (default false), `explanation`|Correct iff the trimmed input full-matches any regex.                                                  |

Every question SHALL include `explanation` (Markdown), shown after answering.

```json
{
  "schemaVersion": 1,
  "id": "differentiation-1-assessment",
  "title": "End of module: Differentiation I",
  "pick": 8,
  "questions": [
    {
      "id": "q1", "type": "numeric",
      "text": "If $f(x) = 3x^4$, find $f'(2)$.",
      "answer": 96, "tolerance": 0.001,
      "explanation": "$f'(x) = 12x^3$, so $f'(2) = 12 \\times 8 = 96$."
    },
    {
      "id": "q2", "type": "mcq",
      "text": "The derivative of a constant is…",
      "choices": ["undefined", "the constant", "0", "1"],
      "answer": 2,
      "explanation": "A constant has zero rate of change."
    }
  ]
}
```

### 4.7 Validation pipeline (normative)

`scripts/build-content.mjs` SHALL, in order, and exit non-zero on any failure:

1. Discover all `course.json`/`module.json`/quiz files under `public/content/`.
1. Validate every file against its JSON Schema (Ajv, draft 2020-12, `allErrors: true`).
1. Enforce: global module-id uniqueness; every `prerequisites` entry resolves; every `Lesson.file`, `assessment.file`, and `::py src` target exists on disk; every `::widget type` exists in a generated widget manifest (`src/widgets/registry.ts` exports `WIDGET_KEYS`, dumped to `schemas/widget-keys.json` by a build step); directive syntax parses; no nested containers.
1. `python -m py_compile` every `.py` under `public/content/**/items/` and `python/**` (syntax gate; behaviour is covered by tests, §11).
1. Emit `public/content/index.json` (§4.2).

This script runs in CI (§10.3), in `npm run build` (before Vite), and in watch mode during `npm run dev`.

-----

## 5. Functional Requirements

### 5.1 Application shell and navigation (FR-SHELL)

|ID          |Pri|Requirement                                                                                                                                                                                                                                                          |
|------------|---|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|FR-SHELL-001|M  |The app SHALL be an SPA using hash routes: `#/` (catalogue), `#/course/:courseId`, `#/module/:moduleId`, `#/module/:moduleId/lesson/:lessonId`, `#/module/:moduleId/assessment`, `#/progress`, `#/settings`. Unknown routes render a not-found page with a link home.|
|FR-SHELL-002|M  |The catalogue SHALL group courses by subject, showing per-course: title, level badge, description, module count, total time, and percent complete (from Dexie).                                                                                                      |
|FR-SHELL-003|M  |The module page SHALL show description, objectives, prerequisite chips (linking to those modules, marked done/not-done), an ordered lesson list with per-lesson completion state, and the assessment entry with best score.                                          |
|FR-SHELL-004|M  |Lesson view SHALL provide Previous/Next lesson navigation, a “Mark lesson complete” action (auto-set on reaching the end via scroll sentinel OR manual click — both SHALL work), and a persistent module progress bar.                                               |
|FR-SHELL-005|M  |Dark/light theme: toggle in settings, default `prefers-color-scheme`, persisted in `kv`.                                                                                                                                                                             |
|FR-SHELL-006|M  |Every route SHALL be wrapped in an error boundary that shows the error, a “copy details” button, and a reload action — the app shell never white-screens.                                                                                                            |
|FR-SHELL-007|S  |Breadcrumb (Subject / Course / Module / Lesson) on all content routes.                                                                                                                                                                                               |

### 5.2 Content loading and rendering (FR-CONT)

|ID         |Pri|Requirement                                                                                                                                                                                                                       |
|-----------|---|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|FR-CONT-001|M  |The app SHALL load `content/index.json` at startup with a cached-first strategy (service worker) and render the catalogue from it alone (no other fetches needed for `#/`).                                                       |
|FR-CONT-002|M  |`course.json`, `module.json`, lesson `.md`, quiz `.json`, and item `.py` files SHALL each be fetched lazily, on first need, relative to `import.meta.env.BASE_URL + 'content/'`.                                                  |
|FR-CONT-003|M  |In dev builds, every loaded JSON SHALL be revalidated with Ajv; failures render an inline diagnostic panel listing each schema error with its JSON pointer. In prod builds runtime validation is skipped (CI guarantees validity).|
|FR-CONT-004|M  |The Markdown renderer SHALL implement §4.5 exactly: GFM, KaTeX maths, the four directives, syntax-highlighted fenced code blocks (Shiki or Prism, lazy-loaded), and images resolved relative to the module folder.                |
|FR-CONT-005|M  |Raw HTML in Markdown SHALL be disabled (`skipHtml`), eliminating content-borne XSS.                                                                                                                                               |
|FR-CONT-006|M  |An unknown widget `type` SHALL render a visible “Unknown widget: X” card (never silently vanish).                                                                                                                                 |
|FR-CONT-007|M  |Lesson content fetch failures SHALL show a retry card; the rest of the page remains functional.                                                                                                                                   |
|FR-CONT-008|M  |Unmet prerequisites SHALL warn (“Recommended first: …”) but SHALL NOT block access.                                                                                                                                               |
|FR-CONT-009|S  |Client-side search over `index.json` + module metadata (title/description/tags/objectives), with a fuzzy matcher (e.g. simple n-gram scoring, no heavy deps), reachable from the header.                                          |

### 5.3 Native widget registry (FR-WID)

|ID        |Pri|Requirement                                                                                                                                                                 |
|----------|---|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|FR-WID-001|M  |`src/widgets/registry.ts` SHALL export `widgetRegistry: Record<string, WidgetDef>` where `WidgetDef = { component: LazyExoticComponent, parseProps(raw: Record<string,string|
|FR-WID-002|M  |Registering a widget SHALL require only: the component file, one registry entry, and a `docs/WIDGETS.md` section (CI checks every registry key has a doc heading).          |
|FR-WID-003|M  |Invalid props SHALL render an inline error card naming the bad prop (dev shows details; prod shows a brief notice).                                                         |

**Required native widget set v1** (all priority M unless noted):

|Registry key        |Purpose                                     |Props (name: type = default)                                                                                                                                                                                                                                                                |Behaviour                                                                                                                                                                                                                                                                                                                                    |
|--------------------|--------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`function-grapher`  |Plot y = f(x); core maths/physics visual    |`expr: string` (required; parsed by a bundled safe expression parser — `mathjs` `compile`, no `eval`); `xmin: number = -10`; `xmax: number = 10`; `ymin?/ymax?: number` (auto if absent); `tangent: boolean = false` (draggable tangent-point with gradient readout); `grid: boolean = true`|SVG plot, responsive width, height 320. Drag/arrow-keys move tangent point. Bad `expr` → error card.                                                                                                                                                                                                                                         |
|`quiz`              |Inline quiz embed                           |`src: string` (module-relative quiz JSON); `pick?: number` (overrides file)                                                                                                                                                                                                                 |Renders the native quiz engine (§5.4) inline; records attempts with `itemId = quiz file id`.                                                                                                                                                                                                                                                 |
|`code-runner`       |Learner-typed code execution (CS/AI)        |`language: "python"` (v1 supports python only); `starter?: string`; `solutionTest?: string` (Python snippet that must run without raising to mark complete); `rows: number = 10`                                                                                                            |Editor (CodeMirror 6, lazy) + Run button. Executes via the Python worker in an **isolated namespace** with stdout/stderr captured and displayed; 5 s soft timeout with interrupt via `SharedArrayBuffer` when available, else a “still running” warning + worker-restart option. If `solutionTest` passes, emits a completion progress event.|
|`step-reveal`       |Multi-step worked solutions                 |Container-like leaf: `src: string` pointing to a small JSON `{steps:[{title, body(md)}]}`                                                                                                                                                                                                   |“Show next step” sequential disclosure; fully revealed state counts as interaction.                                                                                                                                                                                                                                                          |
|`data-plot`         |Static data charts                          |`src: string` (JSON: `{kind:"line"|"bar"|"scatter", series:[{name, points:[[x,y]…]}], xLabel?, yLabel?}`)                                                                                                                                                                                   |Recharts render, responsive.                                                                                                                                                                                                                                                                                                                 |
|`figure`            |Captioned image                             |`src: string`; `alt: string` (required); `caption?: string`; `width?: number`                                                                                                                                                                                                               |`alt` enforced by validation.                                                                                                                                                                                                                                                                                                                |
|`logic-gate-sim` (S)|Interactive AND/OR/NOT/XOR/NAND/NOR circuits|`src: string` (circuit JSON: nodes, wires)                                                                                                                                                                                                                                                  |Toggle inputs, live propagation, truth-table side panel.                                                                                                                                                                                                                                                                                     |
|`flashcards` (S)    |Spaced recall within a lesson               |`src: string` (JSON `{cards:[{front(md), back(md)}]}`)                                                                                                                                                                                                                                      |Flip + self-grade (again/good); grades stored in `itemState`.                                                                                                                                                                                                                                                                                |

(Phase ≥ P3 candidates — `vector-field`, `circuit-sim` (analog), `geometry-canvas`, `truth-table` — are roadmap §13, not required.)

### 5.4 Native quiz engine (FR-QUIZ)

|ID         |Pri|Requirement                                                                                                                                                                                                                           |
|-----------|---|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|FR-QUIZ-001|M  |The engine SHALL render any §4.6 quiz: one question at a time, with progress “Question i of n”, immediate per-question feedback (correct/incorrect + `explanation`), then a summary screen (score, per-question review, retry button).|
|FR-QUIZ-002|M  |Shuffling and `pick` SHALL use a seeded PRNG (mulberry32) seeded with `hash(quizId + attemptNumber)` so an attempt is reproducible.                                                                                                   |
|FR-QUIZ-003|M  |Each completed run SHALL write one `attempts` row (§5.5). For module assessments, `moduleState.assessmentBest` updates if improved; reaching `passMark` with all lessons complete sets the module `completed`.                        |
|FR-QUIZ-004|M  |Numeric input SHALL accept `-`, decimals, and scientific notation; invalid input disables Submit with inline hint.                                                                                                                    |
|FR-QUIZ-005|M  |Feedback SHALL be announced via `aria-live="polite"`; all interactions keyboard-operable.                                                                                                                                             |
|FR-QUIZ-006|S  |“Practice mode” toggle on assessments: unrecorded attempt (no `attempts` row), clearly labelled.                                                                                                                                      |

### 5.5 Progress tracking (FR-PROG) and database schema (normative)

Dexie database name: `learnlab`. Version 1 stores:

```ts
db.version(1).stores({
  moduleState:    'moduleId, courseId, status, updatedAt',
  lessonProgress: '[moduleId+lessonId], moduleId, updatedAt',
  attempts:       '++attemptId, [moduleId+itemId], itemId, finishedAt',
  itemState:      '[moduleId+itemId], updatedAt',
  kv:             'key'
});
```

Record shapes (TypeScript, normative):

```ts
interface ModuleState {
  moduleId: string; courseId: string; subject: string;
  status: 'not-started' | 'in-progress' | 'completed';
  startedAt?: number; completedAt?: number; updatedAt: number;   // epoch ms
  lessonsDone: number; lessonsTotal: number;
  assessmentBest?: { score: number; maxScore: number; at: number };
}
interface LessonProgress {
  moduleId: string; lessonId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedAt?: number; updatedAt: number; timeSpentSec: number; // accumulated, 30 s heartbeat while visible
}
interface Attempt {                       // one per finished quiz run (native or Python QuizItem)
  attemptId?: number;                     // auto-increment
  moduleId: string; itemId: string;       // itemId = quiz id or python item id
  kind: 'assessment' | 'inline-quiz' | 'python-item';
  score: number; maxScore: number;
  startedAt: number; finishedAt: number;
  answers: unknown;                       // engine-defined echo of given answers (JSON-safe)
}
interface ItemState {                     // arbitrary persisted state for stateful items
  moduleId: string; itemId: string;
  state: unknown;                         // JSON-safe, ≤ 64 KB enforced on write
  updatedAt: number;
}
interface KV { key: string; value: unknown; }  // 'theme', 'pyodideConsent', 'lastRoute', …
```

|ID         |Pri|Requirement                                                                                                                                                                                                                                                                                                         |
|-----------|---|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|FR-PROG-001|M  |All writes SHALL go through one module `src/progress/db.ts`; components use `useLiveQuery` hooks so progress UI updates reactively.                                                                                                                                                                                 |
|FR-PROG-002|M  |A lesson becomes `completed` per FR-SHELL-004; a module becomes `completed` per FR-QUIZ-003 (or, if it has no assessment, when all lessons complete).                                                                                                                                                               |
|FR-PROG-003|M  |**Export:** Settings SHALL offer “Download my progress” producing `learnlab-progress-YYYYMMDD.json`: `{ app:"learnlab", exportVersion:1, exportedAt, tables:{ moduleState:[…], lessonProgress:[…], attempts:[…], itemState:[…], kv:[…] } }`.                                                                        |
|FR-PROG-004|M  |**Import:** Settings SHALL accept such a file. Merge policy: per primary key, the record with the newer `updatedAt`/`finishedAt` wins; `attempts` are unioned (deduped on `(moduleId,itemId,startedAt)`). A summary (“imported X, skipped Y”) is shown. Invalid files are rejected with a reason and change nothing.|
|FR-PROG-005|M  |Settings SHALL offer “Erase all local data” behind a typed-confirmation (“ERASE”) dialog; it deletes the Dexie DB and `kv` and reloads.                                                                                                                                                                             |
|FR-PROG-006|M  |The progress page (`#/progress`) SHALL list per-course completion bars and a flat table of modules in progress with resume links.                                                                                                                                                                                   |
|FR-PROG-007|S  |`navigator.storage.persist()` requested once after first meaningful progress write; result stored in `kv` and surfaced in settings (“storage: persistent / best-effort”).                                                                                                                                           |

### 5.6 Python runtime subsystem (FR-PY) — summary

Fully specified in §6. Headline requirements:

|ID       |Pri|Requirement                                                                                                                                                                                                                       |
|---------|---|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|FR-PY-001|M  |All Python (items, code-runner, SDK) SHALL execute in exactly one dedicated Web Worker per app session; the main thread never runs Pyodide.                                                                                       |
|FR-PY-002|M  |The runtime SHALL load lazily: only when the first Python-dependent element approaches the viewport (IntersectionObserver, `rootMargin: '600px'`) or the user activates a code-runner. Tier-1 pages SHALL ship zero Pyodide bytes.|
|FR-PY-003|M  |While loading, each Python mount SHALL show a determinate-ish progress card (“Loading Python runtime… ~xx MB, cached after first time”) driven by `LOG`/phase messages.                                                           |
|FR-PY-004|M  |Item crashes SHALL be contained: the failing item shows an error card (with traceback in dev, “View details” in prod); other items and the page continue working. A “Restart Python runtime” action recovers from a wedged worker.|
|FR-PY-005|M  |Host↔worker communication SHALL use only the JSON protocol of §6.3 (structured-clone of JSON-safe values; no proxies leak across the boundary).                                                                                   |
|FR-PY-006|M  |Items SHALL be instantiated only when mounted and destroyed on unmount (`DESTROY_ITEM`), bounding memory.                                                                                                                         |

### 5.7 Settings (FR-SET)

|ID        |Pri|Requirement                                                                                                                                                                                                                                               |
|----------|---|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|FR-SET-001|M  |Settings page SHALL contain: theme toggle; export/import/erase (§5.5); Python runtime status (version, loaded packages, cache state, restart button); storage persistence state; app version + content build timestamp; links to the GitHub repo and docs.|

### 5.8 PWA and offline (FR-PWA)

|ID        |Pri|Requirement                                                                                                                                                                                                       |
|----------|---|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|FR-PWA-001|M  |`vite-plugin-pwa` SHALL precache the app shell (HTML, JS, CSS, fonts, KaTeX assets) with auto-update (`registerType: 'autoUpdate'`; a toast offers “Reload to update”).                                           |
|FR-PWA-002|M  |Runtime caching: `content/**` → stale-while-revalidate (cache `content-v1`); Pyodide CDN URLs (exact pinned version prefix) → cache-first, 1-year expiry (cache `pyodide-v<ver>`); both with sensible max-entries.|
|FR-PWA-003|M  |Any module fully viewed online (including its Python items, post runtime load) SHALL work offline thereafter, including progress writes. Verified by AC-04.                                                       |
|FR-PWA-004|M  |A web app manifest SHALL be provided (name, icons 192/512, theme colours, `display: standalone`, `start_url` under the base path).                                                                                |
|FR-PWA-005|S  |An offline indicator chip in the header when `navigator.onLine === false`.                                                                                                                                        |

-----

## 6. Python Learning Item Framework (normative)

### 6.1 Goals and design principles

1. **Python-only authoring.** An item developer writes one `.py` file and touches nothing else. They never see React, TypeScript, or the worker protocol.
1. **Declarative UI, Elm-style loop.** An item holds state, `render()` returns a component tree, events run handlers, the framework re-renders. No DOM access, no imperative UI mutation.
1. **Shared building blocks.** `learnsdk` provides components, base item classes, checking, randomness, and drawing; `courselib` accumulates reusable domain code (e.g. `courselib.physics.suvat`). New items are mostly composition.
1. **Strict boundary.** Everything crossing host↔worker is JSON-safe. This keeps the protocol debuggable, testable, and version-stable.
1. **Stability.** `learnsdk` is semver’d (`learnsdk.__version__`). Breaking API changes require a major bump plus a migration note in `docs/PYTHON_ITEMS.md`.

### 6.2 Execution architecture

#### 6.2.1 Processes and lifecycle states

- Exactly one Web Worker (`src/python/worker.ts`) hosts Pyodide. The host-side singleton `PyHost` owns it.
- Runtime states: `idle → loading-pyodide → loading-bundle → ready → error`. State is observable (React hook `usePyRuntime()`); FR-PY-003 UI binds to it.
- Item states (per item instance): `requested → loading → active → destroyed | errored`.

#### 6.2.2 Boot sequence (worker side)

1. `importScripts(PYODIDE_BASE_URL + 'pyodide.js')`; `loadPyodide({ indexURL: PYODIDE_BASE_URL })`.
1. Fetch `python-bundle.zip` (same origin, built by `build-python-bundle.mjs`), `pyodide.unpackArchive(buf, 'zip', { extractDir: '/lib/learnlab' })`, append `/lib/learnlab` to `sys.path`.
1. `import learnsdk._bridge as bridge; bridge.init(js_post)` — registers the Python-side dispatcher.
1. Post `READY { pyodideVersion, sdkVersion }`.

#### 6.2.3 Item loading

On `LOAD_ITEM`, the bridge:

1. Creates a fresh module namespace: `types.ModuleType(f"item_{itemId}")` with `__dict__` pre-seeded so `import learnsdk` / `import courselib` resolve normally.
1. `exec(compile(source, filename, 'exec'), ns)`.
1. Asserts `ns['Item']` exists and `issubclass(ns['Item'], learnsdk.LearningItem)` — the **entry-point convention**: *the file MUST define a class named `Item` subclassing `learnsdk.LearningItem`.* Anything else is a load error.
1. If `Item.requires` is non-empty, awaits `pyodide.loadPackage(Item.requires)` first (host shows “loading numpy…” via `LOG`).
1. Instantiates via the framework (never author `__init__` overrides — see §6.6), injecting `params`, `saved_state`, `seed`.
1. Calls `setup()`, then `render()`, posts `LOADED` then the first `RENDER`.

#### 6.2.4 Pyodide hosting

`src/config.ts` SHALL define `PYODIDE_VERSION` (exact, e.g. `"0.27.7"`) and `PYODIDE_BASE_URL` (default `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`). Switching to self-hosting = changing this one constant to a same-origin path and committing the needed files (documented in `docs/ARCHITECTURE.md`). The service worker caches whichever origin is configured (FR-PWA-002).

### 6.3 Host ↔ Worker message protocol v1 (normative)

Envelope (both directions): `{ "v": 1, "id": "<uuid>", "type": "<TYPE>", "payload": { … } }`. Replies to a request carry `"replyTo": "<request id>"`. All payload values are JSON-safe. Unknown `type` → respond `ERROR{ code:"unknown-type" }`, never crash.

**Host → Worker**

|`type`           |Payload                                                                                                                                                            |Reply                                                                                                            |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
|`INIT`           |`{ pyodideBaseUrl, bundleUrl }`                                                                                                                                    |`READY` or `ERROR`                                                                                               |
|`LOAD_ITEM`      |`{ itemId, sourceUrl, source, params: object, savedState: object|null, seed: number }` (host fetches the source and passes the text; `sourceUrl` is for tracebacks)|`LOADED { itemId, meta:{ title?: string, wantsTick: bool, tickHz?: number } }` then an unsolicited first `RENDER`|
|`EVENT`          |`{ itemId, handler: string, value: any }` (`handler` is the token from §6.4)                                                                                       |none (results arrive as `RENDER`/`PROGRESS`/`PERSIST`)                                                           |
|`TICK`           |`{ itemId, dt: number }` (seconds; host drives at `min(tickHz, 60)` via rAF, only while the item is visible and `wantsTick`)                                       |none                                                                                                             |
|`SERIALIZE_STATE`|`{ itemId }`                                                                                                                                                       |`STATE { itemId, state }`                                                                                        |
|`DESTROY_ITEM`   |`{ itemId }`                                                                                                                                                       |`DESTROYED { itemId }`                                                                                           |
|`RUN_SNIPPET`    |`{ runId, code, timeoutMs }` — backs the `code-runner` widget; isolated namespace, stdout/stderr captured                                                          |`SNIPPET_RESULT { runId, ok, stdout, stderr, error? }`                                                           |
|`SHUTDOWN`       |`{}`                                                                                                                                                               |worker self-terminates                                                                                           |

**Worker → Host**

|`type`    |Payload                                                                       |Host action                                                                                                                        |
|----------|------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
|`READY`   |`{ pyodideVersion, sdkVersion }`                                              |runtime → `ready`.                                                                                                                 |
|`RENDER`  |`{ itemId, seq: number, tree: Node }`                                         |Render tree (§6.4). Drop if `seq` ≤ last applied (out-of-order guard).                                                             |
|`PROGRESS`|`{ itemId, kind: "completed" | "scored", score?: number, maxScore?: number }` |Write `attempts` row (`kind:'python-item'`) for `scored`; mark item complete for `completed`; both update lesson interaction state.|
|`PERSIST` |`{ itemId, state: object }`                                                   |Debounced (500 ms trailing) write to `itemState` (≤ 64 KB; oversize → `LOG` warn + drop).                                          |
|`STATE`   |reply to `SERIALIZE_STATE`                                                    |Used on page hide (`visibilitychange`) to flush state.                                                                             |
|`ERROR`   |`{ itemId?: string, phase: "boot"|"load"|"event"|"tick", message, traceback }`|Item error card (FR-PY-004) or runtime error state if no `itemId`.                                                                 |
|`LOG`     |`{ itemId?: string, level: "debug"|"info"|"warn", text }`                     |Dev console + loading-phase UI text.                                                                                               |

### 6.4 Component tree serialisation (normative)

`render()` returns a `Component`; the bridge serialises it to:

```json
{
  "type": "Column",
  "key": "root",
  "props": { "gap": 3 },
  "children": [
    { "type": "Slider",
      "key": "angle",
      "props": { "label": "Angle", "min": 10, "max": 80, "step": 1, "value": 45,
                 "onChange": { "__h": "h_17" } },
      "children": [] }
  ]
}
```

Rules:

1. `type` must be a key in the host’s `pyComponentRegistry` (§6.7 table). Unknown → host renders an “Unknown component” error card naming it.
1. **Handlers:** any prop whose value is a Python callable is replaced by `{ "__h": "<token>" }`. The bridge keeps `token → callable` per item, regenerated each render; the host wires the matching DOM event to `EVENT { handler: token, value }`. Stale tokens (from a superseded render) are ignored by the bridge with a `debug` log.
1. **Keys:** `key` defaults to the child’s position path; authors SHOULD pass `key=` for dynamic lists (the SDK warns once per item type when list children lack keys). Keys feed React reconciliation, preserving e.g. input focus across re-renders.
1. All prop values must be JSON-safe; the SDK raises `SerializationError` naming the offending prop/path otherwise (numpy scalars/arrays are auto-converted via `.item()` / `.tolist()`).
1. Trees are **full snapshots** (no diffing protocol); React reconciles. Soft cap 2 000 nodes per tree — exceeding logs a warning, > 5 000 raises.

**Re-render policy:** the framework re-renders automatically after every event handler and every `tick()` return. `self.update()` exists to request a render outside those (rarely needed). Handlers that raise produce `ERROR{phase:"event"}` and skip the re-render.

### 6.5 `learnsdk` package layout

Public API (everything else is private): `learnsdk.LearningItem`, `learnsdk.QuizItem`, `learnsdk.SimulationItem`, `learnsdk.PlotExplorerItem`, all component classes (§6.7), `learnsdk.draw`, `learnsdk.checking`, `learnsdk.quiz` question types (`MCQ`, `Multi`, `Numeric`, `TextAnswer`, `Expression`), the helper dataclasses `Ctl` (PlotExplorer controls) and `Step` (MultiStepItem), and `learnsdk.Result`. `from learnsdk import *` exposes exactly these (`__all__` is the contract, tested).

### 6.6 `LearningItem` — core API (normative)

```python
class LearningItem:
    # ---- class-level configuration (author-set) ----
    title: str | None = None        # optional display chrome above the item
    requires: list[str] = []        # pyodide packages, e.g. ["numpy", "sympy"]
    wants_tick: bool = False
    tick_hz: int = 30               # host clamps to [1, 60]

    # ---- injected by the framework before setup(); read-only by convention ----
    params: dict                    # from ::py params, {} if absent
    saved_state: dict | None       # last persisted state, None on first run
    rng: random.Random              # seeded: stable per (item, attempt) — reproducibility
    item_id: str

    # ---- lifecycle: authors override these ----
    def setup(self) -> None: ...                    # build initial state; restore from saved_state
    def render(self) -> Component: ...              # REQUIRED. Pure function of item state.
    def tick(self, dt: float) -> None: ...          # only called if wants_tick
    def get_state(self) -> dict: return {}          # what to persist (JSON-safe)

    # ---- services: authors call these ----
    def update(self) -> None                        # manual re-render request
    def persist(self) -> None                       # snapshot get_state() → PERSIST (debounced host-side)
    def complete(self, score: float | None = None,
                 max_score: float | None = None) -> None
                                                    # PROGRESS: 'completed', or 'scored' if score given
    def log(self, *args) -> None                    # → LOG(info)
```

Contract details:

- Authors SHALL NOT define `__init__`; the framework owns construction (validated at load: defining `__init__` is a load error with a pointed message — this removes a whole class of injection bugs).
- `setup()` SHALL restore from `self.saved_state` when not `None`; the scaffolder template includes this branch so it is never forgotten.
- `render()` must not mutate state (convention, stated in docs; not enforced).
- `complete()` is idempotent per attempt; repeat calls are ignored with a debug log.
- Determinism: `self.rng` is the only sanctioned randomness (`random.seed` use is flagged by a ruff custom rule in CI).

### 6.7 Component library v1 (normative)

Python constructor signature convention: positional children where natural, keyword props. Every component accepts `key: str | None`. Host renders Tailwind-styled equivalents; all interactive components are keyboard-accessible and labelled (NFR-A11Y).

|Component (Python)                                                                             |Constructor|Events                                       |Notes                                                                                                                                                                                                |
|-----------------------------------------------------------------------------------------------|-----------|---------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`Column(*children, gap=2)`                                                                     |layout     |—                                            |Vertical flex. `gap` in Tailwind spacing units.                                                                                                                                                      |
|`Row(*children, gap=2, wrap=True, align="center")`                                             |layout     |—                                            |                                                                                                                                                                                                     |
|`Card(*children, title=None)`                                                                  |layout     |—                                            |Padded surface.                                                                                                                                                                                      |
|`Divider()` / `Spacer(size=2)`                                                                 |layout     |—                                            |                                                                                                                                                                                                     |
|`Text(text, size="md", weight="normal", color=None, mono=False)`                               |display    |—                                            |`size ∈ {sm,md,lg,xl}`.                                                                                                                                                                              |
|`Markdown(text)`                                                                               |display    |—                                            |Same renderer as lessons **minus directives** (no recursion).                                                                                                                                        |
|`Math(latex, display=False)`                                                                   |display    |—                                            |KaTeX.                                                                                                                                                                                               |
|`Image(src, alt, width=None)`                                                                  |display    |—                                            |`src` module-relative or data URI.                                                                                                                                                                   |
|`Alert(text, kind="info")`                                                                     |display    |—                                            |`kind ∈ {info,success,warning,error}`.                                                                                                                                                               |
|`Table(headers: list[str], rows: list[list])`                                                  |display    |—                                            |Cells: str/int/float.                                                                                                                                                                                |
|`CodeBlock(code, language="python")`                                                           |display    |—                                            |Read-only, highlighted.                                                                                                                                                                              |
|`Badge(text, kind="neutral")`                                                                  |display    |—                                            |                                                                                                                                                                                                     |
|`ProgressBar(value, max=1.0, label=None)`                                                      |display    |—                                            |                                                                                                                                                                                                     |
|`Button(label, on_click, kind="primary", disabled=False)`                                      |input      |`on_click(value=None)`                       |`kind ∈ {primary,secondary,danger,ghost}`.                                                                                                                                                           |
|`Slider(label, min, max, step, value, on_change, show_value=True)`                             |input      |`on_change(value: float)`                    |Fires on input, host-throttled to ≤ 30 Hz.                                                                                                                                                           |
|`NumberInput(label, value=None, on_change, min=None, max=None, step=None, unit=None)`          |input      |`on_change(value: float | None)`             |Accepts scientific notation.                                                                                                                                                                         |
|`TextInput(label, value="", on_change, on_submit=None, placeholder="")`                        |input      |`on_change(str)`, `on_submit(str)`           |Enter triggers `on_submit`.                                                                                                                                                                          |
|`Select(label, options: list[str], value, on_change)`                                          |input      |`on_change(value: str)`                      |                                                                                                                                                                                                     |
|`RadioGroup(label, options: list[str], value, on_change)`                                      |input      |`on_change(index: int)`                      |                                                                                                                                                                                                     |
|`Checkbox(label, checked, on_change)`                                                          |input      |`on_change(checked: bool)`                   |                                                                                                                                                                                                     |
|`CheckboxGroup(label, options, values: list[int], on_change)`                                  |input      |`on_change(values: list[int])`               |                                                                                                                                                                                                     |
|`Plot(series, x_label=None, y_label=None, height=320, x_range=None, y_range=None, legend=True)`|viz        |—                                            |`series = [{"name": str, "points": [[x,y],…], "kind": "line"|"scatter"}]`. Static data plot (Recharts host-side).                                                                                    |
|`FunctionPlot(fns, x_range=(-10,10), samples=200, …)`                                          |viz        |—                                            |`fns = [{"name", "expr": callable}]` — sampled **in Python** at render time into points, then sent as `Plot` data (so any Python function works; no expression strings cross the boundary).          |
|`Canvas(width, height, commands: list[dict], on_pointer=None, background="#0b1220")`           |viz        |`on_pointer({type:"down"|"move"|"up", x, y})`|Immediate-mode 2D drawing; the workhorse for simulations. Commands via `learnsdk.draw`. Host repaints a `<canvas>` from the command list each render; coordinate origin top-left, y-down, CSS pixels.|

`learnsdk.draw` command constructors (each returns a JSON dict):
`clear(color)`, `line(x1,y1,x2,y2,color="#e2e8f0",width=1)`, `circle(x,y,r,fill=None,stroke=None,width=1)`, `rect(x,y,w,h,fill=None,stroke=None,width=1)`, `polygon(points,fill=None,stroke=None,width=1)`, `text(x,y,s,color="#e2e8f0",size=12,align="left")`, `arrow(x1,y1,x2,y2,color="#e2e8f0",width=2)` (line + head), `grid(spacing,color="#1e293b")`.
The host implements exactly these eight ops; unknown ops are skipped with one console warning.

### 6.8 Base item classes (normative behaviour)

**`QuizItem(LearningItem)`** — generated/randomised quizzes in pure Python.

```python
class QuizItem(LearningItem):
    shuffle: bool = True
    pass_mark: float | None = None     # None → just report score
    def questions(self) -> list[Question]: ...   # REQUIRED override; may use self.rng
```

Framework behaviour: builds the question list once per attempt in `setup()` (using `self.rng`); renders the same one-at-a-time flow, feedback, and summary as the native engine (§5.4) using §6.7 components; on finish calls `self.complete(score, max_score)`; “Try again” reseeds (`attempt += 1`, persisted) so regenerated numbers differ. Question types (constructors mirror §4.6 semantics): `MCQ(text, choices, answer, explanation="")`, `Multi(text, choices, answers, explanation="")`, `Numeric(text, answer, tolerance=0.0, unit=None, explanation="")`, `TextAnswer(text, accept: list[str], case_sensitive=False, explanation="")`, plus `Expression(text, target: str, symbols: str = "x", explanation="")` which marks by **symbolic equivalence** using sympy (`requires` auto-extended; `simplify(parse_expr(user) - parse_expr(target)) == 0`, parse errors → incorrect with “couldn’t parse” feedback). Any question may instead override `check(self, value) -> Result(correct: bool, feedback: str)` for custom marking.

**`SimulationItem(LearningItem)`** — `wants_tick = True` preset; adds `self.running: bool`, `self.sim_time: float`, `start()/pause()/reset_sim()` helpers and a standard transport `Row` available as `self.transport()`. Authors implement `tick(dt)` and `render()`.

**`PlotExplorerItem(LearningItem)`** — parameter-exploration plots with near-zero code:

```python
class Item(PlotExplorerItem):
    title = "Damped oscillation"
    controls = [Ctl("zeta", "Damping ratio ζ", 0.0, 1.5, 0.05, default=0.2),
                Ctl("w", "ω (rad/s)", 0.5, 10.0, 0.5, default=3.0)]
    x_range = (0.0, 10.0)
    def f(self, x, zeta, w):
        import math
        return math.exp(-zeta*w*x) * math.cos(w*math.sqrt(max(1-zeta**2,1e-9))*x)
```

Base renders sliders from `controls` + a live `FunctionPlot` of `f`; nothing else required.

**`MultiStepItem(LearningItem)`** (S) — guided derivations: authors supply `steps() -> list[Step(prompt_md, check(value) -> Result, hint_md)]`; base renders progress, input, hints, and completion.

### 6.9 Utility modules

**`learnsdk.checking`** (all pure, CPython-testable): `approx(a, b, rel=1e-3, abs_tol=1e-9) -> bool`; `sig_figs(value, n) -> float`; `within(value, lo, hi) -> bool`; `vector_equal(a, b, tol=1e-6) -> bool`; `sympy_equiv(user: str, target: str, symbols="x") -> Result` (lazy sympy import); `Result(correct: bool, feedback: str = "")` dataclass.

**`learnsdk.rand`**: `derive_rng(base: random.Random, label: str) -> random.Random` (stable sub-streams); `nice_numbers(rng, n, lo, hi, exclude=())` (distinct small integers for question generation).

**`courselib`** (initial, grows with content): `courselib.maths` — `poly_str(coeffs)` (LaTeX pretty-printer), `quadratic_roots(a,b,c)`; `courselib.physics` — `suvat(s=None,u=None,v=None,a=None,t=None) -> dict` (solve given any 3), `G = 9.81`; `courselib.cs` — `to_base(n, b)`, `truth_table(fn, n_inputs)`; `courselib.ai` — `mse(ys, yhats)`, `sigmoid(x)`, `train_linreg_1d(points, lr, epochs) -> history`. All pure-Python (numpy optional), all pytest-covered.

### 6.10 State persistence contract

- Persist iff the author overrides `get_state()` and calls `self.persist()` (plus an automatic flush on `visibilitychange`/unmount via `SERIALIZE_STATE`).
- `saved_state` round-trips through JSON: authors get back exactly what `get_state()` returned (post-JSON types: lists not tuples, etc. — documented with examples).
- Versioning is the author’s concern; the scaffold template includes `{"_v": 1}` and a guard.

### 6.11 Package policy

- Available on demand via `requires`: any package shipped in the pinned Pyodide distribution; **blessed and documented:** `numpy`, `sympy`. Others need maintainer sign-off (size/cold-start review) recorded in `docs/PYTHON_ITEMS.md`.
- micropip / network installs at runtime are PROHIBITED (offline guarantee, FR-PWA-003).
- `learnsdk` itself depends only on the standard library.

### 6.12 Developer ergonomics

|ID         |Pri|Requirement                                                                                                                                                                                                                                      |
|-----------|---|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|FR-PYDX-001|M  |`npm run dev` SHALL watch `public/content/**/*.py` and `python/**/*.py`; on change, the host hot-reloads affected items (`DESTROY_ITEM` + re-fetch + `LOAD_ITEM`; bundle changes restart the worker). Sub-2 s edit→see loop.                     |
|FR-PYDX-002|M  |In dev, Python tracebacks render in the item’s error card with the item’s real filename/line numbers (via `sourceUrl` in `compile()`), plus a “copy traceback” button.                                                                           |
|FR-PYDX-003|M  |`print()` inside items SHALL surface as `LOG(info)` in the browser console, prefixed `[py:<itemId>]`.                                                                                                                                            |
|FR-PYDX-004|M  |`docs/PYTHON_ITEMS.md` SHALL contain: quickstart (scaffold → run), full API reference for §6.6–6.10, the two worked examples of §6.13, the persistence guide, the package policy, and a troubleshooting table (top 10 expected errors and fixes).|

### 6.13 Reference examples (normative — these exact items ship in the repo as templates)

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

### 6.14 Python-specific performance requirements

|ID        |Pri|Requirement                                                                                                                   |
|----------|---|------------------------------------------------------------------------------------------------------------------------------|
|NFR-PY-001|M  |Cold runtime load (no SW cache, 10 Mbps): ≤ 20 s with live progress UI. Warm (SW-cached): ≤ 3 s to `READY`.                   |
|NFR-PY-002|M  |`LOAD_ITEM` → first `RENDER` for an item with empty `requires`: ≤ 1.5 s after `READY` (p95, reference mid-range laptop).      |
|NFR-PY-003|M  |`EVENT` → applied `RENDER` round trip: p95 ≤ 50 ms for trees ≤ 300 nodes.                                                     |
|NFR-PY-004|M  |Simulations SHALL sustain configured `tick_hz` (≤ 30) with ≤ 5 % missed ticks for the reference example 6.13(b).              |
|NFR-PY-005|M  |Worker memory steady-state ≤ 512 MB with 3 concurrent active items (numpy loaded); items are destroyed on unmount (FR-PY-006).|

-----

## 7. Authoring Framework and Developer Experience

### 7.1 Scaffolding CLI

|ID         |Pri|Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|-----------|---|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|FR-AUTH-001|M  |`npm run new:module` SHALL prompt for subject, course (existing or new), module id/title/description/estimate/prerequisites, then generate: the module folder, a valid `module.json`, one starter lesson `01-introduction.md` (containing one example of every directive, commented), an `assessment.json` with two placeholder questions, and append the `ModuleRef` to `course.json` (creating a valid `course.json` first if the course is new). Output passes `build-content.mjs` immediately.|
|FR-AUTH-002|M  |`npm run new:item -- --kind quiz|simulation|plot|blank` SHALL generate `items/<name>.py` from the corresponding template (templates live in `scripts/templates/` and are byte-identical to the §6.13 reference examples where applicable, including the `saved_state` guard).                                                                                                                                                                                                                     |
|FR-AUTH-003|M  |`npm run validate` SHALL run the full §4.7 pipeline locally and print human-readable errors with file paths and JSON pointers.                                                                                                                                                                                                                                                                                                                                                                    |

### 7.2 Dev loop

|ID         |Pri|Requirement                                                                                                                                                                                                                               |
|-----------|---|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|FR-AUTH-004|M  |`npm run dev` SHALL serve the app with HMR; edits to `.md`/`.json` content refresh the affected view ≤ 2 s; `.py` edits hot-reload per FR-PYDX-001; validation runs in watch mode and surfaces errors as an in-app toast + console output.|

### 7.3 Required documentation (in-repo, kept current by CI checks where stated)

|Doc                   |Required contents                                                                                                                                                                                                                                                       |
|----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`docs/AUTHORING.md`   |Folder anatomy with annotated tree; step-by-step “add a module in 15 minutes” using the scaffolder; full directive syntax (§4.5) with copy-paste examples; quiz JSON cookbook (one example per question type); maths/KaTeX tips; the MVC checklist (§8.6); PR checklist.|
|`docs/PYTHON_ITEMS.md`|Per FR-PYDX-004.                                                                                                                                                                                                                                                        |
|`docs/WIDGETS.md`     |One section per registry key: description, every prop with type/default, a copy-paste directive example, a screenshot. CI fails if a registry key lacks a section (string match on `## \`<key>``).                                                                      |
|`docs/ARCHITECTURE.md`|§3 condensed + “how to add a native widget” + “how to change the Pyodide version/hosting” runbooks.                                                                                                                                                                     |
|`README.md`           |Project pitch, learner quickstart (URL), contributor quickstart (`npm i && npm run dev`), links to the three guides, licence.                                                                                                                                           |

### 7.4 Contribution workflow

|ID         |Pri|Requirement                                                                                                                                                                                                              |
|-----------|---|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|FR-AUTH-005|M  |`main` is protected; all content and code lands via PR. CI (§10.3) is required to pass. Content-only PRs (paths under `public/content/` + docs) run the fast lane: validation + Python compile + affected e2e smoke only.|
|FR-AUTH-006|S  |A PR template with the MVC checklist for content PRs.                                                                                                                                                                    |

-----

## 8. Initial Content Requirements

### 8.1 Levels taxonomy

`foundation` (assumed-knowledge refreshers, GCSE-grade) → `alevel` (target standard; AS/A2 distinction is carried in module ordering, not separate courses). UK A-level specifications (Edexcel/AQA for maths & physics, AQA/OCR for CS) are the syllabus reference for scope — content is specification-informed, not exam-board-branded.

### 8.2 Mathematics

|Course id               |Title                   |Modules (ordered; ids derive from titles)                                                                                                                                                                                                                                                           |
|------------------------|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`maths-foundation` (P5) |Foundations Refresher   |algebra-essentials; quadratics-intro; trigonometry-basics; graphs-and-functions                                                                                                                                                                                                                     |
|`alevel-pure` (P2)      |A-level Pure Mathematics|proof; indices-and-surds; quadratics-and-inequalities; algebraic-methods; coordinate-geometry; sequences-and-series; binomial-expansion; trigonometry-1; trigonometry-2; exponentials-and-logarithms; differentiation-1; differentiation-2; integration-1; integration-2; numerical-methods; vectors|
|`alevel-statistics` (P2)|A-level Statistics      |sampling-and-data; probability; binomial-distribution; normal-distribution; hypothesis-testing                                                                                                                                                                                                      |
|`alevel-mechanics` (P2) |A-level Mechanics       |kinematics-suvat; variable-acceleration; forces-and-newtons-laws; moments; projectiles; friction-and-connected-particles                                                                                                                                                                            |

### 8.3 Physics

|Course id            |Title          |Modules                                                                                                                                                                                                                                                               |
|---------------------|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`alevel-physics` (P3)|A-level Physics|measurements-and-uncertainty; particles-and-quantum; waves-and-optics; mechanics-and-energy; materials; electricity-dc; further-mechanics-circular-shm; thermal-and-gases; fields-1-gravitational-electric; fields-2-magnetic-and-induction; nuclear-and-radioactivity|

### 8.4 Computer Science

|Course id       |Title                   |Modules                                                                                                                                                                                                                                                                                             |
|----------------|------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`alevel-cs` (P3)|A-level Computer Science|programming-fundamentals; data-structures; algorithms-1-search-sort; algorithms-2-complexity-graphs; boolean-algebra-and-logic; data-representation; computer-architecture; operating-systems-and-software; networks-and-the-web; databases-and-sql; paradigms-oop-functional; theory-of-computation|

### 8.5 AI (no A-level exists; designed track at equivalent depth)

|Course id            |Title         |Modules                                                                                                                                                                                                                                    |
|---------------------|--------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|`ai-foundations` (P4)|AI Foundations|what-is-ai; search-and-problem-solving; knowledge-and-reasoning; ml-concepts-data-and-evaluation; regression; classification; neural-networks-1-perceptrons; neural-networks-2-training; modern-ai-transformers-and-llms; ethics-and-safety|

### 8.6 Minimum Viable Content (MVC) per module — CI-checkable where marked ◆

Every shipped module SHALL contain: ◆ ≥ 3 lessons; ◆ ≥ 1 interactive item (native widget beyond `figure`, or a Python item); ◆ an `assessment.json` with ≥ 8 questions spanning ≥ 2 question types; ◆ declared `prerequisites` and `objectives`; ◆ `estMinutes` on module and lessons; every concept lesson SHOULD include one `:::reveal` worked example. `build-content.mjs --strict` (used in CI for content PRs) enforces the ◆ rules.

### 8.7 Content delivery phases

|Phase|Scope                                                                                                                                                                                                      |Exit criterion                                    |
|-----|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
|P0   |Engine foundation (no public content): shell, content pipeline, progress, native quiz, `function-grapher`, docs skeletons                                                                                  |All P0 ACs green (§12).                           |
|P1   |Python runtime + `learnsdk` core + **4 pilot modules**, one per subject (`differentiation-1`, `kinematics-suvat`, `boolean-algebra-and-logic`, `neural-networks-1-perceptrons`), each using ≥ 1 Python item|AC-02, AC-04, AC-10 green; pilot modules meet MVC.|
|P2   |Full `alevel-pure`, `alevel-statistics`, `alevel-mechanics`; widgets `logic-gate-sim`, `flashcards`                                                                                                        |All maths modules meet MVC.                       |
|P3   |`alevel-physics`, `alevel-cs`                                                                                                                                                                              |MVC.                                              |
|P4   |`ai-foundations` (leans on `code-runner` + Python items, incl. an interactive perceptron/NN playground item)                                                                                               |MVC.                                              |
|P5   |`maths-foundation` bridge; spaced-repetition review queue (roadmap)                                                                                                                                        |—                                                 |

-----

## 9. Non-Functional Requirements

|ID            |Pri|Requirement                                                                                                                                                                                                                                                                                                 |
|--------------|---|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|NFR-PERF-001  |M  |Initial route JS ≤ 350 KB gzipped (excluding lazy chunks, KaTeX fonts, Pyodide). Per-widget lazy chunks ≤ 150 KB gz. CI fails the build on budget breach (`rollup-plugin-visualizer` + a size-check script).                                                                                                |
|NFR-PERF-002  |M  |Catalogue LCP ≤ 2.5 s and module page TTI ≤ 3 s on a mid-range laptop over 10 Mbps (Lighthouse CI, throttled).                                                                                                                                                                                              |
|NFR-PERF-003  |M  |Lesson scroll at 60 fps with two mounted widgets (no long tasks > 100 ms during idle).                                                                                                                                                                                                                      |
|NFR-A11Y-001  |M  |WCAG 2.1 AA: full keyboard operability (including grapher tangent, quiz flows, reveal/callout, Python-rendered inputs), visible focus, contrast ≥ 4.5:1, `aria-live` feedback, KaTeX MathML output, `prefers-reduced-motion` honoured (simulations start paused when set).                                  |
|NFR-COMPAT-001|M  |Browser matrix per §2.3; automated e2e on Chromium + WebKit + Firefox (Playwright). Unsupported-feature banner per §2.3.                                                                                                                                                                                    |
|NFR-SEC-001   |M  |CSP via meta tag: `default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; worker-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net blob:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'`. No other origins, ever. No analytics, no fonts CDN (fonts self-hosted). `blob:` on connect-src/img-src is same-origin-only (document-scoped object URLs), used by the `/widgets` playground to preview user-edited widget data without a hosted file.|
|NFR-SEC-002   |M  |No `eval`/`new Function` in app code (`function-grapher` uses mathjs `compile`); Markdown raw HTML disabled (FR-CONT-005); learner code runs only in the DOM-less worker.                                                                                                                                   |
|NFR-PRIV-001  |M  |Zero network transmission of learner data; this is stated in the README and settings page.                                                                                                                                                                                                                  |
|NFR-REL-001   |M  |All Dexie writes are awaited and errors surfaced via a toast + console; a failed write never silently drops progress.                                                                                                                                                                                       |
|NFR-MAINT-001 |M  |TypeScript `strict`; ESLint + Prettier + ruff clean; public `learnsdk` API 100 % docstring’d (ruff D rules on `python/learnsdk`); subsystem import boundaries lint-enforced (§3.5).                                                                                                                         |
|NFR-MAINT-002 |M  |All schema/protocol versions (`schemaVersion`, protocol `v`, `learnsdk.__version__`, Dexie version) follow the compatibility rule: readers accept equal versions and fail loudly with an actionable message on unknown newer versions.                                                                      |

-----

## 10. Build, CI/CD and Deployment

### 10.1 NPM scripts (normative)

|Script                         |Action                                                                    |
|-------------------------------|--------------------------------------------------------------------------|
|`dev`                          |`build-content --watch` + `build-python-bundle --watch` + Vite dev server.|
|`build`                        |`build-content` → `build-python-bundle` → `vite build` → size-check.      |
|`validate`                     |§4.7 pipeline, strict mode optional via `--strict`.                       |
|`test` / `test:e2e` / `test:py`|Vitest / Playwright / pytest.                                             |
|`new:module` / `new:item`      |§7.1.                                                                     |

### 10.2 Single-point configuration

`src/config.ts` SHALL export: `APP_NAME = 'LearnLab'`, `REPO_NAME = 'LearnLab'` (drives Vite `base: '/' + REPO_NAME + '/'` in CI builds; `'/'` locally), `PYODIDE_VERSION`, `PYODIDE_BASE_URL`. Renaming the app/repo touches only this file plus `package.json`.

### 10.3 GitHub Actions

**`ci.yml`** (PRs + main): job `web` — checkout, Node 22, `npm ci`, lint, typecheck, `validate` (`--strict` when only content changed), `test`, `build`; job `python` — Python 3.12 (matching Pyodide), ruff, `pytest python/tests`; job `e2e` (main + labelled PRs) — Playwright suite incl. one real-Pyodide smoke (Chromium, tagged `@py`).

**`deploy.yml`** (push to main, after CI): `npm ci && npm run build` with `BASE=/<repo>/` → `actions/upload-pages-artifact` (dist) → `actions/deploy-pages`. Pages source: GitHub Actions. Concurrency group prevents overlapping deploys.

### 10.4 Pyodide hosting decision (recorded)

Default CDN-with-SW-cache (rationale: C-2 repo size, zero maintenance, first-load only). Fallback runbook (self-host under `public/pyodide/`, flip `PYODIDE_BASE_URL`, commit core + numpy + sympy wheels ≈ tens of MB) documented in `docs/ARCHITECTURE.md`. NFR-SEC-001’s CSP covers both configurations.

-----

## 11. Testing Requirements

|Layer          |Tooling                                                |Scope (minimum)                                                                                                                                                                                                                                                                                                                                                 |
|---------------|-------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|Unit (TS)      |Vitest + RTL                                           |Content loaders + Ajv guards; directive→widget mapping; quiz marking for all four question types incl. edge cases (tolerance bounds, regex full-match, multi exact-set); progress transitions; export/import merge policy; tree renderer (handler wiring, seq guard, unknown component card). Coverage gate: 80 % lines on `src/{content,quiz,progress,python}`.|
|Bridge contract|Vitest with a mocked worker + pytest with a mocked host|The §6.3 protocol is golden-tested from **both sides** against shared fixture JSON files in `tests/protocol-fixtures/` — the same fixtures, asserted in TS and in Python, so the two implementations cannot drift.                                                                                                                                              |
|Python unit    |pytest (CPython 3.12)                                  |`learnsdk` serialisation (incl. SerializationError paths, handler tokens, key warnings), QuizItem marking, checking module, rand determinism, courselib functions. Coverage gate: 85 % on `learnsdk`.                                                                                                                                                           |
|E2E            |Playwright (3 engines)                                 |Catalogue→module→lesson→complete flow; assessment pass marks module complete; export→erase→import restores state; offline revisit (route via SW); `@py`-tagged: load 6.13(a)+(b), answer a generated question, slider→render round trip, reload restores persisted sim state.                                                                                   |
|Performance    |Lighthouse CI + custom timing harness                  |NFR-PERF-002 budgets; NFR-PY-003 round-trip measured in the `@py` suite.                                                                                                                                                                                                                                                                                        |
|Content        |`validate --strict`                                    |§4.7 + §8.6 ◆ rules on every PR.                                                                                                                                                                                                                                                                                                                                |

-----

## 12. Acceptance Criteria (release gates)

|ID   |Criterion (all SHALL pass)                                                                                                                                                                                             |
|-----|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|AC-01|A CI test adds a fixture module (files only, under a temp content root), runs `build-content`, and asserts it appears in the generated index and renders in the app — proving C-5 (zero `src/` changes to add content).|
|AC-02|Reference item 6.13(a) (≤ 40 lines) loads, marks answers, records an `attempts` row, and shows in module progress — with no JS written.                                                                                |
|AC-03|Complete two lessons + one assessment → export → “Erase all” → import → identical progress UI state (deep-equal on the three tables, modulo `updatedAt`).                                                              |
|AC-04|Visit the projectile module online (Python runtime loads) → go offline (Playwright network block) → full revisit works: lesson, simulation, progress writes.                                                           |
|AC-05|A content PR introducing a dangling `prerequisites` id, a missing lesson file, an unknown widget type, or a nested container fails CI with a message naming file + JSON pointer/line.                                  |
|AC-06|Lighthouse on a module page: Performance ≥ 85, Accessibility ≥ 95 (throttled profile of NFR-PERF-002).                                                                                                                 |
|AC-07|A keyboard-only Playwright test completes an entire assessment (navigate, answer mcq/numeric, read feedback via aria-live assertions, reach summary).                                                                  |
|AC-08|From a clean clone: `npm i && npm run dev` works; pushing to `main` deploys to Pages via Actions with no manual steps beyond enabling Pages (documented in README).                                                    |
|AC-09|Process check: one person unfamiliar with the repo creates an MVC-passing module in < 1 hour using only `docs/AUTHORING.md` + scaffolder.                                                                              |
|AC-10|Item 6.13(b) sustains 30 Hz ticks with ≤ 5 % drops for 20 s on the reference machine (timing harness).                                                                                                                 |

-----

## 13. Roadmap and Out of Scope

**Roadmap (post-P4, prioritised):** spaced-repetition review queue over `flashcards` + missed questions (SM-2-lite); P3 widget candidates (`vector-field`, `geometry-canvas`, analog `circuit-sim`, `truth-table`); per-question partial credit for `multi`; content search over lesson bodies (build-time index); printable lesson view; optional sync via user-owned storage (e.g. file-based export to cloud drive) — still no server.

**Explicitly out of scope for v1:** accounts/auth, server APIs, real-time collaboration, analytics/telemetry, comments/forums, content paywalls, i18n, native apps, editing content in-app.

-----

## Appendix A — Decision log (why, briefly)

|Decision                           |Rationale                                                                                                    |
|-----------------------------------|-------------------------------------------------------------------------------------------------------------|
|Hash routing                       |GitHub Pages serves no rewrites; hash routes need none.                                                      |
|Full-tree renders, React reconciles|Diffing in the protocol buys little at ≤ 2 000 nodes and costs protocol complexity; React already diffs.     |
|`Item` class entry-point convention|One grep-able rule; framework-owned construction kills init-order bugs.                                      |
|`FunctionPlot` samples in Python   |Any Python callable plots; no expression-language duplication across the boundary.                           |
|Quizzes exist in both tiers        |JSON quizzes cost zero Pyodide; Python quizzes buy generation/randomisation. Same attempt records either way.|
|One worker, many items             |Pyodide instances are expensive; namespacing per item gives isolation that matches the trust model (C-6).    |
|CDN Pyodide + SW cache             |C-2; offline still holds after first load (FR-PWA-002/003).                                                  |

*End of SRS v1.0.*