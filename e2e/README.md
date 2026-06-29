# LearnLab end-to-end suite (Playwright)

This directory holds the Playwright e2e tests for the release-gate acceptance
criteria (SRS §11 E2E row, §12). Run them with:

```sh
npm run test:e2e                      # whole suite (what CI runs)
npx playwright test --grep @py        # ONLY the @py suite (AC-02/04/10)
npx playwright test --grep-invert @py # ONLY the non-@py suite (AC-01/03/05/07)
npx playwright test --project=chromium --grep-invert @py   # fast local loop
```

`scripts/e2e-prepare.mjs` (invoked by the `webServer` in `playwright.config.ts`)
does a real `vite build`, then stages `dist/content/` so it holds **both**:

- the **real pilot modules** from `public/content/` (e.g. `differentiation-1`
  with `items/power-rule-quiz.py`, `kinematics-suvat` with `items/projectile.py`)
  — the @py specs target these; and
- the **fixture course tree** from `tests/fixtures/content/valid/`
  (`maths/test-course/pipeline-module`) merged in beside the real courses — the
  non-@py specs target this (decision D-001; proves the C-5 zero-`src/` invariant
  from the app side).

It then regenerates `dist/content/index.json` with `build-content` over the
merged tree, so the catalogue lists the fixture course **and** the four real
pilot courses, and prints the course list as a sanity check.

## Two tiers of specs

### Non-`@py` (run everywhere)

| AC    | File                       | What it proves                                                            |
| ----- | -------------------------- | ------------------------------------------------------------------------ |
| AC-01 | `catalogue.pw.ts`          | Fixture content (files only) is indexed and renders: catalogue→…→lesson.  |
| AC-03 | `progress-roundtrip.pw.ts` | Complete lessons + assessment → export → erase → import restores state.   |
| AC-05 | `validation-gate.pw.ts`    | `build-content` fails bad content with file + JSON pointer / line.        |
| AC-07 | `keyboard-assessment.pw.ts`| Keyboard-only assessment run, feedback read via `aria-live`.              |

These run in every environment (no network beyond the local preview server).
The fixture-targeting locators are scoped/`exact` so they stay unambiguous now
that real pilot courses share the catalogue (e.g. "Mathematics" the subject
heading vs "A-level **Pure Mathematics**" the course title).

### `@py` (real Pyodide — CI only; auto-skip locally)

| AC    | File                  | What it drives                                                                              |
| ----- | --------------------- | ------------------------------------------------------------------------------------------ |
| AC-02 | `py-ac02.@py.pw.ts`   | `items/power-rule-quiz.py` (6.13(a)) loads via real Pyodide, marks generated answers, reaches the summary, records an `attempts` row, shows the module in progress — "no JS written". |
| AC-04 | `py-ac04.@py.pw.ts`   | `items/projectile.py` (6.13(b)) loads online, then OFFLINE (`context.setOffline(true)`) the lesson + sim still render from the SW cache and a progress write succeeds (FR-PWA-003). |
| AC-10 | `py-ac10.@py.pw.ts`   | `items/projectile.py` sustains ~30 Hz ticks with ≤ 5 % missed ticks (NFR-PY-004).          |

The `@py` tag is in each **test title**, so `--grep @py` / `--grep-invert @py`
select the tiers (the file-name `@py` is just for humans).

#### Why they auto-skip locally

The @py specs need the **real** Pyodide runtime (CPython on WebAssembly), which
the worker loads from the pinned jsDelivr CDN (`src/config.ts`
`PYODIDE_BASE_URL`, `0.27.7`). That CDN is reachable on the open internet (CI =
GitHub Actions), but **blocked by this sandbox's egress policy** (and in many
local setups). So each @py test calls `skipUnlessPyodideReachable()` first
(`e2e/py-helpers.ts`): a short `fetch` probe of the pinned `pyodide.js`. If it
fails (403 / timeout / TLS), the test is `test.skip()`ed with a clear "Pyodide
unreachable" message — so `npm run test:e2e` stays **green** locally instead of
hard-failing on a network constraint outside the app's control. In CI (where
`ci.yml`'s `e2e` job runs `npx playwright install --with-deps chromium` +
`npm run test:e2e` on open egress) they run end-to-end.

#### AC-10 measurement method and its limitation

The host drives ticks via `requestAnimationFrame`, firing a `TICK` whenever
≥ `1000/tick_hz` ms (33.3 ms at 30 Hz) have elapsed and passing the real wall
delta as `dt` (`src/python/use-py-item.ts`). The projectile re-renders each
tick and shows `t = {sim_time:.2f} s`, where `sim_time` accumulates `dt`.

`py-ac10.@py.pw.ts` measures the **effective tick rate** by counting *distinct*
`sim_time` readings (each new value = one applied tick) over a wall-clock
window, sampled in-page on every animation frame (so no value is missed):
`distinct / wall_seconds = effective Hz`, asserted `≥ 28.5 Hz` (≤ 5 % missed
ticks). It also asserts `sim_time` advances ≈ wall time within 5 % (the
integrator keeps pace; no double-applied ticks).

**Limitation.** The reference item 6.13(b) **pauses when the projectile lands**
(`y` returns to 0), so it cannot tick continuously for a full 20 s without
changing `src/` or the content (both out of scope for this task). The test
therefore configures the **longest achievable flight** (max angle 80°, max
speed 40 m/s → ~8 s) and measures cadence across that flight window. The 20 s in
AC-10 is a *duration* target on the reference machine; the gated *quantity*
(sustained 30 Hz, ≤ 5 % drops) is what this test measures, over the longest
window the unmodified item allows. A continuous 20 s run would require a
non-pausing sim variant (a content/app change, out of scope here).

## Local CPython evidence for the SDK halves

The @py specs can only be *seen* passing in CI. The Python-side behaviour of the
items they exercise — `QuizItem` marking, `SimulationItem` ticking,
serialisation, `learnsdk`/`courselib` — is independently proven locally by the
headless CPython tests (`python/tests/`, run with `npm run test:py`), including
`python/tests/test_reference_items.py` which exercises the reference items
6.13(a)/(b) directly. Together: CPython proves the SDK half locally; the @py
Playwright specs prove the host↔worker↔real-Pyodide half in CI.

## AC-06 (Lighthouse)

AC-06 is **not** in this Playwright suite; its disposition is unchanged — see
`e2e/lighthouse-check.md` (run manually / wired via Lighthouse CI in deploy).
