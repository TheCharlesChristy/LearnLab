---
name: learnlab-adapt-resource
description: Decompose and adapt an existing external resource (a textbook chapter, PDF syllabus, lecture notes, video transcript, or another course's material) into LearnLab's course/module/lesson content structure. Use when the user hands you a source document or asks you to "convert," "adapt," "port," or "turn this chapter/syllabus into lessons/modules" rather than write content from a blank page. Covers finding the source's real topic boundaries, remapping them onto LearnLab's granularity, deriving an honest prerequisite graph, and rewriting (never copying) into the platform's own voice — including the copyright line you must not cross.
---

# Adapting an external resource into LearnLab content

This skill is the **decomposition and mapping** step: turning a source resource into a plan
— course/module/lesson boundaries, a prerequisite graph, and drafted content in LearnLab's own
voice — that is ready to author. It does not cover the mechanical authoring steps (scaffolding
with `npm run new:module`, directive syntax, JSON schemas, the PR/validate loop): once your
content is mapped and drafted, hand off to the **`learnlab-author-content`** skill for that.
For everything about how the rewritten lessons should *teach* (hooks, checkpoints, worked-example
fading, narrative rules, level calibration), the **`learnlab-lesson-pedagogy`** skill is the
authority — read it before drafting in Step 4. For verifying any fact, formula, or numeric answer
you carry over from the source, hand off to the **`learnlab-research-content`** skill — do not
trust the source's own correctness.

Do all of this with a **fresh read of the source in hand**, never from a summary someone else
gave you. Sources vary wildly in structure (a textbook chapter, a PDF exam syllabus, raw lecture
notes, a video transcript, another platform's course export) — the workflow below is the same
regardless of format.

## Step 1 — Read the whole source before chunking anything

Read (or skim end-to-end, then re-read closely) the *entire* resource before you map a single
lesson boundary. On this first pass you are hunting for two things, not writing anything down
as "module 1, module 2…" yet:

1. **Natural topic boundaries** — where does the source itself change subject? These rarely
   line up with LearnLab's required granularity (see Step 2) — a source's "Chapter 7" might be
   one LearnLab lesson, or it might need to become an entire module.
2. **Internal dependency structure** — as you read, note every place the source says or implies
   "as we saw in section X" or silently reuses a technique introduced earlier. This is the raw
   material for Step 3's prerequisite graph. A source's chapter *order* is not its dependency
   *structure* — a textbook is a linear sequence, but the real prerequisite graph underneath it
   is usually much sparser (see Step 3).

Only after this full pass should you start sketching a course/module/lesson breakdown. Chunking
on a first pass produces boundaries that fight the source's own logic and that you'll have to
redo once you understand the whole shape.

## Step 2 — Map the source onto LearnLab's real granularity

LearnLab's granularity is not a guess — it's empirically consistent across the 60+ modules
already shipped (surveyed directly from every `module.json` under `public/content/`):

- **A module is overwhelmingly 3 lessons.** A handful run to 4 (e.g. `proof`, `indices-and-surds`,
  `differentiation-2`, `data-representation`, `sampling-and-data`) when the topic genuinely splits
  into four coherent chunks — 4 is the practical ceiling; none run to 5+. Below §8.6's floor of 3,
  a module fails CI outright.
- **Each lesson runs 15–45 minutes**, with the bulk clustering at 20–35 (`estMinutes` on the
  `Lesson` object, SRS §4.4). Real examples: `differentiation-1` is 3 lessons at 20/30/25 min;
  `waves-and-optics` is 3 lessons at 40/35/30 min; `data-structures` is 3 lessons at 35/40/35 min.
- **A module totals roughly 75–130 minutes** (`estMinutes` on the module itself is the sum of its
  lessons — e.g. `differentiation-1` totals 75, `electricity-dc` totals 130).
- **A course is an ordered list of modules** covering a subject at one level (SRS §4.1, §4.3) —
  e.g. `alevel-pure` has 16 modules, `alevel-physics` has 11.

**Your source's own boundaries will rarely land on these numbers.** Treat its chapters/sections
as raw material to be recombined, not as a template to copy:

- *Splitting*: a single dense textbook chapter that covers, say, both "wave properties and the
  wave equation" *and* "standing waves and resonance" *and* "two-source interference" is too much
  for one 20–35 minute lesson — and probably too much for one 3-lesson module. LearnLab's own
  `waves-and-optics` module solves exactly this by giving wave basics + standing waves one lesson,
  interference + diffraction gratings a second lesson, and refraction + TIR a third — three
  roughly-even 30–40 minute chunks carved out of what a physics textbook usually treats as one
  long chapter with many subsections.
- *Recombining*: conversely, if a source has eight short "section 4.1, 4.2, 4.3…" subsections that
  are each only a paragraph or two (e.g. a syllabus that lists granular bullet points rather than
  a textbook's prose chapters), don't make eight lessons — group cognate bullets into 3–4 lessons
  each big enough to justify 20+ minutes of real teaching (worked examples, an interactive item, a
  reveal), matching the pattern above.
- *Whole chapters becoming whole modules*: if a source chapter is genuinely the size of a full
  A-level topic (e.g. a "Differentiation" chapter covering first principles through the chain
  rule), don't force it into one module — LearnLab itself splits this into `differentiation-1`
  (gradients, first principles, power rule) and `differentiation-2` (chain/product/quotient
  rules, standard derivatives, curve sketching) as two separate, separately-prerequisited modules.

As a rule of thumb: read a stretch of source material and ask "could I teach this in 20–35
focused minutes, with one worked example and room for one interactive check?" If yes, it's
roughly one lesson's worth. If it's clearly 3+ of those in sequence with a coherent throughline,
it's a module. If it's several such modules' worth spanning a whole subject, it's a course.

While you're mapping, also **fix the source's audience level**: decide which of
learnlab-lesson-pedagogy's level-dial settings (GCSE / A-level / adult-facing) the adapted
content targets. A university textbook adapted down to GCSE and the same textbook adapted to an
adult professional course produce very different rewrites of identical source material — pin
the dial in the plan, before any drafting, so every lesson in the module holds it consistently.

## Step 3 — Derive prerequisites from the source's real dependencies, not its table of contents

A source resource is usually linear (chapter 1, then 2, then 3…), and it is tempting to copy
that order straight into `prerequisites: [...]`. **Don't.** SRS §4.4 defines `prerequisites` as
the specific module ids a module's content actually *uses*, not "everything that came before it
in the book" — and per FR-CONT-008 prerequisites are advisory (they warn, never lock), so an
inflated or dishonest chain misleads learners about what they truly need to know first, with no
gate to catch the mistake.

Do the same thing LearnLab's own content-planning did when building genuine cross-topic chains
(`docs/BUILD_PLAN.md`, Phase P2): trace, concept by concept, what a section of the source
*actually calls on*, and declare only that. The concrete real example, verifiable in the shipped
content: `differentiation-2`'s `module.json` declares
`"prerequisites": ["differentiation-1", "trigonometry-1", "trigonometry-2", "exponentials-and-logarithms"]`
— not the entire `alevel-pure` module sequence that precedes it in the course's linear ordering.
It needs `differentiation-1` (the power rule it extends), `trigonometry-1`/`trigonometry-2` (because
it differentiates $\sin x$, $\cos x$, $\tan x$), and `exponentials-and-logarithms` (because it
differentiates $e^x$ and $\ln x$) — but it does *not* list `proof`, `indices-and-surds`,
`coordinate-geometry`, `sequences-and-series`, or `binomial-expansion`, even though all five
appear earlier in the same textbook-like course sequence, because differentiation-2's content
never actually uses them. BUILD_PLAN.md's Phase P5 write-up shows the same discipline the other
direction: `trigonometry-basics` was *listed* last in the source ordering, but the plan explicitly
notes it "has no real dependency on the other three [foundation modules] — SOHCAHTOA and
right-angled triangles stand alone," and only follows the listed order because there was no
reason to break it, not because of a hidden dependency.

When you map a source chapter's cross-references (from Step 1) onto LearnLab module ids, ask
for each one: "does this new lesson *use* a technique from that earlier chunk, or does it merely
come after it on the page?" Only the former earns a `prerequisites` entry. This also lets you
catch genuine cross-course dependencies the source might not surface at all — e.g. a mechanics
topic that secretly needs a pure-maths integration technique the source assumed as background
(compare `variable-acceleration`'s real, declared forward-reference to `alevel-pure`'s
`integration-1` in BUILD_PLAN.md's Phase P2 notes) — these are easy to miss if you just mirror
the source's own chapter order.

An honest prerequisite graph pays a second dividend: learnlab-lesson-pedagogy requires each
module assessment to include at least one cumulative review question drawing on a *declared*
prerequisite. The dependency tracing you do here is exactly what identifies which earlier
technique that review question should exercise.

## Step 4 — Rewrite in LearnLab's voice; never paste the source

Read a shipped screen-sequence lesson closely before drafting your own — e.g.
`public/content/maths/alevel-pure/differentiation-1/01-gradients.screens.json` and its two
sibling lessons in the same module. It shows the house style translated into screens: a `predict`
screen opening each lesson, short framing text (1-4 sentences) inside each screen's `prompt`/`body`
rather than paragraphs of prose, a `manipulable-target` centerpiece placed right after the idea it
illustrates, and a `reveal-mechanism` + `faded-step` worked-example pair — never a single
monolithic transcription of the source's derivation.

**The pedagogy of the rewrite is governed by `learnlab-lesson-pedagogy` — read it now, before
drafting.** In particular, a source rewrite must apply, not just the house shape above, but that
skill's full design rules, now expressed as screens: a hook that's a `predict` screen ending in a
committed prediction (the four approved patterns; never the source's "this chapter covers…"
register), short per-screen framing with a checkpoint built into every screen (not a separate
step), at least half the screens demanding generation (`entry`/`faded-step`/`manipulable-target`)
rather than recognition (`predict`/`tap-choice`), the worked example rebuilt as a
`reveal-mechanism` + `faded-step` pair, the `manipulable-target` centerpiece in the middle third,
and the close resolving the opening prediction. Its final self-check applies to every adapted
lesson exactly as it does to lessons written from scratch. The dash rule (no em/en-dashes anywhere
in user-facing text, including every screen field) lives in **`learnlab-author-content`** and
applies here too.

**Convert the source's static elements into LearnLab's screen types** (full catalogue, field
reference, and examples in `docs/SCREENS.md`) instead of describing them in prose or embedding a
scanned image:

| Source element | LearnLab target |
|---|---|
| A static graph/plot image | A `manipulable-target` screen wrapping `function-grapher` (for `y=f(x)` shapes), with a real `goal` to hit — not a bare plot |
| A chapter-opening "preview question" or objectives box | A `predict` screen the learner commits to before teaching — the strongest possible conversion, since attempting-before-instruction measurably improves retention |
| A worked-example box / "solution" panel | A `reveal-mechanism` screen (full example, mandatory self-explanation) **plus** a `faded-step` companion with new numbers — never a single monolithic transcription |
| A "try these practice problems" section | A `tap-choice`/`entry` screen per problem worth gating on, or questions in `assessment.json` for end-of-module practice — with **your own** new questions; see Step 5 |
| A chapter-opening anecdote, "did you know" box, historical aside, or fun-fact margin note | Apply learnlab-lesson-pedagogy's deletion test: keep only if load-bearing (it introduces the problem, carries the concept, or threads the sequence); otherwise **delete it** — do not port it out of loyalty to the source |
| End-of-chapter review questions and mark schemes | Never copy them — but **mine them for misconception patterns** (what wrong answers do they anticipate?) to build your own `tap-choice`/`mcq` distractors; see learnlab-research-content's misconception section |
| A multi-step derivation the source shows all at once | A `faded-step` screen if the last step should be a checkpoint, or a `reveal-mechanism` screen if it should open in full with a self-explanation prompt |
| A key-terms glossary / vocabulary list | A `flash-recall` screen per term (attempt-then-reveal), or the legacy `flashcards` widget for a large deck |
| A term/definition matching exercise, or any paired-concepts list (term↔meaning, cause↔effect, symbol↔name) | A `sort-match` screen — see `docs/SCREENS.md` |
| A circuit diagram (logic/boolean topics), or "try running this calculation yourself" | Not yet wrapped by a screen type — stays in a legacy Markdown lesson via `::widget{type="logic-gate-sim"...}` / `::widget{type="code-runner"...}` (`docs/WIDGETS.md`) until a later phase extends `manipulable-target`-style wrapping to more widgets |
| A genuinely static diagram/photo with no data to plot | The legacy `figure` widget, in a Markdown lesson (note: a `figure` alone does **not** satisfy the MVC interactive-item requirement — see Step 5, and a screens-format lesson satisfies it automatically) |

**A warning specific to adapting sources: textbooks are seductive-detail factories.** The
margin boxes, historical vignettes, and "in the real world" asides that make a printed chapter
feel lively are precisely the interesting-but-irrelevant material shown to *reduce* retention
and transfer when carried into a lesson. When adapting, the pull to keep them is strong — they
feel like free engagement. Resist it: run the deletion test on every one, and remember that the
correct LearnLab replacement for a fun-but-idle aside is not a fun-but-idle aside in a callout;
it is either nothing, or a load-bearing hook built from the same real-world material.

**Voice — LearnLab teaches through play, not just correct transcription.** A
source textbook is usually written in a flat, formal register; don't carry
that register over by default. Rewriting in your own words (required below,
for copyright reasons too) is also your chance to write like you're
explaining the idea to someone, not grading them, and to notice where the
source describes something static that could become one of the interactive
widgets in the table above instead. Calibrate the playfulness to the level
dial fixed in Step 2 — a GCSE rewrite and an adult-facing rewrite of the same
chapter should read very differently. None of this loosens the copyright or
verification rules that follow; a playful voice on a wrong or plagiarised
fact is still a bug.

**Copyright — read this before drafting.** Adapting a source's *structure and pedagogical
approach* (how it sequences ideas, which examples it emphasises, the shape of its explanations)
is fine. Reproducing its *actual prose or exercises verbatim* — copied sentences, copied specific
numeric worked examples, copied specific quiz questions — is a real licensing/copyright problem,
not just a style concern. Concretely:

- Always **substantively rewrite** explanations in your own words and your own sentence
  structure. If you catch yourself typing something close to a sentence from the source, stop
  and re-explain the underlying idea from scratch instead.
- Always **construct new worked examples and new assessment questions** with your own numbers.
  Do not lift the source's specific figures (e.g. its exact "$a$ = 0.25 mm, $D$ = 2.4 m" slit
  experiment) — pick your own values, re-derive the answer yourself, and verify it (Step 6).
- This applies even to a source you believe is "just a syllabus" — an exam-board specification's
  own worked mark-scheme examples are still someone else's copyrighted text.
- If in doubt, the test is: could a diff between your lesson and the source read as a copy with
  light edits? If yes, rewrite further.

## Step 5 — Hit the MVC bar; a source's gaps are not an exemption

Every module you produce from adapted content is held to exactly the same Minimum Viable Content
bar as hand-authored content (SRS §8.6, checklist in `docs/AUTHORING.md` §6) — the fact that your
source was a static PDF with no interactivity is not a reason to skip the interactive requirement:

- ◆ ≥ 3 lessons (per Step 2's real granularity — usually exactly 3, occasionally 4).
- ◆ ≥ 1 interactive item per module beyond `figure` — automatically satisfied if any lesson is
  screens-format (every screen gates on a real interaction by construction). If you're adapting
  into the legacy Markdown format for some reason, you must still *design* one explicitly: e.g. a
  static graph becomes a `function-grapher` with a draggable tangent, a "try it yourself" aside
  becomes a `code-runner`.
- ◆ `assessment.json` with ≥ 8 questions spanning ≥ 2 of the four question types (`mcq`, `multi`,
  `numeric`, `text`) — built from *your own* newly-constructed questions (Step 4's copyright
  point applies here too), each with an `explanation`.
- ◆ Declared `prerequisites` (Step 3) and `objectives` (2–6 learner-facing outcomes derived from
  what the source actually teaches).
- ◆ `estMinutes` set on the module and on every lesson.

And the **house bar on top of CI**: adapted modules must also pass learnlab-lesson-pedagogy's
final self-check (prediction hook, checkpoint format mix and placement, faded worked-example
pair, misconception distractors, cumulative review question). A source's flat structure is not
an exemption from any of it — the whole point of adapting rather than mirroring is to end up
with a lesson that teaches better than the source did.

Once your mapping, drafts, and widget/assessment choices are settled, switch to the
**`learnlab-author-content`** skill for the actual mechanics — scaffolding via `npm run new:module`,
directive syntax details, JSON schema shapes, and the PR workflow. Don't duplicate that mechanical
knowledge here; this skill's job ends where drafted, mapped content begins being formally authored.

## Step 6 — Validate, and verify the source's own facts

Run the same build/validation loop any content change requires:

```sh
npm run validate -- --strict
```

Fix everything it reports (schema violations, dangling `prerequisites`, missing `Lesson.file`/
`assessment.file`/`::py src` targets, unknown widget types, nested-container errors, and the MVC
◆ checks from Step 5).

Critically, **do not trust the source's own numbers, formulas, or claims uncritically** — a
textbook, syllabus, or transcript can itself contain errors, outdated conventions, or regional
variations (e.g. exam-board-specific notation) that shouldn't be carried into LearnLab silently.
Apply the same independent-verification discipline the **`learnlab-research-content`** skill
describes to every fact, formula, and worked-example answer you adapt from the source — re-derive
it yourself rather than assuming the source got it right, exactly as LearnLab's own content build
independently re-derived every assessment answer against the source specifications rather than
trusting a first draft (BUILD_PLAN.md's Phase P2/P3 verification notes: 100% independent
re-derivation for computation-heavy subjects, ≥2-3-of-N spot checks for definitional ones — the
same split applies to spot-checking versus fully re-deriving an adapted source's numbers,
weighted toward whichever parts of your source are numeric/formula-driven rather than purely
definitional).
