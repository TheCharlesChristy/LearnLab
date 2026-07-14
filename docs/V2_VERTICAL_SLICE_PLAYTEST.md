# Harbour hoist v2 vertical-slice playtest

## Scope and boundary

`public/content/v2/harbour-hoist/` is the first complete v2 campaign chapter. It uses the existing flash-recall, self-explanation, experiment-and-infer, and diagnose-and-repair mechanics. The only engine seam is the `diagnose-repair@1.0.0` adapter that exposes the already reusable F2 template through the registered ActivityPlugin boundary. Scene effects, checkpoints, evidence, resume, and persistent state remain owned by the runtime.

The chapter is static and local first. It declares no remote assets, network calls, account data, or executable content. Its state declaration is explicit: `/hoist/repaired`, `/hoist/evidence`, and `/hoist/resultant-understood`.

## Research brief and answer verification

The target is GCSE force work: identify a resultant force from straight-line forces and recognise balanced forces as a zero resultant. This is within the [AQA GCSE Physics forces specification](https://www.aqa.org.uk/subjects/physics/gcse/physics-8463/specification/subject-content/forces), which explicitly includes resultant force, balanced forces, and zero resultant. The independent physics check is [OpenStax on equilibrium](https://openstax.org/books/college-physics/pages/9-1-the-first-condition-for-equilibrium), which states that equilibrium requires zero net external force.

Every numeric claim was independently recomputed with upward positive:

| Case | Calculation | Result used in content |
| --- | --- | --- |
| Equal readings | `+200 N + (-200 N)` | `0 N` |
| Low support reading | `+160 N + (-200 N)` | `40 N downward` |
| Transfer and delayed review | `+120 N + (-90 N)` | `30 N upward` |

The unsigned-total distractor is a mechanically derived fallback, not a claim about prevalence: ignoring direction gives `160 + 200 = 360`, which cannot explain the zero-resultant trial. The moving-object-implies-force misconception is deliberately not used, because the chapter does not need it. The repair distractor is causal and testable: a jammed brake would oppose motion, whereas the measured force imbalance directly accounts for the observed downward drift.

## Pedagogy and campaign map

The throughline is one harbour hoist fault. Every scene advances that same diagnosis.

1. `recall-reading` commits retrieval before instruction. A self grade of `again` branches to `guided-sum`; any other self grade continues directly to the experiment.
2. `guided-sum` supplies a short signed-force model and reconverges at `experiment-balance`. The branch changes support, not the learning destination.
3. `experiment-balance` requires prediction, both controlled observations, a supported rule, and a transfer answer.
4. `diagnose-repair` requires the symptom, the force-reading evidence, a compatible diagnosis, and a causal repair. The wrong brake diagnosis gives targeted feedback and stays in the same accessible flow.
5. `hoist-balanced` is the payoff. It names the opening force reading and the repair consequence.

The delayed review item is standalone and can be rendered without the campaign context. It uses a new 120 N upward and 90 N downward force pair.

## Technical playtest matrix

| Coverage | Evidence required before a ship decision |
| --- | --- |
| Graph and all endings | Strict content validation plus the targeted `vertical-slice.test.ts` branch and persistent-effect assertions. |
| Keyboard and screen reader | Tab through every labelled control, verify focus visibility and polite feedback, and complete both recall routes and the repair flow. |
| Touch and mobile | Complete the same routes at a 360 px viewport. Confirm every control remains a labelled native control with a 44 px target. |
| Reduced motion | Enable reduced motion. Confirm the text alternatives in every scene are sufficient and no timed motion is required. |
| Offline and CSP | Load the production build under the existing CSP/offline checks and complete the chapter without a network request. |
| Resume | Reload at each named checkpoint: `recall-resultant`, `guided-signed-sum`, `force-reading-evidence`, and `evidence-based-repair`. Verify no effect, evidence record, or celebration is duplicated. |
| Performance | Record production lazy-chunk sizes and confirm every declared activity remains within its 150 KB gzip budget. |

The automated checks cover graph validity, branch reconvergence, persistent repair state, generated plugin contracts, and content linting. The remaining rows are a required human technical checklist because the learner v2 route is still behind its feature boundary.

## Baseline and learner playtest protocol

Compare the chapter with the existing force-balance learning path using local diagnostics only. For each condition, record time to first action, exits per node, attempts and hint use, delayed review outcome at least 24 hours later, and voluntary return to the next session. Do not export raw answers, free text, state variables, identifiers, or event logs. Use the bounded aggregate export described in [`PLAYTEST_DIAGNOSTICS.md`](PLAYTEST_DIAGNOSTICS.md).

Run at least 12 consented pilot learners per condition before interpreting percentages. Assign the same delayed review item after 24 hours or more. Record accessibility blockers separately from learning outcomes. The comparison is descriptive at pilot size, not a learner ranking.

### Decision rule

- **Ship:** all technical rows pass, no critical accessibility or resume defect remains, delayed review is not more than five percentage points below baseline, and voluntary continuation is at least baseline.
- **Revise:** a technical row is incomplete, any accessibility or resume defect is found, or evidence is too sparse to apply the ship rule. Revise the affected scene and rerun the same checks.
- **Stop:** delayed review is more than ten percentage points below baseline after a repeated pilot, or the branch/mechanic cannot be made accessible and local-first within scope.

### Current decision

**Decision: REVISE.** The automated technical validation is complete, but no consented learner baseline or delayed-review sample has been collected in this repository session. A human learner playtest must not be fabricated from automated results. Do not expand v1 migration or call the chapter shipped until the protocol above has real aggregate evidence and the manual technical matrix passes.
