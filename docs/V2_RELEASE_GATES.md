# Experience Runtime v2 contributor and release gates

## Supported authoring path

1. Create a pack with `npm run new:course`, then add an episode with `npm run new:experience`.
2. Use only activity keys exposed by `src/experience/plugins/registry.ts`; their generated props
   schemas, authoring metadata and preview fixtures are projected by
   `src/experience/plugins/generated.ts` into `schemas/activity-plugin-props.schema.json` and
   `docs/ACTIVITY_PLUGINS.md`.
3. Run `npm run verify:release-v2`, `npm run validate`, `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
   `validate-experience-v2.mjs` checks pack/graph references and capability versions; plugin
   generated tests check schema/catalog/fixture drift; the activity contract matrix mounts every
   registered fixture. A v2 demonstration must be represented by a validated fixture or the
   vertical slice, never an undocumented key.

Example scene activity:

```json
"activity": { "key": "seeded-choice", "version": "1.0.0", "props": { "prompt": "Which route is safe?", "options": [{ "id": "safe", "label": "Safe route" }, { "id": "unsafe", "label": "Unsafe route" }], "correctId": "safe" } }
```

Use the generated schema, not this abbreviated example, as the prop authority. Content authors
must follow `.agents/skills/learnlab-author-content/SKILL.md` and
`.agents/skills/learnlab-lesson-pedagogy/SKILL.md`; platform authors use
`.agents/skills/learnlab-extend-platform/SKILL.md` before adding a key or capability.

## Release checklist

- Learning: vertical-slice playtest includes delayed outcome and voluntary-continuation review;
  completion alone is not a pass signal.
- Privacy: diagnostics/export remain local and explicitly tester initiated.
- Accessibility: keyboard, screen-reader semantics, touch targets, contrast, reduced motion, and
  read-aloud matrix pass.
- Security/offline/performance: production CSP, offline/service worker, bundle/lazy-chunk and
  storage checks pass (`npm run build`, `npm run check:quality`, and the #64 budgets).
- Migration: v1 catalogue, Markdown and screen-sequence routes remain readable; inventory and
  migration report are reviewed.

## V1 retirement is not automatic

Compatibility may be removed only after a separately approved ADR/release decision records all of:

1. 100% of active v1 courses have a verified v2 migration or an approved archival route;
2. two successive release cycles show no unresolved v1 compatibility defects;
3. the migration inventory identifies no learner progress that would be stranded;
4. the vertical-slice learning and accessibility gates above have passed; and
5. maintainers explicitly approve the removal PR after public migration notice and rollback plan.

Until every threshold and that separate approval exist, no v1 parser, route, content format, or
progress import path may be removed.
