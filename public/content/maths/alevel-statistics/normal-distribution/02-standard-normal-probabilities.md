# Using $\Phi(z)$ to find probabilities

The standard normal distribution $Z \sim N(0,1)$ has a cumulative distribution function written $\Phi(z)$:

$$
\Phi(z) = P(Z < z)
$$

that is, $\Phi(z)$ is the probability that a standard normal variable is **less than** $z$ — the area under the standard normal curve to the left of $z$. Values of $\Phi(z)$ are found from standard normal tables or, equivalently, a calculator's built-in normal CDF function. You do not need to derive them; you need to **use** them correctly.

Some values you will meet repeatedly:

| $z$ | $\Phi(z)$ |
|---|---|
| $1.00$ | $0.8413$ |
| $1.96$ | $0.9750$ |
| $2.00$ | $0.9772$ |
| $-1.00$ | $0.1587$ |

(Note $\Phi(-z) = 1 - \Phi(z)$ by symmetry — you rarely need a table of negative $z$.)

::widget{type="function-grapher" expr="2.5*exp(-(x-0)^2/2)" xmin=-4 xmax=4 grid=true}

Imagine shading the area under this curve to the left of some point $z$: that shaded area, as a fraction of the total area (which is $1$), is exactly $\Phi(z)$.

## Three probability shapes

For $X \sim N(\mu, \sigma^2)$, first standardise using $z = \dfrac{x-\mu}{\sigma}$, then use one of these:

1. **"Less than" — $P(X < a)$.** Standardise to get $z$, then $P(X<a) = \Phi(z)$.
2. **"Greater than" — $P(X > a)$.** The total area is $1$, so $P(X>a) = 1 - \Phi(z)$.
3. **"Between" — $P(a < X < b)$.** Standardise both ends to $z_1, z_2$, then $P(a<X<b) = \Phi(z_2) - \Phi(z_1)$.

:::callout{kind="tip"}
Sketching a quick bell curve and shading the region asked for is the single best way to avoid mixing up $\Phi(z)$ with $1-\Phi(z)$. If the shaded region is to the *left* of $z$, it's $\Phi(z)$; to the *right*, it's $1-\Phi(z)$.
:::

:::reveal{title="Worked example: all three shapes"}
A factory's bottle-filling machine gives volumes $X \sim N(500, 4^2)$ ml.

**(a) $P(X > 506)$.** From the previous lesson, $z = \dfrac{506-500}{4} = 1.5$.

$$
P(X>506) = 1 - \Phi(1.5) = 1 - 0.9332 = 0.0668
$$

**(b) $P(X < 492)$.** Here $z = \dfrac{492-500}{4} = -2$.

$$
P(X<492) = \Phi(-2) = 1-\Phi(2) = 1 - 0.9772 = 0.0228
$$

**(c) $P(492 < X < 506)$.** Using the two $z$-values already found ($z_1=-2$, $z_2=1.5$):

$$
P(492<X<506) = \Phi(1.5) - \Phi(-2) = 0.9332 - 0.0228 = 0.9104
$$
:::

## Reading the shape from the question

Look for the direction of the inequality in the question, not just the number: "at least", "more than", "no more than", "between" all point to a different one of the three shapes above. A quick sketch removes almost all of the risk of a sign error.

:::callout{kind="warning"}
$\Phi(z)$ is a **cumulative** probability (area to the left). It is never negative and never exceeds $1$. If your calculation for a probability gives a number outside $[0,1]$, you have made an arithmetic slip — go back and check the standardising step.
:::
