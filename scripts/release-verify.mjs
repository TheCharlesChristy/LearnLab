/* global console, process */
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

for (const file of ['schemas/activity-plugin-props.schema.json', 'docs/ACTIVITY_PLUGINS.md', 'docs/V2_VERTICAL_SLICE_PLAYTEST.md']) {
  if (!fs.existsSync(file)) throw new Error(`verify:release-v2 missing ${file}`);
}
for (const args of [
  ['test', '--', '--run', 'src/experience/plugins/generated.test.ts', 'src/experience/plugins/contract-matrix.test.tsx', 'tests/pipeline/vertical-slice.test.ts'],
  ['run', 'validate', '--', '--strict'],
]) {
  const result = spawnSync('npm', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('verify:release-v2 passed generated schema/docs/fixture drift plus strict validated vertical-slice demonstration gates.');
