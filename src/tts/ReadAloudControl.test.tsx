import 'fake-indexeddb/auto';

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ReadAloudControl } from './ReadAloudControl';

class MockUtterance {
  onboundary: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  rate = 1;
  constructor(public text: string) {}
}

class MockSpeechSynthesis {
  speaking = false;
  paused = false;
  current: MockUtterance | null = null;
  speak(u: MockUtterance) {
    this.current = u;
    this.speaking = true;
  }
  cancel() {
    this.speaking = false;
    this.paused = false;
    this.current = null;
  }
  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
  }
}

beforeEach(() => {
  Object.defineProperty(window, 'speechSynthesis', {
    value: new MockSpeechSynthesis(),
    configurable: true,
    writable: true,
  });
  (window as unknown as { SpeechSynthesisUtterance: typeof MockUtterance }).SpeechSynthesisUtterance =
    MockUtterance;
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ReadAloudControl', () => {
  it('renders nothing when the browser has no speechSynthesis', () => {
    Reflect.deleteProperty(window, 'speechSynthesis');
    const ref = { current: document.createElement('div') };
    const { container } = render(<ReadAloudControl targetRef={ref} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a "Read aloud" button initially, and switches to Pause once started', () => {
    const el = document.createElement('div');
    el.textContent = 'Hello world';
    const ref = { current: el };
    render(<ReadAloudControl targetRef={ref} />);

    const readButton = screen.getByRole('button', { name: /read aloud/i });
    expect(readButton).toBeInTheDocument();

    fireEvent.click(readButton);

    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /read aloud/i })).not.toBeInTheDocument();
  });

  it('the rate slider is keyboard-operable and has an accessible label', () => {
    const el = document.createElement('div');
    el.textContent = 'Hello world';
    const ref = { current: el };
    render(<ReadAloudControl targetRef={ref} />);
    const slider = screen.getByLabelText(/reading speed/i);
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('type', 'range');
  });

  it('Stop returns the control to its initial "Read aloud" state', () => {
    const el = document.createElement('div');
    el.textContent = 'Hello world';
    const ref = { current: el };
    render(<ReadAloudControl targetRef={ref} />);

    fireEvent.click(screen.getByRole('button', { name: /read aloud/i }));
    fireEvent.click(screen.getByRole('button', { name: /stop reading/i }));

    expect(screen.getByRole('button', { name: /read aloud/i })).toBeInTheDocument();
  });
});
