# Experience Runtime v2 quality budgets

Issue #64 turns the static/local-first constraints into release gates. Run the
complete production check with `npm run build`; re-run only its deterministic
artefact checks with `npm run check:quality` after a production build.

| Area | Budget / rule | Enforcement |
| --- | --- | --- |
| Initial application JavaScript | 350 KB gzip | `scripts/size-check.mjs` |
| Any lazy route, widget, scene, or activity chunk | 150 KB gzip | `scripts/size-check.mjs`; every ActivityPlugin also declares the same ceiling |
| One campaign asset | 1 MiB | `scripts/quality-check.mjs` over `dist/content` |
| One campaign pack | 5 MiB | `scripts/quality-check.mjs` over `dist/content/<subject>/<course>` |
| Automatic campaign/activity prefetch | None | no `prefetch`/`prerender` link in production HTML; resources load on learner navigation |
| Offline after a resource is opened online | app shell precache; course content SWR; Pyodide cache-first; Python bundle precached | generated service-worker check plus AC-04 Playwright coverage |
| CSP and origins | exact approved policy; no `eval` or `new Function`; only pinned Pyodide CDN may be a direct remote call | production HTML + source call-site check |
| v2 run/event storage | 16 KiB per event, 64 KiB projection, 1,000 events/run, 10,000 total | B4 write boundary and long-run fixture |
| Long synthetic v2 run export | under 2 MiB for the representative capped fixture | `src/experience/quality-budgets.test.ts` |

## Lazy and offline policy

Activity plugins and route components are React lazy boundaries. Do not add an
eager import merely to make a campaign feel faster. There is intentionally no
automatic campaign prefetch: it would spend mobile data and cache quota before
the learner has chosen a route. Once a learner opens content, the service
worker's content cache provides offline-after-cache behaviour. New campaign
assets must be same-origin, live under the course pack, and fit the asset and
pack budgets above.

## Low-end mobile fixture

The `@low-end` Playwright test uses a Pixel 5 viewport with Chromium CPU
throttled 4×. It requires catalogue startup in under 8 seconds and the core
catalogue-to-course interaction in under 2.5 seconds. These thresholds are
intentionally broad enough for shared CI runners; investigate a regression
rather than tuning the test to a single runner.

## Changing a budget

Treat a budget change as an architecture decision. Record the reason, measure
the production output, preserve the static/local-first/privacy boundaries, and
update this document and the matching automated check together. A larger asset
or a network-dependent workaround is not an acceptable substitute for a lazy,
cacheable capability.
