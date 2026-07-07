# Independence and conditional probability

## Independent events

Two events are **independent** if the occurrence of one has no effect on the probability of the other. For independent events, the probability that both happen is the product of their individual probabilities:

$$
P(A \cap B) = P(A) \times P(B) \qquad \text{(independent events only)}
$$

This is completely different from *mutually exclusive*: mutually exclusive events cannot both happen ($P(A \cap B) = 0$), whereas independent events routinely happen together — knowing one occurred just doesn't change the odds of the other.

:::callout{kind="warning"}
Mutually exclusive and independent are **not** the same thing, and (except in trivial cases) events cannot be both. If $A$ and $B$ are mutually exclusive with non-zero probabilities, then $A$ happening tells you $B$ definitely did *not* happen — that is about as far from "no effect" as you can get.
:::

:::reveal{title="Worked example: independent events"}
A fair coin is flipped and a fair six-sided die is rolled. Find the probability of getting a head **and** rolling a six.

The coin and die do not affect each other, so the events are independent:

$$
P(\text{head} \cap \text{six}) = P(\text{head}) \times P(\text{six}) = \frac{1}{2} \times \frac{1}{6} = \frac{1}{12} \approx 0.0833
$$
:::

## Conditional probability

**Conditional probability** asks: given that we already know $B$ has happened, what is the probability of $A$? Written $P(A \mid B)$ ("probability of $A$ given $B$"), it is defined as:

$$
P(A \mid B) = \frac{P(A \cap B)}{P(B)}, \qquad P(B) \neq 0
$$

Rearranging gives the very useful multiplication rule for **any** two events (independent or not):

$$
P(A \cap B) = P(A \mid B) \times P(B)
$$

:::callout{kind="key"}
If $A$ and $B$ are independent, then knowing $B$ tells you nothing new about $A$, so $P(A \mid B) = P(A)$. This is in fact the formal test for independence: check whether $P(A \mid B) = P(A)$ (equivalently, whether $P(A \cap B) = P(A)\times P(B)$).
:::

:::reveal{title="Worked example: conditional probability from a table"}
In a class of 30 students, 18 study Maths, 12 study Physics, and 8 study both. A student is picked at random and is known to study Physics. Find the probability they also study Maths.

Let $M$ = "studies Maths" and $P$ = "studies Physics". We need $P(M \mid P)$:

$$
P(M \cap P) = \frac{8}{30}, \qquad P(P) = \frac{12}{30}
$$

$$
P(M \mid P) = \frac{P(M \cap P)}{P(P)} = \frac{8/30}{12/30} = \frac{8}{12} = \frac{2}{3} \approx 0.667
$$
:::

## Checking independence numerically

To test whether two events are independent from data, compare $P(A \cap B)$ with $P(A) \times P(B)$: if they are equal (within rounding), the events are independent; if not, they are dependent (and you can then use the conditional-probability formula to explore how).

::widget{type="quiz" src="independence-check.json"}

Next, we bring these rules together using two visual tools: Venn diagrams and tree diagrams.
