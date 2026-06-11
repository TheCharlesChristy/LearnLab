# LearnLab

**An interactive learning environment for engineers — entirely in your browser.**

LearnLab is a static, client-only web app that serves structured courses (Mathematics, Physics, Computer Science, and AI, up to A-level standard) with rich interactive content: function graphers, inline quizzes, simulations, and — from P1 — bespoke learning items written in Python and run in-browser via Pyodide (WebAssembly). There is no backend, no account, and no tracking: it is just files on GitHub Pages and your browser.

Two authoring tiers keep contribution cheap:

- **Tier 1 (declarative):** Markdown lessons + JSON quizzes embedding pre-built native widgets. No programming required.
- **Tier 2 (Python):** single-file interactive items against a stable Python SDK (`learnsdk`), executed in a Web Worker via Pyodide. No JavaScript required. *(Ships in P1.)*

Adding content never requires touching application source — courses are folders of data under `public/content/`.

## For learners

Open the app and start: **`https://<user>.github.io/learnlab/`** *(TODO: replace with the real GitHub Pages URL once Pages is enabled.)*

- Works in any modern browser (latest Chrome, Edge, Firefox, Safari; iOS Safari ≥ 17).
- Works offline after your first visit (PWA — P1).
- Your progress is saved in your browser and can be exported/imported as a JSON file from Settings.

## Privacy

**All of your data stays on your device.** Learner progress lives in your browser's local storage (IndexedDB) only; it is never transmitted anywhere. LearnLab has zero telemetry, zero analytics, zero accounts, and makes no network requests except to its own origin and the pinned Pyodide CDN that supplies the Python runtime. You can export, import, or erase all of your data at any time from the Settings page. (Normative: NFR-PRIV-001.)

## For contributors

```sh
git clone <repo-url>
cd learnlab
npm i
npm run dev
```

Useful scripts:

| Command                       | What it does                                          |
| ----------------------------- | ----------------------------------------------------- |
| `npm run dev`                 | Dev server with HMR + content validation in watch mode |
| `npm run validate -- --strict`| Full content validation pipeline (run before any PR)  |
| `npm run new:module`          | Scaffold a new content module                          |
| `npm run new:item`            | Scaffold a new Python item (P1)                        |
| `npm test` / `npm run test:e2e` / `npm run test:py` | Vitest / Playwright / pytest    |

Guides:

- **[Authoring guide](docs/AUTHORING.md)** — write Markdown lessons and JSON quizzes (Tier 1).
- **[Python items guide](docs/PYTHON_ITEMS.md)** — write interactive items in Python (Tier 2; API contract, ships P1).
- **[Widget catalogue](docs/WIDGETS.md)** — every native widget, its props, and copy-paste examples.
- **[Architecture](docs/ARCHITECTURE.md)** — how the system fits together, plus maintainer runbooks.

`main` is protected; all code and content lands via PR with CI green. Content-only PRs run a fast validation lane.

## Deployment

Pushing to `main` builds and deploys to GitHub Pages via GitHub Actions automatically. **The only manual step, ever, is enabling Pages once** in the repository settings: *Settings → Pages → Source: GitHub Actions* (AC-08). Everything else — content validation, build, deploy — is automated.

## Licence

MIT *(placeholder — TODO: owner to confirm the licence choice and add a `LICENSE` file).*
