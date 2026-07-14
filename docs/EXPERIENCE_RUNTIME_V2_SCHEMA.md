# Experience Runtime v2 schema contract

This is the content contract introduced by v2/B1. It is intentionally declarative: a course
pack or graph must never contain JavaScript, an expression evaluator, or a migration function.
Later runtime work interprets only the registered operators below.

The source of truth is:

- `schemas/course-pack.schema.json` — one self-contained pack manifest.
- `schemas/experience-graph.schema.json` — one episode graph.
- `src/experience/types.ts` — their TypeScript twins for runtime and tooling.

The v1 `build-content` pipeline now discovers a v2 pack at
`public/content/v2/<pack-id>/course-pack.json`. It validates cross-file references, declared
state paths, assets, capability versions, reachability, and mandatory non-terminating paths
before emitting deterministic `content/experience-index.json` and
`content/experience-search-index.json`. The v1 course/module/lesson pipeline remains unchanged.

`schemas/experience-capabilities.json` is the build-time list of installed v2 capability
versions. A pack must declare every activity it uses in `engineCapabilities`, and both the pack
requirement and the activity version must be satisfied by that list. C1/C2 extend this list with
registered activity-plugin contracts and prop schemas; B2 deliberately does not evaluate props.

## Course pack

A pack has `schemaVersion: 2`, a semantic `version`, identity/audience/taxonomy/theme data,
estimated duration, and explicit `engineCapabilities` (`key` plus semantic version). It declares
its state schema and migration metadata rather than relying on invisible defaults. State is an
array of typed declarations (`boolean`, `number`, `string`, or `string-set`) addressed by stable
paths such as `/bridge/repaired`.

It also owns the skill graph, experience-file manifest, campaigns, local assets and attributions,
and review items. All asset and experience paths are local relative paths; remote URLs and parent
directory traversal are not accepted.

Each review item is independently renderable: `standaloneContext`, `prompt`, activity reference,
goal, feedback, and skill links are all required. A source episode/node can be recorded for
provenance, but a review renderer must not need that source scene to make the item intelligible.

## Skill graph and mastery evidence (G1)

`skills` is authored content data. Each skill has a stable id, learner-facing title and description,
and `prerequisiteIds`. Schema validation owns each object's shape; the v2 semantic build and pure
`validateSkillGraph` API additionally check duplicate ids, missing/self prerequisites and cycles.
The build reports the precise `course-pack.json` prerequisite pointer, including a deterministic
closing edge for a cycle. Only a valid DAG may be passed to `buildSkillGraph`, which creates stable
prerequisite/dependent indexes.

`MasteryEvidence` is a separate, versioned local record. An evidence event identifies the skill,
event time and content version, then distinguishes: opportunity (`retrieval`, `application`, or
`transfer`), outcome, support level, hint use/count, confidence, latency band, and transfer
context. `unknown` is a required, honest value for information a source did not capture. In
particular, `hinted`, `assisted`, and an independent attempt are not collapsed; a `sure` failure is
counted as confidently wrong without being treated as ordinary uncertainty.

`normaliseExperienceEvidence` converts B4 append-only run events without mutating their stored
shape. Current `emit-evidence` effects reliably contribute outcome/support/confidence and the
run-start event contributes pack/experience versions. Opportunity, transfer and latency remain
`unknown` until a future activity/effect contract supplies them. A boundary without its run-start
event is rejected as evidence because it cannot identify the content version.

`aggregateMastery` is a pure deterministic explanation, not a probability model or diagnosis. A
single attempt (or any fewer than two opportunities) produces `insufficient-evidence` and **no
mastery band**. `developing` requires two independent successes; `secure` requires at least four
opportunities and three independent successes. Every returned summary exposes its event counts,
confidently-wrong count and textual rule; unknown-skill/duplicate records are returned as ignored
records rather than silently assigned.

Older v1 quiz attempts and SM-2 review state remain explicitly `legacy`: their aggregate scores or
scheduling grades lack declared skill links and the required context, so G1 will not infer mastery
from them. `classifyLegacyQuizAttempt` and `classifyLegacyReviewState` give migration/export code a
stable, inspectable label without rewriting IndexedDB data. A later migration can map a legacy item
only after content supplies an explicit skill and evidence-context mapping.

## Experience graph

Every graph has `schemaVersion: 2`, pack/state versions, a required `entryNodeId`, and typed
nodes. A `scene` always contains presentation, a versioned activity reference, a goal, success
feedback, ordered effects, and transitions. `transitions.fallback` is mandatory; conditional
branches are ordered and are tested before it. An `ending` instead has required `termination`
semantics (`complete`, `failed`, or `abandoned`) and cannot silently continue.

Presentation, goals, conditions, and effects are discriminated closed sets. For example, effects
can only be `set`, `increment`, `append`, `unlock-capability`, `emit-evidence`, `checkpoint`, or
`celebrate`. Conditions can only inspect declared state/outcomes/mastery through the listed
operators or compose them with `all`, `any`, and `not`. Unknown fields and unregistered operators
are rejected by Ajv.

`activity.props` is the deliberate exception to a generic schema: its property vocabulary belongs
to the named activity plugin. B2/C2 must validate it using that plugin's registered input schema;
the outer activity reference itself remains closed and versioned.

## Authoring status

Author v2 packs with the D1 scaffolders rather than copying a fixture by hand:

```sh
npm run new:course
npm run new:experience -- --pack <pack-id> --id <experience-id>
```

They create valid starter graphs, keep the manifest and campaign synchronised, and put a graph copy
under the pack's `fixtures/` directory for later Studio/runtime tests. The repository fixtures under
`fixtures/experience-v2/` remain contract examples for tooling work: they cover linear, branching,
looping, and multi-ending graphs plus invalid fallback/operator/termination cases. Generated indexes
are build artifacts and must not be edited. See [`AUTHORING.md`](AUTHORING.md#2a-start-a-v2-course-pack-or-add-an-experience)
for the commands, output tree, and authoring constraints.
