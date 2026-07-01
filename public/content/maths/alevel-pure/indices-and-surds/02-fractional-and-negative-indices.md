# Fractional and negative indices

The laws from the previous lesson extend naturally to negative and fractional indices, giving a single consistent system for roots and reciprocals.

## Negative indices

A negative index means "reciprocal of the positive power":

$$
a^{-n} = \frac{1}{a^n} \qquad (a \neq 0).
$$

For example, $2^{-3} = \dfrac{1}{2^3} = \dfrac{1}{8}$, and $5^{-1} = \dfrac{1}{5}$.

:::reveal{title="Why does a^(-n) = 1/a^n?"}
Using the division law: $\dfrac{a^0}{a^n} = a^{0-n} = a^{-n}$. Since $a^0 = 1$, the left side is $\dfrac{1}{a^n}$. So $a^{-n} = \dfrac{1}{a^n}$ — again this follows directly from the earlier rules rather than being a new assumption.
:::

## Fractional indices: roots

An index of $\dfrac{1}{n}$ means "the $n$th root":

$$
a^{1/n} = \sqrt[n]{a}.
$$

For example, $a^{1/2} = \sqrt{a}$ (the square root) and $a^{1/3} = \sqrt[3]{a}$ (the cube root). So $9^{1/2} = \sqrt{9} = 3$ and $8^{1/3} = \sqrt[3]{8} = 2$.

## Fractional indices: roots raised to a power

More generally, an index of $\dfrac{m}{n}$ combines a root and a power:

$$
a^{m/n} = \left(\sqrt[n]{a}\right)^m = \sqrt[n]{a^m}.
$$

It is almost always easier to take the root **first** and then raise to the power $m$, since the numbers stay smaller. For example:

$$
8^{2/3} = \left(\sqrt[3]{8}\right)^2 = 2^2 = 4.
$$

Compare that with computing $8^2 = 64$ first and then finding $\sqrt[3]{64} = 4$ — same answer, but with larger intermediate numbers.

:::callout{kind="tip"}
For $a^{m/n}$: root first (using $n$), then power (using $m$). Small numbers, fewer mistakes.
:::

## Negative fractional indices

Combine both rules: take the reciprocal, then apply the root and power.

$$
a^{-m/n} = \frac{1}{a^{m/n}} = \frac{1}{\left(\sqrt[n]{a}\right)^m}.
$$

For example, $16^{-3/4} = \dfrac{1}{\left(\sqrt[4]{16}\right)^3} = \dfrac{1}{2^3} = \dfrac{1}{8}$.

Explore how fractional and negative exponents behave by comparing $2^x$ with $2^{-x}$: as $x$ decreases below $0$ the curve $2^x$ shrinks towards (but never reaches) $0$, mirroring the reciprocal relationship $2^{-x} = 1/2^x$.

::widget{type="function-grapher" expr="2^(-x)" xmin=-4 xmax=4 ymin=0 ymax=16}

:::reveal{title="Worked example: evaluate 27^(-2/3)"}
Step 1 — take the cube root of $27$ (using the denominator $3$):

$$
27^{1/3} = \sqrt[3]{27} = 3.
$$

Step 2 — raise to the power $2$ (the numerator):

$$
3^2 = 9.
$$

Step 3 — apply the negative sign as a reciprocal:

$$
27^{-2/3} = \frac{1}{9}.
$$
:::

## Practise with the code runner

Edit the base and the fraction below to check your own hand calculations against Python's exact fraction arithmetic.

::widget{type="code-runner" language="python" starter="from fractions import Fraction\n\na = 27\nexponent = Fraction(-2, 3)\n\n# nth root then mth power, matching a^(m/n)\nn = exponent.denominator\nm = exponent.numerator\nroot = round(a ** (1 / n))\nvalue = root ** m if m >= 0 else 1 / (root ** (-m))\nprint(f'{a}^({exponent}) =', value)" rows=10}

:::callout{kind="key"}
$a^{1/n} = \sqrt[n]{a}$, $a^{m/n} = \left(\sqrt[n]{a}\right)^m$, and $a^{-n} = \dfrac{1}{a^n}$. Together with the laws from the previous lesson, these let you rewrite any rational-index expression in root or fraction form.
:::
