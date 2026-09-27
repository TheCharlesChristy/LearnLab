# ADR-003: shared runtime, isolated local author previews

Date: 27 September 2026. Status: implemented for the choice/circuit prototype.

The harness needs reproducible starting scenes, branches, assistance and inspectable state.
The existing Studio proposal permits local developer editing; v1 remains supported. We use
an explicit `VITE_AUTHOR_STUDIO=true` lazy route with a loopback guard and the actual
`EpisodeWorkspace`, rather than maintain a second simulation or marking renderer.

`LaboratorySessionPort` redirects reads, writes and archive replacement into memory. Read-aloud
uses only browser-reported local voices and a nonpersisting preference mode. The learner path
keeps existing IndexedDB storage and default persisted speech settings. Source/scene editors
validate shared schemas and semantics before application and retain 20 source snapshots.
The editor is JSON-based; graphical authoring and schema-generated forms remain future work.

A strict versioned author-preview envelope contains source pack, episode, starting scene,
unsigned 32-bit seed, branch preference, hint/worked state and optional event checkpoint.
A breadth-first route honours preferred branches where reachable; preceding actions use actual
correct choices or circuit witnesses. Seeds reorder choices only. Every scene carries prior
exposure so generated or imported state cannot be fresh learner evidence. Imported checkpoints
are replayed and validated; exports check the complete 1 MiB envelope. Runtime sessions keep
their own 256 KiB and 2,000-event limits. Eight in-memory archives retain original pack context.

Starting a preview clears the old projection and remounts the workspace. Preview callbacks
cannot update a newer fixture. Source edits never silently overwrite repository files; explicit
export/staging remains the boundary. Ordinary builds remove the route and module. The loopback
guard is a developer-use constraint, not a security authentication mechanism or hosted service.

To prove that arbitrary course metadata renders honestly, `experience-graph@0.1.1` adds optional
node bridging advice and episode debrief copy. Generic fallback supports earlier 0.1.0 packs;
new fields require 0.1.1. The first demonstration pack increments version to 3. This does not
supply the history reasoning contracts or complete either pilot.

Tests cover schema/runtime/CLI consistency, assistance and prior exposure, source editing/Undo,
checkpoint restore, archive provenance, episode switching, and learner-store isolation including
speech-rate changes with mocked local voice availability. Rendered checks are agent product
critique, not human enjoyment or learning evidence. Git delivery automation and full pilots remain
pending; the owner report/revision requirement remains unchanged.
