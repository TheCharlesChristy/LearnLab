# Repair bench and station capstone, pack version 9

Status: author self-check of episode 10 of 10 in the circuits pilot, 28 September 2026. The history pilot, owner walkthrough and revision remain pending. Agent browser playthroughs show functional behaviour and product issues; they are not human enjoyment or learning evidence.

## Contract and source bounds

`repair-bench@0.1.0` registers a bounded two-to-four-socket workspace. Learners can move distinct ideal resistive parts between sockets, leave a gap, wire the sockets in one path or separate branches, and inspect ideal meter readings. The existing DC solver recomputes each topology. No arbitrary wire graph or component code executes from content. Imported events are replayed; invented parts, duplicate occupancy, unavailable meter actions, no-op edits and unsupported passes fail. Unlimited trial and live target feedback make a bench pass practice, even in a transfer scene. Two later fresh choices provide provisional independent scene evidence.

The [AQA electricity specification](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/subject-content/electricity) and [practical assessment](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/practical-assessment), previously reviewed in the course ledger, set the ideal series/parallel and measurement scope. The two-socket repair task and copy are original. The model assumes a fixed ideal voltage, ideal meters, ohmic loads and no transients, real lamp behaviour, meter uncertainty, internal resistance or physical wiring safety.

## Independent answer derivation

The practice board starts as one path containing a 12 Ω load and an open sensor socket, so source current is 0 A. With separate branches and a 24 Ω sensor load, navigation draws 12/12 = 1 A and transfers 12 W; sensor draws 12/24 = 0.5 A and transfers 6 W. Source current is 1.5 A.

The capstone starts with one 24 Ω branch and an open second branch: source current is 0.5 A, the first load transfers 6 W, and the open branch transfers 0 W. Two distinct repairs satisfy the 1 A source and 6 W per-socket targets:

| Wiring | Parts | Each socket | Source |
|---|---|---|---|
| Parallel | 24 Ω + 24 Ω | 12 V, 0.5 A, 6 W | 1 A, 12 W |
| Series | 6 Ω + 6 Ω | 6 V, 1 A, 6 W | 1 A, 12 W |

Thus one source ammeter reading cannot identify which repair was used; an ideal socket voltmeter or branch ammeter can. The first fresh check uses a new 15 V panel: intact 15 Ω main draws 1 A, intact 30 Ω backup draws 0.5 A, and an open backup removes only its 0.5 A. The second uses a new 10 V, 1 A, 6 s situation: 6 C passes and 60 J transfers. Both answers and distractors were re-derived without taking the solver output as the source of truth.

## Rendered critique and revision

The author played the initial prediction, took a meter reading on an open board, repaired the practice board, followed both capstone repairs in separate clean sessions, inspected socket potential difference and branch current, and finished the two fresh choices. The capstone was also exercised with Enter and native selects on a 360 px viewport at 200% text. A screenshot review found component labels drawn across the SVG instead of within it. The diagram now uses short socket markers with a full text placement list below it. Firefox exposed horizontal overflow in the shared read-aloud speed control at 200% text; its controls now wrap within the panel. A draft scope note was shortened because it crowded the learner notebook. These observations caused pack version 8 to be revised to version 9 before delivery; both staged versions remain in the run.

The new contract and capstone tests cover open states, distinct part movement, both numerical repairs, invalid imported events, arbitrary scene preview, and two later independent choices. The full unit suite had 972 passed and 11 skipped before the final narrow replay/content edits; the focused tests and typecheck were rerun afterwards. The opt-in production build, strict legacy content build, laboratory pack validation and lint passed (lint retains one unrelated existing warning). Chromium and Firefox passed both repair routes, including the 360 px expanded-text route; the pack also passed close-and-reopen offline use in both engines, including a repair action after restart. The host WebKit lacked runtime libraries, so the two repair routes were rerun and passed in the official Playwright WebKit container. Persistent WebKit Cache API offline-reopen coverage remains limited by its known Linux port behaviour, as documented in earlier verification.

The eight-minute estimate is a design guess. The owner has not played this pack or reported whether the capstone is engaging. A physical device, screen-reader user and real apparatus comparison have not been observed. Older work without its pinned downloaded pack still needs a recovery path before the overall goal is complete.
