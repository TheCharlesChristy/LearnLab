# Scene presentation primitives

`src/experience/presentation` is the visual layer for v2 experience scenes. It is deliberately separate from graph traversal, activity plugins, run-state persistence, and content schemas. Import the components from `src/experience`.

## Composition

Use `SceneShell` as the outer surface and put the narrative parts in their instructional order: `SceneBriefing`, `SceneObjective`, optional `EnvironmentalStatus` and `SceneDialogue`/a semantic `figure` with `SceneCaption`, then `SceneActivity`. Place `SceneConsequence`, `SceneTransition`, and `SceneDebrief` after the activity as they become relevant.

`SceneActivity` is only a labelled wrapper. It intentionally exposes no Continue, completion, navigation, or persistence callback. The activity inside it must continue to report a genuine learner interaction through the runtime's existing activity contract. Set a consequence or transition's `revealed`/`active` prop only from that real outcome.

## Accessibility and sensory safety

- Each primitive uses headings, sections, figures, or a description list so its meaning survives print and narrow screens.
- `SceneConsequence`, `SceneTransition`, and `SceneError` move focus to their heading only when entering from a hidden state; revealed/transition notices use live regions, and errors use `role="alert"`.
- Status values always include a text label and value; colour and animation are supplementary. Reveal motion is opt-in through `motion-safe` and explicitly disabled with `motion-reduce`.
- `SceneShell` owns a read-aloud target. Visual scene labels and internal live announcements carry `data-tts-exclude`, so speech contains the actual narrative, objective, activity, and outcome rather than decorative chrome.

## Current boundary

These primitives do not change the v2 course-pack or experience-graph content contract. A later runtime-integration task may map the existing `Presentation` variants onto this layer, but must retain SceneRunner's activity-gated traversal rule.
