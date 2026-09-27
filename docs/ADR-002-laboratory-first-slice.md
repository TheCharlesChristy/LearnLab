# ADR-002: Laboratory first-slice contract

- Status: implemented prototype for review, 27 September 2026
- Depends on ADR-001 and SRS §14.8–14.9

The first playable laboratory episode extends `src/v2/` inside the existing shell.
It does not create a second application, replace v1, or interpret the older rollout
fixture's `typed-effects` declaration as shipped functionality. It remains disabled
unless the existing v2 build flag is enabled. The laboratory parser negotiates its
own actual registered capability versions and rejects incompatible packs.

The initial graph is deliberately smaller than the proposed general world engine:
episodes contain acyclic scenes with passed/assisted transitions, registered choice
or circuit activities, hints, worked examples and mechanisms. Finite control values
and inclusive reading ranges replace arbitrary conditions. There are no authored
scripts or unvalidated effects. Shared Ajv schema plus semantic validation run in
both author CLI and learner app; generated code avoids runtime code evaluation.

Persistence reuses Dexie v3's existing `kv` store and global export/import/erase.
Bounded typed events replay into current state and evidence; no imported pass or
independent claim is trusted. Recovery archives/replacements share one transaction.
Prior answer/help exposure survives restart and rollback import. Pack/state versions
fail closed, retaining original exports. Older acquired compatible pack versions can
reopen their own work; no untested state migration is implied.

Explicit acquisition uses SHA-256 checked runtime/pack files and per-version cache
descriptors. It reports readiness only after all required bytes exist and verify.
Final emitted bundle bytes, rather than intermediate bundler strings, determine
runtime hashes. Browser close/reopen tests are required; eviction remains possible.
Read-aloud is optional and local-voice-only in laboratory workspaces.

The author harness now scaffolds from a retained brief/plan, rejects incomplete or
orphaned content, and stages a checksummed local preview. Its structural checks are
not evidence of correctness, fun or learning. Runtime/source checks, author browser
playthroughs and independent critique remain distinct artifacts. Ordinary preview
staging does not publish, merge or deploy.

Tradeoffs: this narrow contract proves actual interactions and recovery early but
cannot yet express free construction, source comparison, rubric reflection, seeded
variants, due application reviews or a skill-map graph. Those should extend the same
registered contracts when the full pilots require them. The first slice is not a
claim that the proposed world engine, Studio, two pilot courses or overall goal is
complete. Independent scene checks are provisional evidence, not skill certification.
