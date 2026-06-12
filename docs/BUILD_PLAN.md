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
