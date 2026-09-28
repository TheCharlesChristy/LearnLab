# Learning laboratory implementation audit

Date: 27 September 2026. Baseline: `024edfcd2a5c140ac562b1543abb14cba3b4ecf3`.
This is an implementation inventory, not a claim that the goal has been met.

## Checkout and delivery boundary

The owner's working directory is on `claude/learning-app-ux-analysis-6x4ygd`, two
commits ahead of `origin/main`. Those commits deliver FSRS, real review sessions,
confidence, the Today panel, orphan removal and font fixes. They are an existing
dependency, not part of this implementation's authored diff. Use that branch as
the base for a focused initial PR; document the dependency before eventual main
delivery. No merge or deployment is authorised.

Uncommitted edits were present in `docs/ARCHITECTURE.md`, `package.json`,
`scripts/build-content.mjs`, `scripts/build-python-bundle.mjs`, and `vite.config.ts`,
plus an untracked `docs/LEARNLAB_AGENT_GOAL.md`. They fix the local dev loop and CSP
and contain the owner brief. They remain untouched in the original checkout.
Implementation uses a managed worktree created at baseline HEAD. The owner's
attachment is copied as a run input so future work does not depend on an attachment
path. There is no applicable repository AGENTS.md; the LearnLab skills apply.

## Shipped versus proposed

| Area | Observed implementation | Gap against owner goal |
| --- | --- | --- |
| Shell | React hash routes; Today panel recommends resume/review; catalogue, course/module/lesson, search, progress/settings | No capability map or campaign workspace |
| Content | Build-time Ajv validation; Markdown and eight screen types; 15 widgets | Fixed subject/level vocabulary; duplicated registries; orphan modules only warn |
| Circuits | `circuit-sim` validates recursive resistor series/parallel trees and calculates static results; potential-divider Python item | No interactive repair loop, switch/open-fault model or assessment-bearing workbench |
| Progress | Dexie v3, guarded writes, JSON export/import, local FSRS review | v2 event log, assistance and independence evidence, active-time rules absent |
| Lessons | Real interaction gates, authored hints, worked/faded screens, read-aloud | Correct-answer gates can strand learners; widget exploration state is not generalised |
| Review | Authored checkpoints resolved into real cards; FSRS and confidence | Mostly repeats the same question; free-text reflection/self-grade must not become independent mastery |
| Accessibility | Shared controls, focus, themes, read-aloud, game-kit tap alternatives | Each new real activity still needs keyboard/touch/reader and expanded-text testing |
| Offline | Service worker precaches app chunks/fonts/Python bundle, runtime caches visited content | No complete pack acquisition or atomic readiness; visited-only caching isn't a download guarantee |
| v2 | `src/v2/rollout.ts` feature flag/negotiation and tests; ADR, graph/Studio/vertical-slice plans | Graph schemas, graph engine, plugin registry, Studio and v2 persistence are not implemented |
| Authoring | `new-module.mjs`, `new-item.mjs`, docs and four skills | No executable intake, run ledger, plan traceability or whole-course authoring workflow |

The remote `agent/experience-runtime-v2-a1-a4` branch was inspected: it contains
the same contract work, not a hidden graph engine to reuse. Do not build a second
runtime outside `src/v2/`. The existing `V2_SUPPORTED_CAPABILITIES` literals are
negotiation contract fixtures, not proof that their named runtime capabilities
exist. Capability discovery must make that distinction explicit until implemented.

## First-slice update

The table above records the inspected baseline. The implementation now adds the
first registered `choice`/`circuit` graph, event replay, explicit pack acquisition,
retained exposure, recovery and CLI scaffold/validate/stage commands. See ADR-002
and [activity contracts](ACTIVITIES.md) for exact bounds. Four of the ten planned
circuits episodes are staged; history, the remaining investigation tools and owner revision
remain pending. The older rollout fixtures still do not establish typed effects.

## Deliberate choices

Continue ADR-001's additive migration. Implement graphs and activities in `src/v2/`,
keep v1 routes and progress usable, reuse the existing shell and `src/progress`
write boundary, and extend review through public APIs. Local Studio shares the
same runtime and validators and remains excluded from ordinary learner builds.
Pack content remains declarative JSON; executable extensions are registered code.

The new circuits campaign overlaps `electricity-dc` deliberately: it is a shorter
investigation-based introduction/bridge, not a replacement or duplicate claim of
complete A-level coverage. Resistivity, non-ohmic devices, internal resistance and
potential dividers remain in the existing deeper course unless a bounded pilot
need justifies them. Do not migrate its learners or rename its stable IDs.

New course metadata describes subject identity, audience, depth, prerequisites and
bounded outcomes rather than extending school-only enums one course at a time.
Existing v1 schemas remain compatible. Version pack/runtime/assessment/state
contracts explicitly and fail closed for unknown versions.

## Guidance reconciliation

The owner's brief supersedes the adult-tone and compulsory-success rules in the
older pedagogy skill. Adult presentation can be playful when its actions and story
carry conceptual work. Difficulty is calibrated to task and baseline; there is no
universal 75% target. The proposed recovery policy is hint, alternative representation,
worked example, prerequisite recommendation, retry and assisted exit. Its sequence
is a contextual hypothesis to test, not an evidence-certified universal ladder.

An assisted exit records help and completion with help, never independent mastery.
Reflection, exemplar comparison and self-report remain unverified evidence. A
correct retry following answer exposure is practice. Independent evidence requires
a fresh marked task without assistance, with explanation/prediction and transfer
where the capability requires them. Existing v1 completion keeps its old meaning;
do not silently reinterpret legacy completion as independent competence.

## Delivery sequence

1. Audit/research/acceptance and executable run intake/planning foundation.
2. Add graph contracts and a real circuits episode; production-browser playtest
   and revise before using the pattern throughout the course.
3. Extend the same harness with course scaffolding, pack validation, Studio preview,
   repeatable model checks, diagnostics and Git delivery.
4. Author ten circuits episodes through the already-started run.
5. Author four history episodes through a separate run using the same tools.
6. Verify pack download, restart offline, assistance, review, exports, import,
   rollback and responsive/accessibility operation; deliver focused dependent PRs.
7. Obtain the owner's written play report, revise, reverify. The goal remains active
   until this last cycle is complete. Unobserved week/month retention is unobserved.

Platform PRs contain only narrow demonstration content. Broad pilot packs use
separate branches/PRs against the required platform changes, with explicit ordering.

## Local Studio update

The opt-in loopback Studio now edits validated source/scene JSON with 20-snapshot Undo/Redo,
inspects branch edges and previews arbitrary scenes using the same learner workspace. CLI
`preview`/`inspect` and a versioned envelope reproduce seeds/help/checkpoints. Seeds reorder
choices only; every preview scene has prior exposure. Storage and speech preferences stay in
memory, with eight archives retaining original content context. ADR-003 records the boundary.
Graph 0.1.1 moves bridging/debrief copy into optional authored metadata. Circuit
0.1.1 adds finite source and observation-window controls with integrated charge/energy
readings; pack version 4 now contains four episodes. Visual graph authoring,
fresh-task generation, complete pilots and the owner cycle remain pending. Git
delivery automation is implemented in the subsequent focused slice. This update
does not reinterpret the baseline table.
