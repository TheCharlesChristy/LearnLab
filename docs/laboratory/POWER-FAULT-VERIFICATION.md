# Power budget and fault board, pack version 7

Status: author self-check of episodes 8–9 of the planned ten-episode circuits
pilot, 28 September 2026. The final open repair workspace, history pilot,
owner walkthrough and revision are still pending. Browser playthroughs are
functional and product critique, not human enjoyment or competence data.

## Scope and answer derivation

The [AQA A-level electricity specification](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/subject-content/electricity)
sets the pilot's ideal-meter, ohmic and series/parallel scope; its
[practical assessment](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/practical-assessment)
motivates measurement and circuit-checking tasks. The existing research ledger
records the textbook source for P = VI and E = Pt. This app does not replace
hands-on apparatus, nor model internal source resistance, heating-dependent
loads or battery depletion. All station problems and copy are original.

In the first power scene, 6 V across 3 Ω draws 2 A and transfers 12 W. The
alternative 12 V across 12 Ω draws 1 A and also transfers 12 W. The initial
6 V across 12 Ω draws 0.5 A and transfers only 3 W. Thus equal power need not
mean equal current. The branch budget at 12 V has a 12 Ω navigation rail
(1 A, 12 W) and a 24 Ω sensor heater (0.5 A, 6 W). Source current is 1.5 A,
source power is 18 W and ten seconds transfers 180 J. The fresh calculation
uses 12 V × 1.5 A × 4 s = 72 J. For a fixed 12 V ideal supply, changing a
single 6 Ω load to 12 Ω changes current 2 A → 1 A and power 24 W → 12 W;
energy over the same interval halves. W, J and C distractors distinguish a
rate, accumulated energy and charge.

The fault scene contrasts a 12 V, 12 Ω main branch with two backup stories.
If the backup link is open, main/source current is 1 A and backup current is
0 A; the link has 12 V across it. If the backup link closes with its heater
at 24 Ω, backup current is 0.5 A, source current is 1.5 A and link potential
difference is 0 V. Main current stays 1 A and source potential difference
stays 12 V, so those readings cannot decide between the stories. Repairing
the heater to 12 Ω with the link closed restores 1 A in the backup, 2 A at
the source, 12 W in the backup and 24 W at the source. Opening the link
deliberately shows why a different fault would leave only the main route.
The fresh parallel clue at 10 V has a 5 Ω main drawing 2 A; a complete 10 Ω
backup would add 1 A, so an observed 2 A source current supports the open
backup. The fresh measurement-choice scene uses an unchanged reference
branch to make an apparently reasonable but nondiagnostic current reading.

These values were derived from I = V/R, P = VI, E = Pt, series addition and
parallel junction sums, then compared against every authored witness and
alternative control setting. Unit tests also replay a clean route to two
fresh transfer checks in each episode. A configured target or meter probe is
practice; an independently marked transfer scene is still provisional
scene-level evidence rather than a whole capability certificate. The retained
version-6 meter pack and event remain readable against their pinned version;
without that downloaded pack, old-run recovery remains an open platform task.

## Rendered paths and revision

The author played the power scene through both 12 W settings, an incorrect
practice comparison, the branch budget with its power/energy table and both
fresh checks. The fault scene included an unhelpful main-branch probe, a
discriminating backup probe, opening and reclosing the link, the heater
repair, an incorrect fresh reference-branch choice, and a new fault diagnosis.
The full route, mistakes, local resume/offline action, 360 px touch at 200%
text, and light/dark/help recovery inherited from the shared workspace were
exercised in production browsers. The small-screen page is long and requires
scrolling; controls stay operable and no horizontal overflow was observed.
The detailed table remains available in text even when the schematic becomes
small. Physical-device Safari and screen-reader user testing remain unobserved.

The first power rendering hid watts inside the expandable table. Adding
source power to the live status makes the key consequence visible when the
learner changes a control. A full-page screenshot initially captured the
sticky toolbar partway down the document and a button before its selected
state settled. Browser checks now wait for the pressed state and render frames,
then scroll to the top before capturing. The authored measurement scene was
also revised so the unchanged reference branch is a plausible but
nondiagnostic alternative, instead of an obviously irrelevant option.

The full unit suite passed 966 tests with 11 skips, including all previously
authored episodes; the new pinned-pack test passed on a focused follow-up.
Typecheck, lint (one pre-existing warning), strict legacy and laboratory
validation, and the opt-in production build passed. Chromium and Firefox
passed 30 production browser checks. Official Linux WebKit passed 14 with one
existing persistent Cache API offline-reopen skip; its separately tested
failed-write recovery path passed. The host Chromium/Firefox offline
close-and-reopen test includes a meter action and a power-setting action.

The two nine-minute estimates remain design guesses. The fixed answer choices
may be easy for a prepared learner, and the owner's report is needed to judge
whether the station investigation is enjoyable. The capstone must broaden
agency beyond these finite control panels, allow more than one investigation
route, and test a repair in an unfamiliar configuration.
