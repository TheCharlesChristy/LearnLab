# Forward chaining: reasoning from facts to conclusions

**Forward chaining** is a **data-driven** reasoning strategy: start from the facts you already know, and repeatedly apply any rule whose conditions are satisfied to derive new facts, until either a specific goal fact has been derived or no rule can fire anymore.

## The algorithm

1. Start with the known facts.
2. Scan the rules from the top. Find the first rule whose **entire body** is already known to be true (every condition is a known fact) **and** whose conclusion is not already a known fact.
3. **Fire** that rule: add its conclusion to the set of known facts.
4. Go back to step 2 and scan again from the top (the new fact may now let an earlier rule fire).
5. Stop when a complete scan finds no rule left to fire — the knowledge base has reached a **fixpoint**, meaning every conclusion reachable from the starting facts has been derived. (If you only care about one particular goal fact, you may also stop the moment that fact appears.)

Because it fires whatever rule happens to be ready, forward chaining does not need to know the question in advance — it simply grows the set of known facts as far as the rules allow.

## A worked knowledge base

Consider two animals, `kim` and `max`, described by these initial facts:

```
has_feathers(kim)   lays_eggs(kim)   can_swim(kim)
has_webbed_feet(kim)   quacks(kim)
has_fur(max)   gives_milk(max)   eats_meat(max)
```

and this rule set:

```
R1:  has_feathers(X), lays_eggs(X)                    ->  bird(X)
R2:  bird(X), can_swim(X)                              ->  waterbird(X)
R3:  waterbird(X), has_webbed_feet(X), quacks(X)       ->  duck(X)
R4:  has_fur(X), gives_milk(X)                         ->  mammal(X)
R5:  mammal(X), eats_meat(X)                           ->  carnivore(X)
```

Suppose we want to know whether `kim` is a duck, i.e. whether `duck(kim)` can be derived.

:::reveal{title="Worked example: full forward-chaining trace"}
Known facts at the start: `has_feathers(kim)`, `lays_eggs(kim)`, `can_swim(kim)`, `has_webbed_feet(kim)`, `quacks(kim)`, `has_fur(max)`, `gives_milk(max)`, `eats_meat(max)`.

**Scan 1.** Check R1 for `kim`: its body `has_feathers(kim), lays_eggs(kim)` is entirely known, and `bird(kim)` is not yet a fact — **R1 fires**. New fact: `bird(kim)`.

**Scan 2** (restart from the top). R1 has nothing new to give. Check R2 for `kim`: its body `bird(kim), can_swim(kim)` is now entirely known (`bird(kim)` was just derived), and `waterbird(kim)` is new — **R2 fires**. New fact: `waterbird(kim)`.

**Scan 3.** R1, R2 have nothing new. Check R3 for `kim`: its body `waterbird(kim), has_webbed_feet(kim), quacks(kim)` is entirely known, and `duck(kim)` is new — **R3 fires**. New fact: `duck(kim)`. **The goal `duck(kim)` has now been derived.**

If we keep scanning to find everything the knowledge base implies (the fixpoint), the process continues:

**Scan 4.** R1–R3 have nothing new for `kim`. Check R4 for `max`: its body `has_fur(max), gives_milk(max)` is entirely known, and `mammal(max)` is new — **R4 fires**. New fact: `mammal(max)`.

**Scan 5.** Check R5 for `max`: its body `mammal(max), eats_meat(max)` is entirely known, and `carnivore(max)` is new — **R5 fires**. New fact: `carnivore(max)`.

**Scan 6.** Every rule's conclusion is already a known fact for every object it could apply to — no rule fires. **Fixpoint reached.**

New facts derived, **in order**: `bird(kim)`, `waterbird(kim)`, `duck(kim)`, `mammal(max)`, `carnivore(max)`.

Notice that forward chaining derived `mammal(max)` and `carnivore(max)` even though we only asked about `kim` — it does not know or care what the eventual question will be, so it happily derives facts about `max` too, along the way to (and after) answering the question about `kim`.
:::

:::callout{kind="tip"}
Forward chaining is a natural fit for **monitoring and data-processing systems**: a stream of new sensor readings or transactions arrives as facts, and the engine continuously derives whatever conclusions the rules allow, without anyone asking a specific question in advance.
:::

## Try it yourself: forward chaining in Python

The trace above is exactly what the loop below computes. `facts` is a Python `set` of fact strings, and `rules` is a list of `(body, conclusion)` pairs. The loop keeps re-scanning the rule list and firing the first applicable, not-yet-known rule, restarting from the top each time it fires one — precisely the algorithm above. Run it, then try adding a new fact or rule of your own (for example, a `has_shell(X), lays_eggs(X) -> reptile(X)` rule with a fact about a third animal) and re-run to see the derived order change.

::widget{type="code-runner" language="python" starter="facts = {\n    'has_feathers(kim)', 'lays_eggs(kim)', 'can_swim(kim)',\n    'has_webbed_feet(kim)', 'quacks(kim)',\n    'has_fur(max)', 'gives_milk(max)', 'eats_meat(max)',\n}\n\nrules = [\n    (['has_feathers(kim)', 'lays_eggs(kim)'], 'bird(kim)'),\n    (['bird(kim)', 'can_swim(kim)'], 'waterbird(kim)'),\n    (['waterbird(kim)', 'has_webbed_feet(kim)', 'quacks(kim)'], 'duck(kim)'),\n    (['has_fur(max)', 'gives_milk(max)'], 'mammal(max)'),\n    (['mammal(max)', 'eats_meat(max)'], 'carnivore(max)'),\n]\n\ndef forward_chain(facts, rules):\n    facts = set(facts)\n    order = []\n    changed = True\n    while changed:\n        changed = False\n        for body, conclusion in rules:\n            if conclusion not in facts and all(p in facts for p in body):\n                facts.add(conclusion)\n                order.append(conclusion)\n                changed = True\n                break  # restart the scan from the top, like the trace above\n    return order\n\nfor i, fact in enumerate(forward_chain(facts, rules), 1):\n    print(f'{i}. derived {fact}')" rows=16}

Forward chaining is thorough — it derives *everything* the rules allow — but that thoroughness has a cost when you only wanted one answer. The next lesson introduces a strategy that goes straight for the goal.
