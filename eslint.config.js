import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      'playwright-report',
      'test-results',
      'public/content/index.json',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    rules: {
      // React 19: function components + hooks only (SRS §3.2).
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // NFR-SEC-002: no eval / new Function in app code.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      '@typescript-eslint/no-implied-eval': 'error',

      // SRS §3.2: no `any` (boundary guards in src/python/bridge are the only
      // sanctioned exception and must use per-line disables when they land).
      '@typescript-eslint/no-explicit-any': 'error',

      // SRS §3.5 modularity contract: content/, widgets/, quiz/, python/ and
      // progress/ are import-isolated subsystems, each exposing a small
      // index.ts API. Zones are added here as each subsystem lands, e.g.:
      //   { target: './src/widgets', from: './src/quiz' },
      //   { target: './src/quiz', from: './src/widgets' },
      //   { target: './src/progress', from: './src/python' },
      // The rule requires >= 1 zone, so until subsystems land it carries a
      // single always-true guard (nothing may import from build output).
      'import/no-restricted-paths': ['error', { zones: [{ target: './src', from: './dist' }] }],
    },
  },
);
