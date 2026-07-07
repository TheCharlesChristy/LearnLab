# What makes a binomial model?

You already know how to combine probabilities for independent events and how
to count outcomes for repeated trials. The **binomial distribution** packages
this up into a single, reusable model for a very common situation: repeating
the *same* trial a fixed number of times and counting how many times you get
a particular result.

## The setup

Suppose you flip a biased coin 6 times and count the number of heads. Or you
test 10 components off a production line and count how many are faulty. Or
you ask 20 randomly chosen students whether they own a bicycle and count how
many say yes. All three situations have exactly the same underlying
structure, and that structure is what the binomial distribution models.

We write

$$
X \sim B(n, p)
$$

to mean "$X$ is the number of successes in $n$ independent trials, each with
probability $p$ of success." Read $X \sim B(n,p)$ as "$X$ is distributed
binomially with parameters $n$ and $p$."

:::callout{kind="key"}
$X \sim B(n, p)$: $n$ is the (fixed) number of trials, $p$ is the
probability of "success" on a single trial, and $X$ counts the number of
successes out of the $n$ trials.
:::

## The four conditions for a binomial model

A situation can be modelled by $X \sim B(n, p)$ only when **all four** of
these hold:

1. **Fixed number of trials.** $n$ is decided in advance and does not depend
   on the outcomes (e.g. "toss the coin 6 times", not "toss until you get a
   head").
2. **Two outcomes per trial.** Each trial results in exactly one of two
   outcomes, usually labelled "success" and "failure" (e.g. head/tail,
   faulty/not faulty, over 18/not over 18).
3. **Constant probability.** The probability of success, $p$, is the same on
   every trial.
4. **Independence.** The outcome of one trial does not affect the
   probability of success on any other trial.

If any condition fails, $B(n,p)$ is the *wrong* model — even though the
"count the successes" language might sound the same.

:::reveal{title="Worked example — checking the conditions"}
**A bag contains 4 red and 6 blue counters. Three counters are drawn at
random *without replacement*, and $X$ is the number of red counters drawn.
Is $X \sim B(3, 0.4)$ a valid model?**

Check each condition:

- Fixed number of trials: yes, $n = 3$ is fixed. ✓
- Two outcomes: yes, each draw is "red" or "blue". ✓
- Constant probability: **no.** The first draw has $P(\text{red}) =
  \frac{4}{10} = 0.4$, but after removing one counter the composition of the
  bag changes, so the probability of red on the second draw depends on what
  was drawn first (it becomes $\frac{3}{9}$ or $\frac{4}{9}$).
- Independence: **no**, for the same reason — drawing without replacement
  means later draws depend on earlier ones.

**Conclusion:** $X$ is **not** binomial, because sampling without
replacement breaks both the constant-probability and independence
conditions. (If the counters were drawn *with* replacement, or if the bag
were extremely large so removing a few counters barely changes the
proportions, $B(3, 0.4)$ would be a reasonable model.)
:::

## Practice spotting valid models

:::callout{kind="tip"}
The two most common reasons a "binomial-looking" situation actually fails
the conditions are: sampling **without replacement from a small population**
(breaks constant $p$ and independence), and a probability that **changes
over time or between trials** for some other reason (e.g. a machine wearing
out, so faults become more likely later in a production run).
:::

For example, "a fair die is rolled 8 times and $X$ is the number of sixes"
**is** binomial: $X \sim B(8, \tfrac{1}{6})$, since each roll is
independent, there are two outcomes (six / not six), and the probability of
a six is always $\tfrac{1}{6}$.

By contrast, "cards are dealt one at a time from a single 52-card deck,
without replacement, until 5 cards are dealt, and $X$ is the number of
aces" is **not** binomial, for the same without-replacement reason as the
counters above.

::widget{type="quiz" src="assessment.json" pick=4}
