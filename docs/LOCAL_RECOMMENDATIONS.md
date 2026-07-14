# Local recommendations and adaptive scaffolding

LearnLab recommendations are deterministic, local, and inspectable. `buildLocalRecommendationPlan` returns Continue, Quick Review, and Recommended Next actions with a human-readable reason for each. It also returns an explicit always-available browse route: recommendations are suggestions, never a route lockout.

## Decision rules

- **Continue:** most recently updated in-progress module; ties use the module ID.
- **Review:** always available, with the local due count. A recorded confident unsuccessful response is stated plainly in the review reason when present.
- **Next:** the first course supplied by the local catalogue context.
- **Fuller support:** any confident unsuccessful response, or fewer than two evidence opportunities.
- **Faded support:** only a `secure` skill with at least three independent successes. Mixed or supported evidence remains at standard support.

The small local recommendation log stores the plan ID and the same human-readable reasons (up to 100 entries). It contains no learner identity and does not alter progress, mastery, review scheduling, or browsing permissions.

## Delayed evaluation and rollback

Recommendation quality is judged on delayed performance, not completion or in-session comfort. A faded-support exposure waits seven days before evaluation. It rolls back to fuller guidance only when at least that delay has elapsed and delayed independent evidence is absent or does not yet include an independent success. This conservative rule is intentionally inspectable and can be replaced by a measured experiment policy later.
