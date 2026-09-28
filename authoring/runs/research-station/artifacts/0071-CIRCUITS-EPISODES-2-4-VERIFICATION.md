# Research station episodes 2–4: answer and playthrough ledger

Date: 28 September 2026. Pack version 4 contains four of ten planned episodes.
This is author verification of the bounded ideal DC model and the three new
investigations, not human learning or enjoyment evidence.

## Source and model boundary

[AQA's A-level electricity scope](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/subject-content/electricity)
defines current as rate of charge flow, potential difference as work per charge,
the ohmic condition, and series/parallel conservation. The relevant derivations
were checked in [OpenStax on current](https://openstax.org/books/university-physics-volume-2/pages/9-1-electrical-current)
and [energy and power](https://openstax.org/books/university-physics-volume-2/pages/9-5-electrical-energy-and-power).
The questions and story were written afresh. `circuit@0.1.1` integrates a steady
ideal solution over a chosen interval; it does not simulate start-up, changing
resistance with temperature, depletion, real bulbs or arbitrary circuit graphs.
The [research ledger](research-ledger.json) records the source-access limits.

## Independently derived answers

| Scene | Derivation outside the activity evaluator | Expected authored target or answer |
| --- | --- | --- |
| `set-recorder` | `I = 6 V / 6 Ω = 1 A`; `Q = 1 C/s × 4 s = 4 C`. Alternative: `I = 6 V / 3 Ω = 2 A`; `Q = 2 C/s × 2 s = 4 C`. Initial 6 Ω for 2 s yields 2 C. | Source charge 4 C, with two reachable settings. |
| `predict-window` | `1 A × 6 s = 6 C`. | 6 C. |
| `fresh-recorder` | `0.4 A × 15 s = 6 C`. | 6 C. |
| `return-path` | Steady single path conserves charge; 0.8 C/s enters and 0.8 C/s leaves. | 0.8 A leaving. |
| `power-the-console` | At 6 V and 6 Ω, `I = 1 A`; over 4 s, `Q = 4 C`, `P = 6 V × 1 A = 6 W`, `E = 6 W × 4 s = 24 J`, also `VQ = 24 J`. Initial 3 V yields 0.5 A and 6 J in 4 s. | 6 V and 24 J. |
| `read-the-lift` | `12 J / 2 C = 6 J/C`. | 6 V. |
| `fresh-battery` | `15 J / 3 C = 5 J/C`. | 5 V. |
| `current-is-different` | `6 V / 6 Ω = 1 A`; `12 V / 12 Ω = 1 A`. Each coulomb receives 6 J versus 12 J. | Same current, greater energy per charge in B. |
| `safe-current` | Initial `6 V / 12 Ω = 0.5 A`. Solutions `6 V / 6 Ω = 1 A` and `12 V / 12 Ω = 1 A`. | Two reachable ways to meet 1 A. |
| `why-two-settings` | Both `6/6` and `12/12` equal 1 A. | Same voltage/resistance ratio. |
| `fresh-load` | `9 V / 3 Ω = 3 A`; replacing with 6 Ω at fixed 9 V gives 1.5 A. | 1.5 A. |
| `check-the-rule` | `I = V/R`; doubling R halves I only if V remains fixed. If V doubles too, I can remain equal. | State the fixed-voltage condition. |

All goal witnesses pass the shared schema and semantic validator. Unit tests
exercise the charge/time alternative and source/energy replay; numeric tolerances
are ±0.001 for exact, representable targets. This is a deterministic ideal model,
not an empirical simulation of any real heater.

The wrong numeric answers trace specific *derived* operations (multiplying
where division is needed, reversing a ratio, dividing current by time, or
assuming fixed source current). The current-used-up and fixed-current claims are
also discussed in the [circuit thinking research](https://doi.org/10.1103/PhysRevPhysEducRes.20.020128).
We do not claim that every distractor's selection frequency has been measured
with these learners.

## Rendered critique and limits

The author ran all three new episodes through every consequential successful
scene in production Chromium, Firefox and Linux WebKit. Charge/time, supply
voltage, and resistance controls were exercised, including both 1 A settings.
The observation window was changed away from and back to the goal. Keyboard
Enter operated the timer; touch operated the source. At 360 px and 200% root text,
controls remained at least 44 CSS pixels high with no horizontal document overflow.
The extra length at 200% requires scrolling; it did not hide a required control.

The circuit activity makes the mechanism visible before the authored fresh
choices. Matching a displayed target is exploratory practice. Only first-try
transfer choices without help or replay can yield a scene-level independent
flag. The short prompts and branch-free four-scene path could still feel
repetitive or too easy to a human learner; the owner playthrough must judge
interest, clarity and pacing. Estimated eight-minute episodes are hypotheses,
not observed durations. Agent/browser interaction is functional evidence only.

Downloaded pack version 4 was tested after browser close and offline reopen in
Chromium and Firefox, including charge-window interaction. Linux Playwright
WebKit's persistent Cache API discarded a minimal probe entry, so its
close/reopen check remains unavailable there; the strict no-false-ready fallback
was tested in the preceding Studio slice. Physical Safari/device and screen-reader
user testing remain unobserved.
