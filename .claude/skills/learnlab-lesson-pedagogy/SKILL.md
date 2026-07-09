---
name: learnlab-lesson-pedagogy
description: Evidence-based rules for designing LearnLab lessons that maximise both engagement and measured learning — prediction-first hooks, journey/story structure without the seductive-details trap, retrieval checkpoint placement and format mix, backward-faded worked examples with self-explanation prompts, misconception-based quiz design, and the GCSE/A-level/adult calibration dial. Read this BEFORE drafting or substantially revising any lesson prose, quiz question, widget placement, or assessment — and trigger it whenever a task involves writing lessons, "making content engaging or fun", story-based teaching, hooks, checkpoints, quiz explanations, feedback wording, or tone calibration, even if the user doesn't say "pedagogy". The learnlab-author-content skill covers mechanics (directives, schemas, validation); this skill covers what to write and where to put it.
---

# Designing LearnLab lessons that actually teach

Every rule in this skill comes from replicated learning-science findings (meta-analyses
where available), translated into things you can do with LearnLab's existing four
directives, thirteen widgets, and four question types. Effect sizes are cited as
orientation, not guarantees — they are directional evidence for why a rule exists, and
they do not simply add up.

## The north star: measured learning beats smooth feelings

Learning and in-lesson performance are different things, and they routinely conflict.
Conditions that make a lesson *feel* smooth (everything explained before it's asked,
easy checkpoints, no failed attempts) reliably produce worse retention and transfer
than conditions with productive difficulty — retrieval attempts, predictions that turn
out wrong, steps the learner must supply themselves. Likewise, the things that make
content *feel* engaging (fun tangents, colourful asides, dramatic trivia) are exactly
the things shown to *reduce* learning when they don't carry the concept.

So when two choices trade off, pick the one that improves what a learner can do a week
later, not the one that feels nicer in the moment. Concretely, this skill will ask you
to let learners attempt things before you teach them, to leave gaps for them to fill,
and to delete fun material that doesn't earn its place. Trust the rules even when the
draft feels slightly less "finished" for following them — that friction is the point.

## Step 0 — Set the level dial before writing a word

The journey structure (hook → throughline → payoff) works at every age. What changes
with audience is the *dosage* of narrative and scaffolding. Adults are problem-oriented,
time-protective, and want to know why something matters before they'll invest; younger
learners tolerate and benefit from richer framing and denser scaffolding. Pick the
setting from the course's level and intended audience, and hold it for the whole module:

| | **Setting A — GCSE / young foundation (~14–16)** | **Setting B — AS/A2/A-level (~16–18)** | **Setting C — adult-facing (professional/self-improver courses, e.g. much of ai-foundations)** |
|---|---|---|---|
| Narrative | Rich: scenarios, light characters, playful voice all fine | Story as problem-frame and throughline; no characters needed | Minimal whimsy; narrative = one real-world problem anchor, nothing more |
| Hook | Concrete scenario or surprise | Problem the toolkit can't solve, or a prediction | Lead with why-it-matters and immediate application, then the prediction |
| Worked examples | 2 full worked examples before any fading; fade only the last step | 1 full + 1 faded (last step early in module, last two steps by module end) | Fade aggressively: full example once, then completion problems |
| Beat length | ~150 words | 150–250 words | 150–250 words, denser |
| Tone | Warm, encouraging, playful | Concise, encouraging | Direct, respectful of time, zero fluff |

Everything below applies at all settings; the dial only scales it.

## The lesson skeleton

Structure every lesson as this sequence. It is the existing journey house style with
the openings and checkpoints upgraded from "motivational" to "measured-learning":

```
1. HOOK ending in a COMMITTED PREDICTION or PREQUESTION   (before any teaching)
2. BEAT 1 (150–250 words of new material) → checkpoint
3. BEAT 2 → checkpoint
4. CENTERPIECE: best hands-on widget, with a task     (middle third of the lesson)
5. BEAT 3 → checkpoint
6. WORKED EXAMPLE PAIR: one full, one backward-faded  (with self-explanation prompts)
7. CLOSE: resolve the opening prediction explicitly + hand off to the next lesson
```

Positional rules, checkable by eye:
- At least one interactive checkpoint in the **first third** of the lesson.
- The centerpiece widget in the **middle third**, immediately after the idea it
  illustrates — never appended at the end. (A repo-wide audit found 57% of inline
  interactivity sitting in the final third; that pattern reads as a wall of text with
  a quiz bolted on, and it wastes the widget where the idea has already gone cold.)
- The close is short and must return to the hook's prediction: "You predicted X at the
  top. Now you can see it's Y, and you can say exactly why."

## Hooks: open with an attempt, not an announcement

Attempting a question *before* instruction improves later retention even when the
attempt fails — pretesting beats even post-instruction retrieval practice in head-to-head
comparisons (d ≈ 0.3) and measurably reduces mind-wandering during the material that
follows. It also drives curiosity the way nothing else does: curiosity is the itch of a
specific, nearly-closable knowledge gap, so a hook must open a gap the lesson then closes.

**Banned openers** — never start a lesson with any of these shapes:
- "In this lesson we will cover…" / "Welcome to…"
- "X is an important topic in mathematics…"
- "Let's learn about…"

**The four approved hook patterns** (pick per lesson; each must end in a commitment):

1. **The wall** — a problem the learner's current toolkit provably can't solve.
   *"Solve $x^2 = -1$. Go on, try every real number you like. The rest of this lesson
   exists to get past this wall."*
2. **The prediction** — pose a concrete question, make the learner commit before
   teaching. *"A ball is thrown at 20 m/s at 30° above the horizontal. Will it go
   further at 45°, or less far? Lock in your answer below before we work anything out."*
3. **The surprise** — a true result that sounds wrong, with the promise of resolution.
   *"Adding up 1 + 1/2 + 1/4 + … forever gives you exactly 2. Not roughly 2: exactly.
   By the end of this lesson you'll be able to prove it."*
4. **The real scenario** — a concrete situation whose resolution requires today's
   technique (the default at Setting C). *"Your phone's battery reads 80%, then 79% an
   hour later, then 76% an hour after that. When does it actually die? That's a
   modelling question, and here's the tool for it."*

Make the commitment mechanical, not rhetorical. The cheapest pattern in the current
platform is an inline quiz with shuffling off:

```markdown
Before we work anything out: will the ball travel further at 45° than at 30°, or less far? Commit to an answer.

::widget{type="quiz" src="quizzes/predict-range.json"}
```

with `quizzes/predict-range.json` containing one `mcq` (3 choices: further / less far /
exactly the same), `shuffleQuestions` and `shuffleChoices` both `false`, and an
`explanation` that deliberately does **not** give the game away: "Hold that thought.
By the end of this section you'll be able to prove your answer right or wrong." Being
wrong here is productive — never word the prediction feedback as failure.

Then the close of the lesson must pay the prediction off by name.

## Load-bearing narrative: the deletion test

Narrative genuinely helps learning — story-framed instruction beats plain exposition on
*transfer* (d ≈ 0.4–0.5), and helps low-prior-knowledge learners most. But the same
literature documents the failure mode precisely: **seductive details** — interesting but
concept-irrelevant material (a fun tangent, a dramatic anecdote, a "did you know" aside)
— reliably *reduce* retention and transfer. Interest is not the problem; irrelevance is.

So the rule is: **every narrative element must be load-bearing.** It must do one of
exactly three jobs — introduce the problem, carry the concept, or thread the sequence.

**The deletion test:** delete the sentence or detail. If the learner's path to the
concept is unchanged, keep it deleted. Run this test on every sentence of every hook
and every piece of connective tissue before calling a lesson done.

- BAD: opening a differentiation lesson with three sentences on the Newton–Leibniz
  priority feud. Fun, memorable, and it teaches nothing about gradients — a classic
  seductive detail. (In a lesson *about notation conventions*, the same feud might be
  load-bearing. Context decides.)
- GOOD: opening the same lesson with a speedometer — "your car's speedo reads an
  *instantaneous* speed; but speed is distance over time, and at an instant, no time
  passes and no distance is covered, so what is it actually measuring?" Every word
  points at the concept.

This rule is the single most important guardrail when the instruction is "make it
engaging." If you notice yourself adding colour to be entertaining, stop and run the
deletion test.

The same coherence logic applies to visuals: every beat that introduces a visual or
spatial idea should get one *relevant* widget or figure; never add decorative images;
put labels on diagrams rather than in prose that forces the reader's eyes to shuttle;
never restate a body-text sentence inside a caption.

## Beats and checkpoints: retrieval, not recognition, with real feedback

Retrieval practice is the best-evidenced technique in the entire literature (g ≈ 0.5
across 150+ effects) — and two moderators matter enormously for how you build checkpoints:

1. **Feedback nearly doubles the benefit** (g ≈ 0.73 with feedback vs 0.39 without),
   and *elaborated* feedback (explaining why) beats correct-answer-only, which beats
   bare right/wrong by a huge margin (≈ 0.49 vs 0.32 vs 0.05). Every checkpoint
   explanation must teach — name what the right reasoning is, and for each wrong
   option, name the specific error it represents. "Correct, well done!" alone is a bug.
2. **Recall beats recognition** (free/cued recall g ≈ 0.7–0.8 vs multiple choice
   g ≈ 0.36), and a *mixture* of formats beats any single format.

Mechanical rules:
- One checkpoint after every beat that introduces something checkable (existing house
  rule — keep it).
- **At least half of a lesson's inline checkpoints must demand generation, not
  recognition**: a `numeric` or `text` question, a value the learner computes before
  opening a reveal, or a committed prediction. Do not build a lesson out of mcq alone.
- Rotate checkpoint kinds as the existing house style already prescribes (flashcards
  for fresh vocabulary, inline quiz for a just-stated rule, matching-pairs for a
  mechanical skill, the subject's hands-on widget for a spatial idea).
- **Difficulty target: right-with-effort.** Aim for a checkpoint that roughly 3 in 4
  learners get correct after genuinely thinking — not 19 in 20. Never simplify a
  checkpoint just to keep the success rate smooth; productive difficulty is the
  mechanism, not a defect. Equally, don't stack trick questions — flow needs challenge
  matched to skill, and the immediate feedback loop the engine provides.

## Worked examples: one full, one faded, self-explanation throughout

For novices, studying a worked example beats being thrown a problem. But this
*reverses* with expertise (the expertise-reversal effect): examples become redundant
scaffolding that gets in a more knowledgeable learner's way. The bridge between the two
is **backward fading** — show a full example, then a structurally similar one with the
*last* step blanked for the learner to supply, then blank the last two, and so on. In
controlled studies backward fading beat example-problem pairs on transfer *and* took
less learning time; adding **self-explanation prompts** ("what principle makes this
step valid?") extended the benefit to far transfer (g ≈ 0.55 for prompted
self-explanation generally) at no extra time cost.

In current platform vocabulary:

**The full example** stays the existing `:::reveal` house pattern, but cap it with a
self-explanation prompt *before* the final line:

```markdown
:::reveal{title="Worked example: differentiate and evaluate"}
Let $f(x) = 3x^4 - 5x^2 + 2$. Term by term, the power rule gives:

$$
f'(x) = 12x^3 - 10x
$$

Before reading the last line: why did the constant $2$ vanish? Say your answer, then check.

The graph of a constant is horizontal, so its gradient is $0$ everywhere: constants always differentiate to $0$.
:::
```

**The faded companion** immediately follows: same structure, new numbers, last step(s)
missing, with the blanked step checked by a one-question inline quiz:

```markdown
:::reveal{title="Your turn to finish: same idea, new numbers"}
Let $g(x) = 2x^5 + 7x$. The power rule gives $g'(x) = 10x^4 + 7$.

The final step is yours: evaluate $g'(1)$, then check your answer below.
:::

::widget{type="quiz" src="quizzes/faded-step.json"}
```

where the quiz holds one `numeric` question with a full elaborated `explanation`.

Fading depth follows the level dial: last step only at Setting A; last step early in a
module and last two steps by the module's end at Setting B; move quickly to
completion problems (most steps blank) at Setting C. As always with numbers: re-derive
every value yourself — the learnlab-author-content and learnlab-research-content skills
carry the verification discipline, and a faded example doubles the number of values
you're responsible for getting right.

## Widgets: a task, not a toy

The simulation research (PhET's, most directly) is unambiguous about what separates a
sim that teaches from a sim that gets fiddled with and forgotten: **guided inquiry with
minimal explicit direction**. The widget's defaults, ranges, and labels should make the
first thing a learner tries pedagogically productive (implicit scaffolding), and the
prose around it should set a concrete goal without dictating steps.

Rule: **never place a widget bare.** Every `::widget` embed of an explorable
(function-grapher, vector-field, circuit-sim, logic-gate-sim, geometry-canvas,
code-runner, data-plot) ships with:

1. One sentence of open invitation ("Drag the exponent slider and watch the tangent line").
2. One specific task in predict / make-X-happen / find-the-pattern form ("Before you
   drag: predict what happens to the gradient at $x=0$ when the power is even. Now check:
   were you right?").
3. Defaults chosen so the very first interaction shows something meaningful (sensible
   axis ranges, a starting expression that isn't degenerate, a pre-built circuit one
   edit away from the interesting behaviour).

The predict-then-check form is preferred wherever it fits — it stacks the pretesting
and generation effects on top of the interaction itself.

## Question and feedback design

**MCQ format — default to exactly 3 options** (the key plus two distractors). Eighty
years of item research says three options match four or five psychometrically — most
items only ever have two distractors that actually function — while costing less
reading time and less authoring effort. Use a 4th option only when a third *documented,
distinct* misconception genuinely exists. Never use "none of the above" / "all of the
above"; never use double negatives.

**Every distractor encodes a real misconception.** A wrong option should be the answer
a learner lands on by making a specific, known error (sign slip, forgetting to square,
confusing the two related formulas, off-by-one) — so that choosing it *diagnoses*
their thinking. The learnlab-research-content skill covers where to find documented
misconceptions (examiner reports are the goldmine); if none are documented, derive one
by genuinely making the plausible mistake yourself. Then the option's `explanation`
must **name the error**: "If you got $-96$, you dropped the sign when squaring:
$(-2)^2 = +4$."

**Voice: mastery framing, strategy praise, no mindset lectures.** Write feedback in the
existing encouraging house voice, and attribute success to strategy and effort on this
task ("Spotting that the constant vanishes is exactly the right instinct"), never to
innate ability ("you're a natural"). Do not insert growth-mindset pep talks — the
evidence for them is far weaker than their popularity, and they cost words a lesson
doesn't have. Keep celebration to the engine, which already provides it; content-level
reward language ("+10 points for you!") is banned — rewards untethered from mastery
measurably erode intrinsic motivation.

## Module assessments: mix formats and reach backward

Two additions on top of the MVC bar (≥ 8 questions, ≥ 2 types — see
learnlab-author-content):

- **Mix generation and recognition** at the assessment level too: at least a third of
  the questions `numeric` or `text`.
- **At least one cumulative review question per module assessment** that genuinely
  requires a technique from a *declared prerequisite module*, with the explanation
  marking it as review ("This one reached back to the chain rule from
  Differentiation II. Spaced returns like this are what make it stick"). This is the
  cheapest form of spacing and interleaving the current platform supports, and spacing
  is a top-two technique in the whole literature. Only reach back to modules actually
  listed in `prerequisites` — never create a hidden dependency.

## Traps that look like good ideas

- **Learning styles.** Never design "visual learner vs verbal learner" variants; the
  matching hypothesis has no empirical support. Match the *content* to the modality
  (spatial ideas get diagrams), not the learner.
- **Optimising the success rate.** A checkpoint everyone breezes is a checkpoint
  teaching nothing; see the right-with-effort target above.
- **Back-loading interactivity.** Positional rules above; check them explicitly.
- **Whimsy at Setting C.** Adults read cutesy framing as disrespect for their time.
  Same journey structure, drier delivery.
- **"Engaging" as licence for tangents.** Deletion test, every time.
- **Recognition-only lessons.** All-mcq is the path of least authoring resistance and
  roughly half the learning benefit. Force the format mix.

## Final self-check (run before handing a lesson off)

Go through this literally, item by item:

1. Hook uses an approved pattern, ends in a committed prediction/prequestion, and no
   banned opener appears anywhere.
2. Deletion test passed on every narrative sentence — nothing decorative survived.
3. ≥ 1 checkpoint in the first third; centerpiece widget in the middle third; nothing
   interactive is introduced for the first time in the final sixth.
4. ≥ half of inline checkpoints demand generation (numeric/text/predict), not just mcq.
5. Every checkpoint and assessment explanation teaches: names the right reasoning and
   the specific error behind each wrong option. Zero bare "Correct!" strings.
6. Worked example pair present: one full (with a self-explanation prompt before the
   final line) + one backward-faded companion, fading depth per the level dial.
7. Every explorable widget has an invitation, a predict/make/find task, and productive
   defaults.
8. MCQs: 3 options, misconception distractors, no none/all-of-the-above.
9. Module assessment: ≥ 1/3 generation formats, ≥ 1 cumulative review question from a
   declared prerequisite.
10. Close resolves the opening prediction by name and hands off forward.
11. Level dial setting held consistently (narrative dosage, fading depth, tone).
12. Mechanics pass: everything in learnlab-author-content's own checklist (dash grep,
    schema validity, MVC, hand-verified answers) still applies on top of this list —
    this skill adds to that bar, it never replaces it.
