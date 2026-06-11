// Captioned image — SRS §5.3 `figure` row.
// Relative `src` resolves against the lesson's moduleBaseUrl when a
// LessonContext is present (§4.5 module-relative assets); outside a lesson
// route the raw src is used as-is.

import { useContext } from 'react';

import { LessonContext } from '../../content/lesson-context';

import type { FigureProps } from './index';

/** True for URLs that must not be re-based: scheme:, protocol-relative, root-relative. */
function isAbsoluteUrl(src: string): boolean {
  return /^(?:[a-z][a-z\d+\-.]*:|\/)/i.test(src);
}

export default function Figure({ src, alt, caption, width }: FigureProps) {
  const ctx = useContext(LessonContext); // optional: null outside lesson routes
  const resolvedSrc =
    ctx && !isAbsoluteUrl(src) ? `${ctx.moduleBaseUrl}${src.replace(/^\.\//, '')}` : src;

  return (
    <figure className="my-4 text-center">
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        width={width}
        className="mx-auto h-auto max-w-full rounded"
      />
      {caption !== undefined && caption !== '' && (
        <figcaption className="mt-2 text-sm text-zinc-600">{caption}</figcaption>
      )}
    </figure>
  );
}
