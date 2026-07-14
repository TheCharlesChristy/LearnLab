# Local playtest diagnostics

`src/experience/diagnostics` turns the existing local run event log and G1 evidence records into
bounded summaries. It does not write to IndexedDB, call `fetch`, upload, or identify a learner.
The source records remain on the device; the summary excludes answers, free text, state variables,
run ids, timestamps per event, and raw event/evidence logs.

`buildDiagnostics()` reports time to first recorded action, node exits, reported attempts and hints
(including missing telemetry), reached branch transitions, completed-to-later-run continuation, and
delayed review outcomes at least 24 hours after a completed run. Inputs are bounded to 1,000 runs,
10,000 events, and 10,000 evidence records; the dashboard exposes all drops/corruption counts rather
than silently treating partial input as complete.

`createPlaytestExport()` requires `{ confirmed: true, confirmedAt }` from an explicit tester action.
It emits only named aggregate fields listed in `PLAYTEST_EXPORT_FIELDS`; `downloadPlaytestExport()` is
an explicitly invoked browser download helper and is never called by the diagnostics package. A
selected file is read with `parsePlaytestExport()` only: it is size-limited (256 KiB), validated,
and never imported into learner progress storage.

`TesterDiagnosticsPanel` is the local UI boundary for a route owner: it visibly lists every export
field, starts with an unchecked affirmative control, enables Export only after that control is
checked, and reads only a tester-selected JSON file. It keeps the imported summary in component
state for the current comparison and reports malformed files without changing learner progress.

The existing local retention and erase controls remain authoritative: B4 caps individual run events,
per-run events, and the total event log; `eraseExperienceRunData()` erases v2 run/event diagnostics,
and `eraseAll()` erases all local progress. Corrupt or orphan events are ignored and counted in the
summary. Testers should inspect the named-field list before exporting and share a file only through
their approved study process.

Use `compareDiagnostics(baseline, verticalSlice)` with `DiagnosticsDashboard` to compare local
baseline and vertical-slice sessions. The comparison is descriptive, not a learner ranking or a
release decision; delayed outcomes and voluntary continuation remain more meaningful than completion.
