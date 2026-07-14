// D4 / #48: strict authoring lint for v2 course packs. This is deliberately
// additive to validate-experience-v2: the semantic validator owns graph
// correctness; this file owns reviewable learning-quality and asset guidance.

import fs from 'node:fs';
import path from 'node:path';

export const MAX_V2_ASSET_BYTES = 1 * 1024 * 1024;

const MEDIA_BY_EXTENSION = Object.freeze({
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.ogg': 'audio/ogg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
});

const GENERATION_KEYS = new Set([
  'core-entry',
  'core-faded-step',
  'core-reveal-mechanism',
  'core-sort-match',
  'diagnose-repair',
  'experiment-infer',
]);
const RECOGNITION_KEYS = new Set(['choice', 'seeded-choice', 'core-choice', 'core-predict']);
// `choice` is the deliberately minimal B2 compatibility fixture. New C3
// interactions expose the feedback affordances that D4 can enforce.
const FEEDBACK_COMPLETE_KEYS = new Set(['core-choice', 'core-predict']);
const GENERIC_PRAISE = /^(?:correct|right|great|nice work|well done|good job|you did it)[!. ]*$/i;

function findFiles(dir, name) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) return findFiles(target, name);
      return entry.isFile() && entry.name === name ? [target] : [];
    })
    .sort((left, right) => left.localeCompare(right));
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    // Shape/parser errors are reported by validate-experience-v2 first.
    return undefined;
  }
}

function report(reporter, strict, file, pointer, message) {
  if (strict) reporter.atPointer(file, pointer, message);
  else reporter.warn(`${reporter.rel(file)}#${pointer || '/'}: ${message}`);
}

function isImage(asset) {
  return asset.mediaType.startsWith('image/');
}

function checkSvg(file, packFile, pointer, reporter, strict) {
  const source = fs.readFileSync(file, 'utf8');
  if (
    /<script\b|\son[a-z]+\s*=|(?:href|xlink:href)\s*=\s*["']\s*(?:https?:|\/\/|javascript:)/i.test(
      source,
    )
  ) {
    report(
      reporter,
      strict,
      packFile,
      pointer,
      'SVG contains script, event-handler, or remote executable content; assets must remain CSP-safe.',
    );
  }
}

function checkAssets(pack, packFile, reporter, strict) {
  const packDir = path.dirname(packFile);
  for (const [index, asset] of (pack.assets ?? []).entries()) {
    const pointer = `/assets/${index}`;
    if (typeof asset.path !== 'string') continue;
    if (!asset.path.startsWith('assets/')) {
      report(
        reporter,
        strict,
        packFile,
        `${pointer}/path`,
        'asset paths must live below the pack assets/ directory.',
      );
      continue;
    }
    if (/^(?:https?:)?\/\//i.test(asset.path) || asset.path.includes('..')) {
      report(
        reporter,
        strict,
        packFile,
        `${pointer}/path`,
        'asset paths must be local, relative, and free of parent traversal.',
      );
      continue;
    }
    const extension = path.extname(asset.path).toLowerCase();
    const expectedType = MEDIA_BY_EXTENSION[extension];
    if (!expectedType) {
      report(
        reporter,
        strict,
        packFile,
        `${pointer}/path`,
        `asset extension "${extension || '(none)'}" is not an approved CSP-safe media format.`,
      );
      continue;
    }
    if (asset.mediaType !== expectedType) {
      report(
        reporter,
        strict,
        packFile,
        `${pointer}/mediaType`,
        `mediaType must be "${expectedType}" for ${extension} assets.`,
      );
    }
    if (isImage(asset) && !(typeof asset.alt === 'string' && asset.alt.trim())) {
      report(
        reporter,
        strict,
        packFile,
        `${pointer}/alt`,
        'image assets require meaningful alt text (use an empty decorative asset only when it is not declared as a pack asset).',
      );
    }
    const assetFile = path.resolve(packDir, asset.path);
    if (!fs.existsSync(assetFile)) continue; // B2 owns existence reporting.
    const bytes = fs.statSync(assetFile).size;
    if (bytes > MAX_V2_ASSET_BYTES) {
      report(
        reporter,
        strict,
        packFile,
        `${pointer}/path`,
        `asset is ${bytes} bytes; the strict per-asset budget is ${MAX_V2_ASSET_BYTES} bytes.`,
      );
    }
    if (extension === '.svg') checkSvg(assetFile, packFile, `${pointer}/path`, reporter, strict);
  }
}

function isGenericPraise(text) {
  return GENERIC_PRAISE.test(text.trim());
}

function activityFormat(key) {
  if (GENERATION_KEYS.has(key)) return 'generation';
  if (RECOGNITION_KEYS.has(key)) return 'recognition';
  return 'other';
}

function checkSceneFeedback(graph, graphFile, reporter, strict) {
  const scenes = (graph.nodes ?? []).filter((node) => node.kind === 'scene');
  for (const [nodeIndex, node] of (graph.nodes ?? []).entries()) {
    if (node.kind !== 'scene') continue;
    const pointer = `/nodes/${nodeIndex}/feedback`;
    const success = node.feedback?.success;
    if (typeof success !== 'string' || isGenericPraise(success)) {
      report(
        reporter,
        strict,
        graphFile,
        `${pointer}/success`,
        'success feedback must explain the reasoning or consequence; generic praise is not sufficient.',
      );
    }
    if (
      node.goal?.operator !== 'activity-complete' &&
      FEEDBACK_COMPLETE_KEYS.has(node.activity?.key) &&
      !(typeof node.feedback?.failure === 'string' && node.feedback.failure.trim())
    ) {
      report(
        reporter,
        strict,
        graphFile,
        `${pointer}/failure`,
        'a marked goal requires failure feedback so an unsuccessful attempt is actionable.',
      );
    }
    if (
      node.goal?.operator !== 'activity-complete' &&
      node.activity?.key &&
      FEEDBACK_COMPLETE_KEYS.has(node.activity.key) &&
      !(node.feedback?.misconceptions?.length || node.feedback?.hints?.length)
    ) {
      report(
        reporter,
        strict,
        graphFile,
        pointer,
        'a marked recognition activity needs misconception feedback or a hint ladder.',
      );
    }
  }

  // Format mix is meaningful only after an episode has enough beats. Small
  // missions and compatibility fixtures should not be padded just to satisfy
  // a ratio; larger authored episodes must avoid all-recognition practice.
  if (scenes.length >= 4) {
    const generation = scenes.filter(
      (scene) => activityFormat(scene.activity?.key) === 'generation',
    ).length;
    if (generation * 2 < scenes.length) {
      report(
        reporter,
        strict,
        graphFile,
        '/nodes',
        `only ${generation}/${scenes.length} scenes are generation-format; use at least half generation (entry, faded step, self-explanation, or construction) rather than recognition alone.`,
      );
    }
  }
}

/**
 * Run D4 checks across already-shaped v2 packs. In non-strict builds they are
 * warnings; `build-content --strict` turns every finding into a CI failure.
 */
export function lintExperienceV2(root, reporter, { strict = false } = {}) {
  for (const packFile of findFiles(path.join(root, 'v2'), 'course-pack.json')) {
    const pack = readJson(packFile);
    if (!pack || typeof pack !== 'object') continue;
    checkAssets(pack, packFile, reporter, strict);
    const packDir = path.dirname(packFile);
    for (const experience of pack.experiences ?? []) {
      if (typeof experience.file !== 'string') continue;
      const graphFile = path.resolve(packDir, experience.file);
      const graph = readJson(graphFile);
      if (graph && typeof graph === 'object')
        checkSceneFeedback(graph, graphFile, reporter, strict);
    }
  }
}
