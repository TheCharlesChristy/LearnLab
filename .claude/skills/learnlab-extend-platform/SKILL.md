---
name: learnlab-extend-platform
description: Extend the LearnLab engine itself — new widgets, new screen types, new question types, new game mechanics, spaced-repetition scheduling, hint systems, or any src/-level capability. Use whenever a task requires changing src/** rather than public/content/**, whenever a content-authoring task hits the "four closed sets" wall (a widget/screen-type/directive/question type that doesn't exist yet), or whenever the user asks "what should we build next", "improve the platform", "add a widget", or anything about roadmap/engine features. Contains the evidence-ranked capability backlog and the registration/documentation procedure every extension must follow.
---

# Extending the LearnLab platform

This skill is the `src/`-side counterpart to the content skills. The content skills
(learnlab-author-content, learnlab-lesson-pedagogy, learnlab-adapt-resource,
learnlab-research-content) operate strictly inside four closed vocabularies — the
screen-type registry (`docs/BRILLIANT_REWRITE_PLAN.md`, the primary format), 4 legacy
directives, 4 question types, the widget registry — and are instructed to *stop* when a
task needs a ninth screen type, a fifth directive, a fifth question type, or an
unregistered widget. This skill is where those stopped tasks land. The reverse boundary
also holds: platform work never edits `public/content/**` except to add a demonstration
module for a new capability, and a diff that mixes engine and content changes is a
scoping error (invariant C-5).

## The extension procedure — every new capability follows it

Read `docs/ARCHITECTURE.md` and the relevant SRS sections before touching anything;
this section lists the invariants known to be CI-enforced or documented, not a
substitute for the architecture doc.

**Adding a widget:**
1. Register the key in `src/widgets/keys.json` (flat JSON array, lowercase kebab-case).
2. Add the matching `` ## `<key>` `` section to `docs/WIDGETS.md` — this pairing is
   CI-enforced (FR-WID-002), and that section *is* the prop contract content authors
   read. Include a "Validation behaviour" subsection: every prop arrives at
   `parseProps` as a verbatim string (D-004), and your `parseProps` owns all coercion
   and produces the inline error card for bad input — prop errors never fail the
   build, so the documented error strings are the only guardrail authors get.
3. If it's a game (score/shuffle/completion mechanics), build on `src/widgets/game-kit/`
   per the "Building a new game widget" section of `docs/ARCHITECTURE.md` — the shared
   chrome/shuffle/persistence pattern exists so a new game doesn't reinvent it, and the
   engine's celebration layer hooks into game completion automatically.
4. Ship with at least one real usage in a demonstration lesson, validated with
   `--strict` and actually rendered in `npm run dev`.

**Adding a screen type** (`docs/BRILLIANT_REWRITE_PLAN.md`, `docs/SCREENS.md`) — the primary-format
counterpart to adding a widget, full runbook in `docs/ARCHITECTURE.md` §4a:
1. Add the shape to `schemas/screen-sequence.schema.json`'s `$defs.screen.oneOf` — this is the
   entire closed-set enforcement (unlike widgets, a screen's `type` is Ajv-discriminated directly,
   no separate keys file).
2. Create `src/screens/<Name>Screen.tsx` implementing `ScreenRunnerProps<YourType>`
   (`src/screens/screen-def.ts`), rendered inside `ScreenShell` for the shared chrome. **The
   non-negotiable invariant**: `ScreenShell`'s `canAdvance` prop must come from real interaction
   state the component computes itself — there is no default that lets a screen advance without
   one, and a screen type that violates this (prose + a bare enabled Continue) defeats the entire
   point of the rewrite (target spec #2).
3. Register in `src/screens/registry.ts`, add to the union in `src/screens/types.ts`, and add the
   type string to `SCREEN_TYPES` in `scripts/build-content.mjs`.
4. Add the matching `` ## `<type>` `` section to `docs/SCREENS.md` — CI-enforced the same way as
   widget docs.
5. Ship with at least one real usage in a demonstration lesson, validated with `--strict` and
   actually driven end to end (not just rendered) in a production build — Ajv's schema-codegen
   dev-mode revalidation path can collide with this app's CSP in some sandboxed environments;
   `vite preview` against a production build sidesteps it if `npm run dev` shows a
   "Refused to evaluate a string as JavaScript" error unrelated to your change.

**Adding or changing a question type** touches `schemas/quiz.schema.json`, the marking
engine, and the feedback UI together — never the schema alone. Marking semantics must
be documented as precisely as the existing four (the content skills quote exact rules
like "text answers full-match an ECMAScript regex"; a new type needs an equally exact
sentence). `tap-choice`/`entry` screens already reuse this marking verbatim
(`src/screens/marking-helpers.ts`), so a new question type should extend both surfaces together if
it makes sense as a screen too.

**The documentation-and-skills obligation.** A capability content agents don't know
about doesn't exist. Every shipped extension must update, in the same change: the
relevant `docs/` reference, and the content skills that gate on the closed sets —
minimally the registry snapshot and any "current live set" language in
learnlab-author-content, plus a usage rule in learnlab-lesson-pedagogy if the
capability has a pedagogical placement rule (they all should; see the backlog entries'
"On shipping" notes).

## How to choose what to build: measured learning, then cost

The backlog below is ranked by expected learning impact against build cost, from the
learning-science evidence base (meta-analytic where available). Two principles govern
re-ranking as circumstances change:

- **Optimise delayed performance, not in-session comfort.** A feature's success metric
  is what learners can do on a later, spaced assessment — never completion rate or
  in-lesson success rate alone, which reward exactly the smoothness that undermines
  retention. Instrument accordingly (ship behind flags, compare on delayed quiz
  performance where the platform can measure it).
- **Respect the dependency arrows.** Item 6 (parameterised questions) multiplies items
  1 and 7; item 3's response data is what makes item 7's learner model trainable; item
  7 is the precondition for the adaptive half of item 4. Don't build 9 before 2–4 exist
  — an AI tutor bolted onto a platform without prediction, fading, or structured hints
  is expensive icing on a missing cake.

## The capability backlog, ranked

### 1. Cross-module spaced retrieval scheduling
**What:** a per-learner review queue that resurfaces previously-mastered items
(flashcards, assessment questions) at expanding intervals (e.g. 1 d / 3 d / 7 d / 21 d,
adjusted by recall success) across module boundaries, surfaced as short mixed "review
sessions". **Why:** distributed practice is a top-two technique in the entire learning
literature, and mixed-topic review adds the interleaving benefit for confusable
material; the platform currently has no mechanism at all for returning to content after
a module ends, which is where most forgetting happens. **Build notes:** needs a
per-user item-state store (last seen, interval, ease), a due-item selector, and a
review-session UI; reuse the existing flashcards and quiz renderers wholesale.
Intervals can be a fixed expanding ladder first — a tuned SM-2-style algorithm is a
later refinement, not a launch requirement. **On shipping:** learnlab-lesson-pedagogy
gains a rule that flashcard decks and assessment questions should be written to stand
alone out of lesson context (a review-session item arrives without the lesson around
it).

### 2. Prediction-commit mode on explorable widgets — DELIVERED, generalised
Shipped as the `predict` screen type sequenced immediately before a `manipulable-target` screen
(`docs/BRILLIANT_REWRITE_PLAN.md`), rather than as a prop on the widget itself — more general,
since the same `predict` screen also works standalone as a hook with no widget involved. Left below
for the historical rationale (still the correct citation for *why* predict-then-interact matters).
**What:** an optional `predict` prop on the explorables (function-grapher, circuit-sim,
vector-field, data-plot, logic-gate-sim, geometry-canvas): the widget renders a
question and choice chips (or a numeric field), locks interaction until the learner
commits, then unlocks and lets them test their prediction against reality. **Why:**
attempting before instruction (pretesting) beats even post-instruction retrieval
practice head-to-head and cuts mind-wandering; the pedagogy skill currently fakes this
with a separate inline quiz before the widget, which works but splits the commitment
from the payoff. Cheapest item on the list relative to impact — a UI interaction
pattern over existing widgets, no new learner model. **On shipping:** pedagogy skill's
prediction-hook and widget-task patterns switch from the quiz workaround to the native
prop.

### 3. Two-tier questions and confidence marking
**What:** (a) a `two-tier` question type: an answer tier plus a "because…" reason tier,
marked as a pair; (b) an optional confidence selector (sure / think so / guessing) on
existing question types, feeding feedback routing and analytics. **Why:** two-tier
items diagnose *why* a learner is wrong, not just that they are, which is what
misconception-targeted feedback needs; confidence data surfaces the dangerous
confidently-wrong state and trains calibration. This also starts the response-data
flywheel: which distractors actually get chosen (and with what confidence) is the
ground truth that improves distractor authoring and later feeds item 7. **Build
notes:** touches quiz schema + marking + feedback UI per the procedure above; feedback
for a wrong answer-tier should key off the chosen reason tier. **On shipping:**
pedagogy and research skills' misconception sections gain the two-tier pattern as the
preferred deep-diagnostic format.

### 4. Faded worked-example widget — DELIVERED, as a screen type
Shipped as the `faded-step` screen type (`docs/SCREENS.md`), paired with `reveal-mechanism` for the
full-example half. Left below for the historical rationale; note the "static `fadeDepth` prop"
launch-scope caveat still applies — per-learner adaptive depth is still item 7's territory.
**What:** a `faded-example` widget: an ordered list of solution steps where the last N
are input slots (numeric or short-text) the learner completes, each slot carrying its
own misconception-aware feedback, with an optional self-explanation prompt per revealed
step. **Why:** backward fading beats example-problem pairs on transfer in less time,
and self-explanation prompts extend the gain to far transfer; the pedagogy skill
currently assembles this from a reveal plus a separate one-question quiz, which caps
fading at one blanked step and separates the check from the example. **Build notes:**
data-file-driven like step-reveal (a natural starting point for the renderer); slot
marking reuses the numeric/text marking semantics verbatim. A static `fadeDepth` prop
is the launch version; per-learner adaptive depth arrives with item 7. **On shipping:**
pedagogy skill's worked-example section replaces the reveal+quiz workaround.

### 5. Equation-input and structured-answer question types
**What:** an `expression` question type marked by symbolic equivalence (so $2(x+3)$
matches $2x+6$), and structured STEM inputs where they earn their keep (vector
components; a guided free-body-diagram builder for mechanics). **Why:** generation
beats recognition by roughly a factor of two in retrieval benefit, and huge swathes of
maths and physics skill are exactly "produce the expression", which the current four
types can't ask for — `numeric` only checks the final evaluation and `text`-regex
marking of algebra is a false-negative machine. **Build notes:** the hard part is
marking; evaluate an embedded CAS (the platform already ships Python via code-runner,
so a Pyodide/SymPy check path may be nearly free) before writing a bespoke equivalence
checker. Scope tightly: polynomial/standard-function equivalence first, not a theorem
prover. **On shipping:** pedagogy skill's generation-format quotas start counting
`expression` items; author skill documents the marking semantics with the same
precision as the existing four.

### 6. Parameterised question generation
**What:** question templates with declared variable ranges and answer formulas, so one
authored template yields unlimited numeric variants per attempt. **Why:** a force
multiplier rather than a direct learning effect: it removes the item-reuse ceiling on
retrieval practice, makes item 1's spaced reviews inexhaustible, gives retries fresh
numbers instead of answer-memorisation, and later gives item 7 difficulty levers.
**Build notes:** the answer formula must be evaluated by the engine, which moves
answer-correctness from author-verified to engine-computed — the verification
discipline (D-020's lesson) then applies to the *template's formula*, so template
authoring needs its own hand-verification rule: instantiate and independently re-derive
at least three concrete variants, including range endpoints, before shipping a
template. Guard against degenerate draws (division by ~0, negative discriminants,
answers outside tolerance sanity). **On shipping:** research and author skills gain the
template-verification rule.

### 7. Adaptive difficulty and adaptive fading
**What:** a lightweight per-skill mastery model (Bayesian-knowledge-tracing-style)
driving (a) next-item selection between easier/harder variants and (b) per-learner fade
depth in item 4's widget. **Why:** intelligent-tutoring systems built on exactly this
loop approach human-tutoring effect sizes (d ≈ 0.76 vs 0.79) — the highest ceiling on
the list — and adaptive fading specifically beat fixed fading on delayed transfer.
**Build notes:** highest complexity here; stage it. A two-branch rule ("missed it →
easier variant + fuller example; aced it → harder variant + deeper fade") built on
items 4+6 captures much of the value with no formal learner model, and the model can
replace the rule once items 3/6 have generated response data. Depends on: 3, 4, 6.

### 8. Scaffolded subgoal hints — DELIVERED, as a screen field
Shipped as the `hints` array on `tap-choice`/`entry`/`faded-step`/`manipulable-target` screens
(`docs/SCREENS.md`) — revealed one rung at a time on repeated wrong attempts, never the answer.
Left below for the design rationale (bottom-out abuse and help avoidance still govern how any
future revision of this UI should behave).
**What:** an optional hint ladder on problems: hint 1 names the relevant principle,
hint 2 names the next subgoal, hint 3 sets up the step — and the ladder *never*
bottoms out in the answer; the learner always performs the final steps. **Why:**
just-in-time and on-demand hints show consistent moderate gains in tutoring-system
research, but the same literature documents the failure modes to design against:
bottom-out hint abuse (clicking through to the answer) and help avoidance (never
clicking at all) — hence no-answer ladders and unobtrusive, non-punitive hint UI.
**Build notes:** hint content is authored per-question (a `hints` array on question
objects); pairs naturally with items 4 and 5. **On shipping:** pedagogy skill gains
hint-authoring rules (principle → subgoal → setup, never the answer).

### 9. AI-tutor hint layer
**What:** a tightly-scoped Socratic assistant on problems: sees the question, the
learner's attempt, and the misconception metadata; responds within the item-8 ladder
discipline (never reveals the answer, never exceeds the next subgoal). **Why:**
potentially the closest approach to on-demand human tutoring, but the risks are
real — answer leakage, hallucinated maths, cost — and its value is far higher once
items 3–8 give it structure to operate in. Build late, evaluate hard (measured against
item 8's static ladders, not against nothing). Gate every response through the same
verification stance the content skills apply to authored numbers.

### 10. Social and relatedness features
**What:** lightweight, low-moderation-cost forms first: after a committed prediction,
show the anonymous aggregate ("61% of learners predicted further — most people's
intuition disagrees with the physics here"); cohort progress framing. **Why:**
relatedness is the one self-determination-theory lever the platform doesn't touch, but
full peer features carry moderation/safety cost and mixed learning evidence — hence
last, and aggregate-first. Avoid competitive leaderboards as a default: they demotivate
exactly the learners furthest behind.

## Engagement mechanics: guardrails on the existing layer

The engine's celebration layer (streaks, points, animated feedback, completion moments)
is worth keeping — but the motivation literature is specific about how reward systems
backfire, and these constraints apply to any change touching it:

- **Tie rewards to mastery, never to bare activity.** Rewards for logging in or opening
  a lesson measurably erode intrinsic motivation (the overjustification effect);
  rewards for *demonstrated skill* ("mastered vectors") signal competence instead.
- **No competitive leaderboards by default** (see item 10).
- **Keep celebration in the engine, out of the content** — the content skills already
  ban content-level reward language, and engine changes shouldn't push celebration
  copy into lesson data.
- **Never build learner-style pathways** ("visual learner mode"): the
  learning-styles-matching hypothesis has no empirical support, and the build cost
  buys nothing. Adaptivity budget goes to items 7–8 instead.
