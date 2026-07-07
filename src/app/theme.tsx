// Dark/light theme (FR-SHELL-005): toggle in settings, default
// prefers-color-scheme, persisted in kv 'theme', .dark class on <html>.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { kvGet, kvSet } from '../progress';

export type ThemePref = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  pref: ThemePref;
  setPref: (pref: ThemePref) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  pref: 'system',
  setPref: () => undefined,
});

function systemPrefersDark(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function applyTheme(pref: ThemePref): void {
  const dark = pref === 'dark' || (pref === 'system' && systemPrefersDark());
  document.documentElement.classList.toggle('dark', dark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>('system');

  // Restore the persisted preference once.
  useEffect(() => {
    let cancelled = false;
    void kvGet<ThemePref>('theme').then((stored) => {
      if (!cancelled && (stored === 'light' || stored === 'dark' || stored === 'system')) {
        setPrefState(stored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply on change; track OS preference while in 'system' mode.
  useEffect(() => {
    applyTheme(pref);
    if (pref !== 'system' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next);
    void kvSet('theme', next);
  }, []);

  return <ThemeContext.Provider value={{ pref, setPref }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
