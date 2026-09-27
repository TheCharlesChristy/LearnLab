# Laboratory activity contracts

Status: first-episode prototype, opt-in through `VITE_EXPERIENCE_RUNTIME_V2=true`.
This additive runtime lives under `src/v2/`; legacy courses and their saved work
retain the existing schemas and storage. The two registered activities are `choice`
and `circuit` at 0.1.0, with event state version 1.

`src/v2/activity-contracts.json` is the metadata registry. Its `schemaDef` points into
`schemas/laboratory-pack.schema.json`; `src/v2/pack.ts` adds semantic checks shared by
the CLI and browser. Run `npm run author:course -- capabilities` and `schemas` to
inspect the actual contracts. `build-laboratory-contracts.mjs` generates the strict
CSP-safe browser validator; `--check` rejects schema/generated-code drift.
The current renderer dispatches these two registered types directly. A general
external-plugin loader, arbitrary scripts, variants and Studio are not implemented.

## Composition

A pack declares audience, descriptive level, arbitrary subject ID/title, version,
stateVersion, required capabilities, references and attributed relative assets.
Skills and episodes each have advisory prerequisite DAGs. Every episode has a start
node and reachable finite scene graph: `passed` and `assisted` transitions name a
node or null for completion. Cycles, missing destinations and orphaned nodes fail.
Nodes include a concise prompt, role, graduated hints, worked example and mechanism.
The role may be prediction, practice, transfer or reflection; a role label alone
never proves competence. At least one transfer opportunity is structurally required.

Each scene offers Help and an assisted exit. Assistance is recorded rather than
silently awarding independent evidence. Keep worked examples short and appropriate
to the course; use bridging recommendations in authored help. The current Help UI
has hints, a worked example, prerequisite advice, retry through controls and escape.
A clearer representation is supplied by circuit topology/readings; there is no
separate configurable representation-switch contract yet.

## Choice

Input: `type: "choice"` plus 2–6 options containing unique `id`, `text`, `correct`
and `feedback`. Exactly one option is correct. Choose this contract only for an
objectively bounded decision with justified feedback. Multiple defensible historical
interpretations require a separate rubric/reflection capability; do not encode one
preferred interpretation as mechanically correct.

Action: a native option button records `{type:"answer",node,option,at}`. Output is
selected option, attempt count and authored feedback. Passing requires the correct
option. A first correct response on a fresh transfer node may be independent only
when no hint, worked example or prior exposure exists. An incorrect first response
followed by correction is practice. Buttons are locked after success; Help remains
available. All information is text and feedback is a polite status.

## Circuit

Input: `type: "circuit"`, `initial` and reachable `solution` configurations, labels
for every leaf, controls with finite allowed values, and goals. Configurations have
`voltage` and a series/parallel `circuit` tree. Controls change a named switch's
boolean state or a resistor's numeric ohms. Content cannot change topology or supply
voltage through these controls. See [bounded model](CIRCUIT-MODEL.md) for supported
DC configurations, ranges, idealisation and indeterminate/unsupported readings.

Each goal names `reading` (leaf ID or reserved `source`), `quantity` (`current`,
`voltage`, `power`) and inclusive finite `min`/`max`. Units are A, V and W; goals use
actual computed values, not displayed rounding. Choose tolerances from an independent
derivation. The validator checks the witness is reachable using allowed controls,
shares topology and supply, and meets every goal. A witness is not a unique solution:
other allowed configurations meeting the ranges also pass. Initial supported state
is required. Unsupported exploratory configurations receive explicit feedback.

Action: a native control records `{type:"control",node,id,value,at}`. Output comes
from `solveCircuit`: status, source current/power/equivalent resistance and per-leaf
current/voltage/power. Open equivalent resistance and indeterminate drops use null,
never an invented zero. A circuit pass requires at least one control action and all
goals satisfied. Controls, textual topology and a readings table give keyboard,
touch and screen-reader alternatives to the decorative circuit indicator. Targets
are at least 44 CSS pixels high; essential information has no motion/sound dependency.

## State, evidence and recovery

`src/v2/run.ts` defines the typed event envelope and replay output. Envelopes include
pack ID/version, episode ID, stateVersion, start time, at most 2,000 events and an
optional retained prior-exposure list. Total size is bounded at 256 KiB. Imported
unknown fields, invalid actions, incompatible versions and forged passes fail;
outcomes are recomputed from registered activity semantics. Restart, rollback import
and archival retain known answer/help exposure. This reduces repeated-answer shortcuts
within a local workspace; exports are editable local records, not authenticated
proof of observed human behaviour. Deleting all local data also deletes exposure.

The replay projection exposes current scene, interaction memory, evidence, active
milliseconds and restarts. Evidence records outcome, role, attempts, hints, worked
example use and replay status. A scene-level independent flag is not a whole-skill
certificate. The first episode explicitly shows two causal checks and provisional
capability evidence; baseline, delayed checks and full criterion coverage are pending.

Active time is an estimate: credits every 15 seconds while the episode is visible,
unpaused and interacted with in the previous 90 seconds. Pointer, keyboard and
scroll exploration count; the timer does not refresh its own idle clock. Per-event
credits are bounded against elapsed time to reject overlapping imports. Up to one
unfinished interval may be lost on leaving; no speed bonus or learning score follows.

Saved work uses the existing local `kv` store and global export/import/erase boundary.
Recovery writes archive and replacement atomically. Save failure keeps the current
in-memory work exportable and offers retry. At the event limit, archival creates a
new bounded workspace with retained exposure. Incompatible work can be exported
before archival; a downloaded older compatible pack can reopen its own version.

## Acquisition and privacy

A production manifest lists SHA-256 and byte size for each pack asset and required
app file. Explicit download verifies every file, reports progress/failure and checks
cache completeness before saying ready offline. Acquisition needs a connection,
Cache Storage and an active service worker. Hash-qualified URLs protect downloads
from stable-URL cache updates; per-version descriptors retain older downloaded packs.
Browser eviction remains possible. Failure cannot certify offline readiness.

Learner events remain local. There are no runtime inference calls, accounts or
telemetry. Exports require an explicit action. Laboratory read-aloud selects only
voices the browser reports as local; when unavailable, text remains usable. Voice
availability and service classification are browser-provided, not an app guarantee.
