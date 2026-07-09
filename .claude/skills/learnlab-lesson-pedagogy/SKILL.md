---
name: learnlab-lesson-pedagogy
description: Evidence-based rules for designing LearnLab screen sequences that maximise both engagement and measured learning — prediction-first hooks, gating as a structural property of every screen, retrieval checkpoint format mix, backward-faded worked examples with self-explanation prompts, misconception-based distractor design, fading depth across a lesson, and the GCSE/A-level/adult calibration dial. Read this BEFORE drafting or substantially revising any lesson, screen, quiz question, or assessment — and trigger it whenever a task involves writing lessons, "making content engaging or fun", story-based teaching, hooks, checkpoints, quiz explanations, feedback wording, or tone calibration, even if the user doesn't say "pedagogy". The learnlab-author-content skill covers mechanics (screen-type fields, schemas, validation); this skill covers what to write and where to put it.
---

# Designing LearnLab lessons that actually teach

Every rule in this skill comes from replicated learning-science findings (meta-analyses where
available), translated into things you can do with LearnLab's screen-sequence engine
(`docs/BRILLIANT_REWRITE_PLAN.md`, `docs/SCREENS.md`) — eight screen types, plus the four-question-type
assessment format for end-of-module quizzes. Effect sizes are cited as orientation, not guarantees —
they are directional evidence for why a rule exists, and they do not simply add up.

**A lesson is a sequence of screens, not a page of prose.** The learner sees one screen at a time
and cannot advance without a real interaction — every screen type's Continue button is disabled
until the learner does something genuine (commits a prediction, picks correctly, submits a correct
value, hits a widget goal). This is not a house-style preference this skill is asking you to follow
on trust: it is enforced by the engine's type system. What this skill governs is what goes *inside*
each screen and how you sequence them — the difference between a screen sequence that happens to
pass schema validation and one that actually teaches.

**A "beat" is a screen, not a screen's introduction.** In the legacy Markdown format, a lesson beat
was a paragraph of prose followed by a separate checkpoint. In the screens format, there is no such
split: a screen's short framing prose (its `prompt`/`body` field, 1-4 sentences) *is* the beat, and
the screen's own gated interaction *is* the checkpoint. Do not try to write a long non-interactive
framing screen followed by a checkpoint screen — there is no screen type for pure framing, by
design (target spec: "you cannot advance without doing something"). If you find yourself wanting to
write more than a few sentences before the interaction, that's a sign the idea needs its own screen
with its own checkpoint, not a longer prompt.

## The north star: measured learning beats smooth feelings

Learning and in-lesson performance are different things, and they routinely conflict. Conditions
that make a lesson *feel* smooth (everything explained before it's asked, easy checkpoints, no
failed attempts) reliably produce worse retention and transfer than conditions with productive
difficulty — retrieval attempts, predictions that turn out wrong, steps the learner must supply
themselves. Likewise, the things that make content *feel* engaging (fun tangents, colourful asides,
dramatic trivia) are exactly the things shown to *reduce* learning when they don't carry the
concept.

So when two choices trade off, pick the one that improves what a learner can do a week later, not
the one that feels nicer in the moment. Concretely, this skill will ask you to let learners attempt
things before you teach them, to leave gaps for them to fill, and to delete fun material that
doesn't earn its place. Trust the rules even when the draft feels slightly less "finished" for
following them — that friction is the point.

## Step 0 — Set the level dial before writing a word

The journey structure (hook → throughline → payoff) works at every age. What changes with audience
is the *dosage* of narrative and scaffolding. Adults are problem-oriented, time-protective, and
want to know why something matters before they'll invest; younger learners tolerate and benefit
from richer framing and denser scaffolding. Pick the setting from the course's level and intended
audience, and hold it for the whole module:

| | **Setting A — GCSE / young foundation (~14–16)** | **Setting B — AS/A2/A-level (~16–18)** | **Setting C — adult-facing (professional/self-improver courses, e.g. much of ai-foundations)** |
|---|---|---|---|
| Narrative | Rich: scenarios, light characters, playful voice all fine | Story as problem-frame and throughline; no characters needed | Minimal whimsy; narrative = one real-world problem anchor, nothing more |
| Hook screen | Concrete scenario or surprise | Problem the toolkit can't solve, or a prediction | Lead with why-it-matters and immediate application, then the prediction |
| Worked-example screens | 2 full `reveal-mechanism` screens before any `faded-step`; fade only the last step | 1 full + 1 faded (last step early in module, last two steps by module end) | Fade aggressively: one full `reveal-mechanism`, then straight to `faded-step`/`entry` completion screens |
| Screen framing length | ~1-2 sentences per `prompt`/`body` | 2-4 sentences | 2-4 sentences, denser, no throat-clearing |
| Tone | Warm, encouraging, playful | Concise, encouraging | Direct, respectful of time, zero fluff |

Everything below applies at all settings; the dial only scales it.

## The lesson skeleton

Structure every lesson as this sequence of screens. It is the existing journey house style with
the openings and checkpoints made structural instead of merely recommended:

```
1. HOOK               — a `predict` screen, committed before any teaching
2. CONCEPT SCREEN 1    — `tap-choice` or `entry`, short framing + one checkpoint
3. CONCEPT SCREEN 2    — same pattern
4. CENTERPIECE         — a `manipulable-target` screen with a real goal (middle third)
5. CONCEPT SCREEN 3    — same pattern
6. WORKED EXAMPLE PAIR — `reveal-mechanism` (full, with self-explanation) then `faded-step` (faded)
7. CLOSE               — resolve the opening prediction, hand off to the next lesson
```

Positional rules, checkable by eye against the `screens` array:

- Screen 1 (or very close to it) is a `predict` screen using an approved hook pattern (below) —
  **at least one interactive checkpoint in the first third of the sequence** is automatic once you
  follow this, since every screen already gates.
- The `manipulable-target` centerpiece sits in the **middle third** of the `screens` array, placed
  immediately after the idea it illustrates — never appended at the end. (The pre-rewrite platform
  had a repo-wide audit finding 57% of inline interactivity in the final third of a lesson; the new
  engine makes that pattern structurally awkward to reproduce, but it's still possible to write a
  sequence that front-loads all the `predict`/`tap-choice` screens and only reaches the
  `manipulable-target` at the very end — don't.)
- The close is short — fold it into the last screen's `successFeedback`, or use one final short
  screen — and must return to the hook's prediction by name: "You predicted X at the top. Now you
  can see it's Y, and you can say exactly why."

## Hooks: open with an attempt, not an announcement

Attempting a question *before* instruction improves later retention even when the attempt fails —
pretesting beats even post-instruction retrieval practice in head-to-head comparisons (d ≈ 0.3) and
measurably reduces mind-wandering during the material that follows. It also drives curiosity the
way nothing else does: curiosity is the itch of a specific, nearly-closable knowledge gap, so a
hook must open a gap the lesson then closes.

**Banned openers** — never start a `predict` screen's `prompt` with any of these shapes:

- "In this lesson we will cover…" / "Welcome to…"
- "X is an important topic in mathematics…"
- "Let's learn about…"

**The four approved hook patterns** (pick per lesson; each must end in a commitment — i.e. each is
a `predict` screen):

1. **The wall** — a problem the learner's current toolkit provably can't solve. *"Solve
   $x^2 = -1$. Go on, try every real number you like. The rest of this lesson exists to get past
   this wall."*
2. **The prediction** — pose a concrete question, make the learner commit before teaching. *"A
   ball is thrown at 20 m/s at 30° above the horizontal. Will it go further at 45°, or less far?
   Lock in your answer below before we work anything out."*
3. **The surprise** — a true result that sounds wrong, with the promise of resolution. *"Adding
   up 1 + 1/2 + 1/4 + … forever gives you exactly 2. Not roughly 2: exactly. By the end of this
   lesson you'll be able to prove it."*
4. **The real scenario** — a concrete situation whose resolution requires today's technique (the
   default at Setting C). *"Your phone's battery reads 80%, then 79% an hour later, then 76% an
   hour after that. When does it actually die? That's a modelling question, and here's the tool
   for it."*

Make the commitment mechanical: this is now a first-class `predict` screen, not a workaround. The
projectile-range hook above is literally:

```json
{
  "type": "predict",
  "id": "predict-range",
  "prompt": "A ball is thrown at 20 m/s at 30° above the horizontal. Will it go further at 45°, or less far?",
  "choices": ["Further at 45°", "Less far at 45°", "Exactly the same"],
  "correctChoiceIndex": 0,
  "reveal": "Hold that thought. By the end of this section you'll be able to prove your answer right or wrong — for now, notice which one you picked."
}
```

`reveal` deliberately does **not** give the mechanism away immediately if the lesson's job is to
build up to it over several more screens — it can simply acknowledge the commitment and defer the
full explanation to later screens, provided the close resolves it explicitly. Being "wrong" here is
productive — never word `reveal` as failure, and prefer omitting `correctChoiceIndex` entirely for
a genuinely open prediction where marking a guess "wrong" would read as punitive rather than
informative.

Then the close of the lesson must pay the prediction off by name.

## Load-bearing narrative: the deletion test

Narrative genuinely helps learning — story-framed instruction beats plain exposition on *transfer*
(d ≈ 0.4–0.5), and helps low-prior-knowledge learners most. But the same literature documents the
failure mode precisely: **seductive details** — interesting but concept-irrelevant material (a fun
tangent, a dramatic anecdote, a "did you know" aside) — reliably *reduce* retention and transfer.
Interest is not the problem; irrelevance is.

Screens make this rule even sharper than it was in the Markdown format: a screen's framing prose is
1-4 sentences, not a paragraph, so there is less room to hide a seductive detail — but also less
excuse for one. **Every sentence in a `prompt`/`body`/`reveal` field must be load-bearing.** It must
do one of exactly three jobs — introduce the problem, carry the concept, or thread the sequence.

**The deletion test:** delete the sentence or detail. If the learner's path to the concept is
unchanged, keep it deleted. Run this test on every sentence of every hook and every piece of
connective tissue before calling a lesson done.

- BAD: a `predict` screen for a differentiation lesson that opens with three sentences on the
  Newton–Leibniz priority feud before getting to the question. Fun, memorable, and it teaches
  nothing about gradients — a classic seductive detail.
- GOOD: opening the same lesson with a speedometer — "your car's speedo reads an *instantaneous*
  speed; but speed is distance over time, and at an instant, no time passes and no distance is
  covered, so what is it actually measuring?" Every word points at the concept.

The same coherence logic applies to visuals: every screen that introduces a visual or spatial idea
should use a `manipulable-target` (or, rarely, a `figure` widget referenced from a legacy-format
lesson) only when it's genuinely relevant; never add a decorative image; put labels on the widget
itself rather than in prose that forces the reader's eyes to shuttle; never restate a `prompt`
sentence inside `successFeedback`.

## Screens as checkpoints: retrieval, not recognition, with real feedback

Retrieval practice is the best-evidenced technique in the entire literature (g ≈ 0.5 across 150+
effects) — and two moderators matter enormously for how you build screens:

1. **Feedback nearly doubles the benefit** (g ≈ 0.73 with feedback vs 0.39 without), and
   *elaborated* feedback (explaining why) beats correct-answer-only, which beats bare right/wrong
   by a huge margin (≈ 0.49 vs 0.32 vs 0.05). Every `tap-choice` choice's `feedback`, every
   `successFeedback`, and every `reveal`/`selfExplainAnswer` must teach — name what the right
   reasoning is, and for each wrong `tap-choice` option, name the specific error it represents.
   "Correct, well done!" alone is a bug.
2. **Recall beats recognition** (free/cued recall g ≈ 0.7–0.8 vs multiple choice g ≈ 0.36), and a
   *mixture* of formats beats any single format.

Mechanical rules, now directly countable against the `screens` array:

- Because every screen already gates, "one checkpoint after every beat" is automatic — there is no
  separate rule to remember here. What you must still enforce yourself is the **format mix**.
- **At least half of a lesson's screens should be generation-format** — `entry`, `faded-step`, or
  `manipulable-target` — **rather than recognition-format** — `predict` or `tap-choice`. Do not
  build a lesson out of `tap-choice`/`predict` alone; that is the screens-format equivalent of an
  all-mcq lesson and costs roughly half the learning benefit.
- Rotate screen types the way the house style previously rotated widget/quiz choices: `flash-recall`
  for fresh vocabulary, `tap-choice` for a just-stated rule, `sort-match` for a mechanical
  term-pairing skill, `manipulable-target` for a spatial/continuous idea.
- **Difficulty target: right-with-effort.** Aim for a checkpoint that roughly 3 in 4 learners get
  correct after genuinely thinking — not 19 in 20. Never simplify a checkpoint just to keep the
  success rate smooth; productive difficulty is the mechanism, not a defect. Equally, don't stack
  trick questions — the immediate feedback loop and hint ladder the engine provides mean a
  learner who's stuck isn't abandoned, so a screen can afford real difficulty.

## Worked examples: one full, one faded, self-explanation throughout

For novices, studying a worked example beats being thrown a problem. But this *reverses* with
expertise (the expertise-reversal effect): examples become redundant scaffolding that gets in a
more knowledgeable learner's way. The bridge between the two is **backward fading**: show a full
example, then a structurally similar one with the *last* step blanked for the learner to supply,
then blank the last two, and so on. In controlled studies backward fading beat example-problem
pairs on transfer *and* took less learning time; adding **self-explanation prompts** ("what
principle makes this step valid?") extended the benefit to far transfer (g ≈ 0.55 for prompted
self-explanation generally) at no extra time cost.

This pattern is now two dedicated, engine-native screen types instead of an authored workaround:

**The full example is a `reveal-mechanism` screen**, and the mandatory self-explanation prompt is
no longer something you have to remember to write in prose before a reveal — it's a required field
the screen cannot be authored without:

```json
{
  "type": "reveal-mechanism",
  "id": "why-h-vanishes",
  "body": "$$\\frac{f(x+h)-f(x)}{h} = 2x + h.$$ Taking the limit as $h \\to 0$ leaves $f'(x) = 2x$.",
  "selfExplainPrompt": "As $h \\to 0$, the '+h' term disappears but the '2x' term doesn't. Why not — what's different about the two terms?",
  "selfExplainAnswer": "The '+h' term literally contains $h$, so as $h \\to 0$ it shrinks to $0$ and vanishes. The '2x' term has no $h$ in it at all, so letting $h \\to 0$ doesn't touch it."
}
```

**The faded companion is the very next screen, a `faded-step`**: same structure, new numbers, the
final step blanked and checked by the engine's own numeric/text marking:

```json
{
  "type": "faded-step",
  "id": "cube-first-principles",
  "worked": "The same method on $f(x) = x^3$ gives $\\frac{(x+h)^3-x^3}{h} = 3x^2+3xh+h^2$. Letting $h\\to0$, the last two terms vanish, leaving $f'(x) = 3x^2$.",
  "prompt": "So the gradient of $y=x^3$ at any point is $3x^2$. What is $f'(2)$?",
  "inputMode": "numeric",
  "answer": 12,
  "tolerance": 0.01
}
```

Fading depth follows the level dial: at Setting A, fade only the last step (one `faded-step`
screen with a single blank quantity); at Setting B, the last step early in a module and the last
two by the module's end (a `faded-step` whose `worked` field carries less of the derivation as the
module progresses); at Setting C, move quickly to completion-style `entry`/`faded-step` screens
that supply almost no worked scaffolding. As always with numbers: re-derive every value yourself —
the learnlab-author-content and learnlab-research-content skills carry the verification discipline,
and a faded example doubles the number of values you're responsible for getting right.

## Fading across a whole screen sequence

Backward fading isn't just a worked-example-pair pattern — target spec #6 makes it a property of
the *entire* lesson's screen sequence: early screens should carry heavy scaffolding, later screens
should strip it away until the learner is working unaided. Concretely, across a lesson's screens:

- **Early screens** (the hook, the first concept screen or two): favour `predict` and
  `reveal-mechanism` — screens that teach through commit-then-reveal, with the mechanism spelled
  out once the learner has committed.
- **Middle screens** (the centerpiece, further concept screens): `tap-choice` with generous
  `hints`, `manipulable-target` with a well-scaffolded `prompt` that all but names the target.
- **Late screens** (the worked-example pair's faded half, the close): `faded-step` and `entry`
  screens with shorter `hints` arrays (or none), asking the learner to produce more of the answer
  themselves with less structure around it.

This is a content-quality property the engine cannot verify automatically — nothing stops a
schema-valid sequence from opening with a bare `entry` screen and closing with a fully-scaffolded
`reveal-mechanism`, which would be backward. Check the fading direction by eye against this
section, the same way the final self-check below is a manual pass, not a CI gate.

## Widgets: a task, not a toy

The simulation research (PhET's, most directly) is unambiguous about what separates a sim that
teaches from a sim that gets fiddled with and forgotten: **guided inquiry with minimal explicit
direction**. A `manipulable-target` screen's defaults, ranges, and `goal` should make the first
thing a learner tries pedagogically productive (implicit scaffolding), and `prompt` should set a
concrete task without dictating the exact steps.

The schema already enforces the headline rule for you — **a `manipulable-target` screen cannot be
authored without a `goal`**, so "never place a widget bare" is no longer something to remember, it's
something the format makes impossible. What's still on you:

1. `prompt` gives one sentence of open invitation plus the task, in predict/make-X-happen/
   find-the-pattern form ("Drag the point along $y=x^2$ until the tangent line's gradient reads
   4" — not "Explore the tangent to $y=x^2$.").
2. `widgetProps` defaults are chosen so the very first interaction shows something meaningful
   (sensible `xmin`/`xmax`, a starting `expr` that isn't degenerate).
3. `goal.description` states the target in the learner's own terms, and `goal.min`/`goal.max` is
   wide enough to be genuinely reachable (see learnlab-author-content's tolerance/keyboard-step
   trap — a goal window narrower than the widget's interaction step is not just hard, it can be
   literally unreachable for a keyboard user).

The predict-then-manipulate form is preferred wherever it fits: a `predict` screen immediately
before a `manipulable-target` stacks the pretesting and generation effects on top of the
interaction itself, exactly as `01-gradients.screens.json`'s first two screens do.

## Question and feedback design

**Choice format — default to exactly 3 options** (the key plus two distractors), for both
`assessment.json` `mcq` questions and `tap-choice` screens. Eighty years of item research says
three options match four or five psychometrically — most items only ever have two distractors that
actually function — while costing less reading time and less authoring effort. Use a 4th option
only when a third *documented, distinct* misconception genuinely exists. Never use "none of the
above" / "all of the above"; never use double negatives.

**Every distractor encodes a real misconception.** A wrong option should be the answer a learner
lands on by making a specific, known error (sign slip, forgetting to square, confusing the two
related formulas, off-by-one) — so that choosing it *diagnoses* their thinking. The
learnlab-research-content skill covers where to find documented misconceptions (examiner reports
are the goldmine); if none are documented, derive one by genuinely making the plausible mistake
yourself. Then the option's `explanation` (assessment questions) or `feedback` (`tap-choice`
screens) must **name the error**: "If you got $-96$, you dropped the sign when squaring:
$(-2)^2 = +4$."

**Voice: mastery framing, strategy praise, no mindset lectures.** Write feedback in the existing
encouraging house voice, and attribute success to strategy and effort on this task ("Spotting that
the constant vanishes is exactly the right instinct"), never to innate ability ("you're a
natural"). Do not insert growth-mindset pep talks — the evidence for them is far weaker than their
popularity, and they cost words a screen doesn't have room for. Keep celebration to the engine,
which already fires on every screen completion as well as lesson/quiz/deck/game completion;
content-level reward language ("+10 points for you!") is banned in any `prompt`/`feedback`/
`successFeedback` string — rewards untethered from mastery measurably erode intrinsic motivation.

## Module assessments: mix formats and reach backward

`assessment.json` is unchanged by the screens rewrite — every module still ships one end-of-module
assessment in the same four-question-type format, regardless of whether its lessons are
screens-format or legacy Markdown. Two additions on top of the MVC bar (≥ 8 questions, ≥ 2 types —
see learnlab-author-content):

- **Mix generation and recognition** at the assessment level too: at least a third of the
  questions `numeric` or `text`.
- **At least one cumulative review question per module assessment** that genuinely requires a
  technique from a *declared prerequisite module*, with the explanation marking it as review
  ("This one reached back to the chain rule from Differentiation II. Spaced returns like this are
  what make it stick"). This is the cheapest form of spacing and interleaving the platform
  supports at the assessment level, and spacing is a top-two technique in the whole literature.
  Only reach back to modules actually listed in `prerequisites` — never create a hidden dependency.

## Traps that look like good ideas

- **Learning styles.** Never design "visual learner vs verbal learner" variants; the matching
  hypothesis has no empirical support. Match the *content* to the modality (spatial ideas get a
  `manipulable-target`), not the learner.
- **Optimising the success rate.** A checkpoint everyone breezes is a checkpoint teaching nothing;
  see the right-with-effort target above.
- **Back-loading interactivity.** Positional rules above; check them explicitly against the
  `screens` array order.
- **A `manipulable-target` goal narrower than the widget's interaction step.** Verified as a real
  bug, not a hypothetical — see learnlab-author-content's tolerance/keyboard-step trap. Test with
  the keyboard, not just a mouse.
- **Whimsy at Setting C.** Adults read cutesy framing as disrespect for their time. Same journey
  structure, drier delivery.
- **"Engaging" as licence for tangents.** Deletion test, every time.
- **Recognition-only lessons.** All-`tap-choice`/`predict` is the path of least authoring
  resistance and roughly half the learning benefit. Force the format mix.
- **Front-loaded scaffolding.** A sequence that opens unaided and ends heavily scaffolded has the
  fading backward — see "Fading across a whole screen sequence" above.

## Final self-check (run before handing a lesson off)

Go through this literally, screen by screen:

1. Screen 1 (or very close to it) is a `predict` screen using an approved hook pattern, and no
   banned opener appears in any `prompt`.
2. Deletion test passed on every sentence of every `prompt`/`body`/`reveal` — nothing decorative
   survived.
3. The `manipulable-target` centerpiece sits in the middle third of the `screens` array; nothing
   interactive is introduced for the first time in the final sixth (trivially true once you've
   followed the skeleton, but check anyway).
4. At least half of the lesson's screens are generation-format (`entry`/`faded-step`/
   `manipulable-target`), not just `predict`/`tap-choice`.
5. Every `tap-choice` choice's `feedback`, every `successFeedback`, and every
   `selfExplainAnswer`/`reveal` teaches: names the right reasoning and the specific error behind
   each wrong option. Zero bare "Correct!" strings.
6. A worked-example pair is present: `reveal-mechanism` (with its mandatory self-explanation) then
   `faded-step`, fading depth per the level dial.
7. Every `manipulable-target` screen has an invitation + task in `prompt`, a `goal` wide enough to
   be genuinely reachable by keyboard and mouse alike, and productive `widgetProps` defaults.
8. `tap-choice` screens and `assessment.json` `mcq`s: 3 choices, misconception distractors, no
   none/all-of-the-above.
9. Fading direction across the whole sequence runs early-heavy to late-light, not the reverse.
10. Module assessment: ≥ 1/3 generation formats, ≥ 1 cumulative review question from a declared
    prerequisite.
11. Close resolves the opening prediction by name and hands off forward.
12. Level dial setting held consistently (narrative dosage, fading depth, tone).
13. Mechanics pass: everything in learnlab-author-content's own checklist (dash grep, schema
    validity, MVC, hand-verified answers, the tolerance/keyboard-step check) still applies on top
    of this list — this skill adds to that bar, it never replaces it.
