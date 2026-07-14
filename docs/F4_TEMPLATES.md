# F4 design and investigation templates

`src/experience/templates/constraints.ts` provides deterministic, domain-neutral evaluation for
design-under-constraints and evidence-investigation activities. Authors supply visible options,
costs, tags, constraints, evidence, required evidence, and hypotheses; the functions return
accepted/partial status with authored-id feedback. Multiple strategies may be accepted. A conclusion
cannot pass before required evidence is collected and supports it.

Partial results are feedback only. A scene may emit mastery evidence only when `accepted` is true;
never treat `partial` as mastery. Pair the returned result with the existing plugin outcome contract
and typed scene effects. The fixtures in the unit tests are intentionally domain-neutral. A vertical
slice owner should use a template only when its learning objective genuinely includes trade-offs or
evidence-based elimination.
