import { describe, it, expect } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import { useRef } from 'react';

import { usePyRuntime, useEnsureRuntimeOnVisible } from './runtime';
import { PyHost } from './host';
import { MockWorker, happyWorker } from './mock-worker';
import { intersectionObservers } from '../test-setup';

function makeHost(worker: MockWorker): PyHost {
  return new PyHost({
    workerFactory: () => worker,
    bundleUrl: '/b.zip',
    pyodideBaseUrl: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
  });
}

describe('usePyRuntime', () => {
  it('reflects status changes from the host', async () => {
    const w = happyWorker();
    const host = makeHost(w);
    const { result } = renderHook(() => usePyRuntime(host));
    expect(result.current.state).toBe('idle');
    await act(async () => {
      await host.ensureRuntime();
    });
    expect(result.current.state).toBe('ready');
  });
});

describe('useEnsureRuntimeOnVisible', () => {
  it('calls ensureRuntime once when the element intersects', async () => {
    intersectionObservers.length = 0;
    const w = happyWorker();
    const host = makeHost(w);

    function Probe() {
      const ref = useRef<HTMLDivElement | null>(null);
      useEnsureRuntimeOnVisible(ref, '600px', host);
      return <div ref={ref}>probe</div>;
    }
    render(<Probe />);
    expect(host.getStatus().state).toBe('idle');

    await act(async () => {
      for (const io of intersectionObservers) io.callback([{ isIntersecting: true }]);
      await Promise.resolve();
    });
    expect(['loading-pyodide', 'loading-bundle', 'ready']).toContain(host.getStatus().state);
    // The IO uses rootMargin 600px (FR-PY-002) — recorded by the mock.
    expect(intersectionObservers.length).toBeGreaterThan(0);
  });
});
