// Unknown routes (FR-SHELL-001): not-found page with a link home.

import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        That address doesn&rsquo;t match anything in LearnLab.
      </p>
      <p className="mt-4">
        <Link
          to="/"
          className="rounded font-medium text-indigo-700 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-300"
        >
          Back to the catalogue
        </Link>
      </p>
    </section>
  );
}
