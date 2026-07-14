# Experience Runtime v2 evaluation and baseline protocol

- Status: Proposed, pre-registered before the vertical slice
- Protocol version: `A2-2026-07-10.1`
- Baseline source revision: `33d221b1f5536734b47a8cc0043ba8f33cdcc860`
- References: `docs/EXPERIENCE_RUNTIME_V2_PLAN.md` sections 2, 7, 9, and 14; SRS section 14

## Purpose

This protocol separates attractive in-session behaviour from delayed learning, transfer, and
voluntary return. It is local-first: no learner identity, network endpoint, background export, or
remote analytics is part of the baseline. A session may be exported only when the tester
explicitly chooses to export it.

The thresholds below are release decision rules for the first vertical slice, not claims that a
small pilot can establish population-level efficacy. The baseline must be collected before the
slice is enabled for general use.

## Baseline snapshot

The current v1 tree at the source revision above contains:

| Inventory | Count | How it was measured |
| --- | ---: | --- |
| Courses | 9 | `build-content.mjs --strict` |
| Modules | 78 | `build-content.mjs --strict` |
| Markdown lessons | 158 | content-tree file inventory |
| Screen-sequence files | 93 | content-tree file inventory |
| Python items | 13 | content-tree `items/**/*.py` inventory |

The two representative v1 control experiences are:

- `v1-electricity-markdown`: `physics/alevel-physics/electricity-dc`, the content-matched
  control for the selected vertical slice.
- `v1-screens-format`: `maths/alevel-pure/differentiation-1`, a screen-sequence control for
  format-level comparison. This is a format baseline, not a subject-matched learning control.

The authoring workflow baseline is also structural and repeatable:

- `scripts/new-module.mjs` creates four files for a new course/module fixture and makes no
  `src/**` changes;
- the untouched scaffold fails strict MVC validation with exactly two expected errors: one lesson
  instead of three and two assessment questions instead of eight;
- a content-only authoring path therefore starts at four files and zero engine files, while the
  time-to-MVC and number of validation iterations are recorded during the timed run below.

## Metrics

Every metric has a stable definition so v1 and v2 runs cannot be compared by changing the
denominator after the fact.

| Metric | Definition | Collection | First-slice decision rule |
| --- | --- | --- | --- |
| Time to first meaningful action | Seconds from first learner-visible scene render to the first committed prediction, activity action, or evidence-bearing answer | `firstActionAt - sessionStartAt` | p90 <= 20 s, matching the v2 plan |
| Exit point | Last lesson/screen/node reached before an explicit completion or session end | last `entered` event | No earlier-exit band may be more than 5 percentage points worse than v1 |
| Attempts and errors | Count of submitted incorrect outcomes per goal opportunity, separated from hints | outcome events | Report distribution; do not optimise by making goals easier |
| Hint use | Number and depth of hints revealed per goal opportunity | hint events | Report distribution and independence rate; a lower count is not automatically better |
| Immediate retrieval | Score on an unseen but same-skill item immediately after the experience | scored review item | Descriptive only; not the ship gate |
| Delayed retrieval | Score on a context-light same-skill item at 24 hours, 7 days, and 21 days | scheduled local review item | V2 must not be more than 5 percentage points below v1 at any delayed checkpoint |
| Transfer | Score on a near-neighbour problem with changed surface context and unchanged mechanism | delayed transfer item | V2 must not be more than 5 percentage points below v1 |
| Voluntary continuation | Share of completed sessions where the learner starts the offered next mission/review without being required to do so | next-action event | Target at least 10% relative lift; otherwise revise unless learning is clearly non-inferior and qualitative evidence explains the gap |
| Review return | Share of due review items opened and completed within the declared review window | review start/complete events | Must not be more than 5 percentage points below v1 |
| Authoring time | Wall-clock time from scaffold command to strict MVC pass, excluding content research time recorded separately | author session ledger | Record median and range; no fixed ship threshold until two workflows are observed |
| Files touched | Number of content, schema, source, and documentation files changed for the same authored unit | author session ledger | V2 target is zero application-source files for registered capabilities |
| Validation friction | Number of strict validation runs and failures before MVC pass, grouped by error kind | command ledger | Report, then reduce repeated categories in the authoring tooling |

## Local collection protocol

1. Start a fresh browser profile and create a random, non-identifying `sessionId`.
2. Record build revision, content version, experience/control arm, browser engine, viewport,
   reduced-motion setting, and start time.
3. Run a short pretest that samples the target misconceptions without teaching the mechanism.
4. Run the assigned v1 or v2 experience. Record first action, entered screens/nodes, outcomes,
   hints, errors, branch choice, completion, and voluntary next action.
5. Run the immediate retrieval and transfer items without reopening the explanation.
6. Reopen only the standalone delayed items at 24 hours, 7 days, and 21 days. Record score,
   latency band, independence, and whether a hint was used.
7. Export the session only by explicit tester action. Before sharing, inspect the export for
   names, free-text identifiers, URLs, or accidental learner data.

The portable session shape is intentionally small:

```json
{
  "protocolVersion": "A2-2026-07-10.1",
  "sessionId": "random-local-id",
  "buildRevision": "git-revision",
  "arm": "v1-electricity-markdown",
  "events": [
    { "kind": "first-action", "atMs": 18400 },
    { "kind": "outcome", "skill": "series-current", "correct": false, "hints": 1 },
    { "kind": "completion", "voluntaryNext": true }
  ],
  "delayed": [
    { "delay": "24h", "item": "divider-transfer-1", "score": 1, "hint": false }
  ]
}
```

This is a collection format for the protocol, not permission to add telemetry. The future H1
diagnostics work owns the on-device event projection and explicit export UI; until then, a
Playwright fixture or a manually recorded local ledger may supply the same fields.

## Baseline run design

The minimum operational baseline is 12 sessions per arm, balanced across the two v1 controls and
the v2 slice once it exists. If fewer sessions are available, the result is labelled a smoke
baseline and cannot be used as a ship decision. Session order is counterbalanced where the same
tester sees more than one arm. Participants are not asked for names or accounts.

The pre-registered comparison is absolute percentage points for retrieval/transfer/return and
relative percentage change for voluntary continuation. Report medians for time and latency bands,
means with the sample size for scores, and the raw denominator for every proportion. Keep all
failed, abandoned, and hint-assisted attempts in the report.

## Authoring baseline run

For the repeatable author workflow, record one timed run using `new-module.mjs` in a temporary
content root and one run editing an existing module. Each run records:

- start and finish timestamps;
- files created/modified, separated into content, docs, schema, and `src/**`;
- every validation command and its exit code;
- validation failure categories and iteration count;
- research time and writing time separately;
- whether the final result passed `build-content.mjs --strict`.

The baseline comparison is against the same fields for the v2 Studio/scaffold workflow. A v2
authoring claim is not valid if it hides schema, docs, or fixture work outside the measured run.

## Ship/revise rule

Ship the first slice only if:

- delayed retrieval and transfer are non-inferior to the matched v1 control within the 5-point
  boundary;
- v1 routes and the v2 fallback remain available under the A4 rollback test;
- accessibility, offline, CSP, resume, and explicit local-export gates pass;
- p90 time to first meaningful action is at most 20 seconds; and
- voluntary continuation meets the target or a documented revise decision explains why learning
  evidence justifies another iteration.

Any delayed-learning regression beyond the 5-point boundary is a revise decision, regardless of
completion rate, time-on-task, or positive qualitative feedback.

## Source and research notes

The selected topic stays within the UK A-level-informed scope already used by LearnLab. The
official scope cross-checks are [AQA A-level Physics: Mechanics and materials](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/subject-content/mechanics-and-materials),
[AQA A-level Physics: Electricity](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/subject-content/electricity),
and [Pearson Edexcel A-level Physics specification](https://qualifications.pearson.com/content/dam/pdf/A%20Level/Physics/2015/Specification%20and%20sample%20assessments/pearsonedexcel-alevel-physics-spec.pdf).
Misconception research used for the slice is [Engelhardt and Beichner's DIRECT circuits study](https://arxiv.org/abs/physics/0304040)
and the more recent [Physical Review Physics Education Research study of student circuit ideas](https://journals.aps.org/prper/abstract/10.1103/PhysRevPhysEducRes.20.020128).
