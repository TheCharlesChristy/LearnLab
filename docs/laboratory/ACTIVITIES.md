# Laboratory activity contracts

Status: ten-episode circuits pilot and registered source-evidence activity; the
four-episode history pack follows in a dependent draft PR. Opt in through
`VITE_EXPERIENCE_RUNTIME_V2=true`.
This additive runtime lives under `src/v2/`; legacy courses and their saved work
retain the existing schemas and storage. The registered activities are `choice`
at 0.1.0, `circuit` at 0.1.1, `meter-probe` at 0.1.0 and `repair-bench`
at 0.1.0, plus `evidence-board` at 0.1.0, with event state version 1.

`src/v2/activity-contracts.json` is the metadata registry. Its `schemaDef` points into
`schemas/laboratory-pack.schema.json`; `src/v2/pack.ts` adds semantic checks shared by
the CLI and browser. Run `npm run author:course -- capabilities` and `schemas` to
inspect the actual contracts. `build-laboratory-contracts.mjs` generates the strict
CSP-safe browser validator; `--check` rejects schema/generated-code drift.
The current renderer dispatches these five registered types directly. A general
external-plugin loader, arbitrary scripts and parameterised fresh-task variants are not implemented.
The local Studio shares this renderer; see [authoring workflow](AUTHORING-HARNESS.md).

## Composition

A pack declares audience, descriptive level, arbitrary subject ID/title, version,
stateVersion, required capabilities, references and attributed relative assets.
Skills and episodes each have advisory prerequisite DAGs. Every episode has a start
node and reachable finite scene graph: `passed` and `assisted` transitions name a
node or null for completion. Cycles, missing destinations and orphaned nodes fail.
Nodes include a concise prompt, role, graduated hints, worked example and mechanism.
`experience-graph@0.1.1` adds optional node `bridge` text and episode `debrief`
`{title,body}`. Older 0.1.0 packs without these fields receive generic course copy.
New packs using the fields must declare 0.1.1; course copy is no longer hard-coded to circuits.
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

## Evidence board

Input: `type: "evidence-board"`, an inquiry question, 2–8 short source cards,
2–5 human review prompts, and optionally 1–12 labelled schematic map places.
Every card has an author/source origin, source date and chronology order, class,
paraphrased account, explicit evidential limit and a `referenceId` linking to a
pack reference. A card may name a map place. The validator checks unique IDs,
closed references and places, bounded map coordinates and all text lengths.
Source dates label the record, not automatically the event it describes. Authors
must label paraphrases and never present a schematic as a measured map.

Actions: native buttons open cards in any order, then pin or unpin inspected
cards. An editable 1,600-character local claim is saved by an explicit button.
The learner can self-review against the authored prompts after pinning two
sources and saving at least 40 characters. Editing the claim resets the review.
All these steps replay through typed, size-bounded events. A completed board is
recorded as **reflection/practice even on a transfer node**: there is no
semantic or AI grade, and it never counts as independent mastery. The length
threshold is a guard against accidental empty submission, not an assessment.
A teacher or course owner must judge whether the claim actually uses evidence,
handles alternatives and states its uncertainty. Avoid putting the one
"correct" historical interpretation into `choice`; reserve choice for bounded
source-method distinctions. Original source links open separately; no network
request is needed for the locally available paraphrases.

The optional map is a static schematic with a text equivalent; the chronology
is an ordered text list. Buttons, textarea and review work with keyboard and
touch, with no dragging or essential motion.

## Circuit

Input: `type: "circuit"`, `initial` and reachable `solution` configurations, labels
for every leaf, controls with finite allowed values, and goals. Configurations have
`voltage` and a series/parallel `circuit` tree. Controls change a named switch's
boolean state or a resistor's numeric ohms. Content cannot change topology.
At `circuit@0.1.1`, optional `sourceValues` and `interval` add finite supply-voltage
and observation-window controls. Older 0.1.0 activities remain loadable, while
advanced fields require the declared 0.1.1 capability. See the [bounded model](CIRCUIT-MODEL.md) for supported
DC configurations, ranges, idealisation and indeterminate/unsupported readings.

Each goal names `reading` (leaf ID or reserved `source`), `quantity` (`current`,
`voltage`, `power`, `charge`, `energy`) and inclusive finite `min`/`max`. Units are
A, V, W, C and J. Charge/energy goals require an authored observation interval:
the steady ideal readings are integrated as `Q = I × t` and `E = P × t`. This is
not a switch-on transient, battery-depletion or heating simulation. Goals use
actual computed values, not displayed rounding. Choose tolerances from an independent
derivation. The validator checks the witness is reachable using allowed controls,
shares topology and changes supply only through authored source values. A witness
is not a unique solution:
other allowed configurations meeting the ranges also pass. Initial supported state
is required. Unsupported exploratory configurations receive explicit feedback.

Action: a native control records `{type:"control",node,id,value,at}`. Output comes
from `solveCircuit`: status, source current/power/equivalent resistance and per-leaf
current/voltage/power, plus charge/energy over an interval when present. Open
equivalent resistance and indeterminate drops use null,
never an invented zero. A circuit pass requires at least one control action and all
goals satisfied. Controls, textual topology and a readings table give keyboard,
touch and screen-reader alternatives to the decorative circuit indicator. Targets
are at least 44 CSS pixels high; essential information has no motion/sound dependency.
The live status now names source power in W alongside source current in A, so
the power-budget activity does not hide its principal consequence in the table.
The authored series and parallel scenes use the same bounded tree model: series
loads share current and split the source potential difference; complete parallel
branches share potential difference and their currents add at the source. Branch
survival assumes an ideal fixed-voltage supply. These are controlled configurations,
not free-form rewiring or a physical circuit builder.

## Meter probe

Input: `type: "meter-probe"`, two candidate configurations with identical supply and
component positions, the actual candidate ID, labels for every component and a
finite list of ideal ammeter/voltmeter positions. The candidates must differ in a
component setting. At least one position must produce a different **displayed**
reading under the two candidates and at least one must produce the same reading.
The latter makes an uninformative but valid observation available to test. Both
states must have supported determinate readings at every authored position.

Action: a native button records `{type:"probe",node,id,at}` once per position. The
actual measured value and both predicted values appear with A or V units. A pass
requires a probe whose displayed reading separates the candidates. An unhelpful
probe remains in the field notebook and the learner can try another position.
The changed component settings are masked in the visual diagram and textual
topology; the meter is not a shortcut to a value already shown. A labelled
topology list and text readings carry the information without the SVG. Ideal
ammeters are understood in series with the named component; voltmeters are
across it. Real-meter loading and wiring mistakes are outside the model.

This exploration is practice even if authored with a `transfer` role: selecting
several positions or inspecting the predicted values is answer exposure, so the
replay engine never awards independent mastery for a meter-probe scene. To test
fresh competence, author a separate bounded decision **before** revealing the
new panel's meter readings. Preview sessions also carry prior exposure.

## Repair bench

Input: `type: "repair-bench"`, an ideal source above 0 V and at most 24 V, two to four labelled
sockets, two to six distinct labelled ideal resistive parts, an initial board,
a reachable satisfying witness and finite current, voltage or power goals.
Each board state has a `series` or `parallel` layout and exactly one placement
per socket, either one part ID or `null` for an open gap. A part can occupy only
one socket. The same parts can be moved between sockets or returned to the tray;
changing the layout changes the electrical topology. This is a bounded open
workspace with fixed socket positions, not an arbitrary graph editor. The
existing solver handles each arrangement, including all-open boards. Unsafe
ideal shorts remain unsupported. The authoring validator checks the initial
state, the witness, the part inventory and the goals, but a witness is not a
unique solution: any legal arrangement satisfying the ranges passes.

Action: native select controls place or remove parts, and native buttons connect
the sockets in one path or separate branches. `place` and `rewire` events are
replayed from the registered contract; forged parts, duplicated placements,
no-op changes and unearned passes fail. A separate `inspect` event takes an
ideal source ammeter reading or a voltmeter reading across a socket and retains
the observed value in a notebook snapshot. Each socket also permits an ideal
branch ammeter reading. Measurement can precede or follow
repair. A passing board requires a genuine placement/wiring action and all
goals satisfied by computed unrounded values. The SVG is decorative; selected
parts, topology, status and meter notes are text. Moving parts uses the same
native controls with mouse, keyboard or touch, with no required dragging.

The bench is exploratory practice even if a scene carries a `transfer` role.
Unlimited rewiring, inspectable readings and live target feedback expose the
solution, so it never awards independent mastery. Author fresh bounded checks
after the bench to collect provisional independent evidence. The current
capstone has two distinct valid 12 V solutions: two 24 Ω loads in parallel
draw 0.5 A each and transfer 6 W each, while two 6 Ω loads in series draw 1 A
through each and transfer 6 W each. The source draws 1 A and transfers 12 W
in either case, but socket voltages differ (12 V versus 6 V).

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
