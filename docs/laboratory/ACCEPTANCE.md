# Laboratory acceptance and evaluation plan

Protocol `laboratory-2026-09-27.1`, recorded before authoring the pilots. This
supersedes the earlier proposed A2 human-data release gates for *owner-preview
delivery*: month-long recruitment is follow-on validation, not a gate blocking a
working product. It does not establish superiority or retire v1.

| Gate | Required evidence | Initial revision trigger |
| --- | --- | --- |
| First action | Time from meaningful activity render to learner's first conceptual action; record loading separately | Owner cannot find a meaningful action within roughly 20 seconds; this is a design target |
| Outcome coverage | Every bounded outcome maps to an activity and assessment, with prerequisites and transfer | Any uncovered outcome or merely cosmetic activity |
| Model/marking | Independently derived calculations, boundary cases, alternative answers, unit/tolerance checks, reachable goals | Any incorrect answer, unreachable goal or misleading unsupported circuit |
| Graph | All episodes/nodes and consequential paths, mistakes, help, escape, retry, resume, exploration | Unreachable authored branch or assistance giving independent credit |
| Accessibility | Actual keyboard and touch operation, focus/announcements, text equivalent, reduced motion and text expansion | Essential task unavailable by any supported input route |
| Responsive | 360px phone, tablet, desktop, phone landscape, light/dark and 200% text | Hidden controls, horizontal clipping or unusable density |
| Persistence | v1 regression, v2 version guard/migration, export/erase/import, write failure recovery | Lost state without surfaced error and export path |
| Offline | Explicit complete download; close/reopen with network blocked; all episodes/tools/assets/hints/review/save/resume | Ready label before complete compatible cache, or a required remote dependency |
| Privacy | Inspect requests during all flows; local event log and explicit exports | Runtime inference, telemetry or implicit uploads |
| Harness | New subject request, targeted gaps, complete brief/plan, scaffold/preview/check/record/resume, focused PR workflow | Lost brief, orphan green, invented capability or undocumented hidden rule |
| Owner | Written route observations, fun/interest, problems and revised verification | Any unresolved material problem in owner's report |

## Competence and timing

Primary measure: active learning minutes to a predefined per-capability criterion,
conditioned on baseline knowledge. Keep learners who never reach the criterion in
results with elapsed time and non-attainment. Do not average only successful users.

Record baseline, independent first responses, assistance kind/depth, answer exposure,
retry practice, transfer and delayed responses separately. Circuits competence
requires a fresh numeric/design task and marked causal prediction. History conclusions
require source-backed claims, corroboration and acknowledged limits judged against
an authored rubric by a human reviewer; self-reflection alone is not mastery.

Active time includes productive experiments and reading. The proposed local timer
pauses on explicit pause, background tab and after two minutes without input, with a
visible resume control; inactivity is never a difficulty signal. Readers can explicitly
keep reading time active. Validate these rules in owner playtest and report sensitivity
to the idle cutoff. No speed bonus, and no cross-level scientific progress score.

Record voluntary continuation, voluntary return, optional enjoyment response and owner
observations separately from assessment performance. Do not call agent personas human
participants or independent reviewers when the author is doing the checking.

At approximately seven and thirty days, offer fresh delayed tasks locally. Browser
notifications from a static app cannot guarantee scheduled reminders after closure.
Provide in-app due review and an optional explicitly exported calendar reminder;
notification support, if used, is optional and capability-tested. Unseen delayed
tasks remain unobserved rather than failed, passed or imputed.

## Controlled comparison follow-on

Compare equivalent bounded outcomes, source material and fresh assessments with a
concise reading/worked-example control. Match baseline and available time, randomise
or counterbalance, and retain non-attainment, help, attrition and delayed missingness.
Register scoring/rubrics and sample rationale before collecting data. One owner and
agent walkthroughs yield usability evidence, not population efficacy. Do not use
the unrelated differentiation lesson as a circuits learning comparator.

## Required checks at delivery

Content strict validation, lint, TypeScript, full unit/integration suite, Python
tests where affected, production build/size budget and production browser checks.
Attach screenshots/recordings and failures followed by fixes to authoring runs.
Report browser engines and actual device coverage; Chromium touch emulation is
not a physical iPhone or Safari result. Each PR states what its checks establish.
