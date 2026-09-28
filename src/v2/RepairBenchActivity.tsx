import { Button } from '../ui';
import CircuitDiagram from './CircuitDiagram';
import { repairConfiguration, repairGoalMet, repairSolution } from './repair-bench';
import type { RepairBenchActivity as Definition, RepairBenchState } from './repair-bench';

const number = (value: number) =>
  new Intl.NumberFormat('en-GB', { maximumSignificantDigits: 3 }).format(value);
const unit = { current: 'A', voltage: 'V', power: 'W' };

export default function RepairBenchActivity({
  activity,
  state,
  inspections,
  disabled,
  onPlace,
  onRewire,
  onInspect,
}: {
  activity: Definition;
  state: RepairBenchState;
  inspections: {
    reading: string;
    quantity: 'current' | 'voltage' | 'power';
    value: number | null;
  }[];
  disabled: boolean;
  onPlace: (slot: string, part: string | null) => void;
  onRewire: (layout: 'series' | 'parallel') => void;
  onInspect: (reading: string, quantity: 'current' | 'voltage' | 'power') => void;
}) {
  const config = repairConfiguration(activity, state);
  const result = repairSolution(activity, state);
  const labels = Object.fromEntries(
    activity.slots.map((slot, index) => [slot.id, `Socket ${index + 1}`]),
  );
  const available = activity.parts.filter(
    (part) => !Object.values(state.placements).includes(part.id),
  );
  return (
    <div className="space-y-5">
      <div className="lab-bench space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="lab-chip">{number(activity.voltage)} V ideal supply</span>
          <span className="lab-chip">
            {state.layout === 'series' ? 'One path' : 'Separate branches'}
          </span>
        </div>
        <CircuitDiagram element={config.circuit} labels={labels} />
        <ol className="list-decimal space-y-1 pl-6 text-sm" aria-label="Current socket placements">
          {activity.slots.map((slot) => {
            const part = activity.parts.find((item) => item.id === state.placements[slot.id]);
            return (
              <li key={slot.id}>
                {slot.label}: {part ? `${part.label}, ${number(part.ohms)} ohms` : 'open gap'}
              </li>
            );
          })}
        </ol>
        <fieldset className="lab-control">
          <legend className="px-1 font-semibold">How are the sockets connected?</legend>
          <div className="flex flex-wrap gap-2">
            {(['series', 'parallel'] as const).map((layout) => (
              <Button
                key={layout}
                variant={state.layout === layout ? 'primary' : 'secondary'}
                aria-pressed={state.layout === layout}
                disabled={disabled || state.layout === layout}
                onClick={() => onRewire(layout)}
                className="min-h-11"
              >
                {layout === 'series' ? 'Connect in one path' : 'Connect as branches'}
              </Button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          {activity.slots.map((slot) => (
            <label key={slot.id} className="lab-control block font-semibold">
              {slot.label}
              <select
                className="lab-part-select mt-2 min-h-11 w-full rounded-lg border px-3 py-2"
                value={state.placements[slot.id] ?? ''}
                disabled={disabled}
                onChange={(event) => onPlace(slot.id, event.target.value || null)}
              >
                <option value="">Leave an open gap</option>
                {activity.parts.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.label} · {number(part.ohms)} Ω
                    {Object.entries(state.placements).some(
                      ([id, placed]) => id !== slot.id && placed === part.id,
                    )
                      ? ' · move from another socket'
                      : ''}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <p className="text-sm">
          In the tray:{' '}
          {available.length
            ? available.map((part) => `${part.label} (${number(part.ohms)} Ω)`).join(', ')
            : 'no loose parts'}
          . Moving a part frees its previous socket.
        </p>
        <p role="status" className="font-semibold">
          {result.status === 'solved'
            ? `Source current ${number(result.current)} A · source power ${number(result.power)} W · ${repairGoalMet(activity, state) ? 'Repair target reached' : 'Keep investigating'}`
            : result.reason}
        </p>
      </div>
      <div className="lab-details space-y-3">
        <h2 className="font-semibold">Inspect with an ideal meter</h2>
        <p className="text-sm">
          Choose a position and quantity. Current is measured in series; potential difference is
          measured across a socket. Readings describe the present wiring.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="min-h-11"
            disabled={disabled}
            onClick={() => onInspect('source', 'current')}
          >
            Source ammeter
          </Button>
          {activity.slots.map((slot) => (
            <span key={slot.id} className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="min-h-11"
                disabled={disabled}
                onClick={() => onInspect(slot.id, 'current')}
              >
                {slot.label} ammeter
              </Button>
              <Button
                variant="secondary"
                className="min-h-11"
                disabled={disabled}
                onClick={() => onInspect(slot.id, 'voltage')}
              >
                {slot.label} voltmeter
              </Button>
            </span>
          ))}
        </div>
        {inspections.length > 0 && (
          <ol className="list-decimal space-y-1 pl-6" aria-label="Meter notebook">
            {inspections.map((item, index) => (
              <li key={index}>
                {item.reading === 'source'
                  ? 'Source'
                  : activity.slots.find((slot) => slot.id === item.reading)?.label}
                : {item.quantity} ={' '}
                {item.value === null
                  ? 'indeterminate or unsupported'
                  : `${number(item.value)} ${unit[item.quantity]}`}
              </li>
            ))}
          </ol>
        )}
        <p className="text-sm">
          Open gaps carry no current. An ideal short or a zero-resistance branch is outside this
          bounded model. This bench has fixed socket positions and ideal resistors; it does not
          simulate arbitrary wiring, transients, or real lamp heating.
        </p>
      </div>
    </div>
  );
}
