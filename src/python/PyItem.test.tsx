import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

import { PyItem } from './PyItem';
import { PyHost } from './host';
import { pyComponentRegistry } from './component-registry';
import { MockWorker, happyWorker, w2h } from './mock-worker';
import { intersectionObservers } from '../test-setup';
import type { PyComponentProps } from './py-render-context';

function fireVisible() {
  // The test-setup mock collects IO instances; fire intersection on all.
  act(() => {
    for (const io of intersectionObservers) io.callback([{ isIntersecting: true }]);
  });
}

function makeHost(worker: MockWorker): PyHost {
  return new PyHost({
    workerFactory: () => worker,
    bundleUrl: '/python-bundle.zip',
    pyodideBaseUrl: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
  });
}

const added: string[] = [];
afterEach(() => {
  for (const k of added) delete pyComponentRegistry[k];
  added.length = 0;
  intersectionObservers.length = 0;
});

describe('PyItem', () => {
  it('shows the loading card until a tree arrives', async () => {
    const w = new MockWorker(); // no auto-respond → stays loading
    const host = makeHost(w);
    render(<PyItem itemId="i" sourceUrl="x.py" source="s" host={host} />);
    expect(screen.getByRole('status')).toHaveTextContent(/Loading Python runtime/);
  });

  it('boots on visibility and renders the tree', async () => {
    const Text: React.FC<PyComponentProps> = ({ node }) => <p>{String(node.props.text)}</p>;
    pyComponentRegistry.Text = Text;
    added.push('Text');

    const tree = {
      type: 'Text',
      key: 'root',
      props: { text: 'Hello from Python' },
      children: [],
    };
    const w = happyWorker({ firstTree: tree });
    const host = makeHost(w);

    render(<PyItem itemId="hi" sourceUrl="x.py" source="s" host={host} />);
    await act(async () => {
      fireVisible();
      await Promise.resolve();
    });
    // ensureRuntime + loadItem resolve via microtasks.
    await screen.findByText('Hello from Python');
  });

  it('renders a contained error card on item ERROR', async () => {
    const w = happyWorker();
    const host = makeHost(w);
    render(<PyItem itemId="boom" sourceUrl="x.py" source="s" host={host} />);
    await act(async () => {
      fireVisible();
      await Promise.resolve();
    });
    // After load, push an item-scoped ERROR.
    await act(async () => {
      await Promise.resolve();
      w.emit(
        w2h('ERROR', {
          itemId: 'boom',
          phase: 'event',
          message: 'ZeroDivisionError: division by zero',
          traceback: 'Traceback…',
        }),
      );
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('ZeroDivisionError');
  });

  it('sends DESTROY_ITEM on unmount (FR-PY-006)', async () => {
    const w = happyWorker();
    const host = makeHost(w);
    const { unmount } = render(<PyItem itemId="bye" sourceUrl="x.py" source="s" host={host} />);
    await act(async () => {
      fireVisible();
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.resolve();
    });
    unmount();
    expect(w.lastOf('DESTROY_ITEM')?.payload).toEqual({ itemId: 'bye' });
  });

  it('reserves a minimum height to avoid CLS', () => {
    const w = new MockWorker();
    const host = makeHost(w);
    const { container } = render(<PyItem itemId="i" sourceUrl="x.py" source="s" host={host} />);
    const root = container.querySelector('[data-py-item="i"]') as HTMLElement;
    expect(root.style.minHeight).toBe('240px');
  });
});

// Suppress noisy console from LOG routing during these tests.
vi.spyOn(console, 'info').mockImplementation(() => undefined);
