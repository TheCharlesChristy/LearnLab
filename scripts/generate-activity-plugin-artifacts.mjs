// Regenerate C2's checked-in plugin projections from the TypeScript registry.
// Vite's SSR loader lets this script consume the same source definitions as
// the application without maintaining a JavaScript shadow registry.

import fs from 'node:fs';
import path from 'node:path';

import { createServer } from 'vite';

const repoRoot = path.resolve('.');
const vite = await createServer({
  configFile: false,
  appType: 'custom',
  server: { middlewareMode: true },
  // This is a one-shot SSR loader, not a dev server. Dependency scanning would
  // walk unrelated application entry points (including virtual PWA modules).
  optimizeDeps: { noDiscovery: true },
});

try {
  const generated = await vite.ssrLoadModule('/src/experience/plugins/generated.ts');
  const writeJson = (relativeFile, value) => {
    fs.writeFileSync(path.join(repoRoot, relativeFile), `${JSON.stringify(value, null, 2)}\n`);
  };

  writeJson('schemas/activity-plugin-props.schema.json', generated.createActivityPluginSchemaDocument());
  writeJson('fixtures/activity-plugins.json', generated.createActivityPluginFixtureManifest());
  fs.writeFileSync(
    path.join(repoRoot, 'docs/ACTIVITY_PLUGINS.md'),
    generated.renderActivityPluginDocumentation(),
  );
} finally {
  await vite.close();
}
