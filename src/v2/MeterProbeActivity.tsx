import { Button } from '../ui';
import CircuitDiagram from './CircuitDiagram';
import {
  formatMeterReading,
  informativeProbeIds,
  meterReading,
  redactedMeterIds,
} from './meter-probe';
import type { MeterProbeActivity as MeterProbeDefinition } from './meter-probe';
import type { CircuitElement } from './circuit-model';

function Topology({
  element,
  labels,
  masked,
}: {
  element: CircuitElement;
  labels: Record<string, string>;
  masked: string[];
}) {
  if (element.type === 'series' || element.type === 'parallel')
    return (
      <li>
        {element.type === 'series' ? 'One path in order' : 'Separate parallel paths'}
        <ol className="ml-5 list-decimal">
          {element.elements.map((child, index) => (
            <Topology key={index} element={child} labels={labels} masked={masked} />
          ))}
        </ol>
      </li>
    );
  return (
    <li>
      {labels[element.id]}:{' '}
      {masked.includes(element.id)
        ? 'unknown setting'
        : element.type === 'switch'
          ? element.closed
            ? 'closed connection'
            : 'open gap'
          : `${formatMeterReading(element.ohms)} ohms`}
    </li>
  );
}

export default function MeterProbeActivity({
  activity,
  probes,
  disabled,
  onProbe,
}: {
  activity: MeterProbeDefinition;
  probes: string[];
  disabled: boolean;
  onProbe: (id: string) => void;
}) {
  const actual = activity.candidates.find((candidate) => candidate.id === activity.actual)!;
  const informative = new Set(informativeProbeIds(activity));
  const masked = redactedMeterIds(activity);
  return (
    <div className="lab-bench space-y-4">
      <p className="lab-chip inline-block">
        {formatMeterReading(actual.configuration.voltage)} V ideal supply
      </p>
      <p className="text-sm">
        <strong>Two possibilities:</strong>{' '}
        {activity.candidates.map((candidate) => candidate.title).join(' · ')}
      </p>
      <fieldset className="lab-control space-y-2">
        <legend className="px-1 font-semibold">Choose a meter position</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {activity.probes.map((probe) => (
            <Button
              key={probe.id}
              variant={probes.includes(probe.id) ? 'primary' : 'secondary'}
              className="lab-meter-button min-h-11 text-left"
              disabled={disabled || probes.includes(probe.id)}
              aria-pressed={probes.includes(probe.id)}
              onClick={() => onProbe(probe.id)}
            >
              {probe.quantity === 'current' ? 'Ammeter' : 'Voltmeter'} ·{' '}
              {probe.reading === 'source' ? 'supply' : activity.labels[probe.reading]}
            </Button>
          ))}
        </div>
      </fieldset>
      <p className="text-sm">
        An ideal ammeter measures current in series with the named part. An ideal voltmeter measures
        potential difference across it. The question-mark setting stays hidden until you
        investigate.
      </p>
      <CircuitDiagram
        element={actual.configuration.circuit}
        labels={activity.labels}
        maskedIds={masked}
      />
      <details className="lab-details">
        <summary>Read the circuit layout in words</summary>
        <ol className="mt-2 ml-5 list-decimal">
          <Topology
            element={actual.configuration.circuit}
            labels={activity.labels}
            masked={masked}
          />
        </ol>
      </details>
      {probes.length > 0 && (
        <div className="space-y-3" aria-live="polite">
          <h2 className="font-semibold">Field readings</h2>
          {probes.map((id) => {
            const probe = activity.probes.find((item) => item.id === id)!;
            const unit = probe.quantity === 'current' ? 'A' : 'V';
            return (
              <div key={id} className="lab-feedback space-y-1">
                <p>
                  <strong>
                    {probe.quantity === 'current' ? 'Ammeter' : 'Voltmeter'} at{' '}
                    {probe.reading === 'source' ? 'supply' : activity.labels[probe.reading]}:{' '}
                    {formatMeterReading(meterReading(activity, actual.id, id))} {unit}
                  </strong>
                </p>
                <p>
                  {activity.candidates
                    .map(
                      (candidate) =>
                        `${candidate.title}: ${formatMeterReading(meterReading(activity, candidate.id, id))} ${unit}`,
                    )
                    .join(' · ')}
                </p>
                <p>
                  {informative.has(id)
                    ? 'These predictions differ. The reading can distinguish the explanations.'
                    : 'Both explanations predict this reading. Try another position.'}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
