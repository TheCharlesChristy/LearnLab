import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../ui';
import { loadLaboratoryIndex, loadLaboratoryPack } from './acquisition';
import type { PackReference } from './acquisition';
import { EpisodeWorkspace } from './LaboratoryPage';
import type { LaboratorySessionPort } from './LaboratoryPage';
import { parseLaboratoryPack } from './pack';
import type { LaboratoryPack } from './pack';
import { createPreviewRun, parseAuthorPreview, previewPack, previewPath } from './author-preview';
import type { AuthorPreview } from './author-preview';
import { projectRun } from './run';
import type { LaboratoryRun } from './run';

export const localAuthorHost = (hostname: string) =>
  ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname);
const exportJson = (value: unknown, filename: string) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export default function AuthorStudioPage() {
  if (!localAuthorHost(location.hostname))
    return <p role="alert">Author Studio is available only on a loopback host.</p>;
  return <AuthorStudio />;
}
function AuthorStudio() {
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [index, setIndex] = useState<PackReference[]>([]);
  const [course, setCourse] = useState('');
  const [pack, setPack] = useState<LaboratoryPack>();
  const [source, setSource] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [episodeId, setEpisodeId] = useState('');
  const [nodeId, setNodeId] = useState('');
  const [nodeSource, setNodeSource] = useState('');
  const [seed, setSeed] = useState('93027');
  const [hints, setHints] = useState('0');
  const [worked, setWorked] = useState(false);
  const [preference, setPreference] = useState<'passed' | 'assisted'>('passed');
  const [fixture, setFixture] = useState<AuthorPreview>();
  const [run, setRun] = useState<LaboratoryRun>();
  const [archives, setArchives] = useState<AuthorPreview[]>([]);
  const [previewEpoch, setPreviewEpoch] = useState(0);
  const activeFixture = useRef(fixture);
  activeFixture.current = fixture;
  const beginPreview = (next: AuthorPreview) => {
    setRun(undefined);
    setPreviewEpoch((value) => value + 1);
    setFixture(next);
  };
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const episode = pack?.episodes.find((v) => v.id === episodeId);
  const node = episode?.nodes.find((v) => v.id === nodeId);
  useEffect(() => {
    void loadLaboratoryIndex()
      .then((entries) => {
        setIndex(entries);
        setCourse(entries[0]?.id ?? '');
      })
      .catch((cause) => setError(String(cause)));
  }, []);
  useEffect(() => {
    setNodeSource(node ? JSON.stringify(node, null, 2) : '');
  }, [node]);
  const activate = (next: LaboratoryPack) => {
    setPack(next);
    setSource(JSON.stringify(next, null, 2));
    setFixture(undefined);
    setRun(undefined);
    const nextEpisode = next.episodes.find((v) => v.id === episodeId) ?? next.episodes[0]!;
    setEpisodeId(nextEpisode.id);
    setNodeId(nextEpisode.nodes.some((v) => v.id === nodeId) ? nodeId : nextEpisode.start);
    setError('');
    setMessage('Shared pack validation passed. This does not verify answers or teaching.');
  };
  const commit = (raw: unknown) => {
    const next = parseLaboratoryPack(raw);
    const json = JSON.stringify(next, null, 2);
    if (new TextEncoder().encode(json).length > 1024 * 1024)
      throw new Error('Source pack exceeds 1 MiB');
    const snapshots = [...history.slice(0, cursor + 1), json].slice(-20);
    setHistory(snapshots);
    setCursor(snapshots.length - 1);
    activate(next);
  };
  const attempt = (action: () => void | Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    void Promise.resolve()
      .then(action)
      .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)))
      .finally(() => {
        busyRef.current = false;
        setBusy(false);
      });
  };
  const readFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 1024 * 1024) throw new Error('Import exceeds 1 MiB');
    const value: unknown = JSON.parse(await file.text());
    if (
      value &&
      typeof value === 'object' &&
      'kind' in value &&
      value.kind === 'learnlab-author-preview'
    ) {
      const imported = parseAuthorPreview(value);
      commit(imported.pack);
      setEpisodeId(imported.episodeId);
      setNodeId(imported.nodeId);
      setSeed(String(imported.seed));
      setHints(String(imported.hints));
      setWorked(imported.worked);
      setPreference(imported.branchPreference);
      beginPreview(imported);
      setMessage(
        'Author preview restored in memory. Synthetic state cannot award fresh independence.',
      );
    } else commit(value);
  };
  const renderedPack = useMemo(() => fixture && previewPack(fixture.pack, fixture.seed), [fixture]);
  const renderedEpisode = renderedPack?.episodes.find((v) => v.id === fixture?.episodeId);
  const port = useMemo<LaboratorySessionPort | undefined>(() => {
    if (!fixture) return undefined;
    let value = createPreviewRun(fixture);
    return {
      read: async () => structuredClone(value),
      write: async (next, archive) => {
        if (archive)
          setArchives((previous) =>
            [...previous, structuredClone({ ...fixture, session: archive as LaboratoryRun })].slice(
              -8,
            ),
          );
        value = structuredClone(next);
        return true;
      },
      changed: (next) => {
        if (activeFixture.current === fixture) setRun(next);
      },
    };
  }, [fixture]);
  const projection =
    run && renderedPack && renderedEpisode
      ? projectRun(renderedPack, renderedEpisode, run)
      : undefined;
  const graphPath = episode && node ? previewPath(episode, node.id, preference) : [];
  return (
    <div className="lab-studio space-y-6">
      <div className="rounded-xl border border-indigo-300 bg-indigo-50 p-4 text-indigo-950 dark:bg-indigo-950 dark:text-indigo-100">
        <p className="text-sm font-bold">
          Local developer tooling · excluded from ordinary learner builds
        </p>
        <h1 className="my-2 text-2xl font-bold">LearnLab Author Studio</h1>
        <p>
          Edit registered content, inspect branches and play the actual workspace. Sessions stay in
          memory; nothing writes learner progress or uploads files. Export explicitly before
          leaving.
        </p>
      </div>
      {error && (
        <p role="alert" className="rounded border border-red-400 p-3 break-words">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1">
          Staged course
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="min-h-11 rounded border p-2"
          >
            {index.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
        </label>
        <Button
          disabled={busy || !index.some((v) => v.id === course)}
          onClick={() =>
            attempt(async () => {
              const reference = index.find((v) => v.id === course);
              if (!reference) throw new Error('Choose a staged course');
              commit(await loadLaboratoryPack(reference));
            })
          }
        >
          Load staged pack
        </Button>
        <label className="grid gap-1">
          Import pack or author preview
          <input
            type="file"
            disabled={busy}
            accept=".json,application/json"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = '';
              attempt(() => readFile(file));
            }}
          />
        </label>
      </div>
      <details className="lab-details" open={!pack}>
        <summary>Edit source pack JSON</summary>
        <label className="grid gap-2 mt-3">
          Source pack
          <textarea
            aria-label="Source pack"
            className="w-full min-w-0 rounded border p-2 font-mono text-sm"
            rows={12}
            disabled={busy}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => attempt(() => commit(JSON.parse(source)))}>
            Validate and apply source
          </Button>
          <Button
            variant="secondary"
            disabled={busy || cursor <= 0}
            onClick={() => {
              const at = cursor - 1;
              setCursor(at);
              activate(parseLaboratoryPack(JSON.parse(history[at]!)));
            }}
          >
            Undo source edit
          </Button>
          <Button
            variant="secondary"
            disabled={busy || cursor >= history.length - 1}
            onClick={() => {
              const at = cursor + 1;
              setCursor(at);
              activate(parseLaboratoryPack(JSON.parse(history[at]!)));
            }}
          >
            Redo source edit
          </Button>
          <Button
            variant="secondary"
            disabled={!pack}
            onClick={() => exportJson(pack, `${pack?.id}-pack.json`)}
          >
            Export validated pack
          </Button>
        </div>
        <p className="mt-2 text-sm">
          Last 20 validated snapshots only. Local exports do not overwrite repository files or stage
          a course.
        </p>
      </details>
      {pack && episode && node && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1">
              Episode
              <select
                className="min-h-11 rounded border p-2"
                aria-label="Episode"
                value={episodeId}
                onChange={(e) => {
                  const next = pack.episodes.find((v) => v.id === e.target.value)!;
                  setEpisodeId(next.id);
                  setNodeId(next.start);
                  setHints('0');
                }}
              >
                {pack.episodes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              Starting scene
              <select
                className="min-h-11 rounded border p-2"
                value={nodeId}
                onChange={(e) => {
                  setNodeId(e.target.value);
                  setHints('0');
                }}
              >
                {episode.nodes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} · {v.role}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <details className="lab-details">
            <summary>Scene graph, source and activity contract</summary>
            <ul className="mt-3 space-y-2">
              {episode.nodes.map((v) => (
                <li key={v.id}>
                  <strong>{v.id}</strong> · {v.activity.type} · passed →{' '}
                  {v.transitions.passed ?? 'complete'} · assisted →{' '}
                  {v.transitions.assisted ?? 'complete'}
                </li>
              ))}
            </ul>
            <label className="mt-4 grid gap-2">
              Selected scene JSON
              <textarea
                rows={12}
                className="w-full min-w-0 rounded border p-2 font-mono text-sm"
                value={nodeSource}
                onChange={(e) => setNodeSource(e.target.value)}
              />
            </label>
            <Button
              disabled={busy}
              className="mt-3"
              onClick={() =>
                attempt(() => {
                  const next = structuredClone(pack);
                  next.episodes.find((v) => v.id === episodeId)!.nodes = episode.nodes.map((v) =>
                    v.id === nodeId ? JSON.parse(nodeSource) : v,
                  );
                  commit(next);
                })
              }
            >
              Validate scene edit
            </Button>
            <p className="mt-3 text-sm">
              Unknown properties, unsupported activity types, missing destinations, cycles, orphaned
              scenes and invalid model goals fail shared validation. Use the source editor to add
              nodes or change an ID with all its references together.
            </p>
          </details>
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1">
              Preview seed (choices and numeric cases)
              <input
                className="w-36 min-h-11 rounded border p-2"
                type="number"
                min={0}
                max={4294967295}
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
              />
            </label>
            <label className="grid gap-1">
              Preferred branch
              <select
                className="min-h-11 rounded border p-2"
                value={preference}
                onChange={(e) => setPreference(e.target.value as 'passed' | 'assisted')}
              >
                <option value="passed">Passed first</option>
                <option value="assisted">Assisted first</option>
              </select>
            </label>
            <label className="grid gap-1">
              Hints already used
              <input
                className="w-28 min-h-11 rounded border p-2"
                type="number"
                min={0}
                max={node.hints.length}
                value={hints}
                onChange={(e) => setHints(e.target.value)}
              />
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                checked={worked}
                onChange={(e) => setWorked(e.target.checked)}
              />
              Worked example already used
            </label>
            <Button
              onClick={() =>
                attempt(() => {
                  const next = parseAuthorPreview({
                    formatVersion: 1,
                    kind: 'learnlab-author-preview',
                    pack,
                    episodeId,
                    nodeId,
                    branchPreference: preference,
                    seed: Number(seed),
                    hints: Number(hints),
                    worked,
                  });
                  createPreviewRun(next);
                  beginPreview(next);
                })
              }
            >
              Start isolated preview
            </Button>
          </div>
          <p className="text-sm">
            Synthetic route to starting scene:{' '}
            {graphPath.map((v) => `${v.node} (${v.outcome})`).join(' → ') || 'episode start'}.
            Choice order and numeric cases vary reproducibly. Preview scenes carry prior exposure
            and do not certify fresh competence.
          </p>
        </>
      )}
      {fixture && renderedPack && renderedEpisode && port && (
        <>
          <div className="border-t pt-5">
            <h2 className="mb-3 text-xl font-bold">Actual workspace preview</h2>
            <EpisodeWorkspace
              key={previewEpoch}
              pack={renderedPack}
              episode={renderedEpisode}
              session={port}
            />
          </div>
          <details className="lab-details">
            <summary>Inspect preview events, state and evidence</summary>
            <p className="my-3">
              Author-generated route/help state is synthetic. No fresh independent learner evidence
              is awarded.
            </p>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs">
              {JSON.stringify(
                {
                  current: projection?.current,
                  activeMs: projection?.activeMs,
                  memory: projection?.memory,
                  evidence: projection?.evidence,
                  events: run?.events,
                },
                null,
                2,
              )}
            </pre>
          </details>
          <Button
            disabled={!run}
            onClick={() =>
              attempt(() =>
                exportJson(
                  parseAuthorPreview({ ...fixture, session: run }),
                  `${fixture.pack.id}-author-preview.json`,
                ),
              )
            }
          >
            Export reproducible author preview
          </Button>
          {archives.map((archive, position) => (
            <Button
              key={position}
              variant="secondary"
              onClick={() =>
                attempt(() =>
                  exportJson(
                    parseAuthorPreview(archive),
                    `${archive.pack.id}-preview-archive-${position + 1}.json`,
                  ),
                )
              }
            >
              Export preview archive {position + 1}
            </Button>
          ))}
        </>
      )}
    </div>
  );
}
