# Experience Runtime v2: resume and compatibility

`src/experience/resume` is the policy layer above the append-only v2 run log.
It does not write Dexie tables directly. Replay remains the source-of-truth integrity check;
the plan returned by `loadResumePlan` tells a route/runtime whether it can reuse a run or must
start a new one.

## Checkpoints

A `checkpoint` effect is stored atomically with its boundary event and the materialised run.
Reloading calls `loadResumePlan`, which replays the durable log before returning the saved run.
It never reapplies effects, so a checkpoint cannot duplicate evidence, unlocks, or celebrations.
Scene boundaries remain the only write points; activities must not write run state directly.

## Content versions and recovery

Every target supplies the pack identity, graph identity, authored state declarations, and current
versions. `planResume` produces one of four explicit results:

- `resume` — same compatible state and current node;
- `migrate` — an authored, directed `preserve-declared-state` path exists; only declared,
  type-valid values survive and newly declared values use their defaults;
- `reset` — an authored migration explicitly says `reset`;
- `fallback` — identity mismatch, missing node/path, or corrupt/missing saved data.

`reset` and `fallback` provide the entry node and default variables for a fresh run. The old run
and event log remain available for local diagnostics; they are never overwritten or silently
combined with newer content. Pack content declares migration metadata only — it cannot supply a
JavaScript migration function.

## v1 adapters

`adaptScreenSequence` turns a v1 `ScreenSequence` into a linear v2 graph. It uses the registered
`v1-screen` activity and adds one checkpoint after each original screen. `V1ScreenActivityAdapter`
renders the original screen runner, retaining its interaction gating and its legacy item-state
namespace. It emits one normalised completion outcome only after that runner advances.

`LegacyMarkdownExperience` delegates to `MarkdownLesson`, so legacy documents retain their safe
Markdown/directive renderer, source text for the existing search index, print styling and control,
and DOM-based read-aloud control. Migration does not rewrite Markdown content.
