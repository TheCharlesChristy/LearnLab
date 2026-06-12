# AC-06 — Lighthouse check (manual in P0)

AC-06 (module page: Performance >= 85, Accessibility >= 95, throttled profile
of NFR-PERF-002) is **not wired into this Playwright suite**. The release gate
runs via Lighthouse CI in the deploy pipeline, which the orchestrator wires up
after P0; no npm dependency is added for it here.

`npx lighthouse` works in this environment (it resolves the CLI on demand
without touching `package.json`), so the check can be run manually today:

```sh
# 1. Build the app + fixture content and serve it (same as the e2e suite):
node scripts/e2e-prepare.mjs
npx vite preview --port 4173 --strictPort &

# 2. Audit the fixture module page (throttled mobile profile = Lighthouse default):
npx lighthouse "http://localhost:4173/#/module/pipeline-module" \
  --only-categories=performance,accessibility \
  --chrome-flags="--headless=new" \
  --output=json --output-path=./lighthouse-module.json

# 3. Gate (AC-06 thresholds):
node -e '
  const r = JSON.parse(require("fs").readFileSync("./lighthouse-module.json", "utf8"));
  const perf = r.categories.performance.score * 100;
  const a11y = r.categories.accessibility.score * 100;
  console.log(`performance ${perf}, accessibility ${a11y}`);
  process.exit(perf >= 85 && a11y >= 95 ? 0 : 1);
'
```

Note: P0 ships no public content (decision D-001), so the audited module page
comes from the fixture tree copied into `dist/content/` by `e2e-prepare.mjs`.
