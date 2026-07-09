---
name: learnlab-research-content
description: Research a topic before authoring new LearnLab lessons, modules, or courses — pin down the right curriculum scope/depth against adjacent modules, verify formulas and facts against authoritative sources, research the documented misconceptions needed for distractor and feedback design, and independently re-derive worked examples before they go in a lesson or assessment.json. Use before writing any new module, before adding a topic to an existing module, before writing mcq distractors or a prediction hook, and before trusting a remembered formula, exam-board convention, or numeric fact in maths, physics, CS, or AI content.
---

# Researching LearnLab content before authoring it

LearnLab (see `SRS-LearnLab.md`) ships UK A-level-informed content across maths, physics, CS and
AI (§8.1–§8.5). §8.1 is explicit: "UK A-level specifications (Edexcel/AQA for maths & physics,
AQA/OCR for CS) are the syllabus reference for scope — content is specification-informed, not
exam-board-branded." That sentence is the whole job description for this skill: get the scope and
the facts right by checking against real specifications and independent computation, without
pretending to be any one exam board.

Do this research **before** writing a lesson, module, or assessment question — not as a
proofreading pass afterward. Three failure modes matter: authoring a module that duplicates
or contradicts a sibling module's scope, authoring a formula or worked answer that is subtly
wrong, and authoring quiz distractors or "common pitfall" callouts from imagined rather than
real learner errors. All are cheap to prevent up front and expensive to find later.

## 1. Pin down scope and depth before writing anything

A topic's correct depth is not decided by what you remember about it — it's decided by where it
sits in §8.1–§8.5's level taxonomy (`foundation` / `gcse` / `alevel`) and by what the *sibling*
modules already do or deliberately don't do. Before writing a single lesson:

1. **Read §8.2–§8.5 in `SRS-LearnLab.md`** for the exact module list of the course you're touching,
   and skim the module lists of any lower- or higher-level course covering related material.
2. **Read the `module.json` of every adjacent module** (same course, one level down, one level up,
   and — importantly — the same real-world topic in a *different subject*). Look at its
   `objectives` field specifically; that's where a prior author already drew the scope line.
3. **Check for cross-course duplication of the same physical topic**, not just same-course overlap.

Two real, concrete precedents from this repo:

- **`maths-foundation/quadratics-intro` vs `alevel-pure/quadratics-and-inequalities`**
  (`public/content/maths/maths-foundation/quadratics-intro/module.json` vs
  `public/content/maths/alevel-pure/quadratics-and-inequalities/module.json`). The foundation
  module's objectives stop at factorising `x^2+bx+c` with integer factor pairs and solving from
  factorised form — it deliberately never mentions the discriminant or the quadratic formula. The
  `alevel-pure` module picks up exactly there: "solve quadratic equations by... using the quadratic
  formula," "use the discriminant `b^2-4ac`... ," inequalities, simultaneous equations. If you were
  asked to touch either module, reading the other one first tells you exactly where the boundary
  is — don't let the foundation module creep into formula/discriminant territory, and don't have
  the A-level module re-teach factorising from scratch.
- **`alevel-mechanics/kinematics-suvat` vs `alevel-physics/mechanics-and-energy`** — the same
  physical content (SUVAT equations, projectile motion) appears in *two different subjects*. The
  maths module (`public/content/maths/alevel-mechanics/kinematics-suvat/module.json`) treats SUVAT
  as a topic to *derive and apply* algebraically. The physics module
  (`public/content/physics/alevel-physics/mechanics-and-energy/module.json`) treats the same
  equations as a known tool folded into a broader physics unit (vectors → SUVAT → projectiles →
  Newton's laws → energy), building toward force/momentum/energy analysis. Neither module should
  be edited without knowing the other exists — a naive rewrite of one in isolation risks silently
  diverging on notation, sign convention, or the value of `g` used, or duplicating derivations that
  belong to the other subject's framing.

The rule this generalizes to: **before authoring or editing a module, grep the whole content tree
for its topic keywords** (`grep -ril "quadratic\|discriminant" public/content/`, or similar) and
read every `module.json` that turns up, not just the one you were asked to write. If two modules
would teach materially the same fact from two different angles, that's fine — decide deliberately
which one owns the derivation and which one treats it as a prerequisite, the way the two examples
above already do, rather than let it happen by accident.

Scope research also fixes the **level-dial setting** learnlab-lesson-pedagogy requires before
drafting: reading the adjacent modules' objectives tells you not just what to cover but who
you're writing for, which drives narrative dosage, worked-example fading depth, and tone.

## 2. Verify facts and formulas before they go in a lesson or assessment

`docs/AUTHORING.md` requires every quiz question to carry a full `explanation`, and in practice
every module in this repo shows complete worked computation there, not an assertion — e.g.
`public/content/physics/alevel-physics/mechanics-and-energy/assessment.json` q5 doesn't just state
the range of a projectile, it shows `R = u²sin(2θ)/g = 16²·sin(100°)/9.81 = 25.7 m` step by step.
Readers (and future you, debugging a bug report) need to be able to check every number by hand from
what's written. That bar only works if the number was actually checked by hand (or script) before
it was written down.

This repo has a documented history of exactly the failure mode this step prevents. See
`docs/DECISIONS.md` **D-020**: `ai-foundations/neural-networks-2-training`'s assessment asked for
"the epoch count where a full epoch has zero weight updates," worded so precisely that by its own
literal definition the answer was 3 — but the stored answer was 2, because whoever wrote it
followed the lesson's looser prose convention ("converged after 2 epochs") instead of re-deriving
the question's own stated condition. Schema validation (`build-content.mjs --strict`) cannot catch
this: the JSON was perfectly well-formed and internally passed every shape check. Only a
hand-verification pass that recomputed the epoch trace caught it. `docs/BUILD_PLAN.md`'s Phase
P2–P5 notes describe the orchestrator's response to this exact risk at scale, and it's worth
copying the risk model directly:

- **Continuous, formula-driven numeric content is highest-risk.** Phase P2 required *every* answer
  in `alevel-mechanics` and `alevel-statistics` (10 modules — SUVAT/F=ma/moments/friction, binomial
  probabilities, normal-distribution Φ(z) values) to be independently re-derived by the
  orchestrator, "not sampled — schema validation checks shape, not correctness, and these two
  subjects are most prone to silent, CI-invisible formula errors." Phase P3 applied the same 100%
  bar to all 11 `alevel-physics` modules (unit conversions, SUVAT/projectiles, circuits, fields,
  SHM, nuclear decay) for the identical reason. Phase P4 applied it to the four computation-heavy
  `ai-foundations` modules (gradient-descent traces, precision/recall/F1, sigmoid/threshold calcs,
  perceptron weight updates) and is what caught D-020.
- **Discrete, definitional content is lower-risk but not zero-risk.** `alevel-pure` (self-verify +
  orchestrator re-derives ≥3 of 15), `alevel-cs` (self-verify + orchestrator re-checks ≥3 of 11,
  weighted toward the numeric-conversion-heavy modules like `data-representation`'s base
  conversions/two's-complement/floating-point), and the conceptual `ai-foundations` modules
  (self-verify + spot-check ≥2 of 5) all still got partial independent verification, because even
  "mostly definitional" content contains numeric traces (search algorithms, FSM traces, truth
  tables) that are just as capable of being silently wrong.

Apply the same discipline to your own authoring, not just to a mechanical orchestrator pass:

1. **Before writing a formula-driven question or lesson claim, independently compute at least one
   worked example yourself** — don't just transcribe a formula from memory or from a single search
   result and trust its stated output. Use Python (`math`, `sympy`) or hand arithmetic, exactly as
   this repo's own verification passes did ("SymPy/Python cross-checks for calculus, hand
   arithmetic for algebra/trig/vectors/numerical methods," "critical regions via exact `comb(n,k)`
   summation in Python," "SOHCAHTOA/Pythagoras trig computed via Python's `math` module").
2. **Cross-check any formula you're not 100% certain of against at least two independent sources**
   before you commit to it — a single textbook or the first search result can encode a subtly wrong
   or oversimplified convention. Prefer exam-board specifications and mark schemes, or an
   established reference textbook, over a random blog or forum post.
3. **When a question's wording implies a definition, make sure the stored answer is the literal
   consequence of that wording**, not just "the number the lesson happens to use elsewhere" (this
   is precisely what went wrong in D-020 — the fix was to reword the question to match the lesson's
   actual convention, rather than force the answer to match an over-precise question).

Note that learnlab-lesson-pedagogy's patterns increase the number of values under this
discipline: every backward-faded worked-example step and every prediction-quiz answer is a
number you authored and must independently re-derive, exactly like an assessment answer.

## 3. Research the misconceptions, not just the facts

learnlab-lesson-pedagogy requires every mcq distractor to encode a *real* learner misconception
(so a wrong choice diagnoses the learner's thinking, and its explanation can name and correct the
specific error), and its best prediction hooks target a widespread wrong intuition. Both need
research: a distractor invented from imagination is usually either implausible (no one picks it,
so it teaches nothing) or accidentally defensible (ambiguous marking). Before writing a module's
assessment or its "common pitfall" callouts, spend a focused pass gathering the documented errors
for that topic, in this source-priority order:

1. **Exam-board examiner reports — the goldmine.** AQA, Edexcel/Pearson, and OCR publish a
   per-paper examiner report alongside every past paper and mark scheme, and these documents
   exist precisely to catalogue what real candidates got wrong and why ("a significant number of
   candidates differentiated instead of integrating," "the most common error was treating
   tolerance as relative"). Search e.g. `"AQA A-level physics examiner report projectile motion"`
   or `"Edexcel examiners report differentiation chain rule"` and read the actual PDF. One
   examiner report on your topic typically yields more usable distractors than any other single
   source. **Never copy the report's own example questions or answers** (copyright, and the
   adapt-resource skill's rules apply) — you are mining the *error patterns*, then building your
   own fresh questions around them.
2. **Discipline-based education research and concept inventories.** Physics education research
   has decades of catalogued misconceptions (the Force Concept Inventory's distractors are
   themselves a curated misconception list for mechanics); maths education and CS education
   research have equivalents (e.g. documented misconceptions about equality, negative-number
   arithmetic, variable assignment vs mathematical equality, reference vs value semantics).
   Search `"<topic> misconceptions" education research` and prefer published studies or
   university teaching pages over blogs.
3. **Reputable teaching-practice sources** (subject-association sites, exam-board teaching
   guides, well-known educator resources) as a supplement, with the usual scepticism about
   quality.
4. **Derived-by-making-the-mistake, as the fallback.** If nothing documented turns up for a
   specific question, derive a distractor by *genuinely performing* the plausible error yourself
   — do the sign slip, forget to square, use the radius where the diameter belongs — and record
   what value it produces. This guarantees the distractor is at least mechanically reachable by
   a real mistake, rather than an arbitrary wrong number.

Whatever the source, carry the finding into the content in two places: the distractor itself
(the value or statement the error produces) and the question's `explanation` (which names the
error: "If you got $-96$, you dropped the sign when squaring"). A misconception you researched
but can't trace into a specific wrong answer is also fair game for a
`:::callout{kind="warning"}` in the lesson prose, or as the target of the lesson's opening
prediction.

## 4. Using WebSearch / WebFetch effectively for this

When you need to check current UK-specification scope or a formula you're unsure of, you have
`WebSearch` and `WebFetch` available. Use them like a skeptical researcher, not like autocomplete:

- **Write targeted queries, not vague topic names.** `"AQA A-level physics specification mechanics
  circular motion"` or `"Edexcel A-level maths specification differentiation trigonometric
  functions"` gets you close to an actual spec PDF; `"circular motion A-level"` gets you random
  revision sites of wildly varying quality.
- **Go straight for the official specification/mark-scheme PDF when scope or depth precision
  matters** (e.g. "does this board's spec include the small-angle approximation at this stage?",
  "is this a Y12 or Y13 topic?"). Exam boards publish these publicly; they're the closest thing to
  ground truth for "what does A-level actually cover here." Their sibling examiner reports are
  the ground truth for §3's misconception research — fetch both while you're there.
- **Never trust a single source for a formula or a scope claim you're not already confident about.**
  Fetch at least two independent pages (a specification PDF plus a maths/physics reference site, or
  two different exam boards' specs) and check they agree before writing the content. If they don't
  agree, that's real signal — see §6 below.
- **Be actively suspicious of well-worn textbook phrasings that "sound right."** A formula or
  convention can be repeated everywhere in a form that's subtly imprecise (wrong sign convention,
  a special case presented as the general rule, an approximation stated as exact). The fact that a
  phrasing is common in training data is not evidence it's correct — that's exactly why step 2's
  independent computation matters even when a formula feels completely familiar.

## 5. Worked example: verifying a real assessment answer end to end

Walk through what this looks like concretely, using
`public/content/physics/alevel-physics/mechanics-and-energy/assessment.json` q5 as the case study
(illustrating the verification a new, similar question would need):

> "A ball is launched at $u = 16\,\text{m s}^{-1}$ at $50°$ above the horizontal... find the
> horizontal range." Stored answer: `25.7`, tolerance `0.3`.

1. **Identify the formula and confirm it's the right one for this scope.** The range formula for a
   projectile launched and landing at the same height is $R = \dfrac{u^2 \sin 2\theta}{g}$. Check
   this is standard across at least two sources (any A-level mechanics reference will state it) and
   confirm the launch/landing-height assumption applies (it does here — "launched... and landing at
   ground level").
2. **Independently compute it**, don't just trust the stored value:
   ```python
   import math
   u, theta, g = 16, math.radians(50), 9.81
   R = u**2 * math.sin(2*theta) / g   # -> 25.699...
   t = 2*u*math.sin(theta) / g         # companion q4: -> 2.4988...
   ```
   This gives `R ≈ 25.70`, matching the stored `25.7` within its `0.3` tolerance, and `t ≈ 2.50`,
   matching q4's stored `2.5` within its `0.05` tolerance. Both check out.
3. **If your computed value hadn't matched**, the next step is not to shrug and move on — re-derive
   by hand from first principles ($u_x = u\cos\theta$, $u_y = u\sin\theta$, time of flight
   $t=2u_y/g$, $R = u_x t$) to find whether the source formula, the given numbers, or your script
   has the error, exactly the way D-020 was traced back to the question's own wording rather than
   assumed to be a typo in the stored answer.

This is the standard to hold any new formula-driven question to: state the formula, confirm its
applicability conditions, compute it independently, and only then write it into the lesson or
`assessment.json`. And if the question is an mcq, one more step now applies: for each distractor,
state which §3 misconception produces it and verify that performing that error on these numbers
really yields the distractor's value.

## 6. When to flag ambiguity instead of guessing

§8.1's "specification-informed, not exam-board-branded" wording is a deliberate release valve: if
Edexcel and AQA phrase or scope a topic slightly differently (e.g. minor notational differences, or
one board introducing a technique a term earlier than another), you don't need to resolve that to a
single "correct" board convention — pick a reasonable, internally consistent choice and note it if
relevant. That is **not** license to guess on anything that has one factually correct answer: a
formula, a numeric result, a definition, or which of two boards' scope a specific technique falls
under when it actually matters for a prerequisite chain.

Flag genuine ambiguity (in your final report, not silently resolved) when:

- Two authoritative sources give **materially different formulas or numeric conventions** for the
  same named quantity (not just cosmetic notation) and you can't determine which this repo's
  existing content already assumes.
- The correct **scope boundary against a sibling module is unclear** even after reading its
  `module.json` and lessons — e.g. it's genuinely ambiguous whether a technique belongs in the
  `foundation` or `alevel` treatment.
- A worked example's independently-computed answer **doesn't match** a source's stated answer and
  you cannot resolve the discrepancy by hand re-derivation.

Don't flag simple exam-board notation variance (e.g. $\ln$ vs $\log_e$, or minor differences in how
a board orders steps in the same correct method) — pick one, use it consistently within the module,
and move on.
