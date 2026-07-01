# Tree diagrams and Venn diagrams for combined events

Both tools organise the same probability rules visually so combined-event problems become mechanical rather than confusing.

## Venn diagrams

A Venn diagram represents events as overlapping regions inside a rectangle (the *sample space*). Each region's area (loosely) represents a probability:

- The region where two circles $A$ and $B$ overlap is $A \cap B$ ("$A$ and $B$").
- The combined area covered by either circle is $A \cup B$ ("$A$ or $B$").
- The area outside both circles is "neither $A$ nor $B$".
- Mutually exclusive events are drawn as circles that **do not touch**, since $P(A \cap B) = 0$.

Venn diagrams are especially good for problems that give you probabilities of overlaps and unions and ask you to find a missing piece, because you can read conditional probabilities directly off the diagram as a ratio of regions.

:::reveal{title="Worked example: filling in a Venn diagram"}
In a survey of 50 people, 28 like tea ($T$), 19 like coffee ($C$), and 10 like both. Find the probability that a randomly chosen person likes **neither** tea nor coffee.

First find $P(T \cup C)$ using the addition rule:

$$
P(T) = \frac{28}{50}, \qquad P(C) = \frac{19}{50}, \qquad P(T \cap C) = \frac{10}{50}
$$

$$
P(T \cup C) = \frac{28}{50} + \frac{19}{50} - \frac{10}{50} = \frac{37}{50}
$$

"Neither" is the complement of $T \cup C$:

$$
P(\text{neither}) = 1 - P(T \cup C) = 1 - \frac{37}{50} = \frac{13}{50} = 0.26
$$
:::

## Tree diagrams

A tree diagram lays out a sequence of events as branches. Each branch is labelled with a probability, and along any complete path from left to right you **multiply** the branch probabilities (the multiplication rule); to combine several different complete paths that satisfy some condition, you **add** their probabilities (since different paths through the tree are mutually exclusive).

Crucially, tree diagrams handle **sampling without replacement**: once the first item is removed, the probabilities on the second set of branches must be updated to reflect the smaller/changed pool.

Work through the tree diagram below step by step for a "two counters drawn without replacement" problem — a classic setup that combines the multiplication rule (along branches) and the addition rule (across matching branches).

::widget{type="step-reveal" src="steps/tree-diagram-walkthrough.json"}

:::callout{kind="tip"}
A quick sanity check for any tree diagram: the probabilities on branches leaving the *same* node must always sum to 1, and the end probabilities for every complete path through the whole tree must also sum to 1.
:::

## Choosing a tool

- Use a **Venn diagram** when you are given overlaps/unions of events and need to find a missing region (including "neither" and "exactly one" style questions).
- Use a **tree diagram** when events happen in a **sequence** (e.g. draws, trials, stages) and you need to combine probabilities along paths, especially with conditional probabilities that change at each stage (without replacement).

## End-of-lesson check

::widget{type="quiz" src="tree-venn-check.json"}

You are now ready for the end-of-module assessment, which mixes all three lessons together.
