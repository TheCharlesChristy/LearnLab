// CodeMirror 6 editor wrapper for the code-runner widget.
//
// CodeMirror is imported HERE (inside the widget's React.lazy chunk via
// CodeRunner.tsx) so it never reaches the entry bundle (NFR-PERF-001). The
// learner's code never executes on the main thread — this is just a text
// editor; all execution goes through the Pyodide worker (C-6, NFR-SEC-002).
//
// Tests mock this module with a plain <textarea> (see CodeRunner.test.tsx),
// because CodeMirror's contenteditable/measurement does not work in jsdom.

import { python } from '@codemirror/lang-python';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { useEffect, useRef } from 'react';

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Visual height in text rows (CSS min-height heuristic). */
  rows: number;
  disabled?: boolean;
  ariaLabel: string;
}

export default function Editor({ value, onChange, rows, disabled, ariaLabel }: EditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const editableRef = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Create the EditorView once; reconfigure value/editability imperatively so
  // we never recreate the whole editor (which would drop focus/undo history).
  useEffect(() => {
    const parent = hostRef.current;
    if (!parent) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        python(),
        editableRef.current.of(EditorView.editable.of(!disabled)),
        EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString());
        }),
        EditorView.theme({
          '&': { minHeight: `${rows * 1.4}em`, fontSize: '0.875rem' },
          '.cm-content': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    });
    const view = new EditorView({ state, parent });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Intentionally run once on mount. Value/disabled are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. a future "reset" affordance) into the view.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (view.state.doc.toString() !== value) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  }, [value]);

  // Sync editability (disabled while a run is in flight).
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: editableRef.current.reconfigure(EditorView.editable.of(!disabled)),
    });
  }, [disabled]);

  return (
    <div
      ref={hostRef}
      className="overflow-hidden rounded-md border border-gray-300 dark:border-gray-700"
    />
  );
}
