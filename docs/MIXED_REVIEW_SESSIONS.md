# Mixed cross-course review sessions

The Review route presents a deterministic, bounded session of at most eight due items. It sorts due rows by due time and stable identity, then prefers the next item from a different course and a non-overlapping skill. This keeps selection reproducible and reduces immediate same-skill repetition without changing the existing scheduler or catalogue builder.

## Learner flow

- The browser saves the selected identities, current position, and submitted identities in a small local-only snapshot. It resumes only if its remaining items are still due.
- V2 review entries render through their registered standalone activity, so recognition and generation activity plugins use the same accessible rendering path as the rest of the platform. A V2 item must report an activity outcome before its Again/Good controls are enabled.
- Saved catalogue metadata permits an in-progress V2 session to render after a catalogue fetch failure. If an item has been removed or its plugin is unavailable, the learner can skip it without changing its schedule.
- The controller advances its local state before calling `recordReview`, and de-duplicates a submitted identity in the event handler. The existing public scheduler remains the only persistence writer.
- After the bounded session completes, the learner receives a visible `Return to learning` link to the catalogue.

## Evidence and mastery

Review grades are scheduling inputs, not mastery events. The legacy review-state contract does not carry the versioned, contextual activity evidence required by the mastery model, so this feature deliberately does not manufacture mastery updates from an Again/Good click. Mastery remains updated only by eligible activity outcomes.

## Boundaries

This feature consumes only the public due-review and scheduling APIs plus the read-only review catalogue. It does not alter progress storage, run-state logic, or catalogue construction.
