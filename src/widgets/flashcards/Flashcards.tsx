// `flashcards` implementation — spaced-recall cards within a lesson (SRS §5.3
// row). Fetches a module-relative JSON file { cards: [{ front, back }] }
// (Markdown strings) and walks the deck one card at a time: shows the FRONT,
// a "Flip" button reveals the BACK, then two self-grade buttons ("Again" /
// "Good") record a grade and advance to the next card. Per the task contract
// this widget does NOT import src/progress — persistence goes through
// LessonContext.getItemState/setItemState only (D-012, itemId
// `flashcards:${src}`).
//
// Failure handling (mirrors StepReveal/DataPlot): network/HTTP failure →
// retry card; malformed JSON / bad shape → error card naming the exact
// problem. The widget renders an inline card rather than throwing.
//
// Card fronts/backs render through MarkdownInline (src/markdown public
// barrel), which disables raw HTML (skipHtml — FR-CONT-005 / NFR-SEC-002).
//
// DOCUMENTED DESIGN CHOICES (SRS §5.3 leaves replay/spacing to the widget;
// SM-2-style spacing is ROADMAP §13, not required here):
//   - itemState shape: `Record<cardIndex, { grade: 'again' | 'good';
//     reviewedAt: number }>` — keyed by card index (stable within a session;
//     cards don't reorder while a deck is open).
//   - On mount, prior grades are restored and the session starts on the
//     first card NOT already graded "good" (so "again" cards resurface on a
//     later visit; a fully "good" deck opens straight into the "deck
//     complete" state). A small "graded X/N" indicator is always shown.
//   - After the deck's last card is graded, a "Deck complete" state is shown
//     (no wrap-around) with a "Review again" control that restarts the
//     browsing position at card 0 without discarding persisted grades.
//   - With NO LessonContext in scope (e.g. widget previewed outside a lesson
//     route), grades are kept in an in-memory no-op store for the component's
//     lifetime instead of persisting — same graceful-degradation pattern
//     step-reveal/data-plot use for moduleBaseUrl.

import { useContext, useEffect, useRef, useState } from 'react';

import { LessonContext } from '../../content';
import { prefersReducedMotion } from '../../lib/motion';
import { MarkdownInline } from '../../markdown';

import type { FlashcardsProps } from './index';

/** Half of the flip's CSS transition duration (motion-safe:duration-500) — the
 * content swap fires here, at the animation's edge-on midpoint. */
const FLIP_HALF_DURATION_MS = 250;

interface Card {
  front: string;
  back: string;
}

type Grade = 'again' | 'good';

interface GradeRecord {
  grade: Grade;
  reviewedAt: number;
}

type Grades = Record<number, GradeRecord>;

/** True for URLs that must not be re-based: scheme:, protocol-relative, root-relative. */
function isAbsoluteUrl(src: string): boolean {
  return /^(?:[a-z][a-z\d+\-.]*:|\/)/i.test(src);
}

/** Validate the fetched value into Card[], or throw an Error naming the problem. */
function parseCards(value: unknown): Card[] {
  if (typeof value !== 'object' || value === null) {
    throw new Error('file must be a JSON object with a "cards" array');
  }
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.cards) || v.cards.length === 0) {
    throw new Error('cards: must be a non-empty array');
  }
  return v.cards.map((rawCard, i) => {
    if (typeof rawCard !== 'object' || rawCard === null) {
      throw new Error(`cards[${i}]: must be an object { front, back }`);
    }
    const c = rawCard as Record<string, unknown>;
    if (typeof c.front !== 'string' || c.front.trim() === '') {
      throw new Error(`cards[${i}].front: must be a non-empty string`);
    }
    if (typeof c.back !== 'string' || c.back.trim() === '') {
      throw new Error(`cards[${i}].back: must be a non-empty string`);
    }
    return { front: c.front, back: c.back };
  });
}

/** Validate a restored itemState value into Grades, ignoring anything malformed. */
function parseGrades(value: unknown): Grades {
  if (typeof value !== 'object' || value === null) return {};
  const out: Grades = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0) continue;
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    if (e.grade !== 'again' && e.grade !== 'good') continue;
    if (typeof e.reviewedAt !== 'number') continue;
    out[index] = { grade: e.grade, reviewedAt: e.reviewedAt };
  }
  return out;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'fetch-error'; message: string }
  | { status: 'data-error'; message: string }
  | { status: 'ready'; cards: Card[] };

export default function Flashcards({ src }: FlashcardsProps) {
  const ctx = useContext(LessonContext); // optional: null outside lesson routes
  const url =
    ctx && !isAbsoluteUrl(src) ? `${ctx.moduleBaseUrl}${src.replace(/^\.\//, '')}` : src;
  const itemId = `flashcards:${src}`;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    void (async () => {
      let raw: unknown;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        raw = await res.json();
      } catch (err) {
        console.error(`[flashcards] failed to load ${url}`, err);
        if (!cancelled) {
          setState({
            status: 'fetch-error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
        return;
      }
      try {
        const cards = parseCards(raw);
        if (!cancelled) setState({ status: 'ready', cards });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'data-error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, reloadToken]);

  if (state.status === 'loading') {
    return (
      <div role="status" className="my-4 rounded-lg border p-4 text-sm opacity-80">
        Loading flashcards…
      </div>
    );
  }

  if (state.status === 'fetch-error') {
    return (
      <div role="alert" className="my-4 rounded-lg border border-red-300 p-4">
        <p className="font-medium">Couldn’t load flashcards</p>
        <p className="mt-1 text-sm opacity-80">
          {src}: {state.message}
        </p>
        <button
          type="button"
          onClick={() => setReloadToken((t) => t + 1)}
          className="mt-2 rounded bg-blue-600 px-3 py-1 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (state.status === 'data-error') {
    return (
      <div role="alert" className="my-4 rounded-lg border border-red-300 p-4">
        <p className="font-medium">Invalid flashcards data</p>
        <p className="mt-1 text-sm opacity-80">
          {src}: {state.message}
        </p>
      </div>
    );
  }

  return <Deck cards={state.cards} itemId={itemId} />;
}

function Deck({ cards, itemId }: { cards: Card[]; itemId: string }) {
  const ctx = useContext(LessonContext); // optional: graceful no-op persistence when absent
  const [grades, setGrades] = useState<Grades>({});
  const [restored, setRestored] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  // Which face is actually rendered — lags `flipped` by half the CSS
  // transition so the content swap lands at the pinch's zero-width midpoint
  // instead of visibly jumping (see the render below for why this is a
  // single face in the DOM, not two stacked backface-hidden faces — that
  // rotateY(180deg) + backface-visibility:hidden version was tried first and
  // is subtly wrong: at the final 180deg state the div IS its own back face,
  // so backface-visibility:hidden hides it entirely instead of revealing the
  // swapped content).
  const [displayFace, setDisplayFace] = useState<'front' | 'back'>('front');
  // True while pinched to zero width (mid-flip); false = full width, whether
  // showing front or back. Driving `scaleX` this way (1 -> 0 -> 1) rather
  // than a 3D rotateY sidesteps the mirroring/backface issue above entirely.
  const [pinched, setPinched] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const flipButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!flipped) {
      setDisplayFace('front');
      setPinched(false);
      return;
    }
    if (prefersReducedMotion()) {
      setDisplayFace('back');
      setPinched(false);
      return;
    }
    setPinched(true); // pinch shut over the first half of the transition
    const timeout = window.setTimeout(() => {
      setDisplayFace('back'); // swap at the zero-width midpoint...
      setPinched(false); // ...then grow back open over the second half
    }, FLIP_HALF_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [flipped]);

  // Restore prior grades on mount and start the session on the first card
  // not already graded "good" (documented choice above).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const restoredValue = ctx ? await ctx.getItemState(itemId) : null;
      const restoredGrades = parseGrades(restoredValue);
      if (cancelled) return;
      setGrades(restoredGrades);
      const firstUngraded = cards.findIndex((_, i) => restoredGrades[i]?.grade !== 'good');
      setIndex(firstUngraded === -1 ? cards.length - 1 : firstUngraded);
      setRestored(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  if (!restored) {
    return (
      <div role="status" className="my-4 rounded-lg border p-4 text-sm opacity-80">
        Loading flashcards…
      </div>
    );
  }

  const gradedCount = Object.values(grades).filter((g) => g.grade === 'good').length;
  // Deck is "complete" once every card has a recorded "good" grade — no card
  // currently needs review. Reopens automatically if a card is later graded
  // "again" (e.g. after "Review again").
  const showComplete = cards.every((_, i) => grades[i]?.grade === 'good');
  // `cards` is validated non-empty by parseCards, and `index` is always
  // clamped to a valid position, so this index access is safe.
  const currentCard = cards[Math.min(Math.max(index, 0), cards.length - 1)]!;

  function persist(next: Grades) {
    setGrades(next);
    if (ctx) {
      // Fire-and-forget: the progress layer surfaces write failures via its
      // own toast (NFR-REL-001) — do not wrap in a swallowing try/catch.
      void ctx.setItemState(itemId, next);
    }
  }

  function flip() {
    setFlipped(true);
    setAnnouncement('Card flipped');
  }

  function grade(g: Grade) {
    const next: Grades = { ...grades, [index]: { grade: g, reviewedAt: Date.now() } };
    persist(next);
    setFlipped(false);

    // §13 roadmap (D-021/D-022): feed this card's grade into the spaced-
    // repetition review queue, per-card (not per-deck like `itemId` above),
    // so it can resurface later independent of this deck's own linear pass.
    // Fire-and-forget, same rationale as persist()'s setItemState call.
    if (ctx) {
      void ctx.recordReview(`${itemId}:${index}`, g);
    }

    const nextAllGood = cards.every((_, i) => next[i]?.grade === 'good');
    if (nextAllGood) {
      setAnnouncement('Deck complete');
      // Delight layer (not SRS-normative): report the milestone through
      // LessonContext, same fire-and-forget contract as recordReview above —
      // this widget still never imports src/progress directly (D-012/§3.5).
      if (ctx) void ctx.notifyEngagement({ kind: 'flashcards-deck-complete' });
      return;
    }

    setAnnouncement(`Graded: ${g === 'good' ? 'Good' : 'Again'}`);
    setIndex((i) => (i + 1 < cards.length ? i + 1 : 0));
  }

  function reviewAgain() {
    setIndex(0);
    setFlipped(false);
    setAnnouncement('Restarting review');
  }

  return (
    <section className="my-4 rounded-lg border p-4" aria-label="Flashcards">
      <p className="text-sm opacity-70">
        Graded {gradedCount}/{cards.length}
      </p>

      {showComplete ? (
        <div className="mt-3">
          <p className="font-medium">Deck complete</p>
          <p className="mt-1 text-sm opacity-80">
            You’ve graded all {cards.length} card{cards.length === 1 ? '' : 's'} as “Good”.
          </p>
          <button
            type="button"
            onClick={reviewAgain}
            className="mt-3 rounded bg-blue-600 px-3 py-1 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Review again
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide opacity-60">
            Card {index + 1} of {cards.length}
          </p>
          {/* Flip animation: a "pinch" — scaleX 1 -> 0 -> 1 — rather than a
              literal 3D rotateY. Deliberately a SINGLE face in the DOM at a
              time (not two stacked, backface-hidden faces): AT would read
              both the front and back text at once if both were mounted,
              since `backface-visibility` is a paint-only trick screen
              readers ignore entirely. The displayed content swaps at the
              pinch's zero-width midpoint (`pinched` true -> false, timed via
              FLIP_HALF_DURATION_MS below), so the swap is visually
              imperceptible instead of a jump — and unlike a single-node
              rotateY(180deg), scaleX never crosses into "looking at the back
              of the plane", so there's no mirroring/backface-visibility
              trap at the end state. */}
          <div className="mt-2 rounded border p-3">
            <div
              className={`transition-transform motion-safe:duration-[250ms] motion-reduce:transition-none ${
                pinched ? '[transform:scaleX(0)]' : '[transform:scaleX(1)]'
              }`}
              data-flipped={flipped ? 'true' : 'false'}
            >
              <div className="min-h-[4rem]">
                <MarkdownInline markdown={displayFace === 'back' ? currentCard.back : currentCard.front} />
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {!flipped ? (
              <button
                ref={flipButtonRef}
                type="button"
                onClick={flip}
                className="rounded bg-blue-600 px-3 py-1 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Flip
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => grade('again')}
                  className="rounded bg-red-600 px-3 py-1 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  Again
                </button>
                <button
                  type="button"
                  onClick={() => grade('good')}
                  className="rounded bg-green-600 px-3 py-1 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                >
                  Good
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <p role="status" aria-live="polite" className="mt-3 text-sm font-medium text-green-700">
        {announcement}
      </p>
    </section>
  );
}
