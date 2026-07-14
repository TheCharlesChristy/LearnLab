// LearnLab Studio is intentionally a local, development-only authoring aid.
// Its only persistence mechanism is an explicit browser download; it never
// obtains a writable file handle, sends data over the network, or changes a
// source pack behind the author's back.

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { ValidateFunction } from 'ajv';

import type { CoursePack, ExperienceGraph, ExperienceNode, SceneNode } from '../experience';
import { Button, Card, cx } from '../ui';
import { createNode, deleteNode, duplicateNode, setTransitionTarget } from './model';
import { StudioPreviewPanel } from './StudioPreviewPanel';
import { type StudioProblem, validateGraph } from './validation';

interface History {
  past: ExperienceGraph[];
  present: ExperienceGraph | null;
  future: ExperienceGraph[];
}

const EMPTY_HISTORY: History = { past: [], present: null, future: [] };

function isGraph(value: unknown): value is ExperienceGraph {
  return (
    value !== null &&
    typeof value === 'object' &&
    Array.isArray((value as { nodes?: unknown }).nodes)
  );
}

function isCoursePack(value: unknown): value is CoursePack {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { id?: unknown }).id === 'string' &&
    Array.isArray((value as { experiences?: unknown }).experiences)
  );
}

function downloadGraph(graph: ExperienceGraph): void {
  const json = JSON.stringify(graph, null, 2) + '\n';
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${graph.id}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function GraphNode({
  node,
  selected,
  onSelect,
}: {
  node: ExperienceNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const targets =
    node.kind === 'scene'
      ? [
          node.transitions.fallback.to,
          ...node.transitions.branches.map((branch) => branch.to),
        ].filter(Boolean)
      : [];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cx(
        'w-full rounded-lg border p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
        selected
          ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950'
          : 'border-slate-300 bg-white hover:border-indigo-400 dark:border-slate-600 dark:bg-slate-800',
      )}
    >
      <span className="block font-semibold">{node.id}</span>
      <span className="block text-sm text-slate-600 dark:text-slate-300">{node.kind}</span>
      {targets.length > 0 && (
        <span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">
          → {targets.join(', ')}
        </span>
      )}
    </button>
  );
}

function problemLabel(problem: StudioProblem): string {
  const location = [problem.nodeId, problem.field].filter(Boolean).join(' · ');
  return location ? `${location}: ${problem.message}` : problem.message;
}

export default function StudioPage() {
  const [history, setHistory] = useState<History>(EMPTY_HISTORY);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pack, setPack] = useState<CoursePack | null>(null);
  const [packSourceLabel, setPackSourceLabel] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [validator, setValidator] = useState<ValidateFunction>();
  const inputRef = useRef<HTMLInputElement>(null);
  const packInputRef = useRef<HTMLInputElement>(null);
  const graph = history.present;

  useEffect(() => {
    // The Studio route is development-only, so this keeps Ajv and the schema
    // out of learner production bundles while validating the exact shared
    // graph contract in local tooling.
    void (async () => {
      const [ajvModule, schemaModule] = await Promise.all([
        import('ajv/dist/2020'),
        import('../../schemas/experience-graph.schema.json'),
      ]);
      const Ajv2020 = ajvModule.default;
      const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true, discriminator: true });
      setValidator(() => ajv.compile(schemaModule.default));
    })();
  }, []);

  const problems = useMemo(
    () => (graph === null ? [] : validateGraph(graph, validator)),
    [graph, validator],
  );
  const selectedNode = graph?.nodes.find((node) => node.id === selectedNodeId) ?? null;

  function replace(next: ExperienceGraph): void {
    if (graph === null) return;
    setHistory({ past: [...history.past, graph], present: next, future: [] });
  }

  function undo(): void {
    const previous = history.past.at(-1);
    if (previous === undefined || graph === null) return;
    setHistory({
      past: history.past.slice(0, -1),
      present: previous,
      future: [graph, ...history.future],
    });
  }

  function redo(): void {
    const next = history.future[0];
    if (next === undefined || graph === null) return;
    setHistory({ past: [...history.past, graph], present: next, future: history.future.slice(1) });
  }

  async function openGraph(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file === undefined) return;
    if (pack === null) {
      setNotice('Open the course pack first, then select one of its experience graph files.');
      return;
    }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isGraph(parsed))
        throw new Error('The selected JSON does not contain an experience graph with nodes.');
      if (parsed.packId !== pack.id) {
        throw new Error(
          `This graph belongs to pack “${parsed.packId}”, not the selected pack “${pack.id}”.`,
        );
      }
      setHistory({ past: [], present: parsed, future: [] });
      setSelectedNodeId(parsed.entryNodeId);
      setSourceLabel(file.name);
      setNotice(`Opened ${file.name}. Changes remain in memory until you export.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not read that JSON file.');
    }
  }

  async function openPack(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file === undefined) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isCoursePack(parsed))
        throw new Error('The selected JSON does not contain a course pack manifest.');
      setPack(parsed);
      setPackSourceLabel(file.name);
      setHistory(EMPTY_HISTORY);
      setSelectedNodeId(null);
      setSourceLabel(null);
      setNotice(`Opened pack ${parsed.id}. Select one of its experience graph files next.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not read that JSON file.');
    }
  }

  function addNode(kind: 'scene' | 'ending'): void {
    if (graph === null) return;
    const node = createNode(graph, kind);
    replace({ ...graph, nodes: [...graph.nodes, node] });
    setSelectedNodeId(node.id);
  }

  function duplicateSelected(): void {
    if (graph === null || selectedNode === null) return;
    const result = duplicateNode(graph, selectedNode.id);
    if ('message' in result) setNotice(result.message);
    else {
      replace(result);
      setSelectedNodeId(result.nodes.at(-1)?.id ?? null);
    }
  }

  function deleteSelected(): void {
    if (graph === null || selectedNode === null) return;
    const result = deleteNode(graph, selectedNode.id);
    if (result.conflict !== undefined) {
      setNotice(result.conflict.message);
      if (result.conflict.nodeId !== undefined) setSelectedNodeId(result.conflict.nodeId);
      return;
    }
    if (result.graph !== undefined) {
      replace(result.graph);
      setSelectedNodeId(result.graph.entryNodeId);
    }
  }

  function setTarget(field: 'fallback' | number, target: string): void {
    if (graph === null || selectedNode?.kind !== 'scene') return;
    const result = setTransitionTarget(graph, selectedNode.id, field, target);
    if ('message' in result) setNotice(result.message);
    else replace(result);
  }

  function addBranch(): void {
    if (graph === null || selectedNode?.kind !== 'scene') return;
    const target = graph.nodes[0]?.id;
    if (target === undefined) return;
    const nodes = graph.nodes.map((node) => {
      if (node.id !== selectedNode.id || node.kind !== 'scene') return node;
      return {
        ...node,
        transitions: {
          ...node.transitions,
          branches: [
            ...node.transitions.branches,
            {
              when: { operator: 'state-equals', path: '/replace-me', value: true },
              to: target,
              label: 'Replace condition',
            },
          ],
        },
      } satisfies SceneNode;
    });
    replace({ ...graph, nodes });
  }

  function removeBranch(index: number): void {
    if (graph === null || selectedNode?.kind !== 'scene') return;
    const nodes = graph.nodes.map((node) =>
      node.id === selectedNode.id && node.kind === 'scene'
        ? {
            ...node,
            transitions: {
              ...node.transitions,
              branches: node.transitions.branches.filter((_, item) => item !== index),
            },
          }
        : node,
    );
    replace({ ...graph, nodes });
  }

  function setSelectedActivityProps(props: Record<string, unknown>): void {
    if (graph === null || selectedNode?.kind !== 'scene') return;
    replace({
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.id === selectedNode.id && node.kind === 'scene'
          ? { ...node, activity: { ...node.activity, props } }
          : node,
      ),
    });
  }

  return (
    <section className="space-y-6" aria-labelledby="studio-heading">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
          Development tool
        </p>
        <h1 id="studio-heading" className="text-3xl font-bold tracking-tight">
          LearnLab Studio
        </h1>
        <p className="mt-2 max-w-3xl text-slate-700 dark:text-slate-200">
          Open a local v2 graph, make structural edits, validate it, then explicitly download the
          result. Studio never writes to a source pack or sends its contents anywhere.
        </p>
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => packInputRef.current?.click()}>Open course pack</Button>
          <Button onClick={() => inputRef.current?.click()}>Open graph JSON</Button>
          <Button
            variant="secondary"
            disabled={graph === null || history.past.length === 0}
            onClick={undo}
          >
            Undo
          </Button>
          <Button
            variant="secondary"
            disabled={graph === null || history.future.length === 0}
            onClick={redo}
          >
            Redo
          </Button>
          <Button
            variant="primary"
            disabled={pack === null || graph === null || problems.length > 0}
            onClick={() => graph && downloadGraph(graph)}
          >
            Export valid graph
          </Button>
        </div>
        <input
          ref={packInputRef}
          aria-label="Open course pack"
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={openPack}
        />
        <input
          ref={inputRef}
          aria-label="Open graph JSON"
          className="sr-only"
          type="file"
          accept="application/json,.json"
          onChange={openGraph}
        />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {packSourceLabel === null
            ? 'No course pack selected.'
            : `Selected pack: ${pack?.id ?? 'unknown'} (${packSourceLabel}).`}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {sourceLabel === null
            ? 'No experience graph selected.'
            : `Selected graph: ${sourceLabel}.`}
        </p>
        {notice !== null && (
          <p role="status" className="text-sm text-indigo-800 dark:text-indigo-200">
            {notice}
          </p>
        )}
      </Card>

      {graph !== null && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Graph map</h2>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => addNode('scene')}>
                  Add scene
                </Button>
                <Button variant="secondary" onClick={() => addNode('ending')}>
                  Add ending
                </Button>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Entry: <strong>{graph.entryNodeId}</strong> · Pack: <strong>{graph.packId}</strong>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {graph.nodes.map((node) => (
                <GraphNode
                  key={node.id}
                  node={node}
                  selected={selectedNode?.id === node.id}
                  onSelect={() => setSelectedNodeId(node.id)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="space-y-3" aria-label="Validation status">
              <h2 className="text-xl font-bold">Validation</h2>
              {problems.length === 0 ? (
                <p role="status" className="text-emerald-800 dark:text-emerald-200">
                  Graph is valid for export.
                </p>
              ) : (
                <ul className="space-y-2" aria-live="polite">
                  {problems.map((problem, index) => (
                    <li key={`${problem.message}-${index}`}>
                      <Button
                        variant="ghost"
                        className="h-auto w-full justify-start whitespace-normal p-1 text-left text-red-800 dark:text-red-200"
                        onClick={() => {
                          const node =
                            problem.nodeIndex === undefined
                              ? undefined
                              : graph.nodes[problem.nodeIndex];
                          if (node !== undefined) setSelectedNodeId(node.id);
                          else if (problem.nodeId !== undefined) setSelectedNodeId(problem.nodeId);
                        }}
                      >
                        {problemLabel(problem)}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="space-y-3" aria-label="Selected node editor">
              <h2 className="text-xl font-bold">
                {selectedNode === null ? 'Select a node' : selectedNode.id}
              </h2>
              {selectedNode !== null && (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {selectedNode.kind} node · Stable IDs are preserved by edits and duplication
                    creates a new ID.
                  </p>
                  {selectedNode.kind === 'scene' && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium">
                        Fallback transition
                        <select
                          className="mt-1 block w-full rounded border border-slate-400 bg-white p-2 dark:bg-slate-900"
                          value={selectedNode.transitions.fallback.to}
                          onChange={(event) => setTarget('fallback', event.target.value)}
                        >
                          <option value="">Choose a node…</option>
                          {graph.nodes.map((node) => (
                            <option key={node.id} value={node.id}>
                              {node.id}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold">Conditional transitions</h3>
                          <Button variant="secondary" onClick={addBranch}>
                            Add branch
                          </Button>
                        </div>
                        {selectedNode.transitions.branches.map((branch, index) => (
                          <div
                            key={`${branch.to}-${index}`}
                            className="flex items-end gap-2 rounded border border-slate-300 p-2 dark:border-slate-600"
                          >
                            <label className="min-w-0 flex-1 text-sm">
                              {branch.label ?? `Branch ${index + 1}`}
                              <select
                                className="mt-1 block w-full rounded border border-slate-400 bg-white p-2 dark:bg-slate-900"
                                value={branch.to}
                                onChange={(event) => setTarget(index, event.target.value)}
                              >
                                {graph.nodes.map((node) => (
                                  <option key={node.id} value={node.id}>
                                    {node.id}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <Button variant="danger" onClick={() => removeBranch(index)}>
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={duplicateSelected}>
                      Duplicate
                    </Button>
                    <Button variant="danger" onClick={deleteSelected}>
                      Delete
                    </Button>
                  </div>
                  {pack !== null && selectedNode.kind === 'scene' ? (
                    <StudioPreviewPanel
                      pack={pack}
                      graph={graph}
                      scene={selectedNode}
                      onPropsChange={setSelectedActivityProps}
                    />
                  ) : null}
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}
