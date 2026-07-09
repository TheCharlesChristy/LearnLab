// App shell layout: header (app name → home, nav, offline chip), skip link,
// unsupported-browser banner (§2.3), main landmark, routed outlet.

import { BarChart3, Blocks, RotateCcw, Search as SearchIcon, Settings as SettingsIcon, WifiOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router';

import { APP_NAME } from '../config';
import { onWriteError, useDueReviewCount } from '../progress';
import { cx, toast } from '../ui';

/** WebAssembly + Workers are hard requirements for Python items (§2.3). */
export function isPythonSupported(): boolean {
  return typeof WebAssembly !== 'undefined' && typeof Worker !== 'undefined';
}

function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

function UnsupportedBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (isPythonSupported() || dismissed) return null;
  return (
    <div
      role="status"
      className="flex items-center gap-3 border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-100"
    >
      <p className="flex-1">
        Python items won&rsquo;t run in this browser; reading content still works.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss browser support notice"
        className="rounded p-1 hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-amber-700 dark:hover:bg-amber-800"
      >
        <X aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}

// Icon-only below `sm:` (NFR mobile fix — 4 full-text labels overflowed a
// 390px viewport by ~50px); icon + label from `sm:` up. `aria-label` on the
// NavLink itself keeps the accessible name correct regardless of which of
// the icon/text is visually shown.
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:px-3',
    isActive
      ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100'
      : 'text-slate-700 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700',
  );

export default function AppLayout() {
  const online = useOnline();
  const dueReviewCount = useDueReviewCount();

  // NFR-REL-001: failed progress writes surface via a toast.
  useEffect(
    () =>
      onWriteError(() => {
        toast({ message: 'Progress could not be saved.', durationMs: null });
      }),
    [],
  );

  return (
    <div className="min-h-screen bg-surface text-slate-900 dark:bg-surface-dark dark:text-slate-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-indigo-700 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <UnsupportedBanner />
      <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-surface-dark-muted">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="rounded text-lg font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {APP_NAME}
          </Link>
          {!online && (
            <span
              role="status"
              className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-700 dark:text-slate-100"
            >
              <WifiOff aria-hidden className="h-3 w-3" />
              Offline
            </span>
          )}
          <nav aria-label="Main" className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <NavLink to="/search" aria-label="Search" className={navLinkClass}>
              <SearchIcon aria-hidden className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Search</span>
            </NavLink>
            <NavLink to="/review" aria-label="Review" className={navLinkClass}>
              <RotateCcw aria-hidden className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Review</span>
              {!!dueReviewCount && (
                <span
                  className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs font-semibold text-white dark:bg-indigo-500"
                  aria-label={`${dueReviewCount} due`}
                >
                  {dueReviewCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/progress" aria-label="Progress" className={navLinkClass}>
              <BarChart3 aria-hidden className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Progress</span>
            </NavLink>
            <NavLink to="/widgets" aria-label="Widgets" className={navLinkClass}>
              <Blocks aria-hidden className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Widgets</span>
            </NavLink>
            <NavLink to="/settings" aria-label="Settings" className={navLinkClass}>
              <SettingsIcon aria-hidden className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </NavLink>
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-6 outline-none">
        <Outlet />
      </main>
    </div>
  );
}
