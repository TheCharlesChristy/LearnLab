# Basic probability rules and the addition rule

Probability measures how likely an event is, on a scale from impossible to certain.

## The basic rules

For any event $A$:

$$
0 \le P(A) \le 1
$$

- $P(A) = 0$ means $A$ is impossible.
- $P(A) = 1$ means $A$ is certain.

The **complement** of $A$, written $A'$ (or "not $A$"), is the event that $A$ does *not* happen. Since $A$ and $A'$ between them cover every possible outcome:

$$
P(A') = 1 - P(A)
$$

:::callout{kind="key"}
$P(A) + P(A') = 1$ always. If you know $P(A)$, you instantly know $P(A')$ — this is one of the most useful shortcuts in the subject.
:::

:::reveal{title="Worked example: using the complement rule"}
A biased die has $P(\text{rolling a six}) = 0.3$. Find the probability of *not* rolling a six.

$$
P(\text{not six}) = 1 - P(\text{six}) = 1 - 0.3 = 0.7
$$
:::

## Combined events: the addition rule

Often we care about the probability that **at least one** of two events happens — "$A$ or $B$" (written $A \cup B$). Simply adding $P(A)$ and $P(B)$ double-counts outcomes where both happen, so we subtract the overlap:

$$
P(A \cup B) = P(A) + P(B) - P(A \cap B)
$$

Here $A \cap B$ ("$A$ and $B$") is the event that **both** $A$ and $B$ happen.

The bar chart below shows made-up probabilities for drawing a card that is a King ($A$), a Heart ($B$), or both, illustrating the pieces that go into the addition rule.

::widget{type="data-plot" src="king-heart-distribution.json"}

## Mutually exclusive events

Two events are **mutually exclusive** if they cannot both happen at the same time, so $P(A \cap B) = 0$. For example, rolling a 2 and rolling a 5 on the same die roll are mutually exclusive. The addition rule then simplifies to:

$$
P(A \cup B) = P(A) + P(B) \qquad \text{(mutually exclusive events only)}
$$

:::callout{kind="warning"}
Do not use the simplified addition rule unless you have checked (or been told) that the events are mutually exclusive. Using it when events overlap will double-count the overlap and give an answer that is too large.
:::

:::reveal{title="Worked example: the addition rule with overlap"}
A card is drawn at random from a standard 52-card deck. Let $A$ = "the card is a King" and $B$ = "the card is a Heart". Find $P(A \cup B)$.

There are 4 Kings and 13 Hearts, and exactly 1 card (the King of Hearts) is both, so:

$$
P(A) = \frac{4}{52}, \qquad P(B) = \frac{13}{52}, \qquad P(A \cap B) = \frac{1}{52}
$$

$$
P(A \cup B) = \frac{4}{52} + \frac{13}{52} - \frac{1}{52} = \frac{16}{52} = \frac{4}{13} \approx 0.308
$$
:::

## Quick check

::widget{type="quiz" src="addition-rule-check.json"}

Next, we look at what happens when knowing one event changes (or doesn't change) the probability of another.
