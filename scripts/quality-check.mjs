#!/usr/bin/env node
/* global console, process */
// Production quality gate for Experience Runtime v2 / issue #64.
//
// This intentionally checks only deterministic build artefacts and source
// contracts. Timing is exercised separately in the Chromium low-end fixture;
// it is not reliable enough to make a general CI build flaky.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(repoRoot, 'dist');
const sourceDir = path.join(repoRoot, 'src');
const contentDir = path.join(distDir, 'content');

export const V2_QUALITY_BUDGETS = Object.freeze({
  maxCampaignAssetBytes: 1 * 1024 * 1024,
  maxCampaignPackBytes: 5 * 1024 * 1024,
  allowedRemoteOrigin: 'https://cdn.jsdelivr.net',
});

export const PRODUCTION_CSP =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; worker-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net blob:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'";

function fail(message) {
  throw new Error(`quality-check: ${message}`);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function checkProductionCsp() {
  const indexPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexPath)) fail('dist/index.html is missing; run vite build first.');
  const indexHtml = read(indexPath);
  if (!indexHtml.includes('http-equiv="Content-Security-Policy"')) {
    fail('production HTML has no CSP meta policy.');
  }
  if (!indexHtml.includes(PRODUCTION_CSP)) {
    fail('production CSP differs from the approved local-first policy.');
  }
  if (/<link\b[^>]*\brel=["'](?:prefetch|prerender)["']/i.test(indexHtml)) {
    fail('production HTML must not eagerly prefetch campaign or activity resources.');
  }
}

function checkCspSafeSource() {
  const sourceFiles = walk(sourceDir).filter(
    (file) => /\.(?:ts|tsx)$/.test(file) && !/\.(?:test|spec)\.[tj]sx?$/.test(file),
  );
  for (const file of sourceFiles) {
    const content = read(file);
    if (/\beval\s*\(/.test(content) || /\bnew\s+Function\s*\(/.test(content)) {
      fail(`${path.relative(repoRoot, file)} contains eval/new Function.`);
    }

    // Permit only the pinned Pyodide origin for direct network calls. Links,
    // schemas, and documentation strings are deliberately outside this narrow
    // call-site check: they do not make a network request from the application.
    const remoteCalls = [
      ...content.matchAll(/(?:fetch|importScripts)\s*\(\s*[`'"](https?:\/\/[^/'"`]+)/g),
      ...content.matchAll(/new\s+WebSocket\s*\(\s*[`'"](wss?:\/\/[^/'"`]+)/g),
    ];
    for (const match of remoteCalls) {
      const origin = match[1].replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
      if (origin !== V2_QUALITY_BUDGETS.allowedRemoteOrigin) {
        fail(`${path.relative(repoRoot, file)} uses unapproved network origin ${origin}.`);
      }
    }
  }
}

function checkServiceWorkerCaching() {
  const workers = walk(distDir).filter((file) => /(?:^|[\\/])sw\.js$/.test(file));
  if (workers.length !== 1) fail('expected exactly one generated service worker.');
  const serviceWorker = read(workers[0]);
  for (const required of [
    'content-v1',
    'StaleWhileRevalidate',
    'CacheFirst',
    'python-bundle.zip',
  ]) {
    if (!serviceWorker.includes(required)) {
      fail(`service worker is missing the required offline-after-cache contract: ${required}.`);
    }
  }
  if (!fs.existsSync(path.join(distDir, 'python-bundle.zip'))) {
    fail('python-bundle.zip is absent from the production build.');
  }
}

function checkLazyPluginDescriptors() {
  const pluginFiles = walk(path.join(sourceDir, 'experience')).filter(
    (file) => /\.(?:ts|tsx)$/.test(file) && !/\.test\.[tj]sx?$/.test(file),
  );
  const descriptors = pluginFiles.filter((file) =>
    /(?:=|:)\s*defineActivityPlugin(?:<[^>]*>)?\s*\(/.test(read(file)),
  );
  if (descriptors.length === 0) fail('no ActivityPlugin descriptors were found.');
  for (const file of descriptors) {
    const content = read(file);
    if (!/component:\s*lazy\s*\(\s*\(\)\s*=>\s*import\s*\(/.test(content)) {
      fail(`${path.relative(repoRoot, file)} does not declare a React.lazy activity component.`);
    }
    if (!/loading:\s*'lazy'/.test(content) || !/lazyChunkBudgetKbGzip:\s*\d+/.test(content)) {
      fail(`${path.relative(repoRoot, file)} lacks an enforceable lazy chunk budget.`);
    }
  }
}

function checkCampaignAssetBudgets() {
  if (!fs.existsSync(contentDir)) fail('dist/content is missing from the production build.');
  const packSizes = new Map();
  for (const file of walk(contentDir)) {
    const relative = path.relative(contentDir, file);
    const parts = relative.split(path.sep);
    // Generated indexes are catalogue data, not campaign assets.
    if (parts.length < 3 || parts[0] === 'index.json' || parts[0] === 'search-index.json') continue;
    const bytes = fs.statSync(file).size;
    if (bytes > V2_QUALITY_BUDGETS.maxCampaignAssetBytes) {
      fail(
        `${relative} is ${bytes} B; campaign assets may not exceed ${V2_QUALITY_BUDGETS.maxCampaignAssetBytes} B.`,
      );
    }
    const pack = `${parts[0]}/${parts[1]}`;
    packSizes.set(pack, (packSizes.get(pack) ?? 0) + bytes);
  }
  for (const [pack, bytes] of packSizes) {
    if (bytes > V2_QUALITY_BUDGETS.maxCampaignPackBytes) {
      fail(
        `${pack} is ${bytes} B; campaign packs may not exceed ${V2_QUALITY_BUDGETS.maxCampaignPackBytes} B.`,
      );
    }
  }
}

try {
  checkProductionCsp();
  checkCspSafeSource();
  checkServiceWorkerCaching();
  checkLazyPluginDescriptors();
  checkCampaignAssetBudgets();
  console.log(
    'quality-check: production CSP, lazy-plugin, offline-cache, and campaign-asset budgets passed.',
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
