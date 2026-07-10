# ADR-001: Experience Runtime v2 boundary and migration

- Status: Proposed for review
- Date: 2026-07-10
- Owners: LearnLab maintainers
- References: `docs/EXPERIENCE_RUNTIME_V2_PLAN.md`, `SRS-LearnLab.md` section 14

## Context

LearnLab v1 is a static, client-only learning application whose learner-facing content is
either a Markdown lesson or an ordered screen sequence. That model is deliberately small and
well tested, but it cannot express a persistent world, branching consequences, reusable
activities with different presentations, or review items that stand alone outside a lesson.

The v2 implementation plan proposes a strangler migration: preserve v1, introduce a versioned
experience graph behind an explicit capability boundary, prove it with one measured vertical
slice, and migrate selectively. The plan also identifies constraints that must not be weakened
by the new runtime: static hosting, local-only learner data, content-as-data, typed operators,
accessibility, genuine interaction gating, and reviewable engine/content boundaries.

Without a recorded decision, later schema and runtime work could accidentally turn the Studio
into learner editing, introduce a network dependency, make v1 content unreachable, or allow
authored code to execute in the learner application.

## Decision

### 1. v2 is additive and capability-bounded

Experience Runtime v2 is an additive runtime alongside v1. A v2 course pack MUST declare its
format/schema version and required engine capability versions. The application MUST select v2
only when the pack and runtime capabilities are supported. An unsupported or malformed pack MUST
fail closed with a bounded, learner-safe message and developer diagnostics; it MUST NOT silently
fall back to a different interpretation of the data.

v1 Markdown and screen-sequence routes remain available throughout the migration window. A v2
feature flag or equivalent build/runtime capability boundary MAY disable v2 without breaking v1
routes or v1 content.

### 2. The v2 atomic unit is a versioned experience graph

A v2 course pack is content data. It contains one or more experiences made of nodes, activities,
goals, feedback, typed effects, review metadata, and ordered transitions with an explicit
fallback. Conditions and effects use registered, schema-validated, pure and deterministic
operators. Content MUST NOT provide JavaScript, `eval`, `new Function`, or arbitrary predicates.

The runtime separates presentation, activity, progression, and persistence. An activity can be
reused with different presentation and goal policies without creating a new screen type for
each combination.

### 3. The Studio is developer tooling, not learner editing

LearnLab Studio is a local, developer-only authoring and inspection surface. It MAY edit or
export local source files and preview seeded content, but it MUST NOT become an in-product
learner content editor, hosted collaboration surface, account feature, or implicit upload path.
Studio code and routes MUST be capability-gated so the learner product can exclude them from a
production build where practical. Studio previews use the same schemas, validation, runtime
contracts, and accessibility requirements as the learner-facing runtime.

### 4. State and diagnostics remain local-first

V2 run state, mastery evidence, and diagnostic events stay on the learner's device. There is no
telemetry endpoint, account service, hosted learner profile, or background export. Playtest and
diagnostic export MUST be explicit, user initiated, versioned, size-bounded, and parseable before
import. Materialised state is a projection of an append-only local event log; both are subject
to version checks, migration, corruption recovery, and erase behaviour.

### 5. Compatibility uses adapters, not a cutover

The migration order is:

1. keep existing Markdown and v1 screen-sequence experiences working;
2. add the v2 pack/graph contracts and runtime behind the capability boundary;
3. adapt representative v1 screen sequences to linear v2 graphs without changing learner
   behaviour;
4. prove one complete, measured vertical slice;
5. migrate content selectively when the v2 path is demonstrably equivalent or better.

Markdown remains readable, printable, searchable, and read-aloud capable. Existing screen
runners and Python items retain their current isolation and may be wrapped by v2 adapters; they
do not gain direct access to progress storage or the DOM by virtue of the adapter.

### 6. Accessibility and learning gates remain normative

Every v2 activity and presentation MUST specify keyboard and focus behaviour, announcements,
contrast requirements, reduced-motion behaviour, touch behaviour where relevant, and a text or
alternative path where the interaction needs one. A node cannot advance merely because it has
been rendered: its goal MUST be satisfied by a real learner action, evidence, or declared state
change. Rewards, celebrations, and unlocks MUST attach to demonstrated capability rather than
opening an experience or logging in.

### 7. Rollback and retirement are explicit

Before a v2 experience is enabled for general use, the maintainers MUST be able to disable its
capability flag and return learners to the v1 route or a documented safe fallback. Saved v2 state
MUST carry its pack, experience, and state-schema versions. Readers accept the same or an older
version only through a tested migration; unknown newer versions fail loudly and preserve the
original data for export or recovery. A downgrade MUST NOT silently reinterpret v2 state as v1.

Markdown and v1 screen-sequence support MUST NOT be removed until all of the following are true:

- the migration inventory and priority order are approved;
- every retained v1 learner path has a tested adapter or an explicitly approved replacement;
- unique v1 capabilities have an equivalent supported v2 capability or an approved retirement
  decision;
- resume, export/import, accessibility, offline, CSP, and production regression gates pass;
- delayed-learning and voluntary-return measures meet the thresholds recorded for the relevant
  release; and
- a release note and rollback plan have been published for the removal.

## Alternatives considered

### Replace v1 with the graph runtime immediately

Rejected. It creates a high-risk migration cliff, makes failures in the new runtime block all
existing content, and violates the implementation plan's strangler strategy.

### Build a separate v2 application

Rejected. A second shell would duplicate routing, accessibility, offline, privacy, and progress
behaviour, while making compatibility and shared review items harder to prove.

### Keep the screen sequence and add special cases for every new mechanic

Rejected. It preserves the combinatorial coupling between presentation, marking, progression,
and persistence that the v2 plan is intended to remove.

### Put authoring and diagnostics behind a hosted service

Rejected. It conflicts with static hosting, local-first privacy, explicit export, and the v1
security model. Local Studio and versioned files provide the required developer workflow without
introducing a backend.

## Consequences

Positive consequences:

- v1 remains a tested fallback while the new runtime earns its complexity through a vertical
  slice;
- schema, plugin, state, and accessibility contracts can be tested independently;
- content authors can compose registered capabilities without changing application source;
- privacy and rollback remain properties of the architecture rather than promises in UI copy.

Costs and risks:

- two content paths and adapters must be maintained during migration;
- versioned state and explicit capability negotiation add schema and test surface;
- Studio must be kept separate from learner routes and production assumptions;
- the programme needs delayed-learning evidence before declaring the redesign successful.

## Rollback boundary

This ADR does not authorise removing v1 routes, changing the existing progress schema, or
shipping a v2 pack by itself. Until the A1 contract is approved and the later runtime gates pass,
the safe rollback is to keep the v2 code/data path disabled and continue serving v1. Any future
change that weakens the invariants above requires a new ADR and an SRS amendment before
implementation.
