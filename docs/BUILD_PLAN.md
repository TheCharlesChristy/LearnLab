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
3. **Wave 3 (parallel):** T1.4 (after T1.3), T1.8 (after T1.1), T1.9 (after T1.1), T1.W (app wiring).
4. **Wave 4:** T1.10 → T1.11 (4 parallel modules) → T1.12, then Gate P1.

### Progress (live)

- **merged:** ALL P1 tasks — T1.C, T1.1, T1.2, T1.3, T1.4, T1.5, T1.6, T1.7, T1.8, T1.9, T1.W, T1.10, T1.11 (4 pilot modules), T1.12 (@py gate e2e) + glue (`getItemState`, `src/python` barrel, @py chromium-only CI fix).

### Gate P1 — GREEN (confirmed in CI, 2026-06-30)

Local: eslint, tsc, `build-content --strict` (4 courses / 4 modules, MVC ◆), Vitest
417 passed / 7 skipped, pytest 166 passed / 5 skipped, ruff clean, full build within
NFR-PERF-001 budgets (entry 122 KB gz).

CI (run 28474050970, commit `36fe030`): **web / python / e2e all green.** The `@py`
suite needs a real Pyodide CDN this sandbox can't reach (org egress denial on
`cdn.jsdelivr.net`), so it self-skips locally and was verified in CI directly —
26 passed, 0 failed, 1 pre-existing unrelated webkit flake (AC-03, passed on retry).

- **AC-01/03/05/07** (non-`@py`): green, 3 engines.
- **AC-02** (`items/power-rule-quiz.py` loads, marks, records attempt): green in CI.
- **AC-04** (offline revisit): green in CI.
- **AC-10** (30 Hz ≤5% missed ticks): mechanism-correctness hard-gated always;
  the strict cadence bound hard-gates only under `LEARNLAB_REFERENCE_MACHINE=1`
  (§12/§6.14 scope this to "the reference machine", not shared CI hardware —
  same precedent as AC-06). Measured ~22 Hz consistently on the CI runner.
- **AC-06:** Lighthouse — deploy-pipeline/CI (documented, `e2e/lighthouse-check.md`).

**Getting to green surfaced four real bugs** (all fixed, see docs/DECISIONS.md D-008–D-011):
worker constructed as a module worker but `importScripts()` is classic-only (D-008);
`e2e-prepare.mjs` never built `python-bundle.zip` before `vite build`, so a fresh
checkout had no bundle at all (D-009); `RadioGroup` compared option text to an
index-typed value — never matched, on any click, ever (D-010); `python-bundle.zip`
matched neither the PWA precache glob nor any runtime-caching rule, so it was
unreachable offline (D-011).

## Phase P2 — Full alevel-pure / alevel-statistics / alevel-mechanics + logic-gate-sim / flashcards (§8.7)

Goal: ship the 25 remaining modules across the three maths courses started in P0/P1, plus the
two scheduled S-priority widgets. Content-only in spirit — should need zero `src/` changes
beyond the two widgets + their contract, proving C-5 at scale (not just 4 pilot modules).
Full design in the approved plan (see session); summary below.

### Scope

| Course | New modules (§8.2 order) | Existing |
|---|---|---|
| `alevel-mechanics` | variable-acceleration, forces-and-newtons-laws, moments, projectiles, friction-and-connected-particles | kinematics-suvat |
| `alevel-statistics` | sampling-and-data, probability, binomial-distribution, normal-distribution, hypothesis-testing | *(course.json created once first module lands)* |
| `alevel-pure` | proof, indices-and-surds, quadratics-and-inequalities, algebraic-methods, coordinate-geometry, sequences-and-series, binomial-expansion, trigonometry-1, trigonometry-2, exponentials-and-logarithms, differentiation-2, integration-1, integration-2, numerical-methods, vectors | differentiation-1 |

### Waves

1. **Wave 1 (orchestrator, merged):** §7.3/FR-WID-002 CI check (build-content.mjs) that was
   never implemented in P0 + backfilled 3 undocumented P1 widgets (code-runner, step-reveal,
   data-plot); `LessonContext` extension (`getItemState`/`setItemState`) + wiring in
   `LessonPage.tsx` + `AssessmentPage.tsx`.
2. **Wave 2 (dispatched):** `logic-gate-sim` + `flashcards` widgets; all 5 `alevel-mechanics`
   modules; all 5 `alevel-statistics` modules.
3. **Waves 3–5:** `alevel-pure`'s 15 modules in 3 batches of 5, following §8.2's listed order.
4. **Wave 6 (orchestrator):** doc sections for the 2 new widgets; splice every `ModuleRef` into
   the three `course.json` files in §8.2 order; wire `registry.ts`/`keys.json`.
5. **Gate P2:** full-tree `--strict` (27 modules / 3 courses), vitest/eslint/tsc, non-`@py` e2e
   regression, `git diff --stat` audit against the stated allowlist.

Module-authoring agents: scaffold via `new-module.mjs` against an **isolated temp root** (avoids
schema drift across many agents), replace placeholders with real content, self-validate via
`--strict` on the temp root, hand back only their module folder — never touch any real
`course.json` (shared-file collision risk with N modules per course, unlike P1's 1-module-per-
new-course pilots). Orchestrator splices every `ModuleRef` after review, in §8.2 order.

**Verification is stricter than P1** given the volume: `alevel-statistics`/`alevel-mechanics`
(10 modules) get every assessment answer independently checked by the orchestrator, not sampled
— schema validation checks shape, not correctness, and these two subjects are most prone to
silent, CI-invisible formula errors. `alevel-pure` (15 modules): self-verification required,
orchestrator re-derives at least one module per batch (≥3 of 15).

### Decisions logged: D-012–D-015

D-012 (LessonContext extension shape + `flashcards:${src}` itemId rule), D-013 (logic-gate-sim
circuit JSON schema — SRS gives illustrative, not literal, wording), D-014 (the WIDGETS.md
CI-check gap, fixed as a P2 precondition), D-015 (at least one module demos `flashcards`).

