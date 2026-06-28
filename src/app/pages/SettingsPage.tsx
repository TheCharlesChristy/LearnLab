// Settings (FR-SET-001): theme, export/import/erase, Python runtime status,
// storage persistence, versions, repo/docs links, privacy statement.

import { useRef, useState } from 'react';

import packageJson from '../../../package.json';
import { APP_NAME, PYODIDE_VERSION, REPO_NAME } from '../../config';
import {
  KV_PERSISTENT,
  KV_PERSIST_REQUESTED,
  downloadProgress,
  eraseAll,
  importProgress,
  useKv,
} from '../../progress';
import { pyHost, usePyRuntime } from '../../python';
import { Badge, Button, Card, Dialog, Spinner } from '../../ui';
import { loadContentIndex } from '../content-api';
import { useTheme } from '../theme';
import type { ThemePref } from '../theme';
import { useAsyncData } from '../useAsyncData';

const REPO_URL = `https://github.com/TheCharlesChristy/${REPO_NAME}`;

const DOC_LINKS = [
  { label: 'Authoring guide (Tier 1)', href: `${REPO_URL}/blob/main/docs/AUTHORING.md` },
  { label: 'Python items guide (Tier 2)', href: `${REPO_URL}/blob/main/docs/PYTHON_ITEMS.md` },
  { label: 'Widget catalogue', href: `${REPO_URL}/blob/main/docs/WIDGETS.md` },
];

const THEME_OPTIONS: Array<{ value: ThemePref; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

function ThemeSection() {
  const { pref, setPref } = useTheme();
  return (
    <SectionCard title="Appearance">
      <fieldset>
        <legend className="mb-2 text-sm text-slate-600 dark:text-slate-300">
          Theme (defaults to your system preference)
        </legend>
        <div className="flex gap-4">
          {THEME_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="theme"
                value={opt.value}
                checked={pref === opt.value}
                onChange={() => setPref(opt.value)}
                className="h-4 w-4 accent-indigo-700"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>
    </SectionCard>
  );
}

function ProgressDataSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [eraseOpen, setEraseOpen] = useState(false);
  const [eraseText, setEraseText] = useState('');

  const onImportFile = async (file: File) => {
    setImportResult(null);
    setImportError(null);
    try {
      const text = await file.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Not a valid JSON file.');
      }
      const summary = await importProgress(data);
      setImportResult(`Imported ${summary.imported}, skipped ${summary.skipped}.`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : String(error));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const erase = async () => {
    await eraseAll();
    window.location.reload();
  };

  return (
    <SectionCard title="Progress data">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void downloadProgress()}>Download my progress</Button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-300 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600">
          Import progress file
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Import progress file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onImportFile(file);
            }}
          />
        </label>
        <Button variant="danger" onClick={() => setEraseOpen(true)}>
          Erase all local data
        </Button>
      </div>
      <div aria-live="polite">
        {importResult && (
          <p className="mt-3 text-sm text-green-800 dark:text-green-300">{importResult}</p>
        )}
        {importError && (
          <p className="mt-3 text-sm text-red-800 dark:text-red-300" role="alert">
            Import rejected: {importError} Nothing was changed.
          </p>
        )}
      </div>

      <Dialog
        open={eraseOpen}
        title="Erase all local data"
        onClose={() => {
          setEraseOpen(false);
          setEraseText('');
        }}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This permanently deletes all progress, attempts and settings stored in this browser.
          Consider downloading your progress first. Type <strong>ERASE</strong> to confirm.
        </p>
        <input
          type="text"
          value={eraseText}
          onChange={(e) => setEraseText(e.target.value)}
          aria-label="Type ERASE to confirm"
          className="mt-3 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setEraseOpen(false);
              setEraseText('');
            }}
          >
            Cancel
          </Button>
          <Button variant="danger" disabled={eraseText !== 'ERASE'} onClick={() => void erase()}>
            Erase everything
          </Button>
        </div>
      </Dialog>
    </SectionCard>
  );
}

const RUNTIME_STATE_LABELS: Record<string, string> = {
  idle: 'Not loaded',
  'loading-pyodide': 'Loading Pyodide…',
  'loading-bundle': 'Loading SDK…',
  ready: 'Ready',
  error: 'Error',
};

function PythonRuntimeSection() {
  // FR-SET-001: live runtime status (state, version, packages) + an enabled
  // "Restart Python runtime" button. The runtime stays lazily loaded — reading
  // status here does not boot Pyodide.
  const status = usePyRuntime();
  const stateLabel = RUNTIME_STATE_LABELS[status.state] ?? status.state;
  // Before load the worker has not reported a version; show the pinned config
  // version so the page is never blank.
  const version = status.pyodideVersion ?? PYODIDE_VERSION;
  const packages = status.loadedPackages;

  return (
    <SectionCard title="Python runtime">
      <div className="flex items-center gap-3">
        <Badge>{stateLabel}</Badge>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Pyodide version: {version}
          {status.pyodideVersion ? '' : ' (pinned)'}.
        </p>
      </div>
      {status.sdkVersion ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          learnsdk version: {status.sdkVersion}
        </p>
      ) : null}
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Loaded packages:{' '}
        <span className="font-medium">
          {packages.length > 0 ? packages.join(', ') : 'none'}
        </span>
      </p>
      {status.error ? (
        <p className="mt-2 text-sm text-red-800 dark:text-red-300" role="alert">
          {status.error}
        </p>
      ) : null}
      <Button
        variant="secondary"
        className="mt-3"
        onClick={() => void pyHost.restart()}
      >
        Restart Python runtime
      </Button>
    </SectionCard>
  );
}

function StorageSection() {
  const requested = useKv<boolean>(KV_PERSIST_REQUESTED);
  const persistent = useKv<boolean>(KV_PERSISTENT);
  const label = !requested
    ? 'Best-effort (persistence is requested after your first progress write)'
    : persistent
      ? 'Persistent'
      : 'Best-effort';
  return (
    <SectionCard title="Storage">
      <p className="text-sm">
        Storage mode: <span className="font-medium">{label}</span>
      </p>
    </SectionCard>
  );
}

function AboutSection() {
  const index = useAsyncData(loadContentIndex, 'content-index');
  return (
    <SectionCard title="About">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="font-medium">App version</dt>
        <dd>{packageJson.version}</dd>
        <dt className="font-medium">Content build</dt>
        <dd>
          {index.status === 'ready' ? (
            new Date(index.data.generatedAt).toLocaleString()
          ) : index.status === 'loading' ? (
            <Spinner label="Loading…" className="py-0" />
          ) : (
            'unavailable'
          )}
        </dd>
      </dl>
      <ul className="mt-3 space-y-1 text-sm">
        <li>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded font-medium text-indigo-700 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-300"
          >
            {APP_NAME} on GitHub
          </a>
        </li>
        {DOC_LINKS.map((d) => (
          <li key={d.href}>
            <a
              href={d.href}
              target="_blank"
              rel="noreferrer"
              className="rounded font-medium text-indigo-700 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-300"
            >
              {d.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <strong>Privacy:</strong> all learning progress stays in this browser (IndexedDB).{' '}
        {APP_NAME} has no accounts, no analytics and no telemetry, and never transmits learner data
        over the network.
      </p>
    </SectionCard>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-2xl font-bold">Settings</h1>
      <ThemeSection />
      <ProgressDataSection />
      <PythonRuntimeSection />
      <StorageSection />
      <AboutSection />
    </div>
  );
}
