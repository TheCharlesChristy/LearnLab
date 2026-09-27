# Studio CI revision: browser and offline evidence

27 September 2026. This follows the first Author Studio CI run at commit
`a02b13a` (GitHub Actions run `36338721221`), which failed three WebKit
checks and retried one Chromium completion/reload check. The original failed
log and browser traces were retained outside Git and the selected failure
summary is recorded in the research-station authoring run. These were real
cross-browser findings after narrower local Chromium/Firefox checks.

- WebKit's native speech object wrapper dropped an instance method override
  before the preview rendered. The preference-isolation test now installs one
  retained speech object in the test page. It still does not prove playback or
  the availability of a local voice on a real device.
- At 360 px and 200% root text, WebKit counted the full native select-option
  text in a CSS grid label's scroll width (589 px). Block-flow labels for
  Studio selects preserve the native control, its option list and focus outline
  without page-wide overflow. This was reproduced in WebKit 26.4 on Linux.
- The learner completion scene appeared before its local write settled. The
  workspace now publishes the next scene after saving resolves. A controlled
  pending-write test asserts that the completion screen waits, and that a failed
  write still leaves the in-memory work exportable.
- In the persistent Linux Playwright WebKit 26.4 port, a minimal, app-free,
  same-origin Cache API probe returned success from `put()` but `match()` and
  `keys()` found no entry, even immediately. Both WPE headless and GTK headed
  builds did this in the official `v1.60.0-noble` image; nonpersistent cache
  checks did retain bytes. The full close/reopen course check is skipped only
  for this exact Linux WebKit symptom. Other probe errors and unexpected
  corruption still fail. This is **unavailable WebKit persistent-profile
  offline coverage**, not a passed Safari/device test.
- Production acquisition now reads back every stored asset, catalogue,
  runtime manifest and version descriptor. `offlineReady` requires cached
  metadata as well as checked runtime/course asset hashes. A silent cache
  write or metadata-only loss fails rather than claiming readiness. The
  rendered fallback test verifies recovery text, no Ready-offline claim, a
  retry control and independent persistence of learner progress.

An author-enabled production browser rerun in the official Playwright 1.60.0
Linux image passed 32 checks across Chromium, Firefox and WebKit; four were
skipped: three ordinary-build-only checks and the diagnosed Linux WebKit
persistent-cache close/reopen check. The ordinary author-disabled build passed
its route-exclusion check in all three engines (the author-only counterpart was
skipped). The final WebKit phone screenshots (normal and 200% text), the
minimal cache-probe log and the targeted WebKit rerun log are retained in the
research-station run as artifacts 0060–0063. Chromium and Firefox both completed actual offline
close/reopen with progress, and all three engines showed the strict fallback
when writes were silently discarded. This is a local rerun, not a remote CI
result or physical Safari/device test.

Host validation after the fixes: 942 unit/integration tests passed, 11 browser-only
shims skipped (`--maxWorkers=2`); TypeScript, lint (one pre-existing SignalScope
warning), and strict content validation (9 courses/78 modules) passed. The
source review and focused acquisition/save-settlement tests were independently
checked by a second agent (10 focused tests passing). The
reviewer did not independently run the browser suite.
