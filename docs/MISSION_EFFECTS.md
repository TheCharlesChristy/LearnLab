# Mission, objective, and world-effect kit

The v2 mission kit is a small presentation and projection API for story-game
mechanics. It is intentionally **not** another state store, timer system, or
activity plugin. Its inputs are an already-materialised `ExperienceRun` and
registered graph `Effect` values, so the same world status is shown after
reload or resume.

## Use it

Create a mission definition alongside the mechanic, then derive its display
values from the run supplied by the runtime:

```tsx
const stages = deriveObjectiveStages({
  stages: [{
    id: 'calibrate',
    label: 'Calibrate the receiver',
    completeWhen: { operator: 'state-equals', path: '/relay/calibrated', value: true },
  }],
}, run);

const meters = deriveWorldMeters([{
  id: 'signal', label: 'Signal strength', path: '/signal', minimum: 0, maximum: 100, unit: '%',
}], run);

<MissionObjectivePanel stages={stages} />
<WorldMeterPanel meters={meters} />
```

`completeWhen` uses the existing registered `Condition` vocabulary. Do not use
author callbacks, runtime expressions, or a second mission-state object.
`MissionCapabilities` derives unlock state from `run.unlockedCapabilityIds`.
`MissionCheckpointPanel` only asks the owning runtime to return to a persisted
checkpoint; it never applies graph effects itself.

## Effects, checkpoints, and announcements

For a checkpoint replay, pass the attempted effects through
`planCheckpointReplayEffects(run, effects)`. It returns only checkpoint
bookkeeping and suppresses state writes, rewards, unlocks, and semantically
identical mastery evidence; without a persisted checkpoint it returns no
effects. The runtime remains responsible for persistence and
navigation; this keeps the effect/event boundary singular and prevents a UI
reset from earning rewards or evidence a second time.

Use `describeMissionEffects(boundaryEventId, effects)` for concise registered
effect messages. Give `MissionOutcomeBanner` the persisted boundary event id as
`outcomeKey`: it focuses and announces only when that id changes, not on an
initial render after resume.

## Accessibility and scope

The kit has no mandatory timer and offers native buttons only. Objective state,
meter value, capability status, and success/failure/branch/terminal outcomes
all have text equivalents; colour and progress bars are supplementary. Do not
make a mission require drag-and-drop. The kit is compatible with reduced-motion
preferences because it adds no animation.

The components are exported from `src/experience`. They are presentation and
pure-projection helpers: they do not modify `SceneRunner`, activity plugins,
run-state persistence, progress, schemas, or content-build tooling.

`MISSION_KIT_FIXTURES` exports local, framework-independent examples of the
four required states: `success`, `recoverable-failure`, `branch`, and
`terminal-payoff`. Reuse them in mechanic tests or previews rather than
hard-coding a particular course pack's state.
