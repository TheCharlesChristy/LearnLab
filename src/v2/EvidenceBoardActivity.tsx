import { useEffect, useState } from 'react';
import { Button } from '../ui';
import type { EvidenceBoardActivity as Definition, LaboratoryPack } from './pack';
import type { NodeMemory } from './run';

export default function EvidenceBoardActivity({
  activity, references, memory, disabled, onOpen, onPin, onClaim, onReview,
}: {
  activity: Definition;
  references: LaboratoryPack['references'];
  memory: NodeMemory;
  disabled: boolean;
  onOpen: (id: string) => void;
  onPin: (id: string) => void;
  onClaim: (text: string) => void;
  onReview: () => void;
}) {
  const [draft, setDraft] = useState(memory.claim ?? '');
  useEffect(() => setDraft(memory.claim ?? ''), [memory.claim]);
  const [selected, setSelected] = useState<string | null>(null);
  const source = activity.sources.find((item) => item.id === selected);
  const sorted = [...activity.sources].sort((a, b) => a.order - b.order);
  const readyToReview = (memory.pinnedSources?.length ?? 0) >= 2 &&
    (memory.claim?.trim().length ?? 0) >= 40;
  return <div className="space-y-5">
    <p className="lab-chip">Evidence desk · {memory.openedSources?.length ?? 0}/{activity.sources.length} opened · {memory.pinnedSources?.length ?? 0} pinned</p>
    <p className="font-semibold">{activity.question}</p>
    {activity.places && <section className="lab-control lab-evidence-map-section space-y-3" aria-label="Schematic location map">
      <h2 className="font-semibold">Case map</h2>
      <p className="text-sm">Schematic only; positions show broad relationships, not surveyed distances or the fire's route.</p>
      <div className="lab-evidence-map" aria-hidden="true">
        <div className="lab-evidence-river">River Thames</div>
        {activity.places.map((place) => <span key={place.id} className="lab-evidence-place" style={{ left: `${place.x}%`, top: `${place.y}%` }}>{place.label}</span>)}
      </div>
      <p className="text-sm">Places, relative to the Thames:</p>
      <ul className="list-disc pl-5 text-sm" aria-label="Map places in text">
        {activity.places.map((place) => <li key={place.id}>{place.label}: {place.id === 'bridge' ? 'crossing the river' : `${place.y >= 75 ? 'south' : 'north'}-${place.x < 50 ? 'west' : 'east'}`}</li>)}
      </ul>
    </section>}
    <section className="space-y-3" aria-label="Evidence timeline">
      <h2 className="font-semibold">Open the case files in any order</h2>
      <ol className="grid gap-2 sm:grid-cols-2">
        {sorted.map((item) => <li key={item.id}>
          <Button variant={selected === item.id ? 'primary' : 'secondary'} className="lab-evidence-source min-h-11 w-full text-left" aria-pressed={selected === item.id} disabled={disabled}
            onClick={() => { setSelected(item.id); if (!memory.openedSources?.includes(item.id)) onOpen(item.id); }}>
            {item.date} · {item.title}{memory.pinnedSources?.includes(item.id) ? ' · pinned' : ''}
          </Button>
        </li>)}
      </ol>
      <p className="text-sm">Timeline labels date each account or survey, not necessarily the event it describes.</p>
    </section>
    {source && <section className="lab-control space-y-3" aria-live="polite" aria-label={`Source: ${source.title}`}>
      <h2 className="font-bold">{source.title}</h2>
      <p className="text-sm">Paraphrase written for this lesson, based on the linked record.</p>
      <p><strong>From:</strong> {source.origin} · {source.date} · {source.kind.replaceAll('-', ' ')}</p>
      <p>{source.account}</p>
      <p><strong>What it cannot prove:</strong> {source.limit}</p>
      {source.placeId && <p className="text-sm">Map location: {activity.places?.find((place) => place.id === source.placeId)?.label}</p>}
      {(() => { const reference = references.find((item) => item.id === source.referenceId); return reference ? <a className="underline underline-offset-4" href={reference.url} target="_blank" rel="noopener noreferrer">Open the source record at {reference.title}</a> : null; })()}
      <div><Button variant="secondary" className="lab-evidence-action min-h-11" disabled={disabled || !memory.openedSources?.includes(source.id)} onClick={() => onPin(source.id)}>
        {memory.pinnedSources?.includes(source.id) ? 'Unpin from my case' : 'Pin as evidence'}
      </Button></div>
    </section>}
    <section className="space-y-3">
      <label htmlFor="lab-evidence-claim" className="block font-semibold">Your provisional claim</label>
      <p className="text-sm">Use at least two pinned sources. Say what they support and where the evidence stops. Your words stay in this local notebook; no AI or automatic history grade reads them.</p>
      <textarea id="lab-evidence-claim" className="lab-part-select w-full rounded-lg border p-3" rows={6} maxLength={1600} value={draft} disabled={disabled} onChange={(event) => setDraft(event.target.value)} />
      <Button variant="secondary" className="lab-evidence-action min-h-11" disabled={disabled || draft.trim().length === 0 || draft === memory.claim} onClick={() => onClaim(draft)}>Save claim to notebook</Button>
      <p role="status" className="text-sm">{memory.claim ? `Saved ${memory.claim.length} characters. ${memory.selfReviewed ? 'Self-review recorded.' : 'Review the rubric after saving.'}` : 'No claim saved yet.'}</p>
    </section>
    <section className="lab-control space-y-3" aria-label="Human review rubric">
      <h2 className="font-semibold">Check your reasoning</h2>
      <ul className="list-disc space-y-1 pl-5">{activity.rubric.map((item) => <li key={item}>{item}</li>)}</ul>
      <p className="text-sm">This check records reflection only. A teacher or the course owner must read the claim to judge its quality; checking it does not award mastery.</p>
      <Button variant="secondary" className="lab-evidence-action min-h-11" disabled={disabled || !readyToReview || memory.selfReviewed} onClick={onReview}>I reviewed my claim against these prompts</Button>
      {!readyToReview && <p className="text-sm">Open and pin two sources, then save a claim of at least 40 characters to reflect.</p>}
    </section>
  </div>;
}
