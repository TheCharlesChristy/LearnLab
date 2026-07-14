# LearnLab Experience Runtime v2 — implementation plan

Status: proposed  
Programme owner: LearnLab maintainers  
Last updated: 2026-07-10

## 1. Executive summary

LearnLab v1 is a strong static learning application, but its atomic product model is still a
linear lesson: either a Markdown document or an ordered array of gated screens. Experience
Runtime v2 changes that atomic model to a versioned graph of scenes, activities, goals,
outcomes, effects, and transitions. This enables persistent story state, branching,
consequential simulation, reusable game mechanics, mastery-aware review, and an authoring
workflow that does not require hand-editing several interdependent manifests.

The programme uses a strangler migration:

1. preserve all v1 content and routes;
2. add a v2 runtime behind an explicit feature/capability boundary;
3. adapt v1 screen sequences into linear v2 graphs;
4. prove the new model with one complete, measured vertical slice;
5. improve authoring and learner navigation around the proven model;
6. migrate content selectively, keeping legacy Markdown readable until retirement is justified.

This is not a visual reskin. The product-level change is from:

`prompt -> interaction -> feedback -> Continue`

to:

`world problem -> learner action -> visible consequence -> diagnosis -> new capability -> payoff/choice`.

## 2. Outcomes

### 2.1 Learner outcomes

- A learner performs a meaningful action within 20 seconds of starting an episode.
- Their actions can change persistent world state and later scenes.
- Feedback explains the mechanism and changes what the learner can do next.
- Courses feel like coherent campaigns rather than catalogues of pages.
- Review uses real, renderable learning items and connects back to the campaign.
- Difficulty and scaffolding can respond locally to demonstrated mastery without a backend.
- All experiences retain keyboard, screen-reader, reduced-motion, read-aloud, offline, and
  mobile support.

### 2.2 Author outcomes

- A new course can be scaffolded without manually editing a subject enum or registry.
- A new episode can be authored and previewed without writing application source.
- Existing activity plugins can be recombined with different presentation, goal, feedback,
  effect, and transition policies.
- Content schemas, authoring forms, documentation, and validation derive from one plugin
  contract rather than duplicated registries.
- The validation loop identifies unreachable branches, invalid state references, inaccessible
  controls, missing feedback, and broken content dependencies before merge.

### 2.3 Maintainer outcomes

- v1 content remains functional throughout migration.
- New runtime subsystems keep the existing import-boundary discipline.
- Content-only changes continue to require no `src/**` edits when using shipped capabilities.
- Bundle, CSP, offline, privacy, and IndexedDB export/import contracts remain explicit gates.
- Every release can be assessed against delayed learning and voluntary return, not only lesson
  completion.

## 3. Non-goals

- Accounts, authentication, hosted learner profiles, or a LearnLab backend.
- Competitive leaderboards or public social features.
- An AI tutor in the first v2 programme.
- Converting all legacy content before the vertical slice proves the architecture.
- Generative story text at runtime.
- Arbitrary JavaScript predicates or `eval` in content.
- Replacing the existing learning-science rules with engagement-only optimisation.
- Native mobile applications.

## 4. Architectural invariants

The programme must preserve or deliberately supersede these constraints through an ADR and SRS
amendment before implementation:

1. **Static and client-only.** The deployed application remains hostable on GitHub Pages.
2. **Local-first privacy.** Learner state and diagnostic events stay on-device. Playtest export
   is explicit and learner/tester initiated.
3. **Content remains data.** Shipping a course that uses registered capabilities does not touch
   `src/**`.
4. **No arbitrary evaluation.** Conditions and effects use typed registered operators.
5. **Versioned persistence.** Every authored pack and saved run declares a version and has a
   migration/fallback policy.
6. **Backward compatibility.** Markdown and v1 screen sequences remain supported during the
   migration window.
7. **Genuine gating.** Progress requires a learner action that supplies evidence or changes the
   model; no prose-only Next screen is introduced through v2 composition.
8. **Mastery-linked rewards.** Celebration and unlocks attach to demonstrated capability, not
   login/opening activity.
9. **Accessibility is a plugin contract.** New mechanics must define keyboard, focus,
   announcement, contrast, reduced-motion, and touch behaviour.
10. **Engine/content scope remains reviewable.** A PR should not mix platform changes with broad
    content rewrites; demonstration content is the narrow exception.

## 5. Target architecture

```text
Course pack
  -> experience graph
    -> scene runner
      -> presentation renderer
      -> activity plugin
        -> normalised activity events/outcomes
          -> goal evaluator
          -> feedback and hint policy
          -> typed effect reducer
            -> run state + append-only event log
            -> mastery evidence
              -> review and recommendation selectors
```

### 5.1 Course pack

A v2 course pack is a self-contained, versioned content directory. It declares:

- identity, audience, taxonomy, theme, and estimated scope;
- required engine capability versions;
- ordered or recommended campaigns/episodes;
- a skill graph and prerequisite relationships;
- experience graph files;
- local assets and attribution;
- reviewable items;
- state schema/version and migration metadata.

Subjects and levels become validated content taxonomy values rather than TypeScript unions. The
build discovers packs and episodes; authors do not maintain duplicate course/module/lesson
registries.

### 5.2 Experience graph

The precise structural contract is in `docs/EXPERIENCE_RUNTIME_V2_SCHEMA.md` and its two JSON
Schemas. The B1 schema deliberately checks closed object/operator shapes; B2 adds the
cross-file checks that cannot be expressed in JSON Schema alone (references, reachability,
state-path declarations, capability compatibility, and mandatory-cycle termination).

An experience contains nodes and transitions rather than only an ordered `screens[]` array.

Each node composes:

- `presentation`: briefing, dialogue, world event, diagram, or concise explanatory frame;
- `activity`: a registered activity plugin plus validated props;
- `goal`: a registered evaluator over activity outputs and run state;
- `feedback`: success, misconception, failure, and hint policies;
- `effects`: typed state changes, unlocks, evidence, and celebration events;
- `transitions`: ordered conditional destinations plus an explicit fallback;
- `review`: optional standalone item metadata;
- `accessibility`: authored labels or alternatives required by the selected capabilities.

Build validation rejects missing destinations, unreachable nodes, invalid state paths,
non-terminating mandatory cycles, unrecognised operators, and activities without a satisfiable
goal.

### 5.3 Activity plugin contract

Every plugin supplies one definition from which the build derives runtime and authoring support:

- stable key and semantic version;
- lazy runtime component;
- input/prop JSON schema;
- normalised output/event schema;
- supported goal evaluators;
- authoring control metadata and defaults;
- preview fixtures;
- persistence/resume policy;
- accessibility contract;
- performance metadata: `loading: "lazy"` and an independently checked gzip chunk budget no
  greater than 150 KB;
- documentation metadata and examples.

The contract separates the activity from its presentation and progression. A circuit simulator,
for example, can be used in direct practice, a repair mission, a diagnostic investigation, or a
design challenge without creating four screen types.

### 5.4 Goals, conditions, and effects

Content uses a small typed operator registry, for example:

- comparisons: equal, range, set equality, regex match, symbolic equivalence;
- activity state: output value, completion state, selected entities, constructed model;
- run state: flag, counter, inventory/capability, prior choice;
- effects: set, increment, append, unlock, emit evidence, checkpoint, celebrate;
- transitions: unconditional, outcome-based, mastery-band, or prior-state condition.

Operators are pure, deterministic, schema-validated, and unit-tested. Content never supplies
executable code.

### 5.5 Run state and event log

The runtime persists:

- pack, experience, and state-schema versions;
- current node and checkpoint;
- world flags, variables, inventory, and unlocked capabilities;
- decisions and branch history;
- attempts, errors, hints, confidence, and response time;
- emitted mastery evidence;
- completion/ending state.

An append-only local event log is the diagnostic source of truth. Materialised run state is a
projection used for fast rendering and resume. Import/export includes both with versioned
validation and size limits.

### 5.6 Compatibility adapters

- A v1 screen sequence becomes a linear experience graph with one node per screen.
- Existing screen runners are initially wrapped as activity adapters; they are replaced by
  composable plugins incrementally.
- Markdown remains a legacy document experience. It can link into v2 episodes and can be indexed,
  printed, and read aloud.
- Python items become an activity plugin through the existing worker protocol; they do not gain
  DOM or direct progress-store access.

## 6. Product loop and experience design

Every v2 episode should normally implement:

1. **Problem:** show a concrete contradiction, failure, mystery, or target.
2. **Commit:** ask for a prediction or initial action before instruction.
3. **Consequence:** update the simulation/world immediately.
4. **Diagnosis:** make the learner explain, classify, or repair what happened.
5. **Mechanism:** teach only what is needed to make progress.
6. **Faded retry:** repeat with less support and a near-neighbour problem.
7. **Capability:** unlock a real tool, route, or harder action.
8. **Payoff:** resolve the opening problem and make the result visible.
9. **Choice:** offer the appropriate next mission or review.

Narrative dosage follows audience. GCSE/foundation can use richer characters and scenarios;
A-level uses a persistent problem frame; adult/postgraduate material uses authentic professional
missions with minimal whimsy.

## 7. Programme sequencing

### Milestone M0 — Contract approved

Exit gates:

- v2 ADR and SRS amendments approved;
- product principles, non-goals, metrics, and privacy stance recorded;
- one vertical-slice brief selected;
- baseline learner/author measurements captured;
- rollout and rollback strategy agreed.

### Milestone M1 — Runtime alpha

Exit gates:

- graph schema and build validation work against fixtures;
- scene traversal, conditions, effects, checkpoint, and resume work end to end;
- v1 screen adapter renders a representative existing lesson without behavioural regression;
- local event log and export format are versioned;
- unit, integration, and Playwright coverage include branching and resume.

### Milestone M2 — Composition and authoring alpha

Exit gates:

- activity plugin contract supports choice, entry, reveal, one explorable widget, and Python;
- schemas/docs/forms derive from plugin definitions;
- new course/experience scaffolds are immediately valid;
- Studio can edit a graph, configure a supported activity, preview it, and inspect state;
- content lints cover graph integrity and the existing pedagogy rules.

### Milestone M3 — Playable vertical slice

Exit gates:

- one complete campaign chapter ships behind a feature flag;
- it contains persistent state, at least one meaningful branch, three reusable mechanics,
  a delayed review item, and an authored payoff;
- keyboard, screen reader, touch, reduced motion, offline, and resume tests pass;
- playtest results meet the agreed threshold or generate a documented revision cycle.

### Milestone M4 — Learner journey and mastery beta

Exit gates:

- learner home offers Continue, Quick Review, and Recommended Next;
- campaign map communicates current objective, capability progression, and mastery;
- renderable mixed review works across episodes;
- local recommendations use explicit skill evidence and deterministic rules;
- points/celebration are tied to mastery/capability milestones.

### Milestone M5 — Migration rollout

Exit gates:

- migration inventory and course priority order approved;
- search covers Markdown, v1 screens, and v2 experiences;
- at least one legacy-only course has a measured v2 migration path;
- authoring, architecture, screen/widget, and pedagogy documentation are current;
- v1 retirement criteria are recorded, but compatibility is removed only after those criteria
  are met.

## 8. Epic and issue register

The GitHub programme uses one umbrella issue, eight epic issues, and the child issues below.
Numbers are populated in GitHub; the stable IDs here express dependency order.

Published tracking:

- [Programme #67](https://github.com/TheCharlesChristy/LearnLab/issues/67)
- [Epic A #24](https://github.com/TheCharlesChristy/LearnLab/issues/24)
- [Epic B #25](https://github.com/TheCharlesChristy/LearnLab/issues/25)
- [Epic C #26](https://github.com/TheCharlesChristy/LearnLab/issues/26)
- [Epic D #27](https://github.com/TheCharlesChristy/LearnLab/issues/27)
- [Epic E #28](https://github.com/TheCharlesChristy/LearnLab/issues/28)
- [Epic F #29](https://github.com/TheCharlesChristy/LearnLab/issues/29)
- [Epic G #30](https://github.com/TheCharlesChristy/LearnLab/issues/30)
- [Epic H #31](https://github.com/TheCharlesChristy/LearnLab/issues/31)

### Epic A — Product validation, governance, and rollout

- **A1 — Record the Experience Runtime v2 ADR and amend the SRS.** Decide which v1 constraints
  remain normative, define the Studio as developer tooling rather than learner editing, and record
  compatibility and deprecation policy.
- **A2 — Define success metrics and baseline the current product.** Capture author setup time,
  time-to-first-action, exits, hint/error patterns, voluntary continuation, and delayed recall.
- **A3 — Select and specify the vertical slice.** Produce a complete experience brief, learning
  objectives, misconception map, mechanic map, narrative throughline, accessibility plan, and
  verified problem set.
- **A4 — Add feature flags, capability negotiation, and rollback rules.** Ensure v2 packs fail
  closed with actionable errors and v1 remains available during rollout.

### Epic B — Experience graph runtime and state

- **B1 — Define v2 course-pack and experience-graph schemas.** Include nodes, transitions,
  conditions, effects, state declarations, assets, skills, capability versions, and review items.
- **B2 — Build graph validation and content indexing.** Validate references, reachability,
  cycles, state paths, capability versions, and search text; emit deterministic indexes.
- **B3 — Implement SceneRunner and deterministic traversal.** Render one composed scene, evaluate
  goals, apply transitions, handle errors, and preserve genuine interaction gating.
- **B4 — Implement typed effects, run-state projection, and local event log.** Add Dexie tables,
  migrations, export/import, replay tests, and storage caps.
- **B5 — Implement checkpoints, resume, version migration, and v1 adapters.** Adapt screen
  sequences to linear graphs and prove reload/resume and content-version behaviour.

### Epic C — Activity plugins and composable learning mechanics

- **C1 — Define the ActivityPlugin, outcome, goal-evaluator, and accessibility contracts.** Keep
  plugins lazy, deterministic, testable, and isolated from progress storage.
- **C2 — Generate schemas, docs, fixtures, and authoring metadata from plugins.** Remove registry
  duplication while retaining CI coverage and human-readable validation errors.
- **C3 — Adapt core learning interactions.** Cover predict/choice, numeric/text entry,
  self-explanation/reveal, faded step, sort/match, and flash recall with normalised outcomes.
- **C4 — Adapt explorable widgets and Python items.** Support multiple registered goal evaluators,
  observable outputs, resume, hints, and CSP-safe worker execution.

### Epic D — Course packs, scaffolding, and LearnLab Studio

- **D1 — Add auto-discovered course packs and new course/experience scaffolds.** Generate a valid
  pack, episode, skill graph, assets directory, fixtures, and assessment/review starter without
  manual registry edits.
- **D2 — Build the local Studio shell and graph editor.** Developer-only route/tooling with node
  creation, transitions, validation, undo, and safe file export.
- **D3 — Build schema-driven property forms, learner preview, and state inspector.** Preview any
  node/branch with seeded state and inspect events, effects, accessibility, and responsive layout.
- **D4 — Add content linting, asset checks, and migration tooling.** Implemented as strict v2
  authoring lint (format mix, feedback completeness, safe local assets) plus a deterministic,
  review-only legacy migration-plan command. Graph reachability remains a B2 semantic-validator
  invariant; see `docs/V2_LINT_AND_MIGRATION.md`.

### Epic E — Learner journey and narrative presentation

- **E1 — Redesign learner home around Continue, Quick Review, and Recommended Next.** Keep the
  catalogue accessible but make the next valuable action primary.
- **E2 — Build campaign/course maps and capability progression.** Communicate episodes, branches,
  mastery, prerequisites, unlocks, and resumable state without competitive ranking.
- **E3 — Build an immersive SceneShell and narrative presentation primitives.** Add objectives,
  briefings, dialogue/captions, world-state panels, consequence transitions, and debriefs while
  retaining read-aloud and semantic HTML.
- **E4 — Add mastery-linked celebration, optional sound/haptics, motion, and settings.** Implemented
  in `src/experience/sensory`: callers compare two mastery aggregations, so only a newly classified
  `developing` or `secure` skill can be acknowledged. Text feedback is always available; confetti,
  sound, and haptics are opt-in, and motion honours both the OS and the local setting. Preferences
  are browser-local and excluded from progress exports.

### Epic F — Reusable story-game mechanics and vertical slice

- **F1 — Build a shared mission/objective/effect kit.** Provide timer-free objective status,
  staged goals, world meters, tool/capability unlocks, reset/checkpoint, and accessible event
  announcements.
- **F2 — Build the diagnose-and-repair mechanic template.** Observe symptoms, test hypotheses,
  manipulate a model, repair it, and explain the causal mechanism.
- **F3 — Build the experiment-and-infer mechanic template.** Implemented as the lazy
  `experiment-infer` ActivityPlugin plus the pure `evaluateExperimentInfer` mission contract:
  commit a prediction, vary controlled inputs, collect observations, infer a rule, and transfer it
  to a new case. Completion requires the full evidence chain, not bare exploration.
- **F4 — Build design-under-constraints and investigation templates.** Support budgets/trade-offs,
  evidence elimination, multiple valid strategies, and authored misconception feedback.
- **F5 — Author, verify, and playtest the first v2 vertical slice.** Use the relevant research,
  pedagogy, and content-authoring workflows; iterate from evidence and keep engine/content diffs
  separately reviewable.

### Epic G — Mastery evidence, review, and local adaptation

- **G1 — Define the skill graph and normalised evidence model.** Record opportunity, outcome,
  independence, hints, confidence, latency bands, and content version without claiming unsupported
  precision.
- **G2 — Make review items renderable and index all content formats.** Replace ID-only review,
  include standalone context, and search Markdown, v1 screens, and v2 scenes.
  The build emits `content/review-catalogue.json`: v2 items use
  `v2:<pack-id>` plus their authored review id, include their pack content
  version, and remain renderable away from the source scene. The review page
  gives retry/missing-content recovery when that catalogue is stale or absent.
  Search indexes only learner-visible prompts, context, and presentation text;
  answers, feedback, hidden branches, and reveal backs stay out of excerpts.
- **G3 — Build mixed cross-course review sessions.** Implemented: deterministic eight-item
  browser-local sessions interleave due courses/skills, render V2 standalone activities, prevent
  duplicate scheduling, recover unavailable items, and return the learner to the catalogue. See
  `docs/MIXED_REVIEW_SESSIONS.md`.
- **G4 — Add deterministic local recommendations and adaptive scaffolding.** Implemented with
  transparent Continue/Review/Next rules, an always-available browse path, human-readable local
  decision logging, evidence-aware fuller/faded support, and delayed-performance rollback rules.
  See `docs/LOCAL_RECOMMENDATIONS.md`.

### Epic H — Migration, quality, privacy diagnostics, and release

- **H1 — Add privacy-preserving local diagnostics and playtest export.** Project event logs into
  funnels, exit nodes, attempts, hints, branches, and delayed outcomes; export only on explicit
  tester action.
- **H2 — Inventory and prioritise v1 content migration.** Report active/orphaned formats,
  interactivity, feedback gaps, search coverage, reusable assets, and recommended campaign groups.
- **H3 — Define and automate performance, offline, CSP, and storage budgets for v2.** Cover lazy
  plugins, assets, production CSP, service-worker caching, IndexedDB growth, and low-end mobile.
- **H4 — Expand accessibility, visual-regression, and end-to-end test matrices.** Test branching,
  resume, focus, announcements, keyboard goals, touch, colour/contrast, reduced motion, and errors.
- **H5 — Publish contributor docs, skill updates, release gates, and v1 deprecation criteria.** A
  capability is not complete until authors can use it and CI can verify it.

## 9. Critical path and parallel work

Primary critical path:

`A1 -> B1 -> B2/B4 -> B3 -> C1 -> C3/C4 -> F1 -> F5 -> playtest decision`

Parallel paths:

- `A2` and `A3` start immediately after `A1` framing is stable.
- `D1` can begin after `B1`; `D2-D3` require stable schemas/plugin metadata.
- `E1-E2` can prototype early, but production integration waits for run state and recommendation
  contracts.
- `G1` begins once activity outcomes stabilise; `G2-G4` follow runtime persistence.
- `H1-H4` define gates early and implement alongside each subsystem rather than at the end.

No broad content migration begins before F5 has been evaluated. A failed vertical slice should
change the architecture or mechanics before the project multiplies migration cost.

## 10. Testing strategy

### Unit

- Schema fixtures for every valid/invalid branch and operator.
- Pure condition, goal, effect, state projection, recommendation, and migration functions.
- Plugin parsing, output normalisation, and accessibility metadata.
- Deterministic seeded behaviour.

### Integration

- Graph load -> scene -> outcome -> effects -> transition -> persistence.
- Event-log replay equals materialised state.
- v1 adapter behavioural equivalence.
- Python worker activity output and cancellation.
- Review item resolution across content versions.

### End to end

- Complete all endings and recovery paths in the vertical slice.
- Reload at every checkpoint and mid-activity where supported.
- Keyboard-only, screen-reader semantics, touch viewport, reduced motion, and offline.
- Import/export and downgrade/fallback behaviour.
- Production build under CSP; no dev-only Ajv assumptions.

### Content verification

- All numeric/formula answers independently re-derived.
- Distractors map to documented or explicitly derived misconceptions.
- Every branch reaches its intended learning objective.
- Every mechanic has a task and payoff, not bare exploration.
- Delayed review works without surrounding story context.

## 11. Metrics and decision rules

### Learning metrics

- Delayed retrieval at approximately 1, 7, and 21 days where the local schedule permits.
- Transfer to a structurally similar but narratively different problem.
- Independent success after hints/scaffolds are removed.
- Confidently-wrong rate and misconception recurrence.

### Engagement metrics

- Time to first meaningful action.
- Exit node and voluntary next-episode start.
- Return for due review.
- Branch and mechanic completion without farming bare activity.
- Ratio of time acting/reflecting to time passively reading.

### Authoring metrics

- Time from empty pack to first valid playable node.
- Files and registries manually touched.
- Validation errors caught before runtime.
- Percentage of new episodes requiring engine changes.
- Migration effort per lesson/episode.

### Decision rules

- Do not call a mechanic successful from completion rate alone.
- Do not ship a more engaging version if delayed mastery materially falls.
- Do not expand migration until at least one vertical slice meets both learning and voluntary
  continuation thresholds.
- Prefer simpler deterministic adaptation until evidence justifies a more complex learner model.

## 12. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Graph/runtime complexity replaces author complexity with maintainer complexity | Keep operators small, pure, typed, and generated from one contract; prove with the vertical slice. |
| Story becomes decorative or distracting | Enforce the deletion test and require every world event to carry conceptual or causal work. |
| Branches multiply content cost | Branch feedback/strategy, then reconverge on shared conceptual milestones unless a distinct ending earns its cost. |
| Studio violates the v1 no in-app editing constraint | Record an SRS amendment; keep Studio developer-only and local, excluded from production builds if appropriate. |
| Event logs create privacy or storage concerns | Local-only, explicit export, strict caps, documented erase/export, no remote endpoints. |
| Plugins regress accessibility | Make accessibility metadata/tests part of registration and CI. |
| Dual runtime lasts indefinitely | Define adoption and retirement gates; measure active formats; maintain one migration inventory. |
| Rewards displace intrinsic motivation | Award demonstrated mastery/capability, keep celebration engine-owned, avoid leaderboards. |
| Performance suffers from rich assets/mechanics | Lazy plugins/assets, budgets, low-end mobile fixtures, offline tests, and campaign-level prefetching. |
| AI tutor distracts from foundations | Keep it outside the programme until structured outcomes, review, hints, and evaluation are mature. |

## 13. Definition of done for every v2 capability

- Runtime implementation and pure logic tests.
- Schema/contract generated from the registered definition.
- Human-readable validation errors.
- Authoring form metadata and a Studio preview fixture.
- Accessibility behaviour and automated coverage.
- Performance budget checked in production build.
- Documentation and applicable content skills updated.
- At least one real, verified usage in the vertical slice or demonstration content.
- Strict content validation and end-to-end completion under production CSP.
- Persistence/resume/version behaviour specified.
- Learning evidence emitted where the capability represents mastery.

## 14. First decision after planning

Start A1, A2, and A3 together, but do not implement the graph runtime until A1 fixes the v2
contract. The first engineering deliverable should be a schema-and-state spike exercised by a
small fixture, followed immediately by a thin playable path through the chosen vertical slice.
The programme should repeatedly alternate architecture and real content so abstractions are
earned by use rather than designed in isolation.

The A-series contract deliverables are now recorded in:

- A1: `docs/ADR-001-experience-runtime-v2.md` and SRS section 14;
- A2: `docs/EXPERIENCE_RUNTIME_V2_EVALUATION.md`;
- A3: `docs/EXPERIENCE_RUNTIME_V2_VERTICAL_SLICE.md`;
- A4: `docs/EXPERIENCE_RUNTIME_V2_ROLLOUT.md` and `src/v2/rollout.ts`.
