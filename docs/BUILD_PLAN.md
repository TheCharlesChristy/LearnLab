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
2. **Wave 2 (merged):** `logic-gate-sim` + `flashcards` widgets (registered, docs added); all 5
   `alevel-mechanics` modules + `course.json` wired; all 5 `alevel-statistics` modules +
   `course.json` created/wired. All 10 content modules' assessments independently re-verified by
   the orchestrator (mechanics + statistics get 100% coverage, not sampled — see verification
   notes below). Two content agents were interrupted mid-run by a session-limit blip and resumed
   via `SendMessage` with no loss of work (their temp-root state survived).
3. **Waves 3–5 (merged, dispatched as one combined wave of 15 rather than 3×5 batches — justified
   by the proven reliability of the `SendMessage` resume mechanism from Wave 2):** all 15
   `alevel-pure` modules, `course.json` wired with all 16 ModuleRefs in §8.2 order. 10 of 15
   agents hit a session-limit rate-limit mid-task; every one resumed cleanly via `SendMessage`
   with zero work lost (temp-root state survived in every case). Every assessment answer across
   all 15 modules independently re-verified by the orchestrator (SymPy/Python cross-checks for
   calculus, hand arithmetic for algebra/trig/vectors/numerical methods) — zero discrepancies
   found.
4. **Gate P2 — GREEN (2026-07-01):** full-tree `--strict` passes clean (5 courses, 29 modules);
   full `vitest run` (467 passed, 7 skipped); `eslint .` and `tsc --noEmit` both clean;
   `playwright test --grep-invert @py` — all 8 Chromium-based specs pass (firefox/webkit fail only
   on missing browser binaries in this sandbox, a pre-existing environment gap, not a regression);
   `git diff --stat` from the Gate-P1 commit confirms every changed file outside
   `public/content/**` is in the approved allowlist (`lesson-context.ts`, `LessonPage.tsx`,
   `AssessmentPage.tsx`, `build-content.mjs`, `src/widgets/{logic-gate-sim,flashcards}/**`,
   `registry.ts`, `keys.json`, `docs/WIDGETS.md`, 6 test-mock updates, `docs/BUILD_PLAN.md`/
   `DECISIONS.md`), and the content diff touches only `alevel-mechanics`/`alevel-statistics`/
   `alevel-pure`.

Found and fixed one real bug during Gate P2: the FR-WID-002 doc-coverage test mutated the real
repo `docs/WIDGETS.md` in place to exercise its failure path, racing any other test file shelling
out to `build-content.mjs` concurrently (checkWidgetDocs always reads that file regardless of
`--root`). Added a `--docs-file` CLI override (test-only seam) so the test uses a scratch copy
instead of shared repo state.

**5. CI confirmation (2026-07-01, real GitHub Actions — all 3 Playwright engines available there,
unlike this sandbox):** pushing Gate P2's commit surfaced a real webkit-only e2e failure
(`progress-roundtrip.pw.ts`, deterministic across all 3 Playwright retries — chromium/firefox
green) in code that predates P2 and that the P2 diff never touched. Root-caused to an optimistic
UI update in `LessonPage.tsx`'s manual-completion handler (showed "Lesson completed" before the
`markLessonComplete` write resolved) — fixed by reordering the await (D-017). Could not be
reproduced locally (this sandbox has no webkit binary and the available GitHub token lacks
`actions:write`/artifact-download scope), so the fix was verified the only way available: pushed
and re-ran real CI. The next run (`8eb8bef1`) is **fully green — python, web, and e2e (chromium +
firefox + webkit) all pass.** Gate P2 is CI-confirmed green, matching P0/P1's bar.

### Wave 2 verification notes

All 10 mechanics/statistics assessments were independently re-derived by the orchestrator (not
sampled): SUVAT/F=ma/moments/friction arithmetic by hand, all binomial probabilities and
`hypothesis-testing`'s critical regions via exact `comb(n,k)` summation in Python, normal-
distribution Φ(z) values cross-checked — zero discrepancies found across all 10 modules. Current
full-tree `--strict` has exactly one remaining error: `variable-acceleration`'s forward reference
to `alevel-pure`'s `integration-1` (lands in Wave 5) — expected, not a defect.

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

## Phase P3 — Full alevel-physics / alevel-cs (§8.7)

Goal: ship the 22 remaining modules across the two courses named in §8.7's P3 row. Exit
criterion is just "MVC" — no new widget is scheduled for P3 (unlike P2's `logic-gate-sim`/
`flashcards`), so this phase should need **zero `src/`/`python/` changes at all**: every module
uses only the widgets and §6.7 Python components that already exist. That's a strictly stronger
C-5 proof than P2 (which still needed 2 new widgets + a contract extension).

### Scope

| Course | New modules (§8.3/§8.4 order) | Existing |
|---|---|---|
| `alevel-physics` | measurements-and-uncertainty, particles-and-quantum, waves-and-optics, mechanics-and-energy, materials, electricity-dc, further-mechanics-circular-shm, thermal-and-gases, fields-1-gravitational-electric, fields-2-magnetic-and-induction, nuclear-and-radioactivity | *(course.json created once first module lands — this is physics' first content, no P1 pilot per D-007)* |
| `alevel-cs` | programming-fundamentals, data-structures, algorithms-1-search-sort, algorithms-2-complexity-graphs, data-representation, computer-architecture, operating-systems-and-software, networks-and-the-web, databases-and-sql, paradigms-oop-functional, theory-of-computation | boolean-algebra-and-logic (P1 pilot) |

Same module-authoring discipline as P2: agents scaffold via `new-module.mjs` into an isolated temp
root, write real content, self-validate `--strict`, hand back only their own module folder —
never touch any real `course.json`. Orchestrator splices every `ModuleRef` after review, in
§8.3/§8.4 order, then creates `alevel-physics/course.json` fresh (mirroring how
`alevel-statistics/course.json` was created in P2).

All 22 modules dispatched as one wave (proven reliable at this scale by P2's 15-module
`alevel-pure` wave, including its `SendMessage`-resume path for session-limit interruptions).

**Verification:** `alevel-physics` (11 modules) gets every assessment answer independently
re-derived by the orchestrator, not sampled — continuous, formula-driven numeric answers (SUVAT,
circuits, fields, SHM, nuclear decay) are exactly the class of error P2 found needed 100%
coverage for maths/mechanics/statistics. `alevel-cs` (11 modules): self-verification required
from each agent, plus the orchestrator re-derives/re-checks at least 3 of 11 — weighted toward
the numeric-conversion-heavy modules (`data-representation`, `algorithms-2-complexity-graphs`)
where exact-answer risk is highest, even though most CS content is definitional/lower-risk than
physics.

Gate P3: full-tree `--strict` (51 modules / 6 courses expected), vitest/eslint/tsc (expected
unchanged — no `src/` diff), non-`@py` e2e regression, `git diff --stat` audit confirming the
diff touches only `public/content/{physics,cs}/**`.

### Gate P3 — GREEN (2026-07-02)

All 22 modules landed. 10 of 11 physics agents and 10 of 12 (new) CS agents hit session-limit
rate-limits mid-task — every one resumed cleanly via `SendMessage` with zero work lost, same
pattern as P2. One real process gap found and fixed along the way: **orphan module folders (not
yet referenced by any `course.json`) are silently skipped by `build-content.mjs`'s MVC checks
entirely** — an early "16 modules already pass strict" read was wrong because 5 of those CS
modules weren't in `course.json` yet, so they were never actually checked; several turned out to
be bare `new-module.mjs` scaffolds (TODO objectives, 1 lesson, 2-question assessment) that had
been silently passing. Fixed by adding every landed module's `ModuleRef` to its course.json
immediately as it lands, rather than batching the splice to the end — this makes `--strict`
authoritative throughout the wave instead of only at the final review.

Full-tree `node scripts/build-content.mjs --strict` passes clean: **6 courses, 51 modules.**
Every one of `alevel-physics`'s 11 assessments independently re-derived by the orchestrator (unit
conversions, SUVAT/projectiles, circuits, fields, SHM, thermal/ideal-gas, nuclear decay/binding
energy) — zero discrepancies. `alevel-cs`: 5 of 12 modules spot-checked in full
(`algorithms-1-search-sort`'s search/sort traces, `data-representation`'s base
conversions/two's-complement/floating-point, `computer-architecture`'s half-adder truth table,
`theory-of-computation`'s FSM traces, `operating-systems-and-software`'s round-robin schedule) —
comfortably exceeding the ≥3-of-11 bar, zero discrepancies. `vitest run` (467 passed, 7 skipped),
`eslint .`, `tsc --noEmit` all clean; `playwright test --grep-invert @py --project=chromium` — all
8 specs pass (firefox/webkit unavailable in this sandbox, checked via real CI as in P2). `git diff
--stat` from the Gate-P2 commit confirms **zero changes outside `docs/BUILD_PLAN.md` and
`public/content/{physics,cs}/**`** — P3 needed no `src/`/`python/`/`schemas/` changes at all, a
strictly stronger C-5 proof than P2.

## Phase P4 — `ai-foundations` (§8.7)

Goal: ship the 9 remaining modules in `ai-foundations`. Exit criterion is MVC, "leans on
`code-runner` + Python items, incl. an interactive perceptron/NN playground item." Investigated
before dispatch: `learnsdk`'s existing base classes (`QuizItem`, `PlotExplorerItem`,
`SimulationItem`, `MultiStepItem`) and `courselib.ai` (already ships `sigmoid`, `mse`, and a full
gradient-descent linear-regression trainer `train_linreg_1d` with per-epoch history, built and
tested in P1) already cover everything this phase needs — **zero `src/`/`python/` changes
expected here too**, same bar as P3.

### Scope

| Course | New modules (§8.5 order) | Existing |
|---|---|---|
| `ai-foundations` | what-is-ai, search-and-problem-solving, knowledge-and-reasoning, ml-concepts-data-and-evaluation, regression, classification, neural-networks-2-training, modern-ai-transformers-and-llms, ethics-and-safety | neural-networks-1-perceptrons (P1 pilot) |

Prerequisite chain (real dependencies, not just list order): `what-is-ai` (entry point) →
{`search-and-problem-solving`, `knowledge-and-reasoning`, `ml-concepts-data-and-evaluation`} →
`regression` (needs ml-concepts) → `classification` (needs regression's loss/sigmoid framing) →
`neural-networks-2-training` (needs `neural-networks-1-perceptrons` + `regression`'s gradient
descent) → `modern-ai-transformers-and-llms` → `ethics-and-safety` (capstone, needs ml-concepts +
transformers).

The SRS explicitly calls out an "interactive perceptron/NN playground item" for this phase (unlike
other MVC items, which are generic) — assigned to `neural-networks-2-training` specifically, built
as a genuine `SimulationItem`/multi-step trainer with live weight updates and a decision-boundary
redraw each step, not a static plot, mirroring `neural-networks-1-perceptrons`'s existing
`perceptron-explorer.py` (`PlotExplorerItem` + `courselib.ai.sigmoid`) pattern one level up.

Same module-authoring discipline as P2/P3: scaffold into an isolated temp root via `new-module.mjs`,
self-validate `--strict`, hand back only the module's own folder, never touch `course.json`.

**Verification:** the four computation-heavy modules (`ml-concepts-data-and-evaluation` —
precision/recall/F1/confusion-matrix arithmetic; `regression` — gradient-descent traces;
`classification` — sigmoid/threshold calcs; `neural-networks-2-training` — perceptron weight
updates) get every assessment answer independently re-derived by the orchestrator, not sampled —
same numeric-error-prone class P2/P3 found needed 100% coverage. The five conceptual/discursive
modules (`what-is-ai`, `search-and-problem-solving`, `knowledge-and-reasoning`,
`modern-ai-transformers-and-llms`, `ethics-and-safety`) get self-verification required plus
orchestrator spot-check of ≥2 of 5.

Gate P4: full-tree `--strict` (60 modules / 6 courses expected), vitest/eslint/tsc (expected
unchanged), non-`@py` e2e regression, `git diff --stat` audit confirming the diff touches only
`public/content/ai/**`.

### Session-continuity incident (D-019)

This session resumed from a stale checkpoint and independently redid all of Phase P3 from
scratch, unaware that a separate earlier continuation of the same task had already completed P3
(Gate P3 CI-confirmed green) and landed 8 of `ai-foundations`'s 9 new P4 modules on the shared
remote branch. Discovered when the push was rejected. Diffed the redundant local P3 work against
origin's (near-identical) and, after explicit user confirmation, merged (not reset) the two
histories, resolving 4 small conflicts in origin's favour. See D-019 for the full account.

### Gate P4 — GREEN (2026-07-07)

Only one of the 9 planned modules was genuinely missing after the merge: `neural-networks-2-training`
(`modern-ai-transformers-and-llms` already declared it as a dangling prerequisite). Dispatched as a
single well-scoped agent — it built the required "interactive perceptron/NN playground item" as a
genuine `SimulationItem` (mirroring `kinematics-suvat/items/projectile.py`'s tick-driven pattern),
training a perceptron on a small fixed dataset with a live decision-boundary redraw each tick, using
only existing `learnsdk`/`courselib.ai` primitives — zero `src/`/`python/` changes, as planned.

Full-tree `node scripts/build-content.mjs --strict` passes clean: **6 courses, 60 modules.** All 4
computation-heavy P4 modules (`ml-concepts-data-and-evaluation`, `regression`, `classification`,
`neural-networks-2-training`) independently re-derived by the orchestrator, not sampled — one real
bug found and fixed (D-020: an assessment question's own stated convergence definition didn't match
its stored answer). Two of the five conceptual modules spot-checked (`what-is-ai`,
`modern-ai-transformers-and-llms`), comfortably clearing the ≥2-of-5 bar — zero further
discrepancies. `vitest run` (467 passed, 7 skipped), `eslint .`, `tsc --noEmit` all clean;
`playwright test --grep-invert @py --project=chromium` — all 8 specs pass, including
`progress-roundtrip` (confirms the D-017 webkit fix still holds). `git diff --stat` from the
Gate-P3 commit confirms the diff touches only `public/content/ai/**` plus one cosmetic
`alevel-cs/course.json` description line (a benign carry-over from this session's earlier,
pre-merge P3 redo). All six §8.2–8.5 courses (`alevel-pure`, `alevel-mechanics`,
`alevel-statistics`, `alevel-physics`, `alevel-cs`, `ai-foundations`) are now fully MVC.

## Phase P5 — `maths-foundation` bridge (§8.7)

Goal: ship the 4-module `maths-foundation` course (§8.2 — GCSE-grade refresher, `level: "foundation"`).
Unlike P0–P4, §8.7's P5 row has no formal exit criterion (`—`) — this is the smallest, lowest-stakes
remaining phase. The row also names a "spaced-repetition review queue" alongside the bridge course,
but that item is separately listed under §13's "Roadmap (post-P4, prioritised)" as a genuine future
feature (SM-2-lite spaced repetition over `flashcards` + missed questions) — not a P5-scoped content
deliverable. Scoping P5 to the content course only; the review queue is a `src/` feature for a future
phase, out of scope here (P5 itself needs zero `src/`/`python/` changes, same bar as P3/P4).

### Scope

| Course | New modules (§8.2 order) | Existing |
|---|---|---|
| `maths-foundation` | algebra-essentials, quadratics-intro, trigonometry-basics, graphs-and-functions | *(course.json created fresh — first content for this course)* |

Prerequisite chain: `algebra-essentials` (entry point, no prerequisites) → `quadratics-intro` (needs
algebraic manipulation) → `graphs-and-functions` (needs both algebra and an intro to quadratics, for
plotting parabolas alongside lines) → `trigonometry-basics` has no real dependency on the other three
(SOHCAHTOA and right-angled triangles stand alone) but is ordered last per §8.2's own listed order.

Same module-authoring discipline as P2–P4: scaffold via `new-module.mjs` into an isolated temp root,
self-validate `--strict`, hand back only the module's own folder, never touch `course.json`.
Orchestrator creates `maths-foundation/course.json` fresh after reviewing all 4 modules, mirroring
`alevel-statistics`/`alevel-physics`'s first-content pattern from P2/P3.

**Verification:** all 4 modules are GCSE-grade algebra/trig — lower-risk than A-level content, but
still fully numeric/formula-driven, so the orchestrator independently re-derives every assessment
answer across all 4 modules (not sampled), consistent with the precedent that any module dominated by
exact numeric answers gets full coverage regardless of nominal difficulty level.

Gate P5: full-tree `--strict` (64 modules / 7 courses expected), vitest/eslint/tsc (expected
unchanged), non-`@py` e2e regression, `git diff --stat` audit confirming the diff touches only
`public/content/maths/maths-foundation/**`.

### Gate P5 — GREEN (2026-07-07)

All 4 modules landed cleanly in one wave with no session-limit interruptions. Full-tree
`node scripts/build-content.mjs --strict` passes clean: **7 courses, 64 modules.** Every
assessment answer across all 4 modules independently re-derived by the orchestrator (algebra,
factorising, SOHCAHTOA/Pythagoras trig computed via Python's `math` module) — zero discrepancies.
`vitest run` (467 passed, 7 skipped), `eslint .`, `tsc --noEmit` all clean; `playwright test
--grep-invert @py --project=chromium` — all 8 specs pass. `git diff --stat` confirms the diff
touches only `public/content/maths/maths-foundation/**`.

This closes out every content phase in §8.7 (P0–P5). All 7 courses across 4 subjects
(`maths-foundation`, `alevel-pure`, `alevel-mechanics`, `alevel-statistics`, `alevel-physics`,
`alevel-cs`, `ai-foundations`) are now fully MVC. Remaining §8.7/§13 items are roadmap-only
(spaced-repetition review queue, per-question partial credit for `multi`, content search, printable
lesson view, optional cloud-drive sync) — none are gated phases.

## Phase P6 — §13 roadmap: engine features + 4 new widgets + 3 authoring skills

Goal: implement all six §13 roadmap items (spaced-repetition review queue, the 4 named widget
candidates, `multi` partial credit, content search, printable lesson view, cloud-drive sync) plus
three new Claude Code skills for content authoring (create lesson/module/course; research for new
content; break down an existing resource into lessons/modules/courses). Unlike P2–P5 this is
engine work, not content — same "contracts pinned first" discipline as P0/P1, not the content
wave's scaffold-into-temp-root pattern.

### Contracts pinned first (orchestrator, Wave 1)

**D-021 spaced-repetition review queue (done):** new additive `reviewState` Dexie table
(`.version(2)`), pure SM-2-lite algorithm in `src/progress/srs.ts`, `recordReview`/`seedReviewItem`
write API in `db.ts`, `ProgressExport` bumped to `exportVersion: 2` with full v1-backward-compat
import handling, `LessonContext` extended with `recordReview`/`seedReviewItem` (both construction
sites wired), `Flashcards.tsx` and `QuizEngine.tsx` wired to feed the queue. 494 tests / lint / tsc
green before dispatching the consumer (the review-queue UI page).

**D-022 content search index (next):** extend `build-content.mjs` to emit
`content/search-index.json` from lesson markdown bodies; new schema; a dependency-free client-side
`src/search/` query module (substring/token scoring — no new npm dependency, consistent with the
project's pinned-stack philosophy).

**D-023 `multi` partial credit:** supersedes §4.6 v1's "no partial credit" rule for `multi`
questions only (mcq/numeric/text stay boolean). Algorithm: `max(0, (correctSelected -
incorrectSelected) / totalAnswers)`, in `[0, 1]`. `QuizEngine`'s per-question `correct: boolean`
becomes a `points: number` accumulated into `score`; feedback UI gains a third "Partially correct
(NN%)" state alongside Correct!/Incorrect.

**D-024 widget schemas for the 4 named candidates** (each a full WidgetDef + docs section, same
process as `logic-gate-sim`/`flashcards` in P2):
- `vector-field`: `{fx, fy}` mathjs expressions in x,y (reuses the pinned mathjs `compile`,
  NFR-SEC-002, same as `function-grapher`), plots an arrow grid over a configurable range.
- `geometry-canvas`: a `{shapes: [...]}` JSON describing points/lines/circles/labels on a
  draggable 2D canvas — an interactive construction, not a static `figure`.
- `circuit-sim` (analog): a `{components: [...], connections: [...]}` JSON describing a simple
  series/parallel DC circuit (resistors, one voltage source) that computes and displays current/
  voltage at each node via Ohm's law/Kirchhoff's laws — the analog counterpart to `logic-gate-sim`.
- `truth-table`: given a boolean **expression string** (e.g. `A AND (B OR NOT C)`, reusing
  `logic-gate-sim`'s AND/OR/NOT/XOR/NAND/NOR vocabulary as function-call-style tokens), parses and
  evaluates it to render the full truth table — complementary to `logic-gate-sim`'s circuit-diagram
  approach, not a duplicate of it.

**D-025 cloud-drive sync:** File System Access API (`showSaveFilePicker`/`showOpenFilePicker`,
Chromium-only) reusing the existing `ProgressExport` JSON shape verbatim — a live file handle for
"Save to synced file" / "Load from synced file" in Settings, not a new data format or a background
sync daemon. Feature-detected; hidden with a note on unsupported browsers (Firefox/Safari), where
the already-shipped manual export/import remains the fallback.

**D-026 printable lesson view:** a `@media print` stylesheet (hide nav/buttons/sidebar) + a "Print
this lesson" button on `LessonPage`, using `window.print()` — no new data or route.

### Waves

1. **Wave 1 (orchestrator, in progress):** D-021 spaced-repetition contract (done, committed).
   D-022 search-index pipeline emission (next, orchestrator-owned like the P2 WIDGETS.md check).
2. **Wave 2 (parallel subagents):** review-queue UI page + nav wiring (consumes D-021); search UI
   page + nav wiring (consumes D-022); `multi` partial credit implementation (D-023, `src/quiz/**`
   only); printable lesson view (D-026); cloud-drive sync (D-025, `SettingsPage.tsx` + one new
   module); 4 widgets (D-024); 3 Claude Code skills (`.claude/skills/**`, research + write, no
   `src/` changes).
3. **Gate P6:** full `vitest run`/`eslint`/`tsc`, e2e regression (chromium), a fresh AC-03-style
   export/import round-trip check covering `reviewState`, manual smoke of the review queue and
   search UI, `git diff --stat` audit against the allowlist above.

### Gate P6 — GREEN (2026-07-07)

All 12 Wave 2 tasks landed cleanly in one parallel wave (11 subagents + orchestrator-authored
Wave 1 contracts), zero session-limit interruptions. Orchestrator integration after review: wired
all 4 new widgets into `registry.ts`/`keys.json`/`schemas/widget-keys.json`, wrote all 4
`docs/WIDGETS.md` sections (3 from agent drafts, `circuit-sim`'s written by the orchestrator after
independently re-deriving its nested series/parallel worked example — see D-024), wired `/review`
and `/search` routes into `router.tsx` and nav links (with a live due-count badge) into
`AppLayout.tsx`, extended the shared `progressMock()` test fixture for the new `src/progress`
surface.

**Full suite:** `vitest run` — 700 passed, 7 skipped (up from 494 pre-P6); `eslint .` and
`tsc --noEmit` both clean; `npm run build` succeeds, all chunks within the NFR-PERF-001 budget
(4 new lazy widget chunks + `ReviewPage`/`SearchPage` chunks, all comfortably under 150 KB).
`playwright test --grep-invert @py --project=chromium` — all 8 pass (one real fix needed: the
AC-03 round-trip e2e asserted `exportVersion === 1`, now `2` per D-021 — extended `DbDump`/
`expectSameProgress` to also round-trip `reviewState`).

**Manual browser verification** (real headless Chromium against `vite preview`, per this session's
UI-change discipline): screenshotted the catalogue, `/search` (typed "derivative", got 18
highlighted, correctly-ranked results across every course), `/review` (empty-queue state), and a
real lesson page in both normal and `@media print` emulation (nav/breadcrumb/progress-bar/action
row correctly hidden, content readable full-width, forced light background, interactive
`function-grapher` widget renders its current state cleanly on paper).

**Verification of computation-heavy pieces:** independently re-derived `circuit-sim`'s nested
series/parallel example by hand (total resistance 22 Ω, total current ≈0.545 A, branch currents
≈0.327 A / ≈0.218 A summing back to the total) — matches the shipped algorithm exactly.
`scoreMulti`'s worked examples (full credit, partial both directions, floored-at-zero) verified
against the pinned D-023 formula. `sm2Step`'s repetition/interval/easiness-factor progression
spot-checked against the standard SuperMemo-2 algorithm.

**One real bug found and fixed during Gate P6 (not logged as a numbered decision — a process
mistake, not a design ambiguity):** the initial e2e run showed the AC-01 catalogue tests failing
to find the fixture course. Root-caused to the orchestrator's own leftover manual `vite preview`
process still bound to port 4173 from an earlier browser smoke-test — Playwright's
`reuseExistingServer: !process.env.CI` reused it instead of running `scripts/e2e-prepare.mjs`, so
the fixture-course merge never happened. Killed the stray process and reran clean; not a code
regression.

`git diff --stat` from the Gate-P5 commit confirms every changed file matches the plan's stated
scope: `src/progress/**` (D-021), `scripts/build-content.mjs` + `schemas/search-index.schema.json`
(D-022), `src/quiz/**` (D-023), `src/widgets/{vector-field,geometry-canvas,circuit-sim,truth-table}/**`
+ registry wiring (D-024), `src/sync/**` + `SettingsPage.tsx` (D-025), `LessonPage.tsx` +
`src/index.css` (D-026), `src/search/**` + `SearchPage.tsx`, `src/app/pages/ReviewPage.tsx`,
`router.tsx`/`AppLayout.tsx` (orchestrator wiring), `.claude/skills/**` (3 new skills), plus the
test-fixture/doc updates each of those required. All six §13 roadmap items are now shipped.

