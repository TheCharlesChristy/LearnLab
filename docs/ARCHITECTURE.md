# Architecture (contributor's condensed view)

This is SRS §3, condensed for contributors, plus the operational runbooks. The SRS (`SRS-LearnLab.md`) is normative; if this file and the SRS disagree, the SRS wins.

## 1. High-level view

LearnLab is a **static, client-only SPA** on GitHub Pages. The browser is the entire execution environment: no backend, no accounts, no telemetry. All learner data stays on-device in IndexedDB (NFR-PRIV-001).

```
┌──────────────────────────────────────────────────────────────┐
│ Browser                                                      │
│                                                              │
│  Host (main thread, React 19 SPA)        Python Worker (P1)  │
│  • router / shell                ◄──────► • Pyodide          │
│  • content loader (+Ajv)         JSON     • learnsdk         │
│  • Markdown renderer             protocol • courselib        │
│  • native widget registry        (§6.3)   • item code        │
│  • quiz engine                                               │
│  • progress store (Dexie)        Service worker (PWA, P1)    │
│        │                          • app-shell precache       │
│    IndexedDB                      • content SWR cache        │
│                                   • pyodide cache-first      │
└──────────────────────────────────────────────────────────────┘
        ▲ static fetch (same origin)            ▲
   GitHub Pages: /assets, /content/**,     jsDelivr CDN:
   /python-bundle.zip                      pyodide vX.Y.Z + wheels
```

Stack (fixed, §3.2): React 19 (function components + hooks), Vite, TypeScript `strict`, Tailwind CSS 4, react-router v7 with `createHashRouter` (GitHub Pages serves no rewrites — hash routes need none), react-markdown + remark-gfm/math/directive/frontmatter + rehype-katex, KaTeX, Dexie 4, Ajv 8 (JSON Schema 2020-12), Pyodide (P1) in a dedicated Web Worker, vite-plugin-pwa (P1), Recharts + custom SVG for visuals, Vitest/Playwright/pytest.

## 2. The modularity contract (§3.5)

Why adding content scales without touching the app:

- **Content is data** (constraint C-5): courses are folders of JSON/MD/PY under `public/content/`. The generated `content/index.json` is the only registry, built by `scripts/build-content.mjs`, never hand-edited. Adding/editing content SHALL never require changes under `src/`.
- **Widgets are a registry:** one map `widgetRegistry: Record<string, WidgetDef>` in `src/widgets/registry.ts`. A new native widget = one component folder + one registry entry + one `WIDGETS.md` section. Nothing else changes.
- **Python items are files:** one `.py` per item, importing only `learnsdk` (stable, semver) and `courselib`. New interactivity usually costs zero host changes. (P1)
- **Subsystem boundaries:** `content/`, `widgets/`, `quiz/`, `python/`, `progress/` are import-isolated (ESLint `import/no-restricted-paths`); each exposes a small `index.ts` API.

## 3. Subsystem map of `src/`

| Path             | Responsibility                                                                                                       | State |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- | ----- |
| `src/config.ts`  | Single-point configuration (§10.2): `APP_NAME`, `REPO_NAME`, `PYODIDE_VERSION`, `PYODIDE_BASE_URL`. Renaming the app or moving Pyodide touches only this file (plus `package.json`). | built |
| `src/app/`       | Shell: routes, layout, error boundaries.                                                                              | built (P0 scope) |
| `src/content/`   | Content types, lesson context (`moduleBaseUrl` etc.), loaders + Ajv dev-mode guards.                                  | built (P0 scope) |
| `src/markdown/`  | `MarkdownLesson` renderer: GFM, KaTeX maths, Shiki code blocks, and the four §4.5 directives (`::widget`, `::py`, `:::callout`, `:::reveal`) incl. the error cards for unknown widgets / bad props / nested containers. | built |
| `src/widgets/`   | Native widgets + `registry.ts` + `keys.json` (plain-data twin of the registry for the Node validator) + `widget-def.ts` (the `WidgetDef` contract). Implemented: `function-grapher`, `figure`, `quiz`. | built |
| `src/quiz/`      | Native quiz engine: §4.6 types, marking, seeded shuffle/pick (mulberry32), one-question-at-a-time flow.                | built |
| `src/progress/`  | Dexie db (`learnlab`), hooks, export/import, persistence.                                                              | built |
| `src/python/`    | `PyHost` worker management, §6.3 protocol types, `TreeRenderer`, `worker.ts`.                                          | TODO(P1) |
| `src/ui/`        | Shared primitives (Button, Card, ProgressBar…).                                                                        | grows as needed |

Runtime data flow (§3.4): boot → fetch generated `content/index.json` → catalogue; course/module/lesson files fetched lazily; the Markdown renderer maps directives to registry widgets or (P1) `<PyItem>` mounts; progress writes go through `src/progress` into Dexie.

## 4. Runbook: add a native widget

Per FR-WID-002, registering a widget requires only the component file, one registry entry, and a docs section. Concretely in this repo:

1. **Create the component folder** `src/widgets/<key>/` containing:
   - `<Component>.tsx` — the React component, loaded lazily;
   - `index.ts` — exports a props interface, a `parseProps(raw: RawWidgetProps): ParsedProps<P>` guard (hand-rolled, no Zod; every error message names the bad prop — FR-WID-003), and:

     ```ts
     export const def: WidgetDef = defineWidget<MyProps>({
       component: lazy(() => import('./MyComponent')),
       parseProps,
     });
     ```

   - tests for `parseProps` and the component.
2. **Register it** in `src/widgets/registry.ts`: import the `def` and add `'<key>': myWidget` to `widgetRegistry`. (Registry wiring is orchestrator-owned during phased builds — widget tasks export `def` from their folder; the orchestrator adds the entry.)
3. **Add the key to `src/widgets/keys.json`** — the plain-data twin of the registry that the Node content pipeline uses to validate `::widget type` without importing TS (dumped to `schemas/widget-keys.json` by the build). A unit test asserts the map and `keys.json` agree.
4. **Document it** in `docs/WIDGETS.md` with a heading of the exact form `` ## `<key>` `` — CI string-matches every registry key against the doc headings and fails if one is missing.
5. **Keep it lazy and small:** the entry `index.ts` must not import heavy libraries; they belong inside the lazy chunk (per-widget lazy chunks ≤ 150 KB gz, NFR-PERF-001).

That's the whole surface. No router changes, no loader changes, no schema changes.

## 5. Runbook: change the Pyodide version or hosting

Both are single-constant changes in `src/config.ts` (§6.2.4, §10.2):

```ts
export const PYODIDE_VERSION = '0.27.7';
export const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
```

**Bump the version:** change `PYODIDE_VERSION` (keep ≥ 0.27 / the CPython 3.12 line), re-run the Python test suites, and check cold-start budgets (NFR-PY-001). The service worker cache name is derived from the version (`pyodide-v<ver>`), so old caches age out naturally.

**Switch to self-hosting** (recorded fallback, §10.4 — the default is CDN-with-service-worker-cache because of repo-size constraint C-2):

1. Download the pinned Pyodide distribution core plus the wheels we bless (`numpy`, `sympy`) — roughly tens of MB.
2. Commit them under `public/pyodide/` (stay well clear of GitHub's 100 MB per-file limit, C-2).
3. Flip the constant: `PYODIDE_BASE_URL = import.meta.env.BASE_URL + 'pyodide/'` (a same-origin path).
4. No CSP change is needed — see below; the policy covers both configurations. The service worker caches whichever origin is configured (FR-PWA-002).

## 6. Security: CSP (NFR-SEC-001)

The app ships a CSP via meta tag:

```
default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net;
worker-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net;
img-src 'self' data:; style-src 'self' 'unsafe-inline'
```

**No other origins, ever.** No analytics, no font CDNs (fonts are self-hosted). Corollaries that bite contributors:

- No `eval`/`new Function` anywhere in app code (NFR-SEC-002) — `function-grapher` compiles expressions with a mathjs number-only subset instead.
- Raw HTML in lesson Markdown is disabled (FR-CONT-005), eliminating content-borne XSS.
- The only cross-origin traffic is the pinned Pyodide CDN prefix; learner-typed code (the `code-runner` widget, P1) runs only in the DOM-less worker.
