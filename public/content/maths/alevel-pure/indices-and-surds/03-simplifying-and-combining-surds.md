# Simplifying and combining surds

A **surd** is an irrational root left in exact form, such as $\sqrt{2}$ or $\sqrt{5}$, rather than written as a rounded decimal. Working with surds exactly avoids rounding error and is required for exact answers in A-level questions.

## Two key rules

Surds obey multiplicative rules that mirror fractional indices:

$$
\sqrt{a} \times \sqrt{b} = \sqrt{ab}, \qquad \sqrt{\frac{a}{b}} = \frac{\sqrt{a}}{\sqrt{b}}.
$$

These let us pull perfect-square factors out from under the root sign.

## Simplifying a surd

To simplify $\sqrt{n}$, find the **largest perfect square factor** of $n$, split the root using the multiplication rule, and take the square root of that factor.

:::reveal{title="Worked example: simplify √50"}
$50 = 25 \times 2$, and $25$ is a perfect square ($5^2$). So:

$$
\sqrt{50} = \sqrt{25 \times 2} = \sqrt{25} \times \sqrt{2} = 5\sqrt{2}.
$$

Check: $5\sqrt{2} \approx 5 \times 1.4142 = 7.071$, and $\sqrt{50} \approx 7.071$. ✓
:::

Another example: $\sqrt{72} = \sqrt{36 \times 2} = 6\sqrt{2}$. Always check you have used the **largest** square factor — $\sqrt{72} = \sqrt{4 \times 18} = 2\sqrt{18}$ is true but not fully simplified, since $\sqrt{18} = 3\sqrt{2}$ can be simplified further to give $6\sqrt{2}$.

:::callout{kind="warning"}
A surd such as $k\sqrt{n}$ is only **fully simplified** when $n$ has no perfect-square factor other than $1$. Always check whether $n$ can be broken down further.
:::

## Adding and subtracting surds

Only **like surds** — surds with the same number under the root — can be combined directly, just like collecting like terms in algebra:

$$
p\sqrt{n} + q\sqrt{n} = (p+q)\sqrt{n}.
$$

For example, $3\sqrt{2} + 5\sqrt{2} = 8\sqrt{2}$, but $3\sqrt{2} + 5\sqrt{3}$ cannot be combined further because $\sqrt{2}$ and $\sqrt{3}$ are unlike surds.

Sometimes simplifying first reveals like surds that were hidden:

:::reveal{title="Worked example: simplify √8 + √18"}
Simplify each surd separately first:

$$
\sqrt{8} = \sqrt{4 \times 2} = 2\sqrt{2}, \qquad \sqrt{18} = \sqrt{9 \times 2} = 3\sqrt{2}.
$$

Now they are like surds, so they combine:

$$
\sqrt{8} + \sqrt{18} = 2\sqrt{2} + 3\sqrt{2} = 5\sqrt{2}.
$$
:::

## Multiplying surds

Multiply the rational parts together and the surd parts together:

$$
(p\sqrt{a}) \times (q\sqrt{b}) = pq\sqrt{ab}.
$$

For example, $2\sqrt{3} \times 5\sqrt{6} = 10\sqrt{18} = 10 \times 3\sqrt{2} = 30\sqrt{2}$.

Binomials involving surds expand exactly as ordinary brackets do, using $\sqrt{a} \times \sqrt{a} = a$:

$$
(2 + \sqrt{3})(1 - \sqrt{3}) = 2 - 2\sqrt{3} + \sqrt{3} - 3 = -1 - \sqrt{3}.
$$

## Check your simplifications

Use the code runner to verify that a simplified surd form matches the original numerically (small floating-point differences are expected and fine).

::widget{type="code-runner" language="python" starter="import math\n\n# Check that sqrt(50) equals 5*sqrt(2)\nlhs = math.sqrt(50)\nrhs = 5 * math.sqrt(2)\nprint('sqrt(50) =', lhs)\nprint('5*sqrt(2) =', rhs)\nprint('Close enough?', math.isclose(lhs, rhs))" rows=10}

:::callout{kind="key"}
Simplify by extracting the largest square factor; only like surds add or subtract; multiply rational parts and surd parts separately, using $\sqrt{a}\sqrt{a} = a$ to clear roots when they multiply together.
:::
