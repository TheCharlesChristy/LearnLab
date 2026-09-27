// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { afterAll, describe, expect, it } from 'vitest';
import {
  deliverCourse,
  githubRepository,
  parseDeliveryReceipt,
  prepareDelivery,
} from '../../scripts/authoring/delivery.mjs';

const directories: string[] = [];
afterAll(() =>
  directories.forEach((directory) => fs.rmSync(directory, { recursive: true, force: true })),
);
const head = 'a'.repeat(40),
  base = 'b'.repeat(40);
const fixture = () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'learnlab-delivery-test-'));
  directories.push(directory);
  const bodyFile = path.join(directory, 'body.md');
  const body = 'A literal `command` and $(touch SHOULD_NOT_EXIST) remain authored text.\n';
  fs.writeFileSync(bodyFile, body);
  const calls: { command: string; args: string[]; cwd: string }[] = [];
  const state = {
    branch: 'feat/course-delivery',
    dirty: '',
    fetchUrl: 'https://github.com/Example/LearnLab.git',
    pushUrl: 'git@github.com:Example/LearnLab.git',
    files: 'scripts/authoring/delivery.mjs\0',
    count: '1',
    ancestor: true,
    changeHead: false,
    reads: 0,
    createFailure: false,
    createVisible: true,
    pushed: false,
    pull: undefined as
      | undefined
      | {
          url: string;
          isDraft: boolean;
          headRefOid: string;
          headRepository: { name: string };
          headRepositoryOwner: { login: string };
          baseRefName: string;
        },
  };
  const pull = () => ({
    url: 'https://github.com/Example/LearnLab/pull/8',
    isDraft: true,
    headRefOid: head,
    headRepository: { name: 'LearnLab' },
    headRepositoryOwner: { login: 'Example' },
    baseRefName: 'main',
  });
  const run = (command: string, args: string[], cwd: string) => {
    calls.push({ command, args, cwd });
    if (command === 'git') {
      if (args[0] === 'check-ref-format') return '';
      if (args[0] === 'symbolic-ref') return `${state.branch}\n`;
      if (args[0] === 'status') return state.dirty;
      if (args[0] === 'remote')
        return (args.includes('--push') ? state.pushUrl : state.fetchUrl) + '\n';
      if (args[0] === 'ls-files') return 'untracked-source.json\0node_modules\0';
      if (args[0] === 'rev-parse') {
        if (args.includes('--git-common-dir')) return path.join(directory, '.git') + '\n';
        if (args.includes('FETCH_HEAD')) return base + '\n';
        state.reads += 1;
        return (state.changeHead && state.reads > 1 ? 'c'.repeat(40) : head) + '\n';
      }
      if (args[0] === 'fetch') return '';
      if (args[0] === 'merge-base') {
        if (!state.ancestor) throw Error('base moved');
        return '';
      }
      if (args[0] === 'rev-list') return state.count + '\n';
      if (args[0] === 'diff')
        return args.includes('--name-only') ? state.files : '1 file changed\n';
      if (args[0] === 'push') {
        state.pushed = true;
        if (state.pull) state.pull.headRefOid = head;
        return '';
      }
    }
    if (command === 'gh') {
      if (args[1] === 'list') return JSON.stringify(state.pull ? [state.pull] : []);
      if (args[1] === 'create' || args[1] === 'edit') {
        expect(fs.readFileSync(args[args.indexOf('--body-file') + 1]!, 'utf8')).toBe(body);
        if (args[1] === 'create') {
          if (state.createVisible) state.pull = pull();
          if (state.createFailure) throw Error('lost create response');
        }
        return 'https://github.com/Example/LearnLab/pull/8\n';
      }
    }
    throw Error(`Unexpected command ${command} ${args.join(' ')}`);
  };
  const options = {
    repo: directory,
    base: 'main',
    title: 'Deliver authored changes',
    bodyFile,
    output: path.join(directory, 'receipt.json'),
    tempRoot: directory,
    run,
  };
  const writes = () =>
    calls.filter(
      (call) =>
        (call.command === 'git' && call.args[0] === 'push') ||
        (call.command === 'gh' && ['create', 'edit'].includes(call.args[1]!)),
    );
  return { directory, calls, state, pull, options, writes };
};

describe('author Git delivery boundary', () => {
  it('parses configured GitHub origins without accepting credentials, other hosts or destinations', () => {
    for (const remote of [
      'https://github.com/Owner/Repo.git',
      'git@github.com:Owner/Repo.git',
      'ssh://git@github.com/Owner/Repo',
    ])
      expect(githubRepository(remote)).toBe('Owner/Repo');
    for (const remote of [
      'https://token@github.com/Owner/Repo',
      'https://evil.test/Owner/Repo',
      'git@github.com:Owner/../Repo',
      '/tmp/remote.git',
    ])
      expect(() => githubRepository(remote)).toThrow();
  });
  it('previews only local preflight, preserves authored text and reports excluded untracked files', () => {
    const f = fixture();
    const receipt = deliverCourse({ ...f.options, dryRun: true });
    expect(receipt.status).toBe('dry-run');
    expect(receipt.untrackedPaths).toEqual(['untracked-source.json', 'node_modules']);
    expect(
      f.calls.every((call) => call.command === 'git' && !['fetch', 'push'].includes(call.args[0]!)),
    ).toBe(true);
    expect(f.writes()).toHaveLength(0);
    expect(parseDeliveryReceipt(JSON.parse(fs.readFileSync(f.options.output, 'utf8')))).toEqual(
      receipt,
    );
    expect(() => deliverCourse(f.options)).toThrow('Receipt exists');
  });
  it('refuses dirty tracked work, protected branches, mismatched destinations and invalid bodies before publishing', () => {
    for (const scenario of [
      'dirty',
      'protected',
      'same-base',
      'push-repo',
      'multiple-remotes',
      'body-size',
    ]) {
      const f = fixture();
      if (scenario === 'dirty') f.state.dirty = ' M unrelated.md\n';
      if (scenario === 'protected') f.state.branch = 'main';
      if (scenario === 'same-base') f.options.base = f.state.branch;
      if (scenario === 'push-repo') f.state.pushUrl = 'https://github.com/Other/Repo.git';
      if (scenario === 'multiple-remotes')
        f.state.pushUrl += '\nhttps://github.com/Example/LearnLab.git';
      if (scenario === 'body-size') fs.writeFileSync(f.options.bodyFile, 'x'.repeat(65537));
      expect(() => deliverCourse(f.options), scenario).toThrow();
      expect(f.writes(), scenario).toHaveLength(0);
      expect(fs.existsSync(f.options.output), scenario).toBe(false);
    }
  });
  it('checks the fresh base, actual content diff and checkout stability before push', () => {
    for (const scenario of ['base-moved', 'empty-commit', 'no-commits', 'head-changed']) {
      const f = fixture();
      if (scenario === 'base-moved') f.state.ancestor = false;
      if (scenario === 'empty-commit') f.state.files = '';
      if (scenario === 'no-commits') f.state.count = '0';
      if (scenario === 'head-changed') f.state.changeHead = true;
      expect(() => deliverCourse(f.options), scenario).toThrow();
      expect(f.writes(), scenario).toHaveLength(0);
      expect(
        parseDeliveryReceipt(JSON.parse(fs.readFileSync(f.options.output, 'utf8'))).status,
      ).toBe('prepared');
    }
  });
  it('refuses an existing ready PR before changing its head', () => {
    const f = fixture();
    f.state.pull = { ...f.pull(), isDraft: false, headRefOid: 'c'.repeat(40) };
    expect(() => deliverCourse(f.options)).toThrow('already ready');
    expect(f.writes()).toHaveLength(0);
    expect(f.state.pull.headRefOid).toBe('c'.repeat(40));
  });
  it('pins push to the validated SHA, creates only a draft, keeps a receipt and removes temporary files', () => {
    const f = fixture();
    const receipt = deliverCourse(f.options);
    expect(receipt.status).toBe('created');
    expect(receipt.range).toMatchObject({ commits: 1, fileCount: 1 });
    const push = f.calls.find((call) => call.args[0] === 'push')!;
    expect(push.args).toEqual(['push', 'origin', `${head}:refs/heads/feat/course-delivery`]);
    expect(
      f.calls.find((call) => call.command === 'gh' && call.args[1] === 'create')!.args,
    ).toContain('--draft');
    expect(
      f.calls.filter((call) => call.command === 'gh').every((call) => call.cwd === f.directory),
    ).toBe(true);
    expect(
      fs.readdirSync(f.directory).filter((name) => name.startsWith('learnlab-delivery-')),
    ).toEqual([]);
    expect(fs.existsSync(path.join(f.directory, 'SHOULD_NOT_EXIST'))).toBe(false);
    const before = f.writes().length;
    expect(deliverCourse({ ...f.options, resume: true }).url).toBe(receipt.url);
    expect(f.writes()).toHaveLength(before);
    f.state.pull = undefined;
    expect(() => deliverCourse({ ...f.options, resume: true })).toThrow('no longer');
    expect(f.writes()).toHaveLength(before);
  });
  it('updates a matching draft instead of creating a duplicate and ignores another fork', () => {
    const f = fixture();
    f.state.pull = { ...f.pull(), headRefOid: 'c'.repeat(40) };
    expect(deliverCourse(f.options).status).toBe('existing');
    expect(f.writes().map((call) => call.args[1])).toContain('edit');
    expect(f.writes().some((call) => call.args[1] === 'create')).toBe(false);
    const fork = fixture();
    fork.state.pull = { ...fork.pull(), headRepositoryOwner: { login: 'Different' } };
    expect(deliverCourse(fork.options).status).toBe('created');
  });
  it('recovers a lost create response through lookup and never blindly creates again on uncertain resume', () => {
    const recovered = fixture();
    recovered.state.createFailure = true;
    expect(deliverCourse(recovered.options).status).toBe('created');
    expect(recovered.writes().filter((call) => call.args[1] === 'create')).toHaveLength(1);
    const uncertain = fixture();
    uncertain.state.createFailure = true;
    uncertain.state.createVisible = false;
    expect(() => deliverCourse(uncertain.options)).toThrow('uncertain');
    expect(JSON.parse(fs.readFileSync(uncertain.options.output, 'utf8')).status).toBe(
      'create-uncertain',
    );
    expect(() => deliverCourse({ ...uncertain.options, resume: true })).toThrow(
      'Prior create is uncertain',
    );
    expect(uncertain.writes().filter((call) => call.args[1] === 'create')).toHaveLength(1);
    uncertain.state.pull = uncertain.pull();
    expect(deliverCourse({ ...uncertain.options, resume: true }).status).toBe('existing');
    expect(uncertain.writes().filter((call) => call.args[1] === 'create')).toHaveLength(1);
  });
  it('checks real Git branch and dirty state without touching another checkout', () => {
    const f = fixture();
    execFileSync('git', ['init', '-b', 'main', f.directory], { stdio: 'pipe' });
    execFileSync('git', ['config', 'user.email', 'fixture@example.invalid'], { cwd: f.directory });
    execFileSync('git', ['config', 'user.name', 'Fixture'], { cwd: f.directory });
    execFileSync('git', ['add', 'body.md'], { cwd: f.directory });
    execFileSync('git', ['commit', '-m', 'fixture'], { cwd: f.directory, stdio: 'pipe' });
    execFileSync('git', ['switch', '-c', 'feat/new-course'], { cwd: f.directory, stdio: 'pipe' });
    execFileSync('git', ['remote', 'add', 'origin', 'https://github.com/Example/LearnLab.git'], {
      cwd: f.directory,
    });
    const options = { ...f.options, run: undefined };
    expect(prepareDelivery(options).receipt.branch).toBe('feat/new-course');
    fs.appendFileSync(f.options.bodyFile, 'Uncommitted edit\n');
    expect(() => prepareDelivery(options)).toThrow('Commit tracked changes');
    expect(fs.readFileSync(f.options.bodyFile, 'utf8')).toContain('Uncommitted edit');
    expect(() => prepareDelivery({ ...options, base: '--upload-pack=bad' })).toThrow('valid base');
  });
});
