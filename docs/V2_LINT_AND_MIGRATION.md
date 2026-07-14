# V2 linting and migration planning

`npm run validate -- --strict` now runs the v2 semantic validator and D4 authoring lint. The
semantic validator checks graph references, capability versions, declared state paths, reachability,
and termination. The strict lint adds reviewable authoring checks:

- substantive episodes (four or more scenes) must use at least half generation-format interactions;
- marked goals need actionable failure feedback, and marked recognition activities need a hint or
  misconception explanation;
- success feedback cannot be bare generic praise;
- declared assets stay under `assets/`, use an approved local media extension and matching MIME
  type, include image alt text, fit the 1 MiB per-asset budget, and SVGs contain no scripts, event
  handlers, or remote executable references.

Without `--strict`, the same findings are warnings. This lets an in-progress pack be inspected
without weakening the CI gate for published content.

## Review-only legacy migration plan

## Read-only inventory and prioritisation

Before proposing a migration, regenerate and CI-check the filesystem/manifest
inventory. It classifies formats, activities, feedback, search safety, assets,
Python, prerequisites, orphan files, and dual-format modules; it ranks review
candidates but never edits content.

```sh
npm run inventory:migration -- --out docs/V1_CONTENT_MIGRATION_INVENTORY.md --write
npm run inventory:migration -- --out docs/V1_CONTENT_MIGRATION_INVENTORY.md --check
```

Do not bulk-convert Markdown into v2 scenes. Generate a deterministic plan instead:

```sh
npm run plan:migration -- --course maths/alevel-pure --pack alevel-pure-v2 \
  --out docs/migrations/alevel-pure-v2.json --write
npm run plan:migration -- --course maths/alevel-pure --pack alevel-pure-v2 \
  --out docs/migrations/alevel-pure-v2.json --check
```

The plan records screen sequences that can start on the compatibility adapter, Markdown that stays
readable, explicit skill-mapping work, and a manual-review item for every lesson. It never edits a
course, lesson, or learner data. Commit the generated plan alongside a migration proposal; `--check`
is suitable for CI to prove the review plan matches the source tree.
