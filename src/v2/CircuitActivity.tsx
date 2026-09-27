import { Button } from '../ui';
import type { CircuitActivity as CircuitActivityDefinition } from './pack';
import { circuitGoalMet } from './pack';
import { solveCircuit } from './circuit-model';
import type { CircuitConfiguration, CircuitElement } from './circuit-model';
import { controlValue } from './run';
import CircuitDiagram from './CircuitDiagram';

const number = (value: number) =>
  new Intl.NumberFormat('en-GB', { maximumSignificantDigits: 3 }).format(value);
function Topology({
  element,
  labels,
}: {
  element: CircuitElement;
  labels: Record<string, string>;
}) {
  if (element.type === 'series' || element.type === 'parallel')
    return (
      <li>
        <span>{element.type === 'series' ? 'One path, in order' : 'Separate parallel paths'}</span>
        <ol className="ml-5 list-decimal space-y-1">
          <>
            {element.elements.map((child, i) => (
              <Topology key={i} element={child} labels={labels} />
            ))}
          </>
        </ol>
      </li>
    );
  return (
    <li>
      {labels[element.id]}:{' '}
      {element.type === 'switch'
        ? element.closed
          ? 'closed connection'
          : 'open gap'
        : `${number(element.ohms)} ohms`}
    </li>
  );
}
export default function CircuitActivity({
  activity,
  config,
  onControl,
  disabled,
}: {
  activity: CircuitActivityDefinition;
  config: CircuitConfiguration;
  onControl: (id: string, value: number | boolean) => void;
  disabled: boolean;
}) {
  const solution = solveCircuit(config);
  const active = solution.status === 'solved' && solution.power > 0;
  return (
    <div className="space-y-5">
      <div className="lab-bench flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="lab-chip">{number(config.voltage)} V ideal supply</span>
          <span className={`lab-signal ${active ? 'lab-signal-on' : ''}`}>
            <span aria-hidden="true">●</span>{' '}
            {active ? 'Energy transfer present' : 'No energy transfer'}
          </span>
        </div>
        <CircuitDiagram element={config.circuit} labels={activity.labels} />
        <div className="lab-controls grid gap-3 sm:grid-cols-2">
          {activity.controls.map((control) => (
            <fieldset key={control.id} className="lab-control">
              <legend className="px-1 font-semibold">{activity.labels[control.id]}</legend>
              <div className="flex flex-wrap gap-2">
                {control.values.map((value) => (
                  <Button
                    key={String(value)}
                    variant={
                      controlValue(activity, config, control.id) === value ? 'primary' : 'secondary'
                    }
                    aria-pressed={controlValue(activity, config, control.id) === value}
                    disabled={disabled}
                    onClick={() => onControl(control.id, value)}
                    className="min-h-11"
                  >
                    {typeof value === 'boolean'
                      ? value
                        ? 'Closed'
                        : 'Open'
                      : `${number(value)} Ω`}
                  </Button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <p role="status" className="mt-4 font-semibold">
          {solution.status === 'solved'
            ? `Source current: ${number(solution.current)} A · ${circuitGoalMet(activity, solution) ? 'Target reached' : 'Investigate the connections'}`
            : solution.reason}
        </p>
      </div>
      <details className="lab-details">
        <summary>See the path and meter readings</summary>
        <p className="mt-3">
          Starting at one supply terminal, follow these connections and return to the other
          terminal.
        </p>
        <ol className="my-3">
          <Topology element={config.circuit} labels={activity.labels} />
        </ol>
        {solution.status === 'solved' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Ideal steady circuit readings</caption>
              <thead>
                <tr>
                  {['Element', 'Current / A', 'Potential difference / V', 'Power / W'].map((v) => (
                    <th key={v} scope="col" className="p-2">
                      {v}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {solution.readings.map((reading) => (
                  <tr key={reading.id}>
                    <th scope="row" className="p-2 font-medium">
                      {activity.labels[reading.id]}
                    </th>
                    <td className="p-2">{number(reading.current)}</td>
                    <td className="p-2">
                      {reading.voltage === null ? 'Indeterminate' : number(reading.voltage)}
                    </td>
                    <td className="p-2">{number(reading.power)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-sm">
          Current is charge per second; power is energy per second. The loads are ideal resistors,
          not realistic lamp models. No transients are simulated. Multiple open gaps may have
          indeterminate individual voltages.
        </p>
      </details>
    </div>
  );
}
