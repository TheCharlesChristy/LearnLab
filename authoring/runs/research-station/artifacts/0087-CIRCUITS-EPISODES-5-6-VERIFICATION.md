# Research station episodes 5–6: series and parallel verification

Date: 28 September 2026. Pack version 5 contains six of ten planned episodes.
These are author checks of a bounded, steady ideal DC circuit model and the rendered
interactions. They are not independent human evidence of learning or enjoyment.

## Physics and model boundary

The [AQA A-level electricity specification](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/subject-content/electricity)
includes series and parallel relationships plus conservation of charge and energy.
The rules and arithmetic below were checked against [OpenStax's full series/parallel
section](https://openstax.org/books/university-physics-volume-2/pages/10-2-resistors-in-series-and-parallel).
The narration, station context and answer options are newly written. The main-branch
independence claim holds for the **ideal fixed-voltage source** represented here;
real supplies may have internal resistance and changing terminal voltage. The
activity only changes authored switch and resistor values within a fixed circuit
tree; it is not an unrestricted circuit constructor.

## Hand-derived answers and reachable settings

| Scene | Independent derivation outside the activity evaluator | Expected result |
| --- | --- | --- |
| `split-the-supply` | At 12 V with 3 Ω + 9 Ω, total resistance is 12 Ω and common current is 1 A. Drops are 3 V + 9 V; source and load powers are 12 W and 3 W + 9 W. Swapping 3 Ω and 9 Ω also meets 1 A. The initial 3 Ω + 3 Ω gives 2 A. | Either single-coil adjustment reaches 1 A. |
| `predict-drops` | At 1 A, each drop is `IR`: 3 V and 9 V, summing to 12 V. | 3 V then 9 V. |
| `swap-the-coils` | 9 Ω + 3 Ω is still 12 Ω, so 12 V / 12 Ω = 1 A. The front 9 Ω now drops 9 V; rear 3 Ω drops 3 V. | Two controls restore 1 A and move 9 V to the front. |
| `fresh-series` | 5 Ω + 10 Ω = 15 Ω; 15 V / 15 Ω = 1 A in both loads; the 10 Ω load drops 10 V. | 1 A and 10 V. |
| `series-break` | The only path is incomplete. In the steady, storage-free model, current is 0 A through both loads. | Both zero. |
| `open-the-backup` | Main branch: 6 V / 6 Ω = 1 A. Open backup: 0 A, so source total is 1 A. Closed backup: another 1 A, so source total is 2 A; main remains 1 A. | Closing backup reaches 2 A with 1 A in each load. |
| `predict-main` | Reopening the backup removes its 1 A contribution but leaves 6 V across the complete 6 Ω main route. | Main 1 A, source 1 A. |
| `choose-a-limit` | At 12 V, two 6 Ω branches each take 2 A, total 4 A. Change either one to 12 Ω: currents 2 A and 1 A, total 3 A. Both branch voltages remain 12 V. | Either branch may be limited to reach 3 A. |
| `fresh-junction` | 9 V / 3 Ω = 3 A and 9 V / 6 Ω = 1.5 A. The source supplies their sum, 4.5 A. | 4.5 A. |
| `fresh-backup` | At 10 V, main 5 Ω takes 2 A and backup 10 Ω takes 1 A, total 3 A. Opening backup leaves main at 2 A and source at 2 A. | Main stays 2 A; source 3 A to 2 A. |

The pack validator confirms a supported initial state and a reachable witness for
each circuit scene. Unit checks exercise **both** authored alternative routes in
`split-the-supply` and `choose-a-limit`, plus the open/closed backup readings and
voltage/power conservation. Distractors target equal-drop-for-any-series-load,
whole-source-voltage-for-each-series-load, current-used-up, all-branches-fail, and
forgetting one branch in a junction sum. The documented circuit-thinking research
motivates counterexample checks; these exact distractors have not been calibrated
with the intended learners.

## Rendered critique and limits

The author drove every consequential success scene in both episodes in production
Chromium, Firefox and Linux WebKit. Both alternative settings were exercised in
the browser, along with meter inspection, a closed/reopened backup link and fresh
transfer choices. A 360 px touch layout at 200% root text retained 44 CSS pixel
controls, visible text alternatives and no horizontal page overflow in WebKit. The
expanded-text view is long and requires scrolling. An author screenshot of the
parallel circuit is retained with the run; desktop diagram labels are readable,
while the semantic topology and numerical meter table carry the same information
when the visual diagram is reduced on a phone.

The first action in each episode manipulates a model setting. The series episode
spends two scenes on a related circuit; the second asks the learner to swap values
rather than merely reselect an answer. The parallel episode retains a useful
contrast between a single surviving branch and two complete routes. A learner
might still find the fixed choice checks too easy or the tall phone page tiring;
owner playthrough and revision are required. The eight-minute estimates remain
untested design estimates. Physical-device Safari, screen-reader user testing,
and delayed retention remain unobserved.

The retained version-4 pack and a version-4 charge-window event log still parse
and replay against that older pack. Learners who downloaded the older version can
resume its saved work through the version-pinned cache path. A saved older run
without that downloaded pack currently requires export and recovery rather than
automatic migration to version 5. A verified general migration path remains work
for the full pilot; no old independent result is silently regraded on new content.
