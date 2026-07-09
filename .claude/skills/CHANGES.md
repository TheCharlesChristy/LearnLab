# LearnLab skill set: what changed and why

The skill set is now five skills. Two are new; three are revisions of the existing files.
Every new rule traces to a replicated learning-science finding (meta-analytic where one
exists); effect sizes below are orientation, not guarantees.

## New: learnlab-lesson-pedagogy

The canonical home for *what to write*. Absorbs and upgrades the journey and mid-lesson
interactivity sections that previously lived in learnlab-author-content, and adds the rules
the research showed were missing:

- **Prediction-first hooks (pretesting).** Every lesson opens with a committed prediction or
  prequestion before any teaching, resolved by name at the close. Attempting before
  instruction beats even post-instruction retrieval practice (d ≈ 0.3) and reduces
  mind-wandering. Banned openers list + 4 approved hook patterns with a verbatim
  quiz-based commitment pattern.
- **Load-bearing narrative + the deletion test.** The single most important guardrail for a
  story-based platform: narrative helps transfer (d ≈ 0.4–0.5) but seductive details
  (interesting-but-irrelevant material) measurably reduce retention and transfer. Every
  story element must introduce the problem, carry the concept, or thread the sequence.
- **Checkpoint format mix.** ≥ half of inline checkpoints must demand generation
  (numeric/text/predict), not mcq — recall roughly doubles the retrieval benefit over
  recognition (g ≈ 0.7–0.8 vs 0.36). Elaborated feedback mandatory (g ≈ 0.49 vs 0.05 for
  bare right/wrong). Difficulty target: right-with-effort (~3 in 4), never optimise for
  smooth success.
- **Backward-faded worked examples + self-explanation prompts.** One full example (capped
  with a "why is this step valid?" prompt) plus a faded companion whose last step(s) the
  learner supplies, checked by a one-question quiz. Fading beat example-pairs on transfer
  in less time; self-explanation (g ≈ 0.55) extends it to far transfer.
- **Widgets: a task, not a toy.** PhET-derived rule: every explorable ships with an
  invitation, a predict/make/find task, and productive defaults. Never a bare widget.
- **3-option MCQs with misconception distractors.** 80 years of item research: three options
  match four/five psychometrically. Every distractor encodes a real error; every
  explanation names it.
- **The level dial.** GCSE / A-level / adult settings scaling narrative dosage, fading
  depth, and tone — the journey structure holds at all ages; the whimsy doesn't.
- **Cumulative review question** per module assessment (cheapest spacing/interleaving lever
  in the current platform), plus a 12-point mechanical final self-check for smaller models.

## New: learnlab-extend-platform

The src/-side skill the content skills hand off to when they hit the three-closed-sets
wall. Contains the extension procedure (keys.json + WIDGETS.md CI pairing, quiz schema +
marking + docs together, game-kit, the obligation to update the content skills when a
capability ships) and the evidence-ranked capability backlog:

1. Cross-module spaced retrieval scheduling (distributed practice: top-two technique)
2. Prediction-commit mode on explorables (cheapest quick win)
3. Two-tier questions + confidence marking (misconception diagnosis + data flywheel)
4. Faded worked-example widget
5. Equation-input / structured STEM answer types (generation over recognition)
6. Parameterised question generation (multiplies 1 and 7)
7. Adaptive difficulty and adaptive fading (ITS d ≈ 0.76; staged)
8. Scaffolded subgoal hints (never bottom-out)
9. AI-tutor hint layer (late, tightly scoped)
10. Social/relatedness, aggregate-first (no default leaderboards)

Plus engagement guardrails: rewards tied to mastery not activity (overjustification
effect), no learner-style pathways (no empirical support), celebration stays in the
engine.

## Revised: learnlab-author-content

Mechanics preserved verbatim (closed sets, scaffolder, MVC, D-018, directive syntax,
assessment schema and marking rules, hand-verification discipline, validation,
orchestration). Changes:

- Journey + interactivity-formula sections replaced by a mandatory pointer to
  learnlab-lesson-pedagogy ("house bar" above the CI bar), avoiding two drifting copies.
- Assessment section gains the new house rules where questions actually get written:
  3-option mcq default (noting shipped 4-option examples predate the rule),
  misconception-named explanations, ≥1/3 generation formats, cumulative review question.
- Verification discipline extended to the new checkable numbers pedagogy patterns add
  (faded steps, prediction answers).
- Orchestration gains a step: reviewer applies the pedagogy self-check, not just schema
  and answer verification.
- src/-level requests now route to learnlab-extend-platform explicitly.

## Revised: learnlab-adapt-resource

Structure preserved. Changes:

- Step 2 now fixes the level-dial setting in the plan before drafting.
- Step 3 notes the honest prerequisite graph feeds the cumulative review question.
- Step 4 hands pedagogy to the new skill; conversion table gains four rows (preview
  questions → prediction hook; opening anecdotes/fun boxes → deletion test; end-of-chapter
  questions → mine for misconceptions, never copy; monolithic worked example → full+faded
  pair).
- New warning: textbooks are seductive-detail factories — the margin boxes and vignettes
  that make a chapter feel lively are exactly what reduces learning when ported.
- Step 5 adds the house bar (pedagogy self-check) on top of MVC.

## Revised: learnlab-research-content

Structure preserved; sections renumbered to admit one addition:

- **New §3: research the misconceptions, not just the facts.** Source-priority order for
  documented learner errors: exam-board examiner reports (the goldmine — they exist to
  catalogue what real candidates got wrong), discipline-based education research and
  concept inventories, reputable teaching sources, and derived-by-making-the-mistake as
  the fallback. Findings flow into distractors, explanations that name the error, warning
  callouts, and prediction-hook targets.
- §2 and §5 extended: faded-example steps and prediction answers join assessment answers
  under the 100%-re-derivation discipline; mcq verification now includes confirming each
  distractor is actually produced by its claimed misconception on these numbers.

## Deliberately excluded (evidence didn't support it)

- Learning-styles pathways or authoring variants (matching hypothesis unsupported).
- Growth-mindset messaging beyond strategy-focused praise (intervention effects small and
  contested, d ≈ 0.08).
- Content-level reward/points language (overjustification risk; engine owns celebration).
- Interleaving *within* a lesson's teaching sequence (material-dependent, would fight the
  journey structure; applied at assessment/review level instead).
