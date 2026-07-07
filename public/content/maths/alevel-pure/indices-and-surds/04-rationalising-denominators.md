# Rationalising denominators

By convention, an exact answer should not have a surd left in the denominator. **Rationalising** the denominator means rewriting the fraction with an equivalent form whose denominator is a whole number, without changing its value.

## Single-term surd denominators

To rationalise $\dfrac{a}{\sqrt{b}}$, multiply top and bottom by $\sqrt{b}$ (this is really multiplying by $1$, so the value is unchanged):

$$
\frac{a}{\sqrt{b}} = \frac{a}{\sqrt{b}} \times \frac{\sqrt{b}}{\sqrt{b}} = \frac{a\sqrt{b}}{b}.
$$

:::reveal{title="Worked example: rationalise 3/√5"}
Multiply top and bottom by $\sqrt{5}$:

$$
\frac{3}{\sqrt{5}} = \frac{3}{\sqrt{5}} \times \frac{\sqrt{5}}{\sqrt{5}} = \frac{3\sqrt{5}}{5}.
$$

The denominator is now the whole number $5$.
:::

## Binomial denominators: the conjugate

When the denominator is a sum or difference involving a surd, such as $a + \sqrt{b}$, multiplying by $\sqrt{b}$ alone will not clear the root. Instead multiply by the **conjugate**, $a - \sqrt{b}$, which uses the difference-of-two-squares identity:

$$
(a + \sqrt{b})(a - \sqrt{b}) = a^2 - b.
$$

Since $b$ is now not under a root, the denominator becomes rational.

:::callout{kind="tip"}
The conjugate of $a + \sqrt{b}$ is $a - \sqrt{b}$ (flip the middle sign). Multiplying a binomial surd expression by its conjugate always removes the root, because $(\,x+y)(x-y) = x^2 - y^2$.
:::

:::reveal{title="Worked example: rationalise 1/(2 + √3)"}
Multiply top and bottom by the conjugate $2 - \sqrt{3}$:

$$
\frac{1}{2+\sqrt{3}} \times \frac{2-\sqrt{3}}{2-\sqrt{3}} = \frac{2-\sqrt{3}}{(2+\sqrt{3})(2-\sqrt{3})}.
$$

Expand the denominator using difference of two squares:

$$
(2+\sqrt{3})(2-\sqrt{3}) = 2^2 - (\sqrt{3})^2 = 4 - 3 = 1.
$$

So the fraction simplifies to:

$$
\frac{2 - \sqrt{3}}{1} = 2 - \sqrt{3}.
$$
:::

## A slightly bigger example

:::reveal{title="Worked example: rationalise (5 + √2)/(3 − √2)"}
Multiply top and bottom by the conjugate of the denominator, $3 + \sqrt{2}$:

$$
\frac{5+\sqrt{2}}{3-\sqrt{2}} \times \frac{3+\sqrt{2}}{3+\sqrt{2}} = \frac{(5+\sqrt{2})(3+\sqrt{2})}{(3-\sqrt{2})(3+\sqrt{2})}.
$$

**Denominator:** $(3-\sqrt{2})(3+\sqrt{2}) = 9 - 2 = 7$.

**Numerator:** expand $(5+\sqrt{2})(3+\sqrt{2}) = 15 + 5\sqrt{2} + 3\sqrt{2} + 2 = 17 + 8\sqrt{2}$.

So the rationalised form is:

$$
\frac{17 + 8\sqrt{2}}{7}.
$$
:::

## Verify numerically

Rationalising should never change the value of the expression — only its form. Use the code runner to check a rationalisation numerically before trusting the algebra.

::widget{type="code-runner" language="python" starter="import math\n\n# Check that 1/(2 + sqrt(3)) equals 2 - sqrt(3)\nlhs = 1 / (2 + math.sqrt(3))\nrhs = 2 - math.sqrt(3)\nprint('1/(2+sqrt3) =', lhs)\nprint('2 - sqrt3   =', rhs)\nprint('Close enough?', math.isclose(lhs, rhs))" rows=10}

:::callout{kind="key"}
Single surd denominator: multiply by that surd over itself. Binomial surd denominator $a \pm \sqrt{b}$: multiply by the conjugate $a \mp \sqrt{b}$, using $(x+y)(x-y) = x^2 - y^2$ to clear the root.
:::
