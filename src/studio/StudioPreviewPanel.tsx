import { Suspense, useMemo, useRef, useState } from 'react';

import { getActivityPlugin } from '../experience/plugins';
import type { CoursePack, ExperienceGraph, SceneNode } from '../experience';
import type { RunVariables } from '../experience/run-state';
import { ReadAloudControl } from '../tts';
import { Button, Card } from '../ui';
import { explainStudioRun, planStudioPreview, studioPluginFormFields } from './preview';

export function StudioPreviewPanel({
  pack,
  graph,
  scene,
  onPropsChange,
}: {
  pack: CoursePack;
  graph: ExperienceGraph;
  scene: SceneNode;
  onPropsChange: (props: Record<string, unknown>) => void;
}) {
  const [seed, setSeed] = useState<RunVariables>({});
  const [width, setWidth] = useState<'mobile' | 'desktop'>('desktop');
  const [dark, setDark] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const readable = useRef<HTMLDivElement>(null);
  const plan = useMemo(
    () => planStudioPreview(pack, graph, scene.id, seed),
    [pack, graph, scene.id, seed],
  );
  const plugin = getActivityPlugin(scene.activity.key);
  const Activity = plugin?.component;
  const fields = studioPluginFormFields(scene.activity.key);
  return (
    <Card className="space-y-4" aria-label="Learner preview and run inspector">
      <h2 className="text-xl font-bold">Learner preview</h2>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setWidth('mobile')}>
          Mobile
        </Button>
        <Button variant="secondary" onClick={() => setWidth('desktop')}>
          Desktop
        </Button>
        <Button variant="secondary" onClick={() => setDark(!dark)}>
          {dark ? 'Light' : 'Dark'} preview
        </Button>
        <Button variant="secondary" onClick={() => setReducedMotion(!reducedMotion)}>
          Reduced motion: {reducedMotion ? 'on' : 'off'}
        </Button>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">Schema-driven activity properties</h3>
        {fields.map((field) => (
          <label key={field.name} className="block text-sm">
            {field.name}
            {field.required ? ' (required)' : ''}
            <input
              className="mt-1 block w-full rounded border p-2"
              value={String(scene.activity.props[field.name] ?? '')}
              onChange={(event) =>
                onPropsChange({ ...scene.activity.props, [field.name]: event.target.value })
              }
            />
          </label>
        ))}
        {plan && !plan.propsValid ? (
          <ul role="alert">
            {plan.propErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <label className="block text-sm">
        Seeded state JSON
        <textarea
          className="mt-1 block w-full rounded border p-2"
          value={JSON.stringify(seed)}
          onChange={(event) => {
            try {
              setSeed(JSON.parse(event.target.value) as RunVariables);
            } catch {
              /* retain last valid seed */
            }
          }}
        />
      </label>
      <div
        aria-label="Preview viewport"
        data-preview-size={width}
        data-preview-theme={dark ? 'dark' : 'light'}
        data-preview-reduced-motion={String(reducedMotion)}
        className={`${width === 'mobile' ? 'max-w-sm' : 'max-w-3xl'} ${dark ? 'bg-slate-950 text-white' : 'bg-white'} ${reducedMotion ? 'motion-reduce:animate-none' : ''} rounded border p-4`}
      >
        <div ref={readable}>
          {Activity && plan ? (
            <Suspense fallback={<p>Loading preview…</p>}>
              <Activity
                props={scene.activity.props}
                context={{
                  seed: `studio:${scene.id}`,
                  activityInstanceId: `studio:${scene.id}`,
                  attempt: 0,
                }}
                disabled={!plan.propsValid}
                reportOutcome={(value) =>
                  setOutcome(`Outcome reported: ${value.completed ? 'complete' : 'incomplete'}.`)
                }
              />
            </Suspense>
          ) : (
            <p>Choose a registered activity to preview.</p>
          )}
        </div>
        {outcome ? <p role="status">{outcome}</p> : null}
        <ReadAloudControl targetRef={readable} resetKey={scene.id} className="mt-3" />
      </div>
      <section aria-labelledby="inspector-heading">
        <h3 id="inspector-heading" className="font-semibold">
          Run-state inspector
        </h3>
        <ul>
          {plan ? (
            [...plan.explanation, ...explainStudioRun(plan.run, graph)].map((line) => (
              <li key={line}>{line}</li>
            ))
          ) : (
            <li>This node cannot be previewed.</li>
          )}
        </ul>
      </section>
    </Card>
  );
}
