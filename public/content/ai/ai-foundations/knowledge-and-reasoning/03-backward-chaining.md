# Backward chaining and comparing the two strategies

**Backward chaining** is a **goal-driven** reasoning strategy: instead of growing the set of known facts outward, it starts from a specific question — the **goal** — and works backward, asking "what would have to be true for me to prove this?"

## The algorithm

To prove a goal `G`:

1. If `G` is already a known fact, it is **proved** immediately.
2. Otherwise, find a rule whose **head** (conclusion) matches `G`.
3. To fire that rule, every condition in its **body** must be proved. Treat each condition as a new **subgoal**, and recursively apply this same procedure to it (step 1, then step 2 if needed), working through the conditions in order.
4. If every subgoal in the body is proved, `G` is proved. If no rule concludes `G` and `G` is not a known fact, `G` **fails** — it cannot be established from the knowledge base.

This is naturally a depth-first process: the engine dives into proving the first subgoal completely (which may itself spawn sub-subgoals) before moving on to the next one.

## The same worked example, run backward

Reuse the knowledge base from the previous lesson:

```
Facts:  has_feathers(kim)  lays_eggs(kim)  can_swim(kim)
        has_webbed_feet(kim)  quacks(kim)
        has_fur(max)  gives_milk(max)  eats_meat(max)

R1:  has_feathers(X), lays_eggs(X)                 ->  bird(X)
R2:  bird(X), can_swim(X)                           ->  waterbird(X)
R3:  waterbird(X), has_webbed_feet(X), quacks(X)    ->  duck(X)
R4:  has_fur(X), gives_milk(X)                      ->  mammal(X)
R5:  mammal(X), eats_meat(X)                        ->  carnivore(X)
```

This time we ask the question directly: **is `duck(kim)` true?**

:::reveal{title="Worked example: full backward-chaining trace"}
**Goal: prove `duck(kim)`.** It is not a known fact, so find a rule concluding it: **R3**, body `waterbird(kim), has_webbed_feet(kim), quacks(kim)`. All three must be proved.

1. **Subgoal: `waterbird(kim)`.** Not a known fact. Find a rule concluding it: **R2**, body `bird(kim), can_swim(kim)`.
   1. **Sub-subgoal: `bird(kim)`.** Not a known fact. Find a rule concluding it: **R1**, body `has_feathers(kim), lays_eggs(kim)`.
      - `has_feathers(kim)` — known fact. ✓
      - `lays_eggs(kim)` — known fact. ✓
      - Both conditions of R1 are proved, so **`bird(kim)` is proved**.
   2. `can_swim(kim)` — known fact. ✓
   - Both conditions of R2 are proved, so **`waterbird(kim)` is proved**.
2. `has_webbed_feet(kim)` — known fact. ✓
3. `quacks(kim)` — known fact. ✓

All three conditions of R3 are proved, so **`duck(kim)` is proved. Goal succeeds.**

The rules consulted were **only** R1, R2 and R3, in that order (R3 first, then R2, then R1, then back up); the facts consulted were only `has_feathers(kim)`, `lays_eggs(kim)`, `can_swim(kim)`, `has_webbed_feet(kim)` and `quacks(kim)`. **R4, R5, and every fact about `max` were never touched.**
:::

## Comparing forward and backward chaining

The two traces prove the same thing about `kim`, but they explore very different amounts of the knowledge base:

- **Forward chaining** touched all five rules and derived five new facts, including `mammal(max)` and `carnivore(max)` — completely irrelevant to the question we actually cared about.
- **Backward chaining** touched only the three rules on the path to the goal and never looked at `max` at all.

:::callout{kind="key"}
**Backward chaining is usually more efficient when you have one specific goal to check**, especially in a large knowledge base where most rules have nothing to do with that goal — it only ever explores what the goal depends on. **Forward chaining is usually more efficient (or simply necessary) when you don't have a single fixed goal in advance** — for example, when you want to derive everything a fresh batch of facts implies, or feed a monitoring system that must react to whatever new conclusions follow from incoming data.
:::

Backward chaining is not free of costs, though: if the same subgoal shows up in several different branches of the search (which can't happen in this small, linear example, but is common in bigger rule sets), a naive implementation re-proves it from scratch every time, doing repeated work. Forward chaining, having already stored every fact it derives, never re-derives the same fact twice. Production expert-system tools generally offer both strategies — and some let a rule base be queried both ways — because the right choice depends on whether you are asking "what does this fact set eventually imply?" (forward) or "is this one thing true?" (backward).

:::callout{kind="warning"}
Both strategies rely on the rule set actually terminating. A rule whose conclusion feeds back into its own condition (directly or through a cycle of other rules) can make backward chaining loop forever chasing the same subgoal, and can stop forward chaining from ever reaching a fixpoint in the way described here. Well-designed knowledge bases avoid such cycles.
:::

You have now seen both halves of rule-based reasoning: representing knowledge as facts and rules, and the two standard strategies — data-driven forward chaining and goal-driven backward chaining — an inference engine uses to reason over that knowledge. The end-of-module assessment checks all three lessons.
