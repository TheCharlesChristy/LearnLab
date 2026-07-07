# Representing knowledge as facts and rules

So far in this course an "intelligent" program has meant a search algorithm exploring a space of possible moves or states. A different, much older idea in AI is to give a program **knowledge about the world** directly — a store of facts and rules it can combine to answer questions, the same way a human expert reasons. Programs built this way are called **rule-based systems**, or when the knowledge captures a human specialist's know-how, **expert systems**. The classic 1970s medical program MYCIN, which suggested antibiotic treatments from a knowledge base of infectious-disease rules, is the field's founding example.

## Facts: simple statements about the world

A **fact** is a simple statement that something is true. In knowledge representation we usually write a fact as a **predicate** applied to one or more **objects**, in the form `predicate(object)`:

```
bird(tweety)
lays_eggs(tweety)
has_feathers(tweety)
penguin(percy)
```

Read `bird(tweety)` as "tweety is a bird" and `has_feathers(tweety)` as "tweety has feathers". A predicate can take more than one object too, e.g. `heavier_than(elephant, mouse)` for "the elephant is heavier than the mouse". None of this is a real programming language — it is a compact, human-readable notation for the same statements you could write in English. A collection of facts like this is the start of a **knowledge base**.

:::callout{kind="info"}
This notation is deliberately informal. It is inspired by logic programming languages such as Prolog, but you do not need to know Prolog's exact syntax — only the idea that a fact names a property (or relationship) and the object(s) it holds for.
:::

## Rules: if-then statements

A **rule** lets the system derive *new* facts from ones it already has. A rule is an implication: **if** some condition(s) hold, **then** a conclusion follows. We can write a rule in plain if-then form:

```
IF bird(X) AND NOT penguin(X) THEN flies(X)
```

Here `X` is a **variable** — it stands for *any* object, not one specific thing. The rule reads: "for any `X`, if `X` is a bird and `X` is not a penguin, then `X` flies." To *use* the rule for a particular object, we **substitute** that object for `X` throughout the rule; this is often called **grounding** the rule. The same rule is sometimes written in a Prolog-flavoured shorthand, with the conclusion first and a colon-dash standing for "if":

```
flies(X) :- bird(X), not(penguin(X)).
```

Both notations say exactly the same thing — a comma between conditions means "and". Which style a textbook or tool uses does not matter; what matters is that a rule has a **body** (the conditions, joined by AND) and a **head** (the conclusion that follows once every condition in the body is satisfied).

:::callout{kind="key"}
A rule is only "fired" (used to derive its conclusion) once **every** condition in its body is known to hold for the same substitution of its variable(s). A single unmet condition blocks the whole rule.
:::

## A knowledge base answers questions

Put facts and rules together and you have a **knowledge base**: a set of ground facts (`bird(tweety)`, `penguin(percy)`, …) plus a set of general rules (`flies(X) :- bird(X), not(penguin(X))`). An **inference engine** — an algorithm that systematically applies the rules to the facts — can then answer questions the knowledge base was never explicitly told the answer to. Ask "does tweety fly?" and the engine substitutes `X = tweety` into the flying rule, checks that `bird(tweety)` is a known fact and that `penguin(tweety)` is *not*, and concludes `flies(tweety)`. Ask the same question about `percy` and the `NOT penguin(X)` condition fails, so the rule does not fire and (with no other rule concluding `flies(percy)`) the engine reports that flying cannot be established.

The next two lessons study the two standard strategies an inference engine uses to decide *which* rules to fire and in *what order*: **forward chaining**, which works forward from the facts, and **backward chaining**, which works backward from a specific question.

:::reveal{title="Worked example: does Tweety fly? Does Percy?"}
Knowledge base:

- Facts: `bird(tweety)`, `has_feathers(tweety)`, `bird(percy)`, `penguin(percy)`.
- Rule: `flies(X) :- bird(X), not(penguin(X))`.

**Query: does tweety fly?** Substitute `X = tweety` into the rule body: `bird(tweety) AND NOT penguin(tweety)`.

1. Is `bird(tweety)` a known fact? Yes.
2. Is `penguin(tweety)` a known fact? No — it does not appear in the knowledge base, so `NOT penguin(tweety)` holds.
3. Both conditions of the body are satisfied, so the rule fires and the head is derived: **`flies(tweety)` — yes, Tweety flies.**

**Query: does percy fly?** Substitute `X = percy`: `bird(percy) AND NOT penguin(percy)`.

1. Is `bird(percy)` a known fact? Yes.
2. Is `penguin(percy)` a known fact? **Yes** — so `NOT penguin(percy)` is false.
3. The second condition fails, so the rule does **not** fire. No other rule concludes `flies(percy)`, so the knowledge base cannot establish that Percy flies — correctly, since Percy is a penguin.

Notice that swapping in a different object for `X` is the *only* thing that changed between the two queries — the rule itself never changed.
:::

The next lesson traces exactly how an inference engine finds these answers automatically: the **forward chaining** algorithm.
