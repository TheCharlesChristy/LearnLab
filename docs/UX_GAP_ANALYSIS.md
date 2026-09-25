# LearnLab UX gap analysis: closing the retention loop

Status: implemented (D-033, D-034) · Last updated: 2026-09-25

## 1. The spirit of the repository

LearnLab's documents are unusually explicit about what it optimises. Read together, the SRS,
`docs/Evidence_Based_Design_for_learning`, `docs/BRILLIANT_REWRITE_PLAN.md`, the Experience Runtime
v2 plan, and the content skills commit the product to:

- **Measured learning over in-session comfort.** "A feature's success metric is what learners can
  do on a later, spaced assessment — never completion rate" (extend-platform skill); "Do not ship a
  more engaging version if delayed mastery materially falls" (v2 plan §11).
- **Active learning, genuinely gated.** Predict before being told, generate rather than recognise,
  self-explain, and never offer a prose screen with a bare Next button.
- **Enjoyment that serves learning.** Load-bearing narrative (the deletion test), celebration owned
  by the engine, rewards tied to mastery rather than activity, and no leaderboards.
- **Local-first and static.** No accounts, no backend, no telemetry. Everything runs on the
  device and is exportable.

The lesson format lives up to this. The weak point is everything that happens *after* a lesson.

## 2. Method

1. Read every design/plan document and the code for each learner-facing surface.
2. Inventoried content: 93 screen lessons, of which 91 were referenced by modules (the other 2 were
   orphaned and have since been removed, see §6). They contain **326 auto-markable checkpoint screens** (127 `entry`, 99
   `tap-choice`, 81 `faded-step`, 10 `flash-recall`, 9 `sort-match`), plus 78 module assessments.
3. Walked the learner journey (home → lesson → completion → review → progress) against the
   production build in Chromium, including mobile width, and traced where each learner action
   was stored and whether it ever came back.
4. Compared what we found with the evidence base, updated with 2022–2025 research (§5).

## 3. Findings: the journey, stage by stage

| # | Stage | What we found | Severity |
|---|-------|---------------|----------|
| G1 | Lesson → review | **Nothing a learner did in a screen lesson ever came back.** The engine passed each screen a `screenKey` "for future review ids", but no screen used it, and `flash-recall` threw its self-grade away. Only flashcard decks and *missed* quiz questions reached the queue. For the primary format, spaced retrieval (the top-ranked technique in the repo's own evidence doc) was effectively absent. | Critical |
| G2 | Review | **The Review page could not show what it was reviewing.** It displayed `Module: differentiation-1 · Item: flashcards:cards/x.json:3` with Again/Good buttons. The learner was asked to grade their memory of an id. No retrieval happened, so the grades were noise, and those noisy grades then drove the schedule. | Critical |
| G3 | Review | Only *wrong* quiz answers were scheduled. One correct answer is not durable learning; successive relearning needs correct recalls repeated across spaced sessions. | High |
| G4 | Scheduling | SM-2-lite on a 2-button scale. SM-2 dates from 1987; FSRS (DSR model) is now the reference open scheduler and predicts recall markedly better on the open benchmark. | High |
| G5 | Metacognition | No confidence signal anywhere. The v2 evaluation plan names the *confidently-wrong rate* as a key metric, but nothing captured it, and learners never saw whether their sense of knowing matched reality. | High |
| G6 | Home | Home was a catalogue. Every visit started with a decision and nothing surfaced "continue", "review" or "next" (ADR-001 epic E1, still unbuilt). Due reviews were a small nav badge. | High |
| G7 | Lesson completion | "Lesson complete!" plus two buttons. The learner was never told that what they just did would come back, or why. Learners reliably underrate spacing because fluency *feels* like learning. | Medium |
| G8 | Progress | Measured coverage (lessons done), not retention (what's still remembered). The in-progress table showed raw module/course ids instead of titles. | Medium |
| G9 | Feedback (bug) | In `tap-choice` and `predict`, the green/red borders on right and wrong answers **never rendered**. The neutral border class won the CSS cascade (D-034). Learners saw only a faint tint. | Medium |
| G10 | Internal (bug) | `quizReviewItemId()` produced `quiz:<id>:<q>`, but QuizEngine wrote `<id>:<q>`. The helper was unused, so the mismatch was latent. | Low |

## 4. What was built

### 4.1 Every checkpoint feeds spaced retrieval (G1, G3)

- Checkpoint screens report a first-try outcome through a new optional `onOutcome` runner prop.
  The engine commits the latest report when the learner advances (so a changed self-grade is
  respected) and seeds `screen:<lessonId>:<screenId>` into the queue. A first-try success is
  graded `good` and is due in about 2 days. A screen the learner needed feedback or hints for is
  graded `again` and is due tomorrow. Non-checkpoint screens (`predict`, `reveal-mechanism`,
  `manipulable-target`) are never seeded.
- QuizEngine now seeds *every* answered question: correct ones as `good`, misses as `again`.
- Seeding never overwrites an item that is already tracked, so revisits don't disturb a live
  schedule.

### 4.2 Real retrieval in review (G2)

`src/review` resolves each queue row back into its actual question at runtime, through the
existing cached loaders. Quiz items are found by checking the assessment first, then any inline
quiz referenced from Markdown lessons. Four card types cover every source:

- **Choice** (quiz `mcq`/`multi`, `tap-choice`): options are reshuffled per review so the learner
  can't recall *position* instead of content. Choices that refer to their neighbours ("both of the
  above") are left in order.
- **Entry** (quiz `numeric`/`text`, `entry`, `faded-step` with its worked steps): marked with the
  quiz engine's own semantics. When wrong, it shows a readable model answer derived from the regex
  (`7\s*(√|sqrt)\s*2` becomes `7√2`).
- **Recall** (flashcards, `flash-recall`): an optional typed attempt, because producing an answer
  beats recognising one. Then reveal, then a 4-point self-grade.
- **Match** (`sort-match`): a keyboard-accessible select per item.

Items whose content has been removed are dropped from the queue. Items that fail to load (for
example, offline) sit that session out and stay scheduled.

### 4.3 Confidence, calibration and hypercorrection (G5)

Auto-marked answers are submitted with a confidence level: **Guessing · Think so · Sure**.

- A correct *guess* is graded `hard`, so it comes back sooner; it wasn't real retrieval.
- A wrong answer given with **Sure** gets a distinct, calm callout asking the learner to pause on
  the explanation. Confident errors that are corrected are remembered best (the hypercorrection
  effect), but only if the correction gets attention.
- Lifetime calibration totals feed a plain-language insight ("When you feel sure, you're right
  62% of the time — worth a second look before locking in") in the session debrief and on the
  Progress page. The insight needs at least 5 answers at a level before it quotes a figure.

### 4.4 FSRS-6 scheduling (G4)

`src/progress/fsrs.ts` is a pure port of FSRS-6 with its published default parameters, pinned by
tests to outputs from the reference Python implementation. It targets 90% recall at the due date.

- Same-day re-reviews use FSRS's short-term stability rule, so an in-session relearning pass
  isn't credited as a spaced success.
- `ReviewState` gains optional `stability`/`difficulty`/`lapses`. Older SM-2 rows convert on their
  next review.
- There is no Dexie or export-version change, so existing exports import unchanged.

### 4.5 Sessions designed to be finished

- **Capped at 12 items** (about 5 minutes) to avoid the "review debt" that makes learners abandon
  spaced-repetition tools. When more is due, the learner is told those items lead the next session.
- **Most-at-risk first:** lowest predicted recall.
- **Interleaved across modules,** so each item forces "which idea applies here?".
- **Successive relearning:** a miss returns once at the end of the session, so every item ends the
  session answered correctly.
- **Framed up front:** the intro tells the learner the effort is the point. Short refutation-style
  framing measurably improves learners' uptake of desirable difficulties.
- **Debrief:** recall rate, confident mistakes fixed, the calibration insight, and when the next
  items are due.
- **Rewards:** 2 points per correct first-ask recall and a "Memory Builder" achievement. Rewards
  are for recall, never for opening the page.

### 4.6 Home "Today" panel (G6)

The first thing on the catalogue is now the next valuable action:

- **Review** (N items, about M minutes) when anything is due. This is one tap into a session.
- **Continue** the lesson in progress, or **Next up** after a completed one: next lesson, then the
  module assessment, then the next module.
- **The streak, but only while it's intact.** Highlighting an intact streak raises re-engagement;
  highlighting a broken one lowers it, so a broken streak simply isn't shown.
- **A short welcome for brand-new learners** explaining how the loop works.

### 4.7 Lesson debrief and a Memory view (G7, G8)

- **Lesson debrief:** finishing a screen lesson now reports "3 of 5 checkpoints right first time",
  says when they come back, and says why recalling after a gap beats re-reading.
- **Progress › Memory:**
  - items tracked, predicted recall now, due now, and due this week;
  - per-module predicted recall, weakest first;
  - a confidence-vs-accuracy table.
- The in-progress table shows real titles.

## 5. Research basis

| Mechanism | Evidence | Where it lives |
|-----------|----------|----------------|
| Retrieval practice with feedback | Testing effect g = 0.50 (Rowland 2014); classroom g = 0.50 (Yang et al. 2021); stronger with feedback and effortful formats; transfers to related content (Glaser & Richter 2025) | Review cards: answer first, then explained feedback |
| Spacing | Robust across domains. For maths specifically, the 2025 *Educational Psychology Review* meta-analysis found spacing g = 0.28, while retrieval-vs-restudy was inconclusive (g = 0.18), so maths review items should be problems with worked explanations, not bare fact recall | FSRS scheduling; faded-step items re-shown with their worked context |
| Successive relearning | Relearning to criterion across ≥ 3 spaced sessions roughly doubles retention compared with the same number of correct recalls in one session (Rawson & Dunlosky 2022) | Correct answers are scheduled too; misses are relearned in-session |
| Interleaving | Meta-analysis g = 0.42 overall, g = 0.34 for maths (Brunmair & Richter 2019) | Round-robin by module |
| Hypercorrection | High-confidence errors are corrected more readily when feedback is attended to (Butterfield & Metcalfe 2001); persists at one week; replicated in classrooms | Confident-error callout |
| Calibration | Repeatedly predicting, testing and comparing improves judgement accuracy and reduces overconfidence | Confidence lock-in plus calibration feedback |
| Metacognitive illusions | Learners judge spacing and interleaving as *less* effective because they feel harder; refutation plus metacognitive prompts increase their use (npj Science of Learning 2024) | Session intro, empty-state and lesson-debrief copy |
| Scheduler accuracy | FSRS (DSR model) beats SM-2 in recall prediction on the open srs-benchmark, needing fewer reviews for the same retention | `src/progress/fsrs.ts` |
| Streak framing | Intact streaks highlighted in behaviour logs increase subsequent engagement relative to broken ones (Silverman & Barasch 2023, JCR) | Today panel shows intact streaks only |
| Overjustification | Performance-contingent rewards can undermine intrinsic motivation (Deci, Koestner & Ryan 1999) | Points only for correct recall |

## 6. What's still open, ranked

1. **Misconception-targeted feedback for `entry`/`faded-step`.** A wrong numeric/text answer still
   gets a generic "Not quite". A `wrongAnswers: [{ value | pattern, feedback }]` field would let
   authors target the specific error, as `tap-choice` already can. Engine plus content change.
2. **Standalone checkpoint prompts.** Review now asks lesson checkpoints out of context. Most read
   fine with the lesson title shown, but prompts that lean on the story ("the car's graph") are
   harder cold. The pedagogy skill now has a rule for new content; existing content needs an audit.
3. **Parameterised questions** (backlog item 6). This would turn review from "same item again"
   into *variable retrieval* (fresh numbers), which transfers better. It's the biggest multiplier
   on this loop.
4. **Reviewable explorables.** `manipulable-target` screens aren't reviewable yet. Rendering their
   widget inside a review card would bring the most distinctive screen type into spaced practice.
5. **Adaptive fading from evidence** (backlog item 7). The per-item stability, difficulty and
   lapses now recorded are exactly the signal a mastery model needs.
6. **Two-tier questions** (backlog item 3a). Confidence shipped; the "because…" reason tier hasn't.
7. **Learner-set desired retention** (0.85 / 0.9 / 0.95) and session size, in Settings.
8. **Streak repair.** Repairability softens the demotivating effect of a broken streak (Silverman
   & Barasch).
9. **Housekeeping found along the way (all fixed):**
   - removed two orphaned screen lessons in `alevel-mechanics`
     (`forces-and-newtons-laws/01-newtons-laws.screens.json`,
     `kinematics-suvat/01-motion-graphs.screens.json`). Leftovers from #22 that no `module.json`
     referenced; both modules use their Markdown lessons with the same ids;
   - `/favicon.ico` 404: `index.html` now declares the app icon (base-path aware);
   - the `KaTeX_Size3` font (large delimiters) was inlined by Vite as a `data:` URI, which the
     CSP's `default-src 'self'` blocked. `build.assetsInlineLimit` now never inlines font files,
     so every KaTeX face is a same-origin, precached file and the CSP stays strict.

## 7. Measuring it

Everything stays local. The loop now produces the signals the v2 evaluation plan (A2) asks for:

- first-ask recall rate per session (delayed retrieval at the FSRS-chosen gaps);
- lapses per item (forgetting after success);
- the confidently-wrong count and calibration buckets;
- predicted recall per module.

A playtest export can project these from `reviewState` and the kv `calibration` row without new
storage.

## References

- Rawson, K. A., & Dunlosky, J. (2022). Successive relearning: An underexplored but potent technique for obtaining and maintaining knowledge. *Current Directions in Psychological Science*. https://journals.sagepub.com/doi/full/10.1177/09637214221100484
- A meta-analytic review of the effectiveness of spacing and retrieval practice for mathematics learning (2025). *Educational Psychology Review*. https://link.springer.com/article/10.1007/s10648-025-10035-1
- Brunmair, M., & Richter, T. (2019). Similarity matters: A meta-analysis of interleaved learning and its moderators. *Psychological Bulletin*. https://pubmed.ncbi.nlm.nih.gov/31556629/
- Glaser, J., & Richter, T. (2025). The testing effect in the lecture hall: Does it transfer to content studied but not practiced? *Teaching of Psychology*. https://journals.sagepub.com/doi/10.1177/00986283231218943
- Butterfield, B., & Metcalfe, J. (2001). Errors committed with high confidence are hypercorrected. *JEP: LMC*. https://www.researchgate.net/publication/11641193_Errors_Committed_with_High_Confidence_Are_Hypercorrected
- The hypercorrection effect persists over a week, but high-confidence errors return (2011). *Psychonomic Bulletin & Review*. https://link.springer.com/article/10.3758/s13423-011-0173-y
- Hypercorrection of high-confidence errors in the classroom (2018). *Memory*. https://pubmed.ncbi.nlm.nih.gov/29781391/
- Optimizing self-organized study orders: combining refutations and metacognitive prompts improves the use of interleaved practice (2024). *npj Science of Learning*. https://www.nature.com/articles/s41539-024-00245-7
- Silverman, J., & Barasch, A. (2023). On or off track: How (broken) streaks affect consumer decisions. *Journal of Consumer Research*, 49(6). https://academic.oup.com/jcr/article-abstract/49/6/1095/6623414
- Open Spaced Repetition — srs-benchmark (FSRS vs SM-2 and others). https://github.com/open-spaced-repetition/srs-benchmark
- Open Spaced Repetition — py-fsrs (reference implementation the port is tested against). https://github.com/open-spaced-repetition/py-fsrs
- Rowland, C. A. (2014); Yang, C. et al. (2021); Deci, Koestner & Ryan (1999): see `docs/Evidence_Based_Design_for_learning`.
