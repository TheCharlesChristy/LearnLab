# LearnLab Studio (local developer tooling)

LearnLab Studio is a development-only graph editor for an Experience Runtime v2 graph. It is not
part of the learner product and is deliberately absent from production builds. Run `npm run dev`
and open `#/studio` to use it.

## Safe local workflow

1. Select the pack's `course-pack.json`, then select one of the experience graph files listed in
   that manifest. Studio blocks a graph whose `packId` does not match the selected pack.
1. Use the graph map to add, duplicate, select, or delete nodes. A delete that would break the
   entry reference or a transition is blocked; repoint those references first.
1. Edit fallback and conditional transition targets in the selected-node panel. New conditional
   branches are intentionally marked as a replace-me condition for the later property-form pass.
1. Resolve the linked validation problems. Validation uses the shared v2 graph schema plus local
   checks for target IDs and duplicate stable IDs; the content pipeline remains authoritative for
   cross-file pack, capability, state-path, reachability, and cycle validation.
1. Export only after validation passes. Export is an explicit browser download named after the
   graph ID. Replace the chosen source file through your editor and review the diff as normal.

Studio has no writable filesystem handle, no background save, no IndexedDB persistence, and no
network export. It therefore cannot silently modify another course pack (or the selected one).
Undo/redo applies to every graph edit made in the current local session; importing a graph starts a
new undo history.

Studio D3 derives activity fields from the generated plugin catalog, validates edited props, and
mounts the registered activity preview with an in-memory seeded run. The preview toolbar provides
mobile/desktop width, dark/light, reduced-motion, and read-aloud checks. The inspector explains the
current node, seeded state, possible effects, evidence, and resumable/ended status; it never writes
to IndexedDB. Export remains the same explicit JSON download, so a valid graph round-trips without
semantic transformation.
