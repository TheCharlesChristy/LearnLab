# Decision Log

Ambiguities resolved by the orchestrator, per the smallest-decision rule (Appendix A alignment).

| ID    | SRS section | Ambiguity | Decision | Why |
|-------|-------------|-----------|----------|-----|
| D-001 | §8.7 P0 / §12 AC-01, AC-03/07 | P0 ships "no public content", but e2e gates need renderable content | `build-content.mjs` accepts `--root <dir>` (also needed by AC-01). E2E builds against `tests/fixtures/content/` fixture courses; `public/content/` stays empty until P1. | Keeps P0 spec-literal; AC-01 needs a temp-root mode anyway. |
| D-002 | §5.3 vs §8.7 | All v1 widgets are priority M, but the P0 phase row names only `function-grapher` | P0 ships `function-grapher`, `figure`, `quiz` (engine exists in P0). `data-plot`, `step-reveal` land in P1; `code-runner` in P1 (needs the worker); `logic-gate-sim`, `flashcards` in P2 per §8.7. | Phase table governs sequencing; M priority = required by release, not by P0. |
| D-003 | §3.2 | Dependency additions by parallel subagents would collide on `package.json` | T0.1 installs the entire fixed stack (§3.2) up front; thereafter only the orchestrator edits `package.json`. | Prevents parallel-task collisions on shared wiring. |
| D-004 | §4.5 / §5.3 | Who coerces directive attribute types — the Markdown renderer or each widget's `parseProps`? | Attributes pass to `parseProps` verbatim as strings (bare attribute → `true`). Widgets interpret their own prop types. | Pre-coercion corrupted numeric-looking string props (`expr="2"`, `alt="42"`); §4.5 assigns prop validation to widgets. Found by T0.9's doc cross-check. |
| D-005 | §4.1 vs FR-SHELL-001 | Course ids are unique only *within a subject* (§4.1), but the route `#/course/:courseId` keys by id alone | Course resolution scans subjects in catalogue order (maths→physics→cs→ai) and takes the first id match. | Smallest decision; §8 course ids are globally unique in practice. Revisit only if a collision ever ships. |
