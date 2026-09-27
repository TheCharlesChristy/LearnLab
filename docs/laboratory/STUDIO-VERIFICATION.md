# Local Author Studio verification

27 September 2026. Working branch: `feat/laboratory-author-studio`, based on the first
playable slice `60231262423776db947e1cdfb19eb09b67e358e7`. Retained fixtures, logs,
screenshots, independent findings and revisions are in `authoring/runs/research-station/`.
These are functional/product checks, not observed human learning or enjoyment.

The actual CLI produced `authoring/previews/research-station-assisted.json` at fresh-fault,
seed17, hint1 and worked example. `inspect` replayed it, and the browser restored it into
an actual shared workspace. Pack version3 moves bridging/debrief copy into graph0.1.1
metadata. Validation still reports one of ten planned circuits episodes; no history pilot
is claimed complete.

- Full unit run with `--maxWorkers=2`:935 passed; browser-only shims skipped. Two earlier
  unrestricted runs had existing lazy-route lookup failures (933/934 passing); both failed
  logs are retained. The two implicated route suites passed13/13 separately. Contention is
  an inference, not a proven diagnosis; no product code or timeout was changed to hide it.
- TypeScript, lint, strict legacy content validation (9courses/78modules), shared laboratory
  schema/generator/pack checks and production build/size budgets passed. Lint retains one
  existing SignalScope unused-disable warning; build retains existing highlight CSS warnings.
- Author-enabled production build:10 browser checks passed across Chromium and Firefox;
  two ordinary-only checks skipped. Includes actual source editing/Undo, validation diagnostics,
  checkpoint export/import, cross-episode switching, archive provenance, 360px/200%text and
 44px button targets, and a rendered non-loopback document guard. Remote URL test bytes were
  supplied from the local server; no external host was contacted.
- Ordinary author-disabled production build:30 non-Pyodide browser checks passed across
  both engines; ten author-only checks skipped. Includes absent Studio route/module, existing
  v1 keyboard assessment and global progress roundtrip, actual circuit recovery and downloaded
  episode after full browser close/offline reopen. Emitted JavaScript contains no Studio heading
  or Studio/author-preview module.
- Independent agent review found the TTS preference write, archive context/lifecycle concerns
  and phone overflow. Revisions were independently rechecked: all learner stores empty after
  speech-rate changes with mocked browser-local voice availability; archives retain original
  source; episode switching has no page errors; synthetic evidence stays non-independent.
  At360px, normal and200%text, client/content/inner widths are360px. Buttons are at least44px.

The first added CI run at head `a02b13a` failed three WebKit tests and had one Chromium
reload retry. The failures and their follow-up are retained in
`docs/laboratory/STUDIO-CI-REVISION.md`. That earlier result is not a green CI claim.
Physical Safari, phones and a screen-reader-user session remain untested. Mock voice availability proves the
preference boundary; it does not prove installed voices or actual speech playback.

The Studio is a validated JSON editor with shared rendering, bounded in-memory history and
explicit snapshots. Graph drawing, schema-generated forms, fresh parameterised assessment,
Git delivery automation, full pilot packs, whole-skill criteria and owner feedback/revision
remain pending. The complete implementation goal remains active.
