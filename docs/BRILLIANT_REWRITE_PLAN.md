# The Brilliant rewrite: from lesson library to screen sequence

Status: **approved, in progress**. This document is the plan that was approved
before implementation began. It is kept in-repo as the record of what was
decided and why — update it if a later phase materially changes the design,
but do not rewrite history in it.

## Why

LearnLab currently works as a lesson **library**: Markdown prose is the
backbone, widgets are embedded decorations inside it. The target is the
opposite architecture — a Brilliant.org-style **interactive experience**,
where an ordered sequence of gated interactive screens *is* the lesson, and
prose is short framing around each screen, never the backbone. Concretely
(see the originating request for the full target spec):

1. The screen is the atomic unit, not the document.
2. You cannot advance without doing something — gating is structural, not a
   convention authors remember to follow.
3. Prediction-before-reveal is the default screen type for new concepts.
4. Interaction first, formalism second.
5. Wrong answers branch to hints, they don't just mark wrong.
6. Scaffolding fades across a lesson's screen sequence.
7. Tight, single-column, mobile-first, immediate feedback, per-screen
   celebration.
8. Still evidence-based: retrieval over recognition, generation over passive
   recognition, misconception-targeted wrong answers, cumulative/spaced
   retrieval.

This is a genuine `src/`-level engine change (governed by the
`learnlab-extend-platform` skill), not a content-authoring task.

## Grounding

Before designing, the following was read in full: the `learnlab-extend-platform`
and `learnlab-lesson-pedagogy` skills; `docs/ARCHITECTURE.md` and
`SRS-LearnLab.md`; the current rendering/progression pipeline
(`MarkdownLesson.tsx`, `LessonPage.tsx`, `widgets/registry.ts`,
`QuizEngine.tsx`, `progress/srs.ts`, `progress/engagement.ts`). Three research
passes additionally covered: the other three content skills
(`learnlab-author-content`, `learnlab-adapt-resource`,
`learnlab-research-content`) in full; real usage statistics across all 67
shipped modules / 209 lessons; and the remaining engine internals
(`progress/db.ts`, `quiz/types.ts` + `marking.ts`, the `step-reveal` /
`flashcards` / `matching-pairs` / `game-kit` precedents, `LessonContext`, the
Python item protocol, and `build-content.mjs`'s validation pipeline).

Key facts that shaped the design:

- The platform **already has** spaced retrieval (`progress/srs.ts`, the
  `reviewState` Dexie table, `ReviewPage`) and a full engagement/celebration
  layer (`progress/engagement.ts`: points, streaks, achievements). The
  extend-platform capability backlog's item 1 is done. The new engine must
  **wire into these**, not rebuild them.
- Widget usage across the library: `code-runner` (76 uses), `function-grapher`
  (67), `quiz` (41), `data-plot` (34), `step-reveal` (20), `flashcards` (14),
  `matching-pairs` (2). `figure`, `vector-field`, `circuit-sim`, `truth-table`
  are effectively unused.
- Only 13 of 67 modules use a Python item (`::py`), one each — low priority
  for this rewrite.
- Typical lesson: ~500–850 words, 0–1 widgets, 1–2 `:::reveal`, 1–2
  `:::callout`.
- `LessonContext` already gives any widget `recordAttempt`,
  `getItemState`/`setItemState`, `recordReview`, `seedReviewItem`,
  `notifyEngagement` — exactly the primitives a screen needs to report
  progress without a new host API.

## Decisions made with the user before building

- **Session scope:** convert **one** flagship module
  (`maths/alevel-pure/differentiation-1`, 3 lessons, single widget type, the
  cleanest sample surveyed) as the only content migrated this session. The
  other 66 modules are explicitly **not** touched now.
- **Old format fate:** **planned deprecation**. The Markdown+directive format
  is labelled legacy in the rewritten skills; new authoring defaults to
  screens; a migration deadline for the rest of the library is recorded as a
  roadmap item, not scheduled or executed in this session.

## Key design decisions

1. **Screens are JSON, not Markdown.** A screen-sequence lesson is
   `NN-slug.screens.json` (a new `Lesson.kind: "screens"` value alongside the
   existing `"markdown"`/`"python"`). Each screen is a typed object; short
   framing prose lives in string fields (`prompt`, `explanation`, …) rendered
   through the *existing* Markdown-minus-directives renderer (the same one
   `learnsdk.Markdown` already uses for Python items), so KaTeX/GFM keep
   working with zero new prose parser.

2. **Screen types fold the widget/quiz/game vocabulary in — they don't
   duplicate it.** A new `src/screens/` subsystem, import-isolated exactly
   like `content/widgets/quiz/python/progress` are today:

   | Screen type | What it generalizes | Reuses |
   |---|---|---|
   | `predict` | Brilliant's signature move — commit a guess, then reveal the mechanism | new; the default type for introducing a concept |
   | `tap-choice` / `entry` | full-screen mcq/multi vs numeric/text | `src/quiz/marking.ts` verbatim |
   | `manipulable-target` | a bare explorable widget with a goal to hit | existing widgets (`function-grapher` first), wrapped with a per-widget goal-checker |
   | `faded-step` | one blanked step of a worked example | `step-reveal` + the faded-worked-example backlog item |
   | `sort-match` | drag/tap matching | `matching-pairs` + `GameShell` chrome |
   | `flash-recall` | flip/self-grade recall | `flashcards`' loop |

   Every `ScreenDef` in the registry **structurally** implements a
   `respond()`/`canAdvance` contract in TypeScript — there is no way to
   register a screen type that renders prose and a bare Next button. Gating is
   enforced by the type system, not by author discipline.

3. **Progression engine** (`ScreenSequenceEngine.tsx`): one screen at a time,
   single column, mobile-first. Next is disabled until the current screen
   reports completion. Wrong answers on a gated screen route to an authored
   hint ladder (`hints: string[]`, nudge → subgoal → setup, never the answer)
   instead of a bare X. Each screen completion fires
   `notifyEngagement({kind:'screen-complete'})` — a small additive event so
   the existing celebration/points/streak layer reacts per screen, not just
   per lesson. `LessonProgress` gains two additive fields (`screensDone`,
   `screensTotal`) for the in-lesson progress sense and resume.

4. **Fading is authored data, not a mechanical constraint.** Backward fading
   across a lesson's screens is a content-quality property the rewritten
   `learnlab-lesson-pedagogy` skill enforces through structure (early screens
   = full worked examples/heavy scaffold, later screens = faded/none), the
   same way today's MVC bar mixes CI-enforced and SHOULD-level rules. The
   engine cannot verify pedagogical fading automatically.

5. **Compatibility, not cutover.** `Lesson.kind` becomes a three-way
   discriminant (`"markdown" | "python" | "screens"`); `LessonPage` branches
   to `ScreenSequenceEngine` only for `"screens"`. Old lessons stay
   byte-for-byte untouched, still using `MarkdownLesson` and the
   scroll-sentinel completion. This *is* the feature flag — content-level
   opt-in per lesson, no global toggle — matching the existing "content is
   data" invariant (C-5): the one-time `src/` change buys authoring the new
   format at zero further `src/` cost, exactly like the widget registry does
   today.

6. **Python items stay out of scope for this rewrite.** Only 13/67 modules use
   `::py`; folding `learnsdk` items into screens is genuinely new engine
   surface with its own trust-boundary questions (C-6). Recorded as roadmap.
   `kind:"python"` full-page lessons are untouched.

7. **Migration tooling is a draft assistant, not a converter.** A
   `scripts/migrate-lesson-to-screens.mjs` mechanically lifts what's
   mechanical (splits prose on headings into framing candidates, lifts
   existing quiz-question JSON straight into `tap-choice`/`entry` screens via
   the same marking semantics, lifts widget directive props into
   `manipulable-target` shells) and **flags** everything that needs real
   pedagogical judgment — where to put a prediction hook, what the goal
   condition is, what the hint ladder says — rather than guessing. A bad
   auto-conversion would violate the exact rules (prediction-before-reveal,
   misconception-targeted wrong answers) that motivate the rewrite, so this is
   explicitly not a one-shot content generator.

## Phasing

Every phase ends in a shippable state, validated with
`npm run validate -- --strict`, `npm test`, and `npm run build` before moving
to the next.

### Phase 1 — Data model + engine skeleton + first lesson renders

- `schemas/screen-sequence.schema.json`; add `"screens"` to `Lesson.kind` in
  `schemas/module.schema.json`.
- `src/screens/types.ts` (discriminated `Screen` union: `predict`,
  `tap-choice`, `entry`, `manipulable-target` to start), `registry.ts`
  (mirrors `widgets/registry.ts`), `ScreenSequenceEngine.tsx`.
- `build-content.mjs`: parse/validate `.screens.json`; enforce that every
  screen object carries the fields its type needs to gate.
- `LessonPage.tsx`: branch on `kind:"screens"`.
- Hand-convert `differentiation-1/01-gradients.md` into the first real
  `.screens.json` — proves prediction-before-reveal, interaction-first, and
  gated advancement on one real lesson.
- **Exit criterion:** that lesson renders and progresses correctly in
  `npm run dev`; existing tests + `validate --strict` stay green; zero
  regressions to any old-format lesson.

### Phase 2 — Remaining screen types + hint ladders + per-screen engagement

- Add `faded-step`, `sort-match`, `flash-recall`, plus a `reveal-mechanism`
  screen with a mandatory self-explanation prompt (never a passive reveal).
- Hint-ladder data + UI.
- Wire `screen-complete` into `engagement.ts`/the celebration bus; additive
  Dexie v4 fields for `screensDone`/`screensTotal`.
- Finish converting `differentiation-1`'s remaining two lessons; confirm its
  `assessment.json` is still reachable at the end of the sequence.
- **Exit criterion:** the full 3-lesson `differentiation-1` module is a
  complete, gated, hint-laddered, fading-visible screen experience end to
  end; module completion/assessment/progress bar all still work.

### Phase 3 — Rewrite the four content skills + docs, deprecate the old format

- Rewrite `learnlab-author-content` (the biggest lift) to teach screen
  authoring as the default mechanics, with the old format kept as a
  clearly-labelled legacy section plus a recorded roadmap item for an
  eventual migration deadline. Update `scripts/new-module.mjs`'s scaffolder to
  generate a `.screens.json` starter by default.
- Rewrite `learnlab-lesson-pedagogy` so its skeleton (hook → beats →
  centerpiece → worked-example pair → close) is expressed as a screen
  sequence, with fading made structural.
- Update `learnlab-adapt-resource`'s conversion table and MVC-bar section to
  target screens; light touch-ups to `learnlab-research-content` (already
  format-agnostic).
- New `docs/SCREENS.md` (mirrors `docs/WIDGETS.md`'s per-key contract
  pattern, CI-enforced the same way); update `docs/AUTHORING.md` and
  `docs/ARCHITECTURE.md`.
- **Exit criterion:** all four skills and docs describe screens as primary;
  the new screens registry has doc-coverage CI checking like widgets do; full
  `validate --strict` + test suite green.

### Explicitly out of scope this session (recorded as roadmap)

- Converting any module beyond `differentiation-1`.
- Folding Python/`learnsdk` items into screens.
- A hard migration deadline for the other 66 modules.

## Critical files

- **New:** `src/screens/*` (types, registry, `ScreenSequenceEngine.tsx`, one
  component per screen type), `schemas/screen-sequence.schema.json`,
  `docs/SCREENS.md`, `scripts/migrate-lesson-to-screens.mjs`,
  `public/content/maths/alevel-pure/differentiation-1/0{1,2,3}-*.screens.json`.
- **Modified:** `schemas/module.schema.json`, `src/content/types.ts`
  (`LessonMeta.kind`), `src/app/pages/LessonPage.tsx`,
  `scripts/build-content.mjs`,
  `src/progress/{engagement-types,engagement,db}.ts` (additive only),
  the four `.claude/skills/learnlab-*/SKILL.md` files,
  `docs/{AUTHORING,ARCHITECTURE}.md`.
- **Reused as-is, no duplication:** `src/quiz/marking.ts`,
  `src/widgets/game-kit/GameShell.tsx`, `src/content/lesson-context.ts`,
  `src/progress/srs.ts`, the Markdown-minus-directives inline renderer.

## Risks and invariants preserved

- **C-5 (content requires zero `src/` changes)** is preserved going forward,
  not violated: adding the screens *capability* is a one-time platform
  extension (governed by `learnlab-extend-platform`), exactly like adding the
  widget registry was; authoring new screen-sequence lessons afterward costs
  zero further `src/` changes.
- **Closed-sets discipline** extends to screen types: like directives,
  widgets, and question types, screen types become a fourth closed vocabulary
  with the same registry + docs + CI string-match enforcement.
- **`--strict` validation** gets a screens-format MVC equivalent (structural
  gating is enforced by TypeScript; content-quality rules like "≥1 prediction
  screen per lesson" are enforced the same way today's SHOULD-level rules
  are — by the pedagogy skill, not by CI).
- **Dual-format cognitive load** is a real cost — mitigated by a clear "new
  content defaults to screens" rule in the rewritten skills, and by not
  touching any of the other 66 modules.
- **Existing e2e assumptions** (scroll-sentinel completion) still hold for
  every old-format lesson; new Playwright coverage is added for
  screen-gated completion rather than replacing the old suite.
- **Bundle size**: screen-type components are lazy-loaded per the existing
  per-widget lazy-chunk budget (NFR-PERF-001).
- **UI investment is real**: single-column mobile-first layout needs actual
  `npm run dev` visual verification at each phase, not just unit tests.
