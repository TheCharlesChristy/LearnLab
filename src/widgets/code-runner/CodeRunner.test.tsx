// Behaviour tests for the CodeRunner implementation (SRS §5.3 row).
//
// We mock the src/python barrel (a fake pyHost.runSnippet / ensureRuntime /
// restart + usePyRuntime) and the CodeMirror Editor (a plain <textarea> — jsdom
// cannot host CodeMirror's contenteditable). Learner code never runs on the main
// thread (C-6); these tests verify the widget delegates to runSnippet.

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CodeRunner from './CodeRunner';
import type { SnippetResult } from './CodeRunner';

// ---- Mocks ----------------------------------------------------------------

const runSnippet = vi.fn<(code: string, timeoutMs: number) => Promise<SnippetResult>>();
const ensureRuntime = vi.fn<() => Promise<void>>(async () => {});
const restart = vi.fn<() => Promise<void>>(async () => {});
let runtimeStatus = { state: 'ready', loadedPackages: [] as string[], phaseText: undefined as string | undefined };

vi.mock('../../python', () => ({
  pyHost: {
    runSnippet: (code: string, timeoutMs: number) => runSnippet(code, timeoutMs),
    ensureRuntime: () => ensureRuntime(),
    restart: () => restart(),
  },
  usePyRuntime: () => runtimeStatus,
}));

// Replace the CodeMirror editor with a controlled textarea.
vi.mock('./Editor', () => ({
  default: ({
    value,
    onChange,
    ariaLabel,
    disabled,
  }: {
    value: string;
    onChange: (v: string) => void;
    ariaLabel: string;
    disabled?: boolean;
  }) => (
    <textarea
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

function result(over: Partial<SnippetResult> = {}): SnippetResult {
  return { runId: 'r1', ok: true, stdout: '', stderr: '', ...over };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  runtimeStatus = { state: 'ready', loadedPackages: [], phaseText: undefined };
  vi.useRealTimers();
});

beforeEach(() => {
  runSnippet.mockReset();
  ensureRuntime.mockClear();
  restart.mockClear();
});

// ---- Tests ----------------------------------------------------------------

describe('CodeRunner', () => {
  it('renders the editor seeded with starter', () => {
    render(<CodeRunner language="python" rows={10} starter="print('hi')" />);
    expect(screen.getByLabelText('Python code editor')).toHaveValue("print('hi')");
  });

  it('Run calls runSnippet with the code + 5000 and shows stdout', async () => {
    runSnippet.mockResolvedValueOnce(result({ stdout: 'hello\n' }));
    render(<CodeRunner language="python" rows={10} starter="print('hello')" />);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(runSnippet).toHaveBeenCalledWith("print('hello')", 5000));
    expect(await screen.findByTestId('cr-stdout')).toHaveTextContent('hello');
  });

  it('shows stderr / error traceback output', async () => {
    runSnippet.mockResolvedValueOnce(
      result({ ok: false, stderr: 'oops', error: 'Traceback: NameError' }),
    );
    render(<CodeRunner language="python" rows={10} starter="boom" />);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByTestId('cr-stderr')).toHaveTextContent('oops');
    expect(screen.getByTestId('cr-error')).toHaveTextContent('NameError');
  });

  it('runs solutionTest after a successful run; passing → complete + onComplete', async () => {
    const onComplete = vi.fn();
    runSnippet
      .mockResolvedValueOnce(result({ stdout: '4\n' })) // learner run
      .mockResolvedValueOnce(result()); // solutionTest passes
    render(
      <CodeRunner
        language="python"
        rows={10}
        starter="x = 4"
        solutionTest="assert x == 4"
        onComplete={onComplete}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(screen.getByText('✓ Complete')).toBeInTheDocument();
    expect(screen.getByLabelText('Python code runner')).toHaveAttribute('data-complete', 'true');
    // second call is the solutionTest snippet
    expect(runSnippet).toHaveBeenNthCalledWith(2, 'assert x == 4', 5000);
  });

  it('does not mark complete when the solutionTest raises', async () => {
    const onComplete = vi.fn();
    runSnippet
      .mockResolvedValueOnce(result({ stdout: '3\n' }))
      .mockResolvedValueOnce(result({ ok: false, stderr: 'AssertionError' }));
    render(
      <CodeRunner
        language="python"
        rows={10}
        starter="x = 3"
        solutionTest="assert x == 4"
        onComplete={onComplete}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    await screen.findByTestId('cr-stdout');
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.queryByText('✓ Complete')).not.toBeInTheDocument();
  });

  it('shows the runtime-loading state from usePyRuntime', () => {
    runtimeStatus = {
      state: 'loading-pyodide',
      loadedPackages: [],
      phaseText: 'Loading Python runtime… cached after first time',
    };
    render(<CodeRunner language="python" rows={10} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading Python runtime');
  });

  it('shows "still running" + restart affordance when runSnippet never resolves', async () => {
    runSnippet.mockImplementation(() => new Promise<SnippetResult>(() => {})); // never resolves
    render(<CodeRunner language="python" rows={10} starter="while True: pass" />);

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));

    // The soft-timeout (5 s) flips the UI to "still running…"; wait for it.
    expect(await screen.findByText('Still running…', {}, { timeout: 7000 })).toBeInTheDocument();
    const restartBtn = screen.getByRole('button', { name: 'Restart Python runtime' });
    await userEvent.click(restartBtn);
    expect(restart).toHaveBeenCalledTimes(1);
  }, 10000);
});
