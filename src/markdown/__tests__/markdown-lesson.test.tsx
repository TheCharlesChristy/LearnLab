// MarkdownLesson tests — SRS §11 "directive→widget mapping" unit scope,
// FR-CONT-004/005/006, FR-WID-003, §4.5 directive forms, NFR-A11Y-001.

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

// No vitest globals in this repo, so RTL cannot auto-cleanup between tests.
afterEach(cleanup);

import { LessonContext, type LessonContextValue } from '../../content/lesson-context';
import { MarkdownLesson } from '../index';

// Mocked registry: one known widget key "mock" (§5.3 registry interaction).
vi.mock('../../widgets/registry', async () => {
  const { createElement, lazy } = await import('react');
  const MockWidget = (props: Record<string, unknown>) =>
    createElement('div', { 'data-testid': 'mock-widget' }, JSON.stringify(props));
  return {
    WIDGET_KEYS: ['mock'],
    widgetRegistry: {
      mock: {
        component: lazy(() => Promise.resolve({ default: MockWidget })),
        parseProps: (raw: Record<string, unknown>) =>
          'bad' in raw
            ? { ok: false, errors: ['bad: this prop is not allowed'] }
            : { ok: true, props: raw },
      },
    },
  };
});

function lessonCtx(overrides: Partial<LessonContextValue> = {}): LessonContextValue {
  return {
    moduleId: 'differentiation-1',
    moduleBaseUrl: '/content/maths/alevel-pure/differentiation-1/',
    recordAttempt: async () => {},
    ...overrides,
  };
}

describe('::widget directive', () => {
  it('passes attribute values to parseProps verbatim as strings (D-004)', async () => {
    render(
      <MarkdownLesson markdown={'::widget{type="mock" expr="2" tangent=true n=3 bare}'} />,
    );
    const widget = await screen.findByTestId('mock-widget');
    const props = JSON.parse(widget.textContent ?? '{}') as Record<string, unknown>;
    // Strings stay strings — type interpretation is each widget's parseProps
    // job (§4.5); numeric-looking string props (expr="2") must survive.
    expect(props).toEqual({ expr: '2', tangent: 'true', n: '3', bare: true });
  });

  it('renders a visible "Unknown widget" card for unknown types (FR-CONT-006)', () => {
    render(<MarkdownLesson markdown={'::widget{type="frobnicator"}'} />);
    expect(screen.getByText(/Unknown widget: frobnicator/)).toBeInTheDocument();
  });

  it('renders an inline error card naming bad props (FR-WID-003, dev details)', () => {
    render(<MarkdownLesson markdown={'::widget{type="mock" bad="x"}'} />);
    expect(screen.getByText(/Widget "mock" has invalid props/)).toBeInTheDocument();
    // import.meta.env.DEV is true under vitest → details listed.
    expect(screen.getByText(/bad: this prop is not allowed/)).toBeInTheDocument();
  });

  it('renders an error card when type is missing', () => {
    render(<MarkdownLesson markdown={'::widget{expr="x"}'} />);
    expect(screen.getByText(/missing its type/i)).toBeInTheDocument();
  });
});

describe('::py directive', () => {
  it('renders a neutral placeholder with reserved min-height when no renderer is given', () => {
    const { container } = render(<MarkdownLesson markdown={'::py{src="items/foo.py"}'} />);
    expect(screen.getByText('Python item: items/foo.py (runtime not loaded)')).toBeInTheDocument();
    const placeholder = container.querySelector('[data-py-placeholder]');
    expect(placeholder).toHaveStyle({ minHeight: '240px' });
  });

  it('reserves the author-specified height (min 240) to prevent CLS', () => {
    const { container } = render(
      <MarkdownLesson markdown={'::py{src="items/foo.py" height=400}'} />,
    );
    expect(container.querySelector('[data-py-placeholder]')).toHaveStyle({ minHeight: '400px' });
  });

  it('calls pyItemRenderer with parsed params and height', () => {
    const pyItemRenderer = vi.fn(() => <div data-testid="py-mounted" />);
    render(
      <MarkdownLesson
        markdown={'::py{src="items/quiz.py" params=\'{"questions": 4}\' height=300}'}
        pyItemRenderer={pyItemRenderer}
      />,
    );
    expect(screen.getByTestId('py-mounted')).toBeInTheDocument();
    expect(pyItemRenderer).toHaveBeenCalledWith({
      src: 'items/quiz.py',
      params: { questions: 4 },
      height: 300,
    });
  });

  it('renders an error card on invalid params JSON', () => {
    const pyItemRenderer = vi.fn(() => <div data-testid="py-mounted" />);
    render(
      <MarkdownLesson
        markdown={'::py{src="items/quiz.py" params=\'{nope\'}'}
        pyItemRenderer={pyItemRenderer}
      />,
    );
    expect(screen.getByText(/params is not valid JSON/)).toBeInTheDocument();
    expect(pyItemRenderer).not.toHaveBeenCalled();
    expect(screen.queryByTestId('py-mounted')).not.toBeInTheDocument();
  });

  it('renders an error card when src is missing', () => {
    render(<MarkdownLesson markdown={'::py{height=300}'} />);
    expect(screen.getByText(/missing its src/i)).toBeInTheDocument();
  });
});

describe(':::callout directive', () => {
  it.each(['info', 'tip', 'warning', 'key'] as const)('renders kind=%s as a note aside', (kind) => {
    render(<MarkdownLesson markdown={`:::callout{kind="${kind}"}\nBody text.\n:::`} />);
    const aside = screen.getByRole('note');
    expect(aside).toHaveAttribute('data-callout', kind);
    expect(aside).toHaveTextContent('Body text.');
    // distinct icon per kind
    expect(aside.querySelector('svg')).not.toBeNull();
  });

  it('treats an invalid kind as info with a dev-only warning badge', () => {
    render(<MarkdownLesson markdown={':::callout{kind="banana"}\nHm.\n:::'} />);
    const aside = screen.getByRole('note');
    expect(aside).toHaveAttribute('data-callout', 'info');
    // DEV is true under vitest → badge shown.
    expect(screen.getByText(/Unknown callout kind: banana/)).toBeInTheDocument();
  });

  it('treats a missing kind as info', () => {
    render(<MarkdownLesson markdown={':::callout\nHm.\n:::'} />);
    expect(screen.getByRole('note')).toHaveAttribute('data-callout', 'info');
  });

  it('renders nested markdown and maths inside the callout', () => {
    const { container } = render(
      <MarkdownLesson markdown={':::callout{kind="key"}\nSome **bold** and $x^2$.\n:::'} />,
    );
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(container.querySelector('.katex')).not.toBeNull();
  });
});

describe(':::reveal directive', () => {
  it('is collapsed by default and toggles via keyboard (§4.5, NFR-A11Y-001)', async () => {
    const user = userEvent.setup();
    render(
      <MarkdownLesson markdown={':::reveal{title="Worked solution"}\nThe hidden answer.\n:::'} />,
    );
    const button = screen.getByRole('button', { name: /Worked solution/ });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('The hidden answer.')).not.toBeInTheDocument();

    button.focus();
    await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('The hidden answer.')).toBeInTheDocument();

    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('The hidden answer.')).not.toBeInTheDocument();
  });

  it('falls back to "Reveal" when title is missing', () => {
    render(<MarkdownLesson markdown={':::reveal\nHidden.\n:::'} />);
    expect(screen.getByRole('button', { name: 'Reveal' })).toBeInTheDocument();
  });
});

describe('closed directive set', () => {
  it('renders an error card naming an unknown leaf directive', () => {
    render(<MarkdownLesson markdown={'::mystery{x=1}'} />);
    expect(screen.getByText(/Unknown directive: mystery/)).toBeInTheDocument();
  });

  it('renders an error card naming an unknown container directive', () => {
    render(<MarkdownLesson markdown={':::mystery\nstuff\n:::'} />);
    expect(screen.getByText(/Unknown directive: mystery/)).toBeInTheDocument();
    expect(screen.queryByText('stuff')).not.toBeInTheDocument();
  });

  it('renders an error card for unknown text (inline) directives', () => {
    render(<MarkdownLesson markdown={'See :sparkle[this] for details.'} />);
    expect(screen.getByText(/Unknown directive: sparkle/)).toBeInTheDocument();
  });

  it('renders an error card when a known name uses the wrong form', () => {
    render(<MarkdownLesson markdown={'::callout{kind="info"}'} />);
    expect(screen.getByText(/Directive "callout" used with the wrong form/)).toBeInTheDocument();
  });

  it('renders an error card for a container nested inside a container', () => {
    const markdown = [
      '::::callout{kind="info"}',
      ':::reveal{title="Inner"}',
      'nope',
      ':::',
      '::::',
    ].join('\n');
    render(<MarkdownLesson markdown={markdown} />);
    expect(screen.getByText(/Nested container directive: "reveal"/)).toBeInTheDocument();
    expect(screen.queryByText('nope')).not.toBeInTheDocument();
  });

  it('still renders leaf directives nested inside a container', async () => {
    const markdown = [':::callout{kind="tip"}', '::widget{type="mock" a=1}', ':::'].join('\n');
    render(<MarkdownLesson markdown={markdown} />);
    expect(await screen.findByTestId('mock-widget')).toBeInTheDocument();
  });
});

describe('pipeline (GFM, maths, frontmatter, skipHtml)', () => {
  it('strips raw HTML, including <script> (FR-CONT-005 / NFR-SEC-002)', () => {
    const { container } = render(
      <MarkdownLesson markdown={'before\n\n<script>window.pwned = true;</script>\n\nafter'} />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).not.toContain('pwned');
    expect(screen.getByText('before')).toBeInTheDocument();
    expect(screen.getByText('after')).toBeInTheDocument();
  });

  it('renders $maths$ via KaTeX with MathML output (§3.2)', () => {
    const { container } = render(<MarkdownLesson markdown={'Euler: $e^{i\\pi} = -1$'} />);
    expect(container.querySelector('.katex')).not.toBeNull();
    expect(container.querySelector('math')).not.toBeNull(); // htmlAndMathml
  });

  it('renders display maths', () => {
    const { container } = render(<MarkdownLesson markdown={'$$\n\\int_0^1 x\\,dx\n$$'} />);
    expect(container.querySelector('.katex-display')).not.toBeNull();
  });

  it('renders GFM tables', () => {
    render(<MarkdownLesson markdown={'| a | b |\n| - | - |\n| 1 | 2 |'} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('parses and ignores YAML frontmatter', () => {
    const { container } = render(
      <MarkdownLesson markdown={'---\ntitle: Should Not Appear\n---\n\n# Real heading'} />,
    );
    expect(container.textContent).not.toContain('Should Not Appear');
    expect(screen.getByRole('heading', { name: 'Real heading' })).toBeInTheDocument();
  });
});

describe('images', () => {
  it('resolves relative src against moduleBaseUrl and lazy-loads', () => {
    render(
      <LessonContext.Provider value={lessonCtx()}>
        <MarkdownLesson markdown={'![a graph](./figures/graph.png)'} />
      </LessonContext.Provider>,
    );
    const img = screen.getByRole('img', { name: 'a graph' });
    expect(img).toHaveAttribute(
      'src',
      '/content/maths/alevel-pure/differentiation-1/figures/graph.png',
    );
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('leaves absolute and root-relative URLs untouched', () => {
    render(
      <LessonContext.Provider value={lessonCtx()}>
        <MarkdownLesson
          markdown={'![abs](https://example.org/x.png)\n\n![root](/static/y.png)'}
        />
      </LessonContext.Provider>,
    );
    expect(screen.getByRole('img', { name: 'abs' })).toHaveAttribute(
      'src',
      'https://example.org/x.png',
    );
    expect(screen.getByRole('img', { name: 'root' })).toHaveAttribute('src', '/static/y.png');
  });

  it('falls back to the raw src when no lesson context is present', () => {
    render(<MarkdownLesson markdown={'![bare](figures/graph.png)'} />);
    expect(screen.getByRole('img', { name: 'bare' })).toHaveAttribute(
      'src',
      'figures/graph.png',
    );
  });
});

describe('fenced code blocks', () => {
  it('renders a plain <pre><code> fallback immediately, then highlights lazily', async () => {
    const { container } = render(
      <MarkdownLesson markdown={'```python\nprint("hi")\n```'} />,
    );
    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    expect(pre).toHaveTextContent('print("hi")');

    // shiki loads via dynamic import; tokenised output replaces the fallback.
    await waitFor(
      () => {
        expect(container.querySelector('pre[data-highlighted="true"]')).not.toBeNull();
      },
      { timeout: 15000 },
    );
    expect(container.querySelector('pre')).toHaveTextContent('print("hi")');
  }, 20000);

  it('keeps the plain fallback for unknown languages', () => {
    const { container } = render(<MarkdownLesson markdown={'```cobol\nDISPLAY "HI".\n```'} />);
    const pre = container.querySelector('pre');
    expect(pre).toHaveTextContent('DISPLAY "HI".');
    expect(pre).not.toHaveAttribute('data-highlighted');
  });
});
