// Local author tooling only. Commands are fixed executables plus argument arrays;
// authored text is never interpolated into a shell or executed by the learner app.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { URL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

export const deliverySchema = JSON.parse(
  fs.readFileSync(new URL('../../schemas/author-delivery.schema.json', import.meta.url), 'utf8'),
);
const validate = new Ajv2020({ allErrors: true }).compile(deliverySchema);
export function parseDeliveryReceipt(raw) {
  if (!validate(raw)) throw new Error(`Delivery receipt: ${JSON.stringify(validate.errors)}`);
  if (['created', 'existing'].includes(raw.status) && !raw.url)
    throw new Error('Completed delivery requires a pull request URL');
  return JSON.parse(JSON.stringify(raw));
}
const execute = (command, args, cwd) =>
  execFileSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 1024 * 1024, timeout: 60000 });
export function githubRepository(remote) {
  const url = remote.trim();
  const match =
    /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([A-Za-z0-9_-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/i.exec(
      url,
    );
  if (!match || ['.', '..'].includes(match[2]))
    throw new Error('Delivery requires one GitHub origin without embedded HTTPS credentials');
  return `${match[1]}/${match[2]}`;
}
const entries = (text) => text.split('\0').filter(Boolean);
const same = (a, b) => a.toLowerCase() === b.toLowerCase();
const commit = (text) => {
  const value = text.trim();
  if (!/^([0-9a-f]{40}|[0-9a-f]{64})$/.test(value)) throw new Error('Invalid Git commit response');
  return value;
};

export function prepareDelivery({
  repo,
  base,
  title,
  bodyFile,
  output,
  resume = false,
  run = execute,
}) {
  if (!base || base.startsWith('-') || base.length > 1024)
    throw new Error('An explicit valid base branch is required');
  run('git', ['check-ref-format', `refs/heads/${base}`], repo);
  if (!title?.trim() || title.length > 256 || /[\r\n\0]/.test(title))
    throw new Error('Title must be a nonempty single line of at most 256 characters');
  const body = fs.readFileSync(bodyFile);
  if (!body.toString('utf8').trim() || body.length > 65536)
    throw new Error('PR body must be nonempty and at most 64 KiB');
  const branch = run('git', ['symbolic-ref', '--quiet', '--short', 'HEAD'], repo).trim();
  run('git', ['check-ref-format', `refs/heads/${branch}`], repo);
  if (branch === base || ['main', 'master'].includes(branch))
    throw new Error('Delivery requires a focused branch distinct from the base');
  if (run('git', ['status', '--porcelain', '--untracked-files=no'], repo).trim())
    throw new Error('Commit tracked changes before delivery; nothing was staged or pushed');
  const fetchUrls = run('git', ['remote', 'get-url', '--all', 'origin'], repo).trim().split('\n');
  const pushUrls = run('git', ['remote', 'get-url', '--push', '--all', 'origin'], repo)
    .trim()
    .split('\n');
  if (fetchUrls.length !== 1 || pushUrls.length !== 1)
    throw new Error('Delivery refuses multiple origin destinations');
  const repository = githubRepository(fetchUrls[0]);
  if (!same(repository, githubRepository(pushUrls[0])))
    throw new Error('Origin fetch and push repositories differ');
  const headCommit = commit(run('git', ['rev-parse', 'HEAD'], repo));
  const untracked = entries(run('git', ['ls-files', '--others', '--exclude-standard', '-z'], repo));
  const commonDir = run(
    'git',
    ['rev-parse', '--path-format=absolute', '--git-common-dir'],
    repo,
  ).trim();
  const ghCwd = path.dirname(commonDir);
  const receipt = {
    formatVersion: 1,
    kind: 'learnlab-author-delivery',
    attemptId: randomUUID(),
    status: 'prepared',
    repository,
    branch,
    base,
    headCommit,
    baseCommit: null,
    title,
    bodySha256: createHash('sha256').update(body).digest('hex'),
    bodyBytes: body.length,
    untrackedCount: untracked.length,
    untrackedPaths: untracked.slice(0, 100),
    range: null,
    url: null,
    at: new Date().toISOString(),
  };
  if (fs.existsSync(output)) {
    if (!resume) throw new Error('Receipt exists; use --resume for the same delivery attempt');
    const previous = parseDeliveryReceipt(JSON.parse(fs.readFileSync(output, 'utf8')));
    for (const field of ['repository', 'branch', 'base', 'headCommit', 'title', 'bodySha256'])
      if (previous[field] !== receipt[field]) throw new Error(`Resume mismatch: ${field}`);
    if (previous.status === 'dry-run')
      throw new Error('Use a new receipt for actual delivery after a dry-run');
    Object.assign(receipt, previous);
  } else if (resume) throw new Error('Cannot resume a missing delivery receipt');
  return { receipt, body, ghCwd, repo, output, run };
}
function store(context, initial = false) {
  const value = parseDeliveryReceipt(context.receipt);
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  fs.mkdirSync(path.dirname(context.output), { recursive: true });
  if (initial) fs.writeFileSync(context.output, bytes, { flag: 'wx' });
  else {
    const temporary = `${context.output}.${randomUUID()}.tmp`;
    try {
      fs.writeFileSync(temporary, bytes, { flag: 'wx' });
      fs.renameSync(temporary, context.output);
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }
}
function findPull(context, requireHead = true) {
  const { receipt, run, ghCwd } = context;
  const pulls = JSON.parse(
    run(
      'gh',
      [
        'pr',
        'list',
        '--repo',
        receipt.repository,
        '--head',
        receipt.branch,
        '--base',
        receipt.base,
        '--state',
        'open',
        '--limit',
        '100',
        '--json',
        'url,isDraft,headRefOid,headRepository,headRepositoryOwner,baseRefName',
      ],
      ghCwd,
    ),
  );
  if (!Array.isArray(pulls) || pulls.length >= 100)
    throw new Error('Ambiguous pull request lookup');
  const matches = pulls.filter(
    (pull) =>
      pull.headRepository?.name &&
      pull.headRepositoryOwner?.login &&
      same(`${pull.headRepositoryOwner.login}/${pull.headRepository.name}`, receipt.repository) &&
      pull.baseRefName === receipt.base,
  );
  if (matches.length > 1)
    throw new Error('Multiple matching pull requests; inspect before delivering');
  const match = matches[0];
  if (match) {
    const prefix = `https://github.com/${receipt.repository}/pull/`;
    if (
      typeof match.url !== 'string' ||
      !same(match.url.slice(0, prefix.length), prefix) ||
      !/^[1-9][0-9]*$/.test(match.url.slice(prefix.length))
    )
      throw new Error('Pull request response does not match the origin repository');
    if (!match.isDraft) throw new Error(`Matching PR is already ready for review: ${match.url}`);
    if (requireHead && match.headRefOid !== receipt.headCommit)
      throw new Error('GitHub has not reported the expected pushed head; resume after checking it');
  }
  return match;
}
export function deliverCourse(options) {
  const context = prepareDelivery(options);
  const { receipt, repo, run } = context;
  if (options.dryRun) {
    if (options.resume) throw new Error('Dry-run cannot resume an actual delivery');
    receipt.status = 'dry-run';
    store(context, true);
    return receipt;
  }
  if (options.resume && ['created', 'existing'].includes(receipt.status)) {
    const pull = findPull(context);
    if (!pull || pull.url !== receipt.url)
      throw new Error(
        'Previously delivered PR is no longer the matching open draft; receipt preserved',
      );
    return receipt;
  }
  // Reserve the output and readable body BEFORE any external mutation. A private
  // home temp directory also works with this host's Snap-confined GitHub CLI.
  const bodyDir = fs.mkdtempSync(path.join(options.tempRoot ?? os.homedir(), 'learnlab-delivery-'));
  const bodyFile = path.join(bodyDir, 'body.md');
  try {
    fs.writeFileSync(bodyFile, context.body, { flag: 'wx', mode: 0o600 });
    if (!options.resume) store(context, true);
    run('git', ['fetch', '--no-tags', 'origin', `refs/heads/${receipt.base}`], repo);
    receipt.baseCommit = commit(run('git', ['rev-parse', 'FETCH_HEAD'], repo));
    run('git', ['merge-base', '--is-ancestor', receipt.baseCommit, receipt.headCommit], repo);
    const count = Number(
      run(
        'git',
        ['rev-list', '--count', `${receipt.baseCommit}..${receipt.headCommit}`],
        repo,
      ).trim(),
    );
    if (!Number.isSafeInteger(count) || count < 1)
      throw new Error('No committed change against the current base');
    const files = entries(
      run(
        'git',
        ['diff', '--name-only', '-z', `${receipt.baseCommit}..${receipt.headCommit}`],
        repo,
      ),
    );
    if (!files.length)
      throw new Error('No content diff against the current base; nothing was pushed');
    receipt.range = {
      commits: count,
      fileCount: files.length,
      files: files.slice(0, 1000),
      stat: run(
        'git',
        ['diff', '--stat', `${receipt.baseCommit}..${receipt.headCommit}`],
        repo,
      ).slice(0, 262144),
    };
    if (
      commit(run('git', ['rev-parse', 'HEAD'], repo)) !== receipt.headCommit ||
      run('git', ['status', '--porcelain', '--untracked-files=no'], repo).trim()
    )
      throw new Error(
        'Checkout changed during preflight; original committed snapshot was not pushed',
      );
    // Reject a ready-for-review or ambiguous matching PR before its head could change.
    findPull(context, false);
    // Push the validated SHA, never a moving HEAD and never --force.
    run('git', ['push', 'origin', `${receipt.headCommit}:refs/heads/${receipt.branch}`], repo);
    const uncertain = receipt.status === 'create-uncertain';
    receipt.status = uncertain ? 'create-uncertain' : 'pushed';
    store(context);
    let pull = findPull(context);
    if (pull) {
      run(
        'gh',
        [
          'pr',
          'edit',
          pull.url,
          '--repo',
          receipt.repository,
          '--title',
          receipt.title,
          '--body-file',
          bodyFile,
        ],
        context.ghCwd,
      );
      receipt.url = pull.url;
      receipt.status = 'existing';
    } else {
      if (uncertain)
        throw new Error(
          'Prior create is uncertain; no matching PR found. Receipt preserved; inspect GitHub before creating again',
        );
      // Persist uncertainty BEFORE create. A lost response cannot trigger a blind
      // second create on --resume; lookup must find the original pull request.
      receipt.status = 'create-uncertain';
      store(context);
      try {
        run(
          'gh',
          [
            'pr',
            'create',
            '--repo',
            receipt.repository,
            '--head',
            receipt.branch,
            '--base',
            receipt.base,
            '--draft',
            '--title',
            receipt.title,
            '--body-file',
            bodyFile,
          ],
          context.ghCwd,
        );
      } catch (error) {
        pull = findPull(context);
        if (!pull)
          throw new Error(
            `PR create uncertain; branch and receipt preserved. Resume to look up the original PR. ${error.message}`,
          );
      }
      pull ??= findPull(context);
      if (!pull)
        throw new Error('PR create returned but lookup is not yet available; resume this receipt');
      receipt.url = pull.url;
      receipt.status = 'created';
    }
    receipt.at = new Date().toISOString();
    store(context);
    return receipt;
  } finally {
    fs.rmSync(bodyDir, { recursive: true, force: true });
  }
}
