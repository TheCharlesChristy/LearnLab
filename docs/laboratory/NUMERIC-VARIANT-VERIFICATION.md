# Parameterised Ohm's law task verification

The new `fresh-ohm-law` scene in the resistance investigation asks for current from a newly drawn voltage and resistance pair. It uses an ideal ohmic resistor in a complete single path and applies `I = V/R`. This matches the bounded circuit model already used by the course. It does not imply that every component is ohmic or model temperature, source resistance or transients.

## Source and derivation

OpenStax University Physics Volume 2, section 9.4, states Ohm's law as `V = IR`, identifies voltage in volts, current in amperes and resistance in ohms, and limits it to ohmic materials. Rearranging gives `I = V/R`. The course's AQA 7408 scope reference remains in the pack; this is a specification-informed pilot, not full exam-board coverage.

Every possible input pair was independently recomputed by division:

| Voltage | Resistance | Current |
| ---: | ---: | ---: |
| 6 V | 2 Ω | 3 A |
| 6 V | 3 Ω | 2 A |
| 6 V | 6 Ω | 1 A |
| 9 V | 2 Ω | 4.5 A |
| 9 V | 3 Ω | 3 A |
| 9 V | 6 Ω | 1.5 A |
| 12 V | 2 Ω | 6 A |
| 12 V | 3 Ω | 4 A |
| 12 V | 6 Ω | 2 A |

The authored hand checks include the first and last combinations and an interior case: `6/2 = 3 A`, `9/3 = 3 A`, and `12/6 = 2 A`. All nine values are finite and within the activity's numeric bounds. Changing either variable changes at least one paired answer. There are seven distinct answers; the 0.01 A absolute tolerance is smaller than half the smallest gap between distinct answers (0.25 A).

## Marking checks

- `500 mA` is equivalent to `0.5 A`, because the `mA` factor is 0.001.
- A result exactly 0.01 A from the target is accepted; one 0.011 A away is rejected.
- A unit other than A or mA, `Infinity`, and invalid numeric text are rejected. Invalid text does not create an attempt.
- Zero or near-zero resistance is rejected before preview because it makes the formula degenerate. The complete cartesian grid is checked, rather than sampling a subset.
- The stored case remains stable when a saved run reloads and changes after restart. A first correct answer without help may count as independent for this scene; an answer after a wrong attempt, hint or worked example remains practice.

## Scope of this check

Production Chromium playthroughs rendered the authored scene in the real Research Station episode, checked the derived answer in mA, and verified that Continue stays disabled until the answer is checked. The downloaded pack was also exercised after browser close and offline reopen; the current v10 transfer task loaded and accepted its derived mA answer. In isolated Studio previews, an incorrect answer followed by a corrected alternative-unit answer remained practice, and the hint plus worked-example route recorded assistance. The rendered 360px/200%-text and dark-theme checks passed.

These are model, marking and interaction checks, not evidence that a learner understands Ohm's law or finds the scene enjoyable. The whole-skill criterion still needs multiple fresh independent opportunities and delayed review; the owner's walkthrough and revision remain pending.
