# Executable authoring workflow

Status: intake, planning, capability discovery, scaffolding, shared pack validation,
local preview staging and evidence preservation are implemented. One circuits
episode has been authored through these commands. Studio inspection, parameterised
variants, complete pilots and Git delivery automation remain pending. This first
slice does **not** satisfy the complete harness goal.

Use Node 22.18 or newer: the CLI shares the browser's typed pack/model contracts
through Node's built-in TypeScript stripping. No extra authoring service is needed.

Run `npm run author:course -- <command>`. Commands return inspectable JSON and exit
nonzero on an invalid contract. No inference, credentials, accounts or authoring API
calls are built in. An external coding agent supplies the reasoning and interviews;
its model subscription/API costs are separate and depend on the user's provider.
The CLI never claims to semantically understand a subject from keywords.

## Start and contextual intake

```sh
npm run author:course -- start --run authoring/runs/my-course --request request.txt --brief brief.json
npm run author:course -- intake --run authoring/runs/my-course --brief answers.json
npm run author:course -- status --run authoring/runs/my-course
```

`request.txt` is the requester's natural-language request and may reference supplied
sources. Brief JSON records title, subject `{id,title}`, audience, descriptive level,
bounded outcomes, prerequisites, scope/exclusions, curriculum (or `none`), sources,
play concept, decisions, assumptions, unresolved questions and delegated choices.
See the committed circuits/history inputs in `authoring/inputs/`.

Questions describe missing fields using the course/subject context. The agent must
refine them using the actual subject and contradictory answers; generic field
questions are diagnostics, not an instruction to ask every question verbatim. Never
ask for already-recorded decisions. Resolve delegated choices autonomously, then
record the answers. Delegation alone does not satisfy a missing field. Empty source
and prerequisite lists are valid deliberate choices. Sources still need research.

`intake` merges a partial brief into the existing brief, retains numbered revisions,
and invalidates the current plan. It never deletes previous verified work. It does
not update the original request. Open questions must be resolved before planning.

## Plan before bulk authoring

```sh
npm run author:course -- plan --run authoring/runs/my-course --file plan.json
```

The plan declares stable episode IDs, activities, assessments, estimates, recovery,
optional experiments and an advisory prerequisite DAG. Every agreed outcome maps
to teaching episodes, independent evidence, a fresh transfer task and a criterion.
Research decisions record source access, strength, limits and validation plans.
The harness rejects missing prerequisites, cycles, duplicate IDs, unknown and
uncovered outcomes, and inconsistent traceability. It validates structure, not
whether the teaching is excellent or the sources/answers are correct.

## Discover capabilities and preserve evidence

```sh
npm run author:course -- capabilities
npm run author:course -- schemas
npm run author:course -- record --run authoring/runs/my-course --kind research --file research-ledger.json
npm run author:course -- record --run authoring/runs/my-course --kind playthrough --file observation.json --note "Keyboard failure, awaiting revision"
```

Discovery reads existing widget keys, screen/question schemas, and the laboratory
activity registry. The implemented laboratory activities are `choice` and `circuit`;
older v2 negotiation fixtures are not implemented activities. `schemas` emits brief,
plan, pack and activity contracts from their source of truth. The generated browser
pack validator is checked by `npm run validate:laboratory` and the production build.
See [activity contracts](ACTIVITIES.md) for controls, marking, outputs and limits.

Artifacts are copied under the run, hashed with SHA-256, and stamped with Git
revision, brief hash and current plan hash. `status` checks request, current brief,
current plan and artifact integrity. Hashes detect accidental drift, not hostile
changes to the whole run. A manifest and its historical revisions are inspectable
files, not a secure signature or proof of scientific validity. Artifacts are capped
at 16 MiB each; split recordings if needed. Runs are single-writer local directories.
Do not operate two author commands concurrently on one run.

Research, content, check, playthrough, critique, owner feedback, revision and delivery
are distinct artifact kinds. A failed playthrough is useful evidence and should be
retained. The presence of a file never certifies that its gate passed. No command
declares the overall implementation goal achieved.

## Scaffold, validate and stage a local preview

```sh
npm run author:course -- scaffold --run authoring/runs/my-course --output authoring/drafts/my-course
# Or build a first slice using an episode ID from the verified plan:
npm run author:course -- scaffold --run authoring/runs/my-course --output authoring/drafts/my-course-first --episode first-investigation
npm run author:course -- validate-pack --run authoring/runs/my-course --file authoring/drafts/my-course/pack.json
npm run author:course -- stage-pack --run authoring/runs/my-course --file authoring/drafts/my-course/pack.json
VITE_EXPERIENCE_RUNTIME_V2=true npm run build
```

Scaffolding requires a complete retained brief and valid current plan. It creates a
new directory with metadata and deliberately incomplete episode placeholders. Fill
nodes, references and registered activity data before validation; an empty scaffold
cannot get a misleading pass. Subject IDs and level descriptions are unrestricted
within the schema. A first slice reports the remaining planned episodes explicitly.

Validation uses the same parser as the learner app: schema, capability versions,
skill and episode prerequisite DAGs, reachable scene branches, no scene cycles or
orphans, independent-transfer opportunities, circuit bounds and reachable witnesses.
It verifies local asset closure and rejects unlisted files and paths escaping the
pack. These checks do not prove a source is true or a learning outcome is met.

Staging copies pack data and listed assets into `public/laboratory/<id>/`, retains a
snapshot in the run and provides a local walkthrough route. Existing previews need
`--replace`; changed packs must increment their version. Staging is not publication.
Run `npm run validate:laboratory` after staging to check the complete preview tree,
including stale or unregistered files. Remove obsolete assets deliberately when
updating a pack. Production builds generate checksummed acquisition manifests.
The learner routes remain behind `VITE_EXPERIENCE_RUNTIME_V2=true` in this prototype.

## Subsequent author procedure

1. Read the author/research/pedagogy/platform skills and live registry contracts.
2. Start a run **before** drafting a course; preserve the request and material choices.
3. Research sources and misconceptions, plan bounded outcomes and concept-bearing play.
4. Build the first complete episode, play it in the production browser and revise.
5. Scaffold before drafting through the same harness; validate and stage each slice.
   Create registered code extensions in focused platform PRs where required.
6. Author the remaining episodes using the shipped contracts and retain actual files,
   model checks, mistakes, help/escape paths, browser artifacts and critiques.
7. Play the actual rendered course on all consequential paths. Record author self-check
   honestly; use independent review when available, never invent it.
8. Deliver a focused PR with validation, limitations and owner walkthrough route.
9. Record the owner's experience and revise. Agent critique cannot certify human fun.
