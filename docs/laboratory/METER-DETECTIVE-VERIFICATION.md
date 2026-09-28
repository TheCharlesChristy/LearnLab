# Meter detective, pack version 6

Status: author self-check of episode 7 of 10, 28 September 2026. This is a
bounded ideal-DC investigation, not evidence of human enjoyment or learning.
The STEM pilot, history pilot, compatibility migration and owner cycle remain
incomplete.

## Source and model check

The current [AQA electricity specification](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/subject-content/electricity)
includes current and potential-difference measurement, series/parallel
conservation and ideal-meter assumptions. Its [practical assessment](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/practical-assessment)
calls for electrical multimeters and circuit design/checking. This browser
activity does not certify those physical practical skills. The source ledger
records the design decision and validation plan; all station language and
numbers are authored for this course.

The first panel has a 12 V ideal source and two 12 Ω parallel branches. The
main branch is complete. With a complete backup, each branch carries 1 A and
the source carries 2 A. With the backup link open, main current remains 1 A,
backup current is 0 A and source current is 1 A. Main current and source
potential difference therefore cannot discriminate; backup current, source
current and potential difference across the backup link can. The last is 0 V
when the ideal link closes and 12 V when it opens. These were derived from
I = V/R, a shared potential difference across the two branches, and a junction
sum, then checked against every authored meter position.

The second panel keeps a 12 V source and a 6 Ω navigation rail in parallel
with a sensor heater. The navigation rail carries 2 A whether the sensor is
12 Ω or 24 Ω. Sensor current is 1 A or 0.5 A; source current is 3 A or 2.5 A.
The source and sensor potential differences remain 12 V. The final fresh
series check uses 9 V and a 1 A source reading: total resistance is 9 Ω,
so a known 3 Ω load leaves 6 Ω for the hidden one. The alternative 3 Ω hidden
load would draw 1.5 A. Computed binary values are compared with a tight
tolerance in tests; the displayed three-significant-digit readings are used
when deciding whether a probe distinguishes two candidates.

The new `meter-probe@0.1.0` activity requires exactly two supported candidate
states with identical topology and supply, at least one discriminating and one
nondiscriminating placement, full component labels and finite readings. It
masks differing settings in both the diagram and word topology. A saved `probe`
event is replayed and checked against the authored positions. Repeating or
forging a placement fails validation; an uninformative reading cannot support
a pass. Probe exploration never awards independent mastery, even on a
transfer-labelled scene. The two marked transfer choices are made before a
new panel reveals its measurements.

## Rendered playthrough and critique

The author played the complete success route with a poor main-branch probe,
then a useful backup probe, resumed after reload, reopened the recorded field
reading, tried a wrong fresh choice and corrected it, tested the second panel,
and completed the final unfamiliar series reading. An assisted advance after a
poor probe and a deliberately transfer-labelled probe are covered in event
tests; both remain non-independent. Author Studio can synthesize a valid path
through the probe scene. The browser checks also cover keyboard activation,
touch, 360 px with 200% root text, no horizontal overflow, and offline meter
state after browser close/reopen in Chromium and Firefox.

The initial desktop rendering hid the first control below the viewport. Moving
the concise rival hypotheses above the buttons brought the first action into
view. The first successful screenshot exposed dimmed used-button labels; the
used state now remains opaque, and the browser asserts its pressed state and
opacity before capture. At 200% text on a narrow phone, the page becomes long
and requires scrolling, but the controls remain at least 44 CSS pixels high.
The visual diagram is decorative; the labelled topology and readings convey
the same information in text. A physical screen-reader user has not reviewed it.

The full unit suite passed 962 tests with 11 skips; typecheck, lint (one
pre-existing warning), strict laboratory validation and the opt-in production
build passed. Chromium and Firefox production browser checks passed after a
test-only ambiguous text locator was corrected. Official Linux WebKit ran 11
browser checks, with one existing persistent Cache API offline-reopen skip:
that Linux port reports a resolved cache write but cannot read back its bytes.
The separate failed-write recovery check passed. No physical Safari, hardware
meter placement, human learning or delayed retention result is claimed.

Run artifacts retain the scaffold, staged pack revisions, both failed full
unit logs, the corrected full unit log, the first browser failure, corrected
targeted browser checks, Linux WebKit checks and visual screenshots. A failed
test or saved artifact is evidence of the process, not proof that its gate
passed. Choice-order seeds remain presentation variants, not fresh generated
questions. Earlier downloaded packs remain playable when their pinned pack
exists; recovery for an older saved run **without** its downloaded pack remains
an open platform task before the whole goal can be complete.
