import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { kvGet, saveLaboratoryState } from '../progress';
import { Button, Spinner } from '../ui';
import { ReadAloudControl } from '../tts/ReadAloudControl';
import { createV2RolloutConfig } from './rollout';
import {
  acquirePack,
  loadLaboratoryIndex,
  loadLaboratoryPack,
  loadDownloadedVersion,
  offlineReady,
} from './acquisition';
import type { PackReference } from './acquisition';
import type { LaboratoryEpisode, LaboratoryPack } from './pack';
import {
  activityMemory,
  appendEvent,
  newRun,
  nodePassed,
  parseRun,
  projectRun,
  retainedExposure,
  restoreRun,
} from './run';
import type { LaboratoryRun, RunEvent, RunInput } from './run';
import CircuitActivity from './CircuitActivity';
import './laboratory.css';

const download = (value: unknown, filename: string) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
function Acquisition({ reference }: { reference: PackReference }) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    void offlineReady(reference).then((v) => {
      if (active) setReady(v);
    });
    return () => {
      active = false;
    };
  }, [reference]);
  const acquire = async () => {
    setBusy(true);
    setReady(false);
    try {
      await acquirePack(reference, (done, total) =>
        setProgress(`Saving ${done} of ${total} required files…`),
      );
      setReady(true);
      setProgress('');
    } catch (error) {
      setProgress(
        error instanceof Error ? error.message : 'Download failed. Retry when connected.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        className="min-h-11"
        disabled={busy}
        onClick={() => {
          void acquire();
        }}
      >
        {busy ? 'Downloading…' : ready ? 'Check downloaded files' : 'Download for offline use'}
      </Button>
      <p role="status" className="text-sm">
        {ready
          ? 'Ready offline · complete course and required app files checked'
          : progress ||
            'First download needs a connection. Browser storage can be cleared or evicted.'}
      </p>
    </div>
  );
}
function EpisodeWorkspace({
  pack,
  episode,
  reference,
}: {
  pack: LaboratoryPack;
  episode: LaboratoryEpisode;
  reference: PackReference;
}) {
  const key = `laboratory:${pack.id}:${episode.id}`;
  const [run, setRun] = useState<LaboratoryRun>();
  const runRef = useRef<LaboratoryRun | undefined>(undefined);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [rawSaved, setRawSaved] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [help, setHelp] = useState(false);
  const [paused, setPaused] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const helpHeadingRef = useRef<HTMLHeadingElement>(null);
  const helpPanelRef = useRef<HTMLElement>(null);
  const lastInteraction = useRef(Date.now());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    void kvGet<unknown>(key)
      .then((raw) => {
        if (!mounted.current) return;
        setRawSaved(raw);
        const value = raw === undefined ? newRun(pack, episode) : parseRun(raw, pack, episode);
        runRef.current = value;
        setRun(value);
      })
      .catch((cause: unknown) => {
        if (mounted.current)
          setError(cause instanceof Error ? cause.message : 'Saved work could not be read.');
      });
    return () => {
      mounted.current = false;
    };
  }, [key, pack, episode]);
  const send = useCallback(
    async (event: RunInput) => {
      if (!runRef.current || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      if (event.type !== 'time') lastInteraction.current = Date.now();
      try {
        const at = Math.max(
          Date.now(),
          runRef.current.events.at(-1)?.at ?? runRef.current.startedAt,
        );
        const next = appendEvent(pack, episode, runRef.current, { ...event, at } as RunEvent);
        runRef.current = next;
        setRun(next);
        const saved = await saveLaboratoryState(key, next);
        if (mounted.current)
          setSaveError(
            saved
              ? ''
              : 'This session is in memory, but saving failed. Export your work or retry saving.',
          );
      } catch (cause) {
        if (mounted.current)
          setSaveError(cause instanceof Error ? cause.message : 'This action could not be saved.');
      } finally {
        busyRef.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    [pack, episode, key],
  );
  useEffect(() => {
    let lastTick = Date.now();
    const interact = () => {
      lastInteraction.current = Date.now();
    };
    const visibility = () => {
      lastTick = Date.now();
    };
    for (const type of ['pointerdown', 'keydown', 'scroll'])
      window.addEventListener(type, interact, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    const timer = window.setInterval(() => {
      const now = Date.now();
      const delta = Math.min(now - lastTick, 15000);
      lastTick = now;
      const current = runRef.current && projectRun(pack, episode, runRef.current).current;
      if (
        current &&
        !paused &&
        document.visibilityState === 'visible' &&
        now - lastInteraction.current < 90000 &&
        !busyRef.current
      )
        void send({
          type: 'time',
          node: current,
          ms: Math.max(
            0,
            Math.min(
              delta,
              now -
                ([...runRef.current!.events].reverse().find((e) => e.type === 'time')?.at ??
                  runRef.current!.startedAt),
            ),
          ),
        });
    }, 15000);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', visibility);
      for (const type of ['pointerdown', 'keydown', 'scroll'])
        window.removeEventListener(type, interact);
    };
  }, [pack, episode, paused, send]);
  const projection = run && projectRun(pack, episode, run);
  const current = projection?.current;
  useEffect(() => {
    headingRef.current?.focus();
    setHelp(false);
    setNoticeDismissed(false);
  }, [current]);
  useEffect(() => {
    if (help) {
      helpPanelRef.current?.scrollIntoView({ block: 'start' });
      helpHeadingRef.current?.focus({ preventScroll: true });
    }
  }, [help]);
  if (error)
    return (
      <div className="lab-panel space-y-4">
        <h1 className="text-xl font-bold">Saved work needs recovery</h1>
        <p role="alert">{error}</p>
        <Button
          disabled={rawSaved === undefined}
          onClick={() => download(rawSaved, `${pack.id}-saved-original.json`)}
        >
          Export original saved work
        </Button>
        <Button
          variant="secondary"
          disabled={rawSaved === undefined}
          onClick={() => {
            void (async () => {
              const value = newRun(pack, episode, retainedExposure(rawSaved, episode));
              if (await saveLaboratoryState(key, value, rawSaved)) {
                runRef.current = value;
                setRun(value);
                setError('');
              } else setError('Recovery could not be saved. Your original remains unchanged.');
            })();
          }}
        >
          Archive original and start this version
        </Button>
        <Link to={`/laboratory/${pack.id}`}>Return to map</Link>
      </div>
    );
  if (!run || !projection) return <Spinner label="Loading your local workspace…" />;
  const node = episode.nodes.find((n) => n.id === projection.current);
  const memory = node && activityMemory(node, projection);
  const passed = !!node && !!memory && nodePassed(node, memory);
  const feedback =
    node?.activity.type === 'choice'
      ? node.activity.options.find((v) => v.id === memory?.selected)
      : undefined;
  const transfers = projection.evidence.filter((e) => e.role === 'transfer');
  const independent = new Set(transfers.filter((e) => e.independent).map((e) => e.node)).size;
  const firstAction = run.events.find((e) => e.type === 'control' || e.type === 'answer');
  return (
    <div className="lab-page space-y-5">
      <div className="lab-toolbar flex flex-wrap items-center justify-between gap-3">
        <Link to={`/laboratory/${pack.id}`} className="rounded underline underline-offset-4">
          ← Station map
        </Link>
        {node && (
          <Button
            variant="secondary"
            className="min-h-11"
            aria-controls="lab-help-panel"
            aria-expanded={help}
            onClick={() => setHelp((v) => !v)}
          >
            Help
          </Button>
        )}
        <details className="lab-tool-menu">
          <summary>Notebook tools</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="secondary" className="min-h-11" onClick={() => setPaused((v) => !v)}>
              {paused ? 'Resume timer' : 'Pause timer'}
            </Button>
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() => download(run, `${pack.id}-${episode.id}-work.json`)}
            >
              Export work
            </Button>
            <Button
              variant="ghost"
              className="min-h-11"
              disabled={busy}
              onClick={() => {
                void send({ type: 'restart', node: episode.start });
              }}
            >
              Restart episode
            </Button>
          </div>
        </details>
      </div>
      {run.events.length >= 1950 && (
        <p role="status">
          Your field notebook is nearly full. Export it, then archive it and start a new workspace
          below.
        </p>
      )}
      {saveError && (
        <div role="alert" className="lab-panel space-y-3">
          <p>{saveError}</p>
          <Button
            disabled={busy}
            onClick={() => {
              if (busyRef.current) return;
              busyRef.current = true;
              setBusy(true);
              void saveLaboratoryState(key, runRef.current)
                .then((saved) => setSaveError(saved ? '' : saveError))
                .finally(() => {
                  busyRef.current = false;
                  setBusy(false);
                });
            }}
          >
            Retry saving
          </Button>
          <Button variant="secondary" onClick={() => download(run, 'learnlab-unsaved-work.json')}>
            Export unsaved work
          </Button>
        </div>
      )}
      {node && memory ? (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div ref={textRef} className="lab-panel lab-scene min-w-0 space-y-5">
            <p className="lab-kicker">Research station · {episode.title}</p>
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold focus:outline-none">
              {node.title}
            </h1>
            <p className="max-w-prose text-lg leading-relaxed">{node.prompt}</p>
            {node.activity.type === 'circuit' && memory.circuit ? (
              <CircuitActivity
                activity={node.activity}
                config={memory.circuit}
                disabled={busy}
                onControl={(id, value) => {
                  void send({ type: 'control', node: node.id, id, value });
                }}
              />
            ) : node.activity.type === 'choice' ? (
              <div className="space-y-3">
                {node.activity.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="lab-choice"
                    disabled={busy || passed}
                    aria-pressed={memory.selected === option.id}
                    onClick={() => {
                      void send({ type: 'answer', node: node.id, option: option.id });
                    }}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            ) : null}
            {feedback && (
              <div role="status" className="lab-feedback">
                <strong>
                  {feedback.correct ? 'Answer checked. ' : 'Try another explanation. '}
                </strong>
                {feedback.feedback}
              </div>
            )}
            {passed && (
              <div className="lab-feedback">
                <p>{node.mechanism}</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="min-h-11"
                disabled={!passed || busy}
                onClick={() => {
                  void send({ type: 'advance', node: node.id, outcome: 'passed' });
                }}
              >
                {node.transitions.passed === null
                  ? 'Finish investigation'
                  : 'Continue investigation'}
              </Button>
            </div>
            {memory.attempts >= 2 && !help && !noticeDismissed && (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <p>Want another way into this?</p>
                <Button variant="ghost" onClick={() => setHelp(true)}>
                  Open Help
                </Button>
                <Button variant="ghost" onClick={() => setNoticeDismissed(true)}>
                  Dismiss
                </Button>
              </div>
            )}
            {help && (
              <section
                ref={helpPanelRef}
                id="lab-help-panel"
                aria-label="Help and recovery"
                className="lab-details lab-help space-y-3"
              >
                <h2 ref={helpHeadingRef} tabIndex={-1} className="font-bold">
                  Take a different route
                </h2>
                <p>
                  Help is available at any point. Using a hint or worked example records assistance,
                  so there is no pressure to pretend you did it alone.
                </p>
                {node.hints.slice(0, memory.hints).map((hint, i) => (
                  <p key={hint} className="lab-feedback">
                    Hint {i + 1}: {hint}
                  </p>
                ))}
                <Button
                  variant="secondary"
                  className="min-h-11"
                  disabled={busy || memory.hints >= node.hints.length}
                  onClick={() => {
                    void send({ type: 'hint', node: node.id });
                  }}
                >
                  Show next hint
                </Button>
                <Button
                  variant="secondary"
                  className="min-h-11"
                  disabled={busy || memory.worked}
                  onClick={() => {
                    void send({ type: 'worked', node: node.id });
                  }}
                >
                  Show worked example
                </Button>
                {memory.worked && <p className="lab-feedback">{node.workedExample}</p>}
                <p>
                  Bridge: a steady current needs a complete conducting path. The source transfers
                  energy; charge is conserved. You can return to the map and explore later.
                </p>
                <Button
                  variant="secondary"
                  className="min-h-11"
                  disabled={busy}
                  onClick={() => {
                    void send({ type: 'advance', node: node.id, outcome: 'assisted' });
                  }}
                >
                  Continue with help
                </Button>
                <p className="text-sm">
                  This escape records assisted completion; it never awards an independent pass.
                </p>
              </section>
            )}
            <ReadAloudControl localOnly targetRef={textRef} resetKey={node.id} />
          </div>
          <aside className="lab-panel space-y-4">
            <p className="lab-kicker">Field notebook</p>
            <p>
              This first episode is a working prototype: 1 of 10 planned station investigations.
            </p>
            <p className="text-sm">
              {paused
                ? 'Timer paused'
                : `Active time estimate: ${Math.floor(projection.activeMs / 60000)} min`}
            </p>
            <details>
              <summary className="cursor-pointer">How timing works</summary>
              <p className="mt-2 text-sm">
                Visible tab only; manually pausable. Pauses after 90 seconds without a click, key or
                scroll. Productive exploration counts. The last partial 15 seconds may be lost on
                closing. Time is not a score.
              </p>
            </details>
            {pack.version === reference.version ? (
              <Acquisition reference={reference} />
            ) : (
              <p>
                Resuming downloaded course version {pack.version}. Version {reference.version} is
                available on the map. Your earlier notebook remains readable.
              </p>
            )}
            <p className="text-sm">
              Saved locally. No account, uploads or learner AI. Read-aloud is optional; all tasks
              work without a voice.
            </p>
          </aside>
        </div>
      ) : (
        <div className="lab-hero space-y-4">
          <p className="lab-kicker">Investigation complete</p>
          <h1 ref={headingRef} tabIndex={-1}>
            The beacon has a story to tell
          </h1>
          <p>You investigated why the full path matters, and what the heater transfers.</p>
          <p>
            {independent} of 2 fresh causal checks passed independently. Assisted and repeated
            checks stay visible in your notebook. These checks alone do not establish the full
            charge-flow capability.
          </p>
          <details className="lab-details">
            <summary>See each check in your notebook</summary>
            <ul className="mt-3 space-y-3">
              {projection.evidence.map((evidence, i) => (
                <li key={`${evidence.node}-${i}`}>
                  <strong>{episode.nodes.find((n) => n.id === evidence.node)?.title}</strong>
                  <p>
                    {evidence.independent
                      ? 'Fresh independent check'
                      : evidence.outcome === 'assisted'
                        ? 'Completed with help'
                        : 'Explored / practice'}
                    {evidence.replayed ? ' · prior exposure' : ''}
                    {evidence.hints ? ` · ${evidence.hints} hint(s)` : ''}
                    {evidence.worked ? ' · worked example used' : ''}
                    {evidence.attempts ? ` · ${evidence.attempts} answer attempt(s)` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </details>
          <p>
            First recorded control/answer:{' '}
            {firstAction
              ? `${((firstAction.at - run.startedAt) / 1000).toFixed(1)} seconds after this run started`
              : 'not observed (assisted route)'}
            .
          </p>
          <Link to={`/laboratory/${pack.id}`} className="lab-map-link">
            Return to the station map
          </Link>
          <Button
            variant="secondary"
            onClick={() =>
              download({ run, evidence: projection.evidence }, 'station-local-evidence.json')
            }
          >
            Export local evidence
          </Button>
        </div>
      )}
      <details className="lab-details">
        <summary>Archive this notebook and start a new workspace</summary>
        <p className="my-3">
          The old event log is preserved in local storage and Settings exports. Prior answer and
          help exposure stays recorded; repeating these checks does not count as fresh independence.
        </p>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            if (busyRef.current) return;
            busyRef.current = true;
            setBusy(true);
            void (async () => {
              try {
                const fresh = newRun(pack, episode, retainedExposure(runRef.current, episode));
                if (!(await saveLaboratoryState(key, fresh, runRef.current)))
                  throw new Error('Archiving failed; original work remains unchanged.');
                runRef.current = fresh;
                setRun(fresh);
                setSaveError('');
              } catch (cause) {
                setSaveError(cause instanceof Error ? cause.message : 'Archiving failed.');
              } finally {
                busyRef.current = false;
                setBusy(false);
              }
            })();
          }}
        >
          Archive and start new workspace
        </Button>
      </details>
      <details className="lab-details">
        <summary>Import saved work for this episode</summary>
        <p className="my-3">
          Importing replaces this episode after validation and archives its current envelope. Other
          progress is unchanged. Use Settings to export, import or delete all local progress.
        </p>
        <input
          type="file"
          accept="application/json,.json"
          aria-label="Import episode work"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file || busyRef.current) return;
            busyRef.current = true;
            setBusy(true);
            void (async () => {
              try {
                if (file.size > 256 * 1024) throw new Error('Import exceeds 256 KiB');
                const imported = restoreRun(
                  JSON.parse(await file.text()),
                  runRef.current,
                  pack,
                  episode,
                );
                if (!(await saveLaboratoryState(key, imported, runRef.current)))
                  throw new Error('Import could not be saved; original work remains unchanged.');
                runRef.current = imported;
                setRun(imported);
                setSaveError('');
              } catch (cause) {
                setSaveError(cause instanceof Error ? cause.message : 'Import failed.');
              } finally {
                busyRef.current = false;
                setBusy(false);
              }
            })();
            event.target.value = '';
          }}
        />
      </details>
    </div>
  );
}
function PackMap({ pack, reference }: { pack: LaboratoryPack; reference: PackReference }) {
  const [states, setStates] = useState<Record<string, string>>(
    Object.create(null) as Record<string, string>,
  );
  useEffect(() => {
    let active = true;
    void Promise.all(
      pack.episodes.map(async (episode) => {
        try {
          const raw = await kvGet<unknown>(`laboratory:${pack.id}:${episode.id}`);
          if (!raw) return [episode.id, 'Unvisited'];
          const p = projectRun(pack, episode, parseRun(raw, pack, episode));
          return [
            episode.id,
            p.current !== null
              ? 'Explored · resume available'
              : p.evidence.some((v) => v.outcome === 'assisted' || v.hints || v.worked)
                ? 'Completed with help'
                : 'Completed · check evidence in notebook',
          ];
        } catch {
          return [episode.id, 'Saved version needs recovery'];
        }
      }),
    ).then((entries) => {
      if (active) setStates(Object.fromEntries(entries));
    });
    return () => {
      active = false;
    };
  }, [pack]);
  return (
    <div className="lab-page space-y-6">
      <div className="lab-hero">
        <p className="lab-kicker">Field campaign · {pack.subject.title}</p>
        <h1>{pack.title}</h1>
        <p className="max-w-prose leading-relaxed">{pack.description}</p>
        <p className="mt-3 text-sm">
          {pack.level} · {pack.audience}
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="lab-panel space-y-4">
          <h2 className="text-xl font-bold">Choose an investigation</h2>
          <p>Explore in any order. Prerequisites are suggestions, never locked doors.</p>
          {pack.episodes.map((episode) => (
            <Link
              key={episode.id}
              className="lab-map-link"
              to={`/laboratory/${pack.id}/${episode.id}`}
            >
              <strong>{episode.title}</strong>
              <span className="mt-1 block text-sm">
                {states[episode.id] ?? 'Checking local progress…'} · about{' '}
                {episode.estimatedMinutes} min
              </span>
            </Link>
          ))}
          <p className="text-sm">{pack.scopeNote}</p>
        </section>
        <aside className="lab-panel space-y-4">
          <h2 className="text-xl font-bold">Capability map</h2>
          {pack.skills.map((skill) => (
            <div key={skill.id}>
              <h3 className="font-semibold">{skill.title}</h3>
              <p className="text-sm">{skill.criterion}</p>
              <p className="mt-2 text-sm">
                Evidence is provisional. Full capability demonstration and fresh scheduled review
                are still being built.
              </p>
            </div>
          ))}
          <Acquisition reference={reference} />
        </aside>
      </div>
      <details className="lab-details">
        <summary>Sources and model limits</summary>
        <ul className="mt-3 space-y-3">
          {pack.references.map((ref) => (
            <li key={ref.id}>
              <a href={ref.url} target="_blank" rel="noreferrer" className="underline">
                {ref.title}
              </a>
              <p className="text-sm">{ref.note}</p>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
export default function LaboratoryPage() {
  const { packId, episodeId } = useParams();
  const [index, setIndex] = useState<PackReference[]>();
  const [pack, setPack] = useState<LaboratoryPack>();
  const [error, setError] = useState('');
  const enabled = createV2RolloutConfig().enabled;
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setPack(undefined);
    setError('');
    void loadLaboratoryIndex()
      .then(async (entries) => {
        if (!active) return;
        setIndex(entries);
        if (packId) {
          const reference = entries.find((v) => v.id === packId);
          if (!reference) throw new Error('Unknown laboratory course');
          const raw = episodeId
            ? await kvGet<unknown>(`laboratory:${packId}:${episodeId}`)
            : undefined;
          const savedVersion =
            raw && typeof raw === 'object' && 'packVersion' in raw ? raw.packVersion : undefined;
          const loaded =
            typeof savedVersion === 'number' &&
            Number.isSafeInteger(savedVersion) &&
            savedVersion !== reference.version
              ? await loadDownloadedVersion(packId, savedVersion).catch(() =>
                  loadLaboratoryPack(reference),
                )
              : await loadLaboratoryPack(reference);
          if (active) setPack(loaded);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Course unavailable.');
      });
    return () => {
      active = false;
    };
  }, [enabled, packId, episodeId]);
  if (!enabled)
    return (
      <div className="lab-panel">
        <h1 className="text-xl font-bold">Laboratory preview is disabled</h1>
        <p>Existing courses remain available.</p>
        <Link to="/">Return home</Link>
      </div>
    );
  if (error)
    return (
      <div className="lab-panel">
        <h1 className="text-xl font-bold">Course could not be opened</h1>
        <p role="alert">{error}</p>
        <Button onClick={() => location.reload()}>Retry</Button>
        <Link to="/laboratory">Return to laboratory</Link>
      </div>
    );
  if (!index || (packId && !pack)) return <Spinner label="Opening the laboratory…" />;
  if (!pack)
    return (
      <div className="lab-page space-y-5">
        <div className="lab-hero">
          <p className="lab-kicker">LearnLab field laboratory</p>
          <h1>Something here needs your curiosity</h1>
          <p>Investigate, change something, and see what follows.</p>
        </div>
        {index.map((entry) => (
          <Link key={entry.id} className="lab-map-link" to={`/laboratory/${entry.id}`}>
            <strong>{entry.title}</strong>
            <p>{entry.description}</p>
          </Link>
        ))}
      </div>
    );
  const reference = index.find((v) => v.id === pack.id)!;
  if (!episodeId) return <PackMap pack={pack} reference={reference} />;
  const episode = pack.episodes.find((v) => v.id === episodeId);
  if (!episode)
    return (
      <div>
        <h1>Investigation not found</h1>
        <Link to={`/laboratory/${pack.id}`}>Return to map</Link>
      </div>
    );
  return (
    <EpisodeWorkspace
      key={`${pack.id}:${episode.id}:${pack.version}`}
      pack={pack}
      episode={episode}
      reference={reference}
    />
  );
}
