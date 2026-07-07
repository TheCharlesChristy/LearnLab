# Algebraic fractions and basic partial fractions

## Simplifying algebraic fractions

Just as $\frac{6}{9}$ simplifies to $\frac{2}{3}$ by cancelling a common factor, an algebraic fraction simplifies by factorising the numerator and denominator and cancelling any factor common to both.

:::reveal{title="Worked example: simplify an algebraic fraction"}
Simplify $\dfrac{x^2-4}{x^2+5x+6}$.

Factorise both parts:

$$
x^2 - 4 = (x-2)(x+2), \qquad x^2+5x+6 = (x+2)(x+3).
$$

So

$$
\frac{x^2-4}{x^2+5x+6} = \frac{(x-2)(x+2)}{(x+2)(x+3)} = \frac{x-2}{x+3}, \qquad x \ne -2, -3.
$$

**Check:** pick a value, say $x=4$: original $= \frac{16-4}{16+20+6} = \frac{12}{42} = \frac{2}{7}$; simplified $= \frac{4-2}{4+3} = \frac{2}{7}$. ✓ Matches.
:::

:::callout{kind="warning"}
Only cancel **factors**, never individual terms. $\dfrac{x-2}{x+3}$ cannot be simplified further — $x$ is not a common *factor* of the whole numerator and whole denominator.
:::

## Why split a fraction into partial fractions?

$\dfrac{5x+7}{(x+1)(x+2)}$ is a single fraction with a factorised denominator made of two distinct linear factors. Partial fractions reverses the process of adding fractions: it rewrites this as a **sum** of two simpler fractions,

$$
\frac{5x+7}{(x+1)(x+2)} \equiv \frac{A}{x+1} + \frac{B}{x+2},
$$

which is useful later for integration and for series expansions.

## Method: distinct linear factors

Multiply both sides by the denominator $(x+1)(x+2)$ to clear fractions:

$$
5x+7 \equiv A(x+2) + B(x+1).
$$

This is an identity (true for **all** $x$), so we can substitute convenient values of $x$ to find $A$ and $B$ — in particular, the values that make each bracket vanish.

::widget{type="step-reveal" src="steps/partial-fractions-method.json"}

:::callout{kind="key"}
**Method for distinct linear factors.** To split $\dfrac{f(x)}{(x-p)(x-q)}$ into $\dfrac{A}{x-p}+\dfrac{B}{x-q}$: write $f(x) \equiv A(x-q) + B(x-p)$, then substitute $x=p$ to isolate $A$ and $x=q$ to isolate $B$.
:::

## Full worked example

:::reveal{title="Worked example: partial fractions with (x+1)(x-2) in the denominator"}
Express $\dfrac{5x+1}{(x+1)(x-2)}$ in partial fractions.

Write

$$
\frac{5x+1}{(x+1)(x-2)} \equiv \frac{A}{x+1} + \frac{B}{x-2}.
$$

Multiply both sides by $(x+1)(x-2)$:

$$
5x+1 \equiv A(x-2) + B(x+1).
$$

Substitute the value of $x$ that makes each bracket vanish in turn:

Let $x=2$: $\; 5(2)+1 = A(0) + B(3) \Rightarrow 11 = 3B \Rightarrow B = \dfrac{11}{3}$.

Let $x=-1$: $\; 5(-1)+1 = A(-3) + B(0) \Rightarrow -4 = -3A \Rightarrow A = \dfrac{4}{3}$.

So

$$
\frac{5x+1}{(x+1)(x-2)} \equiv \frac{4}{3(x+1)} + \frac{11}{3(x-2)}.
$$

**Check:** combine back over a common denominator: $\dfrac{4(x-2) + 11(x+1)}{3(x+1)(x-2)} = \dfrac{4x-8+11x+11}{3(x+1)(x-2)} = \dfrac{15x+3}{3(x+1)(x-2)} = \dfrac{5x+1}{(x+1)(x-2)}$. ✓ Matches the original.
:::

Here is a case that comes out with whole-number coefficients — useful to check your method on:

:::reveal{title="Worked example: a cleaner case, integer coefficients"}
Express $\dfrac{2x+9}{(x+2)(x+3)}$ in partial fractions.

$$
2x+9 \equiv A(x+3) + B(x+2).
$$

Let $x=-3$: $\; -6+9 = A(0)+B(-1) \Rightarrow 3=-B \Rightarrow B=-3$.

Let $x=-2$: $\; -4+9 = A(1)+B(0) \Rightarrow 5=A$.

So

$$
\frac{2x+9}{(x+2)(x+3)} \equiv \frac{5}{x+2} - \frac{3}{x+3}.
$$

**Check:** $\dfrac{5(x+3) - 3(x+2)}{(x+2)(x+3)} = \dfrac{5x+15-3x-6}{(x+2)(x+3)} = \dfrac{2x+9}{(x+2)(x+3)}$. ✓
:::

:::callout{kind="tip"}
This module covers only **distinct linear factors** in the denominator. Repeated linear factors (e.g. $(x-1)^2$) and irreducible quadratic factors need an extra term in the partial-fraction split and are covered in a later module.
:::
