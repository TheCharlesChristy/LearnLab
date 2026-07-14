# Campaign maps and capability progression

`src/experience/campaign` is the learner-facing projection for v2 course packs. It deliberately
does not persist progress, infer mastery, or add fields to content: callers supply the validated
`CoursePack`, matching `ExperienceGraph` records, local `ExperienceRun` projections, and the
existing `MasteryAggregation`.

Use `buildCampaignMap()` to create the deterministic view model, then render `CampaignMap` with an
optional `onOpenExperience` callback. The component is a responsive ordered-card map rather than a
canvas, so the same episode order, states, and controls reflow for keyboard users, touch users,
small screens, and browser zoom. Every status is text (not colour), and locked episodes have a
disabled native button plus the prerequisite explanation.

The projection has deliberately conservative progression rules:

- An unfinished saved run is **resumable**; it is never stranded by a later mastery import.
- Its current scene presentation supplies the displayed current objective; no separate campaign
  progress copy is stored.
- A completed episode is recorded from its actual run ending.
- A prerequisite is only met by a `secure` mastery band. Completing an earlier episode alone does
  not unlock a later one.
- Capability status is read from `unlockedCapabilityIds` in local runs; it is not guessed from an
  episode completion badge.
- Only the number of route choices already made is shown. Future branch labels and destinations
  are withheld, so the map explains that a route exists without spoiling its outcomes.

`LegacyCourseList` is the deliberately plain v1 fallback: callers retain the existing course/module
list rather than attempting to fabricate run, graph, mastery, or capability data for legacy content.
The application route owner chooses v1 versus v2 from the loaded content format; this package has
no router or persistence dependency.
