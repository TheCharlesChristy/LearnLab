# First episode playthrough and revision

27 September 2026. One of ten planned circuits episodes; not the complete pilot.

## Independent rendered critique

Separate reviewer `/root/circuit_model_review` used an isolated Chromium context
against the production build. Novice mobile 360×800/touch, struggling tablet 768×1024
and impatient desktop 1440×900/keyboard were simulated perspectives, not recruited
human learners. The reviewer observed correct 0/1 A consequences, a 1 A/6 V/6 W load,
causal error feedback, help/worked/escape on all scenes, assisted completion 0/2,
restart/reload, map/resume, and no page errors or horizontal overflow. Offline
page close/reopen restored state and permitted repair after explicit acquisition;
this independent check did not restart the browser process.

Four concrete observations prompted revision:

1. All three choice scenes had the correct answer first. The reviewer's impatient
   first-option path received 2/2 independent checks without discriminating options.
   Authored positions now vary. This removes that positional shortcut; it does not
   make fixed local answers tamper-proof or prove understanding.
2. Completion promised visible checks but displayed only an aggregate and export.
   A readable per-scene notebook now reports independent/practice/assisted outcomes,
   attempts, hints, worked examples and prior exposure.
3. The visible wire was generic while topology was hidden. A visible model-derived
   series/parallel diagram now shows open/closed switches and resistor values;
   accessible textual topology and readings remain available.
4. On 360×640, controls began at y657 below the initial viewport. Introductory spacing
   is compacted and controls precede the diagram on phones. A production assertion
   checks the first actionable Closed button is entirely within the initial viewport.

Reviewer screenshots are retained in the author run. They describe the pre-revision
build; updated author screenshots must not be labelled independent review.

## Author verification and failures

Actual production tests cover wrong answers, hints, assisted escape, first/repeated
checks, local export, restart/resume, both themes, reduced motion, native keyboard,
touch, save failure, complete acquisition and browser-process close/reopen offline.
Additional tablet/landscape and 200% root text checks found shared navigation overflow:
links now wrap while retaining accessible names. No essential course request should
leave the app origin; the first-slice browser check observes network requests.

Retained failures include an intermediate-bundle checksum differing from final
emitted bytes, first time credit exceeding the asynchronously created run's age,
and an incorrectly duplicated Help focus effect. Each was fixed before the passing
run. Runner setup failures (missing pinned browser and a test baseURL) are distinct
from application failures. WebKit cannot launch on this host because required
libicu74/libxml2/libmanette/libwoff libraries are absent; no Safari/iOS coverage or
physical-device claim follows from Chromium touch emulation.

Functional first action under 20 seconds is an automated design check, not human
performance data. Agent playthroughs do not establish enjoyment, delayed retention,
transfer quality or superiority. Owner written feedback and revision remain pending.

## Independent revision recheck and legacy regression

The reviewer rechecked version 2 in an isolated rendered context. Both 44 px controls
were wholly visible at 360×640 (y491 and y591), diagram gaps became closed connections,
the completion notebook showed five named rows, and a first-option-only assisted route
ended 0/2 instead of 2/2. Desktop also passed. A remaining clipped diagram edge came
from its 300 px minimum width in a 266 px container; the SVG now fits the container.
This follow-up remains agent evidence, not owner feedback.

Broad browser coverage found two baseline issues: the keyboard test expected an old
em-dash summary label while the UI uses a colon; its locator is aligned with the actual
accessible name. More materially, `LessonBody` kept `completedNow` when a hash-route
changed lesson ID, so later lessons could appear completed without their saved rows.
Keying the body by module/lesson resets session state, with a navigation regression
and the existing all-lessons/export/import browser flow verifying the behaviour.
