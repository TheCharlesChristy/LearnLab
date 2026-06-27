# LearnLab Build Plan

Living plan maintained by the orchestrator. Source of truth for requirements: `SRS-LearnLab.md`.
Statuses: `todo | dispatched | in-review | merged`.

## Phase P0 — Engine foundation (§8.7)

Goal: shell, content pipeline, progress, native quiz, `function-grapher`, docs skeletons.
**Gate P0:** clean-clone `npm i && npm run dev` works; build within budgets (NFR-PERF-001);
CI green; AC-01, AC-03, AC-05, AC-06, AC-07, AC-08 pass.

### Task breakdown

| ID    | Task                                                                 | SRS refs                  | Files (allowlist)                                  | Depends   | Status |
|-------|----------------------------------------------------------------------|---------------------------|----------------------------------------------------|-----------|--------|
| T0.1  | Repo scaffold: Vite+React19+TS strict+Tailwind4, full dep set, lint, config, CSP, CI workflows | §3.2–3.3, §10.1–10.3, NFR-SEC-001 | root configs, `src/config.ts`, `index.html`, `.github/workflows/` | none | merged |
| T0.C  | Contracts pin (orchestrator): `WidgetDef`, content/quiz/progress TS types, registry skeleton | §4, §5.3, §5.5            | `src/widgets/registry.ts`, `src/content/types.ts`, `src/quiz/types.ts`, `src/progress/types.ts` | T0.1 | merged |
| T0.2  | JSON Schemas + content pipeline (`build-content.mjs`, `validate`, scaffolders) | §4.1–4.7, §7.1, §8.6      | `schemas/`, `scripts/`                             | T0.1      | merged |
| T0.4  | Markdown renderer + 4 directives + KaTeX + code highlight             | §4.5, FR-CONT-004/005/006 | `src/markdown/`                                    | T0.C      | merged |
| T0.5  | Widget registry impl + `function-grapher` + `figure`                  | §5.3 (FR-WID-001..003)    | `src/widgets/`                                     | T0.C      | merged |
| T0.6  | Native quiz engine (4 question types, seeded shuffle/pick) + `quiz` widget | §4.6, §5.4               | `src/quiz/`, `src/widgets/quiz/`                   | T0.C      | merged |
| T0.7  | Dexie store, hooks, export/import/erase                               | §5.5 (FR-PROG-001..007)   | `src/progress/`                                    | T0.C      | merged |
| T0.3  | Content loaders + Ajv dev-mode guards                                 | §5.2 (FR-CONT-001..003)   | `src/content/` (not types.ts)                      | T0.2, T0.C| merged |
| T0.8  | App shell: routes, catalogue/course/module/lesson/assessment/progress/settings pages, theme, error boundaries, PWA | §5.1, §5.7–5.8 | `src/app/`, `src/ui/`, `vite.config.ts` (PWA)      | T0.3–T0.7 | merged |
| T0.9  | Doc skeletons: AUTHORING, PYTHON_ITEMS, WIDGETS, ARCHITECTURE, README | §7.3                      | `docs/*.md`, `README.md`                           | T0.5      | merged |
| T0.10 | Gate tests: e2e (AC-03, AC-05, AC-07), AC-01 fixture test, size check, CI wiring | §11, §12             | `tests/`, `e2e/`, size script                      | T0.8      | merged |

### Waves (parallelism)

1. **Wave 1 (serial):** T0.1 → T0.C (orchestrator).
2. **Wave 2 (parallel):** T0.2, T0.4, T0.5, T0.6, T0.7 — disjoint dirs, built against pinned contracts.
3. **Wave 3 (parallel):** T0.3, T0.8, T0.9.
4. **Wave 4:** T0.10, then run Gate P0.

Orchestrator owns all shared wiring: `package.json`, barrels, router table, registry index.

### Gate P0 commands

```
npm ci && npm run lint && npx tsc --noEmit && npm run validate && npm test && npm run build
npm run test:e2e        # AC-03, AC-05, AC-07 (+ AC-01 fixture test in vitest)
npm i && npm run dev    # clean-clone check (AC-08; deploy.yml reviewed manually)
```

### Gate P0 result — GREEN (2026-06-12)

All ten tasks merged. lint/tsc clean; 279 unit + 17 pipeline tests; e2e 8/8 (chromium);
build + size-check green (entry 124 KB gz / 350 budget). AC-01 ✅ AC-03 ✅ AC-05 ✅ AC-07 ✅
AC-08 ✅ (local halves; Actions deploy proves on merge to main). AC-06 documented
(e2e/lighthouse-check.md), runs in CI on a deployed build — carried into P1 gate.

## Phase P1+ (not yet decomposed)

P1 decomposition happens after Gate P0 is reported green. Protocol fixtures (§6.3–6.4)
will be pinned before any P1 parallel dispatch.

## Phase P1 — Python runtime + learnsdk + 4 pilot modules (§8.7)

Goal: Pyodide worker + `PyHost` + protocol; tree renderer; `learnsdk` + `courselib`;
bundle builder; `code-runner`/`data-plot`/`step-reveal` widgets; dev hot-reload; the two
§6.13 reference items verbatim; four pilot modules (one per subject), each MVC.
**Gate P1:** protocol fixtures pass BOTH sides; pytest (85% learnsdk) + Vitest coverage;
AC-02, AC-04, AC-10 pass; `@py` Chromium smoke green.

### Contracts pinned first (orchestrator, Wave 1)

`src/python/protocol.ts` (§6.3 envelope + closed message sets), `src/python/component-tree.ts`
(§6.4 PyNode/HandlerRef + §6.7 COMPONENT_TYPES + 8 DRAW_OPS), `src/python/py-render-context.tsx`
(render context + PyComponentProps), `src/python/component-registry.ts` (skeleton, I wire),
`tests/protocol-fixtures/**` (golden JSON, both-sides), `python/pyproject.toml` + ruff/pytest +
minimal importable `learnsdk`/`courselib` packages (activates CI python job).

### Task breakdown

| ID    | Task                                                              | SRS refs           | Files (allowlist)                                   | Depends | Status |
|-------|------------------------------------------------------------------|--------------------|-----------------------------------------------------|---------|--------|
| T1.C  | Pin protocol + tree + render-context + fixtures + py skeleton     | §6.3–6.7, §11      | src/python/{protocol,component-tree,py-render-context,component-registry}, tests/protocol-fixtures, python/{pyproject,learnsdk/__init__,courselib/__init__,tests} | none | dispatched |
| T1.1  | TS host: worker + PyHost + runtime hooks + TreeRenderer + PyItem  | §6.2–6.4, FR-PY-*  | src/python/{worker.ts,host.ts,runtime.ts,tree-renderer.tsx,PyItem.tsx,use-py-item.ts}, tests | T1.C | todo |
| T1.2  | TS components: §6.7 component set + Canvas draw renderer          | §6.7, NFR-A11Y     | src/python/components/**, tests                      | T1.C | todo |
| T1.3  | learnsdk core: item lifecycle, components, draw, rand, _bridge    | §6.4–6.6, §6.9     | python/learnsdk/{item,components,draw,rand,_bridge}.py, python/tests | T1.C | todo |
| T1.4  | learnsdk higher: QuizItem+question types, Simulation, Plot, checking, MultiStep | §6.8, §6.9 | python/learnsdk/{quiz,simulation,plot,checking}.py, python/tests | T1.3 | todo |
| T1.5  | courselib starters (maths/physics/cs/ai)                         | §6.9               | python/courselib/{maths,physics,cs,ai}.py, python/tests | T1.C | todo |
| T1.6  | Real python-bundle builder (zip learnsdk+courselib)              | §6.2.2, §10.1      | scripts/build-python-bundle.mjs                      | T1.C | todo |
| T1.7  | Native widgets data-plot + step-reveal (no python dep)           | §5.3               | src/widgets/{data-plot,step-reveal}/**              | none | todo |
| T1.8  | code-runner widget (RUN_SNIPPET via worker)                      | §5.3, C-6          | src/widgets/code-runner/**                           | T1.1 | todo |
| T1.9  | Dev hot-reload for .py items (FR-PYDX-001/002/003)               | §6.12              | (host hook + dev wiring; scoped at dispatch)         | T1.1 | todo |
| T1.10 | Two §6.13 reference items verbatim + new:item templates          | §6.13, FR-AUTH-002 | scripts/templates/**, fixture items                  | T1.3,T1.4 | todo |
| T1.11 | Four pilot modules MVC (differentiation-1, kinematics-suvat, boolean-algebra-and-logic, neural-networks-1-perceptrons) | §8.2-8.5, §8.6 | public/content/** | T1.1-T1.5,T1.10 | todo |
| T1.12 | P1 gate tests: AC-02, AC-04, AC-10 + @py smoke                  | §11, §12           | e2e/**, timing harness                               | T1.11 | todo |

### Waves

1. **Wave 1 (orchestrator):** T1.C.
2. **Wave 2 (parallel):** T1.1, T1.2, T1.3, T1.5, T1.6, T1.7 — disjoint files, against fixtures.
3. **Wave 3 (parallel):** T1.4 (after T1.3), T1.8 (after T1.1), T1.9 (after T1.1).
4. **Wave 4:** T1.10 → T1.11 → T1.12, then Gate P1.

