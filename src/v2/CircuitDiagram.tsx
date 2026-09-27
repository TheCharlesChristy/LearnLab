import type { CircuitElement } from './circuit-model';

type Size = { width: number; height: number };
function size(element: CircuitElement): Size {
  if (element.type !== 'series' && element.type !== 'parallel') return { width: 100, height: 74 };
  const children = element.elements.map(size);
  return element.type === 'series'
    ? {
        width: children.reduce((n, v) => n + v.width, 0),
        height: Math.max(...children.map((v) => v.height)),
      }
    : {
        width: Math.max(...children.map((v) => v.width)) + 40,
        height: children.reduce((n, v) => n + v.height, 0),
      };
}
function Path({
  element,
  x,
  y,
  labels,
}: {
  element: CircuitElement;
  x: number;
  y: number;
  labels: Record<string, string>;
}) {
  const box = size(element);
  const centre = y + box.height / 2;
  if (element.type === 'series') {
    let next = x;
    return (
      <g>
        {element.elements.map((child, i) => {
          const childBox = size(child);
          const childX = next;
          next += childBox.width;
          return (
            <Path
              key={i}
              element={child}
              x={childX}
              y={centre - childBox.height / 2}
              labels={labels}
            />
          );
        })}
      </g>
    );
  }
  if (element.type === 'parallel') {
    let nextY = y;
    const centres = element.elements.map((child) => {
      const childBox = size(child);
      const at = nextY + childBox.height / 2;
      nextY += childBox.height;
      return at;
    });
    return (
      <g>
        <path
          d={`M ${x} ${centre} H ${x + 20} M ${x + box.width - 20} ${centre} H ${x + box.width} M ${x + 20} ${centres[0]} V ${centres.at(-1)} M ${x + box.width - 20} ${centres[0]} V ${centres.at(-1)}`}
        />
        {element.elements.map((child, i) => {
          const childBox = size(child);
          return (
            <g key={i}>
              <Path
                element={child}
                x={x + 20}
                y={centres[i]! - childBox.height / 2}
                labels={labels}
              />
              <path d={`M ${x + 20 + childBox.width} ${centres[i]} H ${x + box.width - 20}`} />
            </g>
          );
        })}
      </g>
    );
  }
  return (
    <g>
      <path d={`M ${x} ${centre} H ${x + 25} M ${x + 75} ${centre} H ${x + 100}`} />
      {element.type === 'switch' ? (
        <>
          <circle cx={x + 25} cy={centre} r={3} />
          <circle cx={x + 75} cy={centre} r={3} />
          <path
            className={element.closed ? 'lab-diagram-closed' : 'lab-diagram-gap'}
            d={`M ${x + 25} ${centre} L ${x + 75} ${element.closed ? centre : centre - 20}`}
          />
          <text x={x + 50} y={centre - 25}>
            {element.closed ? 'closed' : 'gap'}
          </text>
        </>
      ) : (
        <>
          <path d={`M ${x + 25} ${centre} l 5 -8 l 8 16 l 8 -16 l 8 16 l 8 -16 l 8 8`} />
          <text x={x + 50} y={centre - 20}>
            {element.ohms} Ω
          </text>
        </>
      )}
      <text x={x + 50} y={centre + 25}>
        {labels[element.id]}
      </text>
    </g>
  );
}
export default function CircuitDiagram({
  element,
  labels,
}: {
  element: CircuitElement;
  labels: Record<string, string>;
}) {
  const box = size(element);
  const centre = box.height / 2 + 10;
  const bottom = box.height + 35;
  return (
    <div className="lab-diagram" aria-hidden="true">
      <svg viewBox={`0 0 ${box.width + 100} ${bottom + 10}`}>
        <path
          d={`M 45 ${centre - 10} H 70 M 25 ${centre + 10} H 65 M 45 ${centre - 10} V 10 H 80 V ${centre} M ${box.width + 80} ${centre} V ${bottom} H 45 V ${centre + 10}`}
        />
        <text x={25} y={centre - 16}>
          +
        </text>
        <text x={25} y={centre + 28}>
          −
        </text>
        <Path element={element} x={80} y={10} labels={labels} />
      </svg>
    </div>
  );
}
