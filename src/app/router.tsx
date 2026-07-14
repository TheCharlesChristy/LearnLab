// Route table (FR-SHELL-001, C-3 hash routing). Pages are lazy so route code
// stays out of the entry chunk (NFR-PERF-001). Every route has an error
// boundary (FR-SHELL-006) via errorElement.

import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router';

import { Spinner } from '../ui';

import AppLayout from './AppLayout';
import { RouteErrorPage } from './RouteErrorPage';

const CataloguePage = lazy(() => import('./pages/CataloguePage'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const ModulePage = lazy(() => import('./pages/ModulePage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const WidgetsPage = lazy(() => import('./pages/WidgetsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
// ADR-001: Studio is developer tooling, never a learner-product route. Vite
// replaces DEV at build time, so this lazy chunk and its Ajv/schema imports are
// absent from production learner builds.
const StudioPage = import.meta.env.DEV ? lazy(() => import('../studio/StudioPage')) : null;

function page(node: ReactNode): ReactNode {
  return <Suspense fallback={<Spinner label="Loading page…" />}>{node}</Suspense>;
}

export function buildRoutes(): RouteObject[] {
  return [
    {
      path: '/',
      element: <AppLayout />,
      errorElement: <RouteErrorPage />,
      children: [
        { index: true, element: page(<CataloguePage />), errorElement: <RouteErrorPage /> },
        {
          path: 'course/:courseId',
          element: page(<CoursePage />),
          errorElement: <RouteErrorPage />,
        },
        {
          path: 'module/:moduleId',
          element: page(<ModulePage />),
          errorElement: <RouteErrorPage />,
        },
        {
          path: 'module/:moduleId/lesson/:lessonId',
          element: page(<LessonPage />),
          errorElement: <RouteErrorPage />,
        },
        {
          path: 'module/:moduleId/assessment',
          element: page(<AssessmentPage />),
          errorElement: <RouteErrorPage />,
        },
        { path: 'progress', element: page(<ProgressPage />), errorElement: <RouteErrorPage /> },
        { path: 'review', element: page(<ReviewPage />), errorElement: <RouteErrorPage /> },
        { path: 'search', element: page(<SearchPage />), errorElement: <RouteErrorPage /> },
        { path: 'settings', element: page(<SettingsPage />), errorElement: <RouteErrorPage /> },
        {
          path: 'widgets/:widgetKey?',
          element: page(<WidgetsPage />),
          errorElement: <RouteErrorPage />,
        },
        ...(StudioPage === null
          ? []
          : [{ path: 'studio', element: page(<StudioPage />), errorElement: <RouteErrorPage /> }]),
        { path: '*', element: page(<NotFoundPage />), errorElement: <RouteErrorPage /> },
      ],
    },
  ];
}
