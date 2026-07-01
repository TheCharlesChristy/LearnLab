#!/usr/bin/env node
/* global process, console, setTimeout, clearTimeout */
// LearnLab content pipeline — SRS §4.7 (normative), §8.6 (--strict ◆ rules),
// decision D-001 (--root <dir>, default public/content).
//
// Usage:
//   node scripts/build-content.mjs [--root <dir>] [--strict] [--watch]
//
// In order, exiting non-zero on any failure (errors name file + JSON pointer
// or file + line):
//   1. Regenerate schemas/widget-keys.json from src/widgets/keys.json.
//   2. Discover course.json / module.json / referenced quiz files under root.
//   3. Ajv-validate everything (draft 2020-12, allErrors: true).
//   4. Enforce cross-file rules: global module-id uniqueness; prerequisites
//      resolve; Lesson.file / assessment.file / ::py src targets exist;
//      ::widget types come from schemas/widget-keys.json; only the four §4.5
//      directive forms; containers never nest containers; figure needs alt;
//      callout kind ∈ {info,tip,warning,key}.
//   5. python3 -m py_compile every .py under <root>/**/items/ and python/**.
//   6. Emit <root>/index.json (§4.2) and validate it against its schema.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

import { dumpWidgetKeys } from './dump-widget-keys.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SUBJECTS = ['maths', 'physics', 'cs', 'ai'];
const SUBJECT_TITLES = {
  maths: 'Mathematics',
  physics: 'Physics',
  cs: 'Computer Science',
  ai: 'AI',
};
const CALLOUT_KINDS = ['info', 'tip', 'warning', 'key'];

// ---------------------------------------------------------------------------
// CLI

function parseCli(argv) {
  const opts = {
    root: path.join(repoRoot, 'public', 'content'),
    strict: false,
    watch: false,
    docsFile: path.join(repoRoot, 'docs', 'WIDGETS.md'),
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') {
      const value = argv[i + 1];
      if (!value) fail('--root requires a directory argument');
      opts.root = path.resolve(value);
      i += 1;
    } else if (arg === '--strict') {
      opts.strict = true;
    } else if (arg === '--watch') {
      opts.watch = true;
    } else if (arg === '--docs-file') {
      // Test-only seam (§7.3, FR-WID-002 coverage test): lets a test point
      // checkWidgetDocs at a scratch copy instead of mutating the real repo
      // docs/WIDGETS.md, which would race other tests that shell out to this
      // script concurrently. Not part of the documented CLI surface.
      const value = argv[i + 1];
      if (!value) fail('--docs-file requires a file argument');
      opts.docsFile = path.resolve(value);
      i += 1;
    } else {
      fail(`unknown argument: ${arg}\nusage: build-content.mjs [--root <dir>] [--strict] [--watch]`);
    }
  }
  return opts;
}

function fail(message) {
  console.error(`build-content: ${message}`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Ajv setup

function loadSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'schemas', name), 'utf8'));
}

function makeValidators() {
  const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true, discriminator: true });
  addFormats(ajv);
  return {
    course: ajv.compile(loadSchema('course.schema.json')),
    module: ajv.compile(loadSchema('module.schema.json')),
    quiz: ajv.compile(loadSchema('quiz.schema.json')),
    contentIndex: ajv.compile(loadSchema('content-index.schema.json')),
  };
}

// ---------------------------------------------------------------------------
// Error collection

class Reporter {
  constructor(root) {
    this.root = root;
    this.errors = [];
    this.warnings = [];
  }

  rel(file) {
    return path.relative(process.cwd(), file) || '.';
  }

  /** Schema/JSON error at file + JSON pointer. */
  atPointer(file, pointer, message) {
    this.errors.push(`${this.rel(file)}#${pointer || '/'}: ${message}`);
  }

  /** Markdown error at file + line. */
  atLine(file, line, message) {
    this.errors.push(`${this.rel(file)}:${line ?? '?'}: ${message}`);
  }

  atFile(file, message) {
    this.errors.push(`${this.rel(file)}: ${message}`);
  }

  warn(message) {
    this.warnings.push(message);
  }

  schemaErrors(file, ajvErrors) {
    for (const err of ajvErrors ?? []) {
      const extras =
        err.keyword === 'additionalProperties'
          ? ` (unexpected property "${err.params.additionalProperty}")`
          : err.keyword === 'enum'
            ? ` (allowed: ${JSON.stringify(err.params.allowedValues)})`
            : '';
      this.atPointer(file, err.instancePath, `${err.message}${extras}`);
    }
  }
}

function readJson(file, reporter) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    reporter.atFile(file, `cannot read file: ${err.message}`);
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    reporter.atFile(file, `invalid JSON: ${err.message}`);
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Markdown directive validation (§4.5)

const mdProcessor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ['yaml'])
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkDirective);

const DIRECTIVE_TYPES = new Set(['containerDirective', 'leafDirective', 'textDirective']);

/**
 * Validate one lesson Markdown file. Returns facts used by cross-file checks:
 * { interactive: boolean } — true if the lesson contains a ::widget beyond
 * `figure`, or a ::py item (§8.6 interactive-item rule).
 */
function checkLessonMarkdown(file, moduleDir, widgetKeys, validators, reporter) {
  const facts = { interactive: false };
  let source;
  try {
    source = fs.readFileSync(file, 'utf8');
  } catch (err) {
    reporter.atFile(file, `cannot read lesson file: ${err.message}`);
    return facts;
  }

  let tree;
  try {
    tree = mdProcessor.parse(source);
  } catch (err) {
    reporter.atLine(file, err.line ?? 1, `Markdown failed to parse: ${err.message}`);
    return facts;
  }

  const line = (node) => node.position?.start?.line;

  const visit = (node, insideContainer) => {
    if (DIRECTIVE_TYPES.has(node.type)) {
      checkDirective(node, insideContainer);
    }
    const childInsideContainer = insideContainer || node.type === 'containerDirective';
    for (const child of node.children ?? []) visit(child, childInsideContainer);
  };

  const checkDirective = (node, insideContainer) => {
    const name = node.name;
    const attrs = node.attributes ?? {};

    if (node.type === 'textDirective') {
      reporter.atLine(
        file,
        line(node),
        `unknown directive ":${name}" — only ::widget, ::py, :::callout and :::reveal are recognised (§4.5)`,
      );
      return;
    }

    if (node.type === 'leafDirective') {
      if (name === 'widget') {
        checkWidgetDirective(node, attrs);
      } else if (name === 'py') {
        checkPyDirective(node, attrs);
      } else {
        reporter.atLine(
          file,
          line(node),
          `unknown leaf directive "::${name}" — only ::widget and ::py are recognised (§4.5)`,
        );
      }
      return;
    }

    // containerDirective
    if (name !== 'callout' && name !== 'reveal') {
      reporter.atLine(
        file,
        line(node),
        `unknown container directive ":::${name}" — only :::callout and :::reveal are recognised (§4.5)`,
      );
      return;
    }
    if (insideContainer) {
      reporter.atLine(
        file,
        line(node),
        `containers must not nest containers: ":::${name}" appears inside another container (§4.5)`,
      );
    }
    if (name === 'callout') {
      if (!attrs.kind) {
        reporter.atLine(file, line(node), 'callout requires kind="info|tip|warning|key" (§4.5)');
      } else if (!CALLOUT_KINDS.includes(attrs.kind)) {
        reporter.atLine(
          file,
          line(node),
          `callout kind "${attrs.kind}" is invalid — must be one of ${CALLOUT_KINDS.join(', ')} (§4.5)`,
        );
      }
    }
  };

  const checkWidgetDirective = (node, attrs) => {
    const type = attrs.type;
    if (!type) {
      reporter.atLine(file, line(node), '::widget requires a type attribute (§4.5)');
      return;
    }
    if (!widgetKeys.includes(type)) {
      reporter.atLine(
        file,
        line(node),
        `unknown widget type "${type}" — registered widgets: ${widgetKeys.join(', ')} (schemas/widget-keys.json)`,
      );
      return;
    }
    if (type !== 'figure') facts.interactive = true;
    if (type === 'figure' && !attrs.alt) {
      reporter.atLine(file, line(node), 'figure widget requires a non-empty alt attribute (§5.3)');
    }
    if (type === 'quiz') {
      const src = attrs.src;
      if (!src) {
        reporter.atLine(file, line(node), 'quiz widget requires a module-relative src attribute (§5.3)');
        return;
      }
      const quizFile = path.resolve(moduleDir, src);
      if (!fs.existsSync(quizFile)) {
        reporter.atLine(file, line(node), `quiz src "${src}" does not exist in the module folder`);
        return;
      }
      const quiz = readJson(quizFile, reporter);
      if (quiz !== undefined && !validators.quiz(quiz)) {
        reporter.schemaErrors(quizFile, validators.quiz.errors);
      }
    }
  };

  const checkPyDirective = (node, attrs) => {
    const src = attrs.src;
    if (!src) {
      reporter.atLine(file, line(node), '::py requires a src attribute (§4.5)');
      return;
    }
    if (!fs.existsSync(path.resolve(moduleDir, src))) {
      reporter.atLine(file, line(node), `::py src "${src}" does not exist in the module folder`);
    } else {
      facts.interactive = true;
    }
    if (attrs.params !== undefined) {
      try {
        const parsed = JSON.parse(attrs.params);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          reporter.atLine(file, line(node), '::py params must be a JSON object string (§4.5)');
        }
      } catch {
        reporter.atLine(file, line(node), '::py params is not valid JSON (§4.5)');
      }
    }
    if (attrs.height !== undefined) {
      const height = Number(attrs.height);
      if (!Number.isFinite(height) || height < 240) {
        reporter.atLine(file, line(node), '::py height must be a number ≥ 240 (§4.5)');
      }
    }
  };

  visit(tree, false);
  return facts;
}

// ---------------------------------------------------------------------------
// Tree walk

function listDirs(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function validateTree(root, strict, validators, widgetKeys, reporter) {
  /** @type {Map<string, {file: string}>} */
  const moduleIds = new Map();
  /** @type {{moduleFile: string, prereqs: string[]}[]} */
  const prereqChecks = [];
  /** @type {{id: string, title: string, level: string, path: string, estMinutes: number, moduleCount: number}[][]} keyed by subject */
  const subjects = new Map();

  if (!fs.existsSync(root)) return { subjects, moduleIds };

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue; // index.json, .gitkeep, …
    if (!SUBJECTS.includes(entry.name)) {
      reporter.atFile(path.join(root, entry.name), `unknown subject folder — must be one of ${SUBJECTS.join(', ')} (§4.1)`);
      continue;
    }
    const subjectDir = path.join(root, entry.name);
    const courses = [];
    for (const courseDirName of listDirs(subjectDir)) {
      const course = validateCourse(entry.name, courseDirName, path.join(subjectDir, courseDirName));
      if (course) courses.push(course);
    }
    if (courses.length > 0) subjects.set(entry.name, courses);
  }

  // Every prerequisites entry must resolve somewhere in the tree (§4.4, AC-05).
  for (const { moduleFile, prereqs } of prereqChecks) {
    prereqs.forEach((prereq, i) => {
      if (!moduleIds.has(prereq)) {
        reporter.atPointer(
          moduleFile,
          `/prerequisites/${i}`,
          `dangling prerequisite: module id "${prereq}" does not exist anywhere in the content tree`,
        );
      }
    });
  }

  return { subjects, moduleIds };

  function validateCourse(subjectId, courseDirName, courseDir) {
    const courseFile = path.join(courseDir, 'course.json');
    if (!fs.existsSync(courseFile)) {
      reporter.atFile(courseDir, 'course folder is missing course.json (§4.3)');
      return undefined;
    }
    const course = readJson(courseFile, reporter);
    if (course === undefined) return undefined;
    if (!validators.course(course)) {
      reporter.schemaErrors(courseFile, validators.course.errors);
      return undefined;
    }
    if (course.subject !== subjectId) {
      reporter.atPointer(
        courseFile,
        '/subject',
        `subject "${course.subject}" must match the parent folder "${subjectId}" (§4.3)`,
      );
    }

    let totalEstMinutes = 0;
    const seenDirs = new Set();
    course.modules.forEach((ref, i) => {
      if (seenDirs.has(ref.dir)) {
        reporter.atPointer(courseFile, `/modules/${i}/dir`, `duplicate module dir "${ref.dir}"`);
        return;
      }
      seenDirs.add(ref.dir);
      const est = validateModule(courseFile, i, ref, path.join(courseDir, ref.dir));
      totalEstMinutes += est;
    });

    // Orphan module folders (present on disk, absent from course.json) are
    // unreferenced and unvalidated — surface them as warnings.
    for (const dirName of listDirs(courseDir)) {
      if (!seenDirs.has(dirName) && fs.existsSync(path.join(courseDir, dirName, 'module.json'))) {
        reporter.warn(
          `${reporter.rel(path.join(courseDir, dirName))}: module folder is not referenced by ${reporter.rel(courseFile)}`,
        );
      }
    }

    return {
      id: course.id,
      path: `${subjectId}/${courseDirName}`,
      title: course.title,
      level: course.level,
      moduleCount: course.modules.length,
      totalEstMinutes,
    };
  }

  /** Returns the module's estMinutes contribution (0 on failure). */
  function validateModule(courseFile, refIndex, ref, moduleDir) {
    const moduleFile = path.join(moduleDir, 'module.json');
    if (!fs.existsSync(moduleFile)) {
      reporter.atPointer(
        courseFile,
        `/modules/${refIndex}/dir`,
        `module folder "${ref.dir}" has no module.json`,
      );
      return 0;
    }
    const mod = readJson(moduleFile, reporter);
    if (mod === undefined) return 0;
    if (!validators.module(mod)) {
      reporter.schemaErrors(moduleFile, validators.module.errors);
      return 0;
    }
    if (mod.id !== ref.id) {
      reporter.atPointer(
        courseFile,
        `/modules/${refIndex}/id`,
        `ModuleRef id "${ref.id}" does not match module.json id "${mod.id}" (§4.3)`,
      );
    }

    // Global module-id uniqueness (§4.1).
    if (moduleIds.has(mod.id)) {
      reporter.atPointer(
        moduleFile,
        '/id',
        `module id "${mod.id}" is not globally unique — already used by ${reporter.rel(moduleIds.get(mod.id).file)}`,
      );
    } else {
      moduleIds.set(mod.id, { file: moduleFile });
    }

    prereqChecks.push({ moduleFile, prereqs: mod.prerequisites });

    // Lesson ids unique within the module (§4.1); files exist (§4.7).
    const lessonIds = new Set();
    let interactive = false;
    mod.lessons.forEach((lesson, i) => {
      if (lessonIds.has(lesson.id)) {
        reporter.atPointer(moduleFile, `/lessons/${i}/id`, `duplicate lesson id "${lesson.id}" within module`);
      }
      lessonIds.add(lesson.id);
      const lessonFile = path.resolve(moduleDir, lesson.file);
      if (!fs.existsSync(lessonFile)) {
        reporter.atPointer(
          moduleFile,
          `/lessons/${i}/file`,
          `lesson file "${lesson.file}" does not exist on disk`,
        );
        return;
      }
      if ((lesson.kind ?? 'markdown') === 'markdown') {
        const facts = checkLessonMarkdown(lessonFile, moduleDir, widgetKeys, validators, reporter);
        if (facts.interactive) interactive = true;
      } else {
        interactive = true; // full-page Python item lesson
      }
    });

    // Assessment file exists + validates (§4.7).
    let assessmentQuiz;
    if (mod.assessment) {
      const assessmentFile = path.resolve(moduleDir, mod.assessment.file);
      if (!fs.existsSync(assessmentFile)) {
        reporter.atPointer(
          moduleFile,
          '/assessment/file',
          `assessment file "${mod.assessment.file}" does not exist on disk`,
        );
      } else {
        const quiz = readJson(assessmentFile, reporter);
        if (quiz !== undefined) {
          if (!validators.quiz(quiz)) {
            reporter.schemaErrors(assessmentFile, validators.quiz.errors);
          } else {
            assessmentQuiz = quiz;
          }
        }
      }
    }

    if (strict) {
      checkMvc(moduleFile, mod, interactive, assessmentQuiz);
    }

    return mod.estMinutes;
  }

  // §8.6 ◆ Minimum Viable Content rules (--strict).
  function checkMvc(moduleFile, mod, interactive, assessmentQuiz) {
    if (mod.lessons.length < 3) {
      reporter.atPointer(
        moduleFile,
        '/lessons',
        `MVC (§8.6): module has ${mod.lessons.length} lesson(s); ≥ 3 required`,
      );
    }
    if (!interactive) {
      reporter.atFile(
        moduleFile,
        'MVC (§8.6): module has no interactive item (a ::widget beyond figure, or a ::py item) in any lesson',
      );
    }
    if (!mod.assessment) {
      reporter.atFile(moduleFile, 'MVC (§8.6): module has no assessment (assessment.json with ≥ 8 questions required)');
    } else if (assessmentQuiz) {
      const assessmentFile = path.resolve(path.dirname(moduleFile), mod.assessment.file);
      if (assessmentQuiz.questions.length < 8) {
        reporter.atPointer(
          assessmentFile,
          '/questions',
          `MVC (§8.6): assessment has ${assessmentQuiz.questions.length} question(s); ≥ 8 required`,
        );
      }
      const types = new Set(assessmentQuiz.questions.map((q) => q.type));
      if (types.size < 2) {
        reporter.atPointer(
          assessmentFile,
          '/questions',
          `MVC (§8.6): assessment uses only ${types.size} question type(s); ≥ 2 required`,
        );
      }
    }
    // prerequisites / objectives / estMinutes declarations are schema-required
    // (§4.4) and therefore already enforced by step 2; objectives 2–6 likewise.
  }
}

// ---------------------------------------------------------------------------
// Python syntax gate (§4.7 step 4)

function collectPyFiles(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__pycache__' || entry.name === 'node_modules') continue;
      collectPyFiles(full, predicate, out);
    } else if (entry.name.endsWith('.py') && predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

function pyCompile(root, reporter) {
  const files = [
    ...collectPyFiles(root, (f) => f.split(path.sep).includes('items')),
    ...collectPyFiles(path.join(repoRoot, 'python'), () => true),
  ];
  if (files.length === 0) return;

  const probe = spawnSync('python3', ['--version'], { encoding: 'utf8' });
  if (probe.error || probe.status !== 0) {
    reporter.warn('python3 not found — skipping py_compile syntax gate (CI runs it)');
    return;
  }
  const result = spawnSync('python3', ['-m', 'py_compile', ...files], { encoding: 'utf8' });
  if (result.status !== 0) {
    reporter.errors.push(
      `py_compile failed:\n${(result.stderr || result.stdout || '').trim()}`,
    );
  }
}

// ---------------------------------------------------------------------------
// index.json emission (§4.2)

function emitIndex(root, subjects, validators, reporter) {
  const index = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    // Ordered maths, physics, cs, ai; only subjects that have ≥ 1 course
    // appear (empty subjects are omitted — the catalogue has nothing to show
    // for them, and §4.2 orders, not enumerates, the subject list).
    subjects: SUBJECTS.filter((id) => subjects.has(id)).map((id) => ({
      id,
      title: SUBJECT_TITLES[id],
      courses: subjects.get(id),
    })),
  };

  if (!validators.contentIndex(index)) {
    reporter.schemaErrors(path.join(root, 'index.json'), validators.contentIndex.errors);
    return;
  }
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// Widget doc coverage (§7.3, FR-WID-002): every registered widget key must
// have a `## `<key>`` heading in docs/WIDGETS.md. Runs unconditionally (not
// gated on --strict) — this is an always-on M-priority invariant of
// "registering a widget", not a content-strictness/MVC rule.

function checkWidgetDocs(widgetKeys, docsFile, reporter) {
  const docsText = fs.existsSync(docsFile) ? fs.readFileSync(docsFile, 'utf8') : '';
  for (const key of widgetKeys) {
    const heading = `## \`${key}\``;
    if (!docsText.includes(heading)) {
      reporter.atFile(
        docsFile,
        `widget "${key}" is registered (schemas/widget-keys.json) but docs/WIDGETS.md has no ` +
          `"${heading}" section (§7.3, FR-WID-002)`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// One full pipeline run

function runPipeline(opts) {
  const started = Date.now();
  const reporter = new Reporter(opts.root);

  // Step 1: regenerate + read the widget manifest.
  const widgetKeys = dumpWidgetKeys();
  checkWidgetDocs(widgetKeys, opts.docsFile, reporter);

  const validators = makeValidators();
  const { subjects, moduleIds } = validateTree(opts.root, opts.strict, validators, widgetKeys, reporter);

  pyCompile(opts.root, reporter);

  if (reporter.errors.length === 0) {
    emitIndex(opts.root, subjects, validators, reporter);
  }

  for (const warning of reporter.warnings) console.warn(`WARN  ${warning}`);
  for (const error of reporter.errors) console.error(`ERROR ${error}`);

  const elapsed = Date.now() - started;
  if (reporter.errors.length > 0) {
    console.error(
      `build-content: FAILED — ${reporter.errors.length} error(s) in ${elapsed} ms (root: ${reporter.rel(opts.root)})`,
    );
    return false;
  }
  const moduleCount = moduleIds.size;
  const courseCount = [...subjects.values()].reduce((n, c) => n + c.length, 0);
  console.log(
    `build-content: OK — ${courseCount} course(s), ${moduleCount} module(s)${opts.strict ? ' [strict]' : ''}; wrote index.json in ${elapsed} ms (root: ${reporter.rel(opts.root)})`,
  );
  return true;
}

// ---------------------------------------------------------------------------
// Watch mode (FR-AUTH-004) — dependency-free fs.watch with debounce.

function watch(opts) {
  fs.mkdirSync(opts.root, { recursive: true });
  let timer;
  const schedule = (event, filename) => {
    if (filename && path.basename(filename) === 'index.json') return; // our own output
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log('\nbuild-content: change detected, revalidating…');
      try {
        runPipeline(opts);
      } catch (err) {
        console.error(`build-content: ${err.message}`);
      }
    }, 250);
  };
  fs.watch(opts.root, { recursive: true }, schedule);
  fs.watch(path.join(repoRoot, 'src', 'widgets', 'keys.json'), schedule);
  console.log(`build-content: watching ${path.relative(process.cwd(), opts.root)} (Ctrl-C to stop)`);
}

// ---------------------------------------------------------------------------

const opts = parseCli(process.argv);

let ok;
try {
  ok = runPipeline(opts);
} catch (err) {
  console.error(`build-content: ${err.stack ?? err.message}`);
  ok = false;
}

if (opts.watch) {
  watch(opts); // never exits, even when the first run failed (FR-AUTH-004)
} else {
  process.exit(ok ? 0 : 1);
}
