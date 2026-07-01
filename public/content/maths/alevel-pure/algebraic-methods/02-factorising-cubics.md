# Factorising and solving cubic and quartic equations

The factor theorem lets us break a cubic (or quartic) into a product of simpler factors, which we can then solve just like a quadratic.

## Strategy for a cubic

To factorise a cubic $f(x) = ax^3+bx^2+cx+d$ completely:

1. Use the factor theorem to find one root $a$ by trial — test factors of $d$ (divided by factors of the leading coefficient) until $f(a) = 0$.
2. Divide $f(x)$ by $(x-a)$ to get a quadratic quotient.
3. Factorise (or use the quadratic formula on) the quadratic quotient to find the remaining root(s).

:::callout{kind="info"}
For integer-coefficient polynomials, the **only** possible integer roots are factors of the constant term (by the factor theorem combined with the rational root idea) — so you never need to guess blindly.
:::

## Worked example

:::reveal{title="Worked example: factorise and solve x^3 + 2x^2 - 5x - 6 = 0"}
Let $f(x) = x^3 + 2x^2 - 5x - 6$. The constant term is $-6$, so try its factors: $\pm1, \pm2, \pm3, \pm6$.

$$
f(1) = 1+2-5-6 = -8 \quad (\text{not zero})
$$

$$
f(-1) = -1+2+5-6 = 0 \quad \checkmark
$$

So $(x+1)$ is a factor. Divide $f(x)$ by $(x+1)$:

$$
x^3+2x^2-5x-6 = (x+1)(x^2+x-6).
$$

**Check:** $(x+1)(x^2+x-6) = x^3+x^2-6x+x^2+x-6 = x^3+2x^2-5x-6$. ✓ Matches.

Now factorise the quadratic: $x^2+x-6 = (x+3)(x-2)$, since $3 \times(-2)=-6$ and $3+(-2)=1$.

So $f(x) = (x+1)(x+3)(x-2)$, and the equation $f(x)=0$ has roots

$$
x = -1, \quad x=-3, \quad x=2.
$$
:::

Here is a graph of that cubic — check that it really does cross the $x$-axis at $-3$, $-1$ and $2$:

::widget{type="function-grapher" expr="x^3 + 2*x^2 - 5*x - 6" xmin=-5 xmax=4}

## Repeated roots

A cubic can also have a **repeated root**, where a linear factor appears twice, e.g. $f(x) = (x-1)^2(x+2)$. At a repeated root the curve *touches* the $x$-axis rather than crossing it — the same behaviour you saw for quadratics with a repeated root.

:::callout{kind="tip"}
After finding one factor with the factor theorem and dividing down to a quadratic, always check whether that quadratic itself has a repeated root (discriminant $b^2-4ac=0$) or does not factorise over the rationals at all (in which case leave it as a quadratic factor).
:::

## Simple quartics

The same method extends to quartics (degree 4): find a root by the factor theorem, divide to get a cubic, then repeat.

:::reveal{title="Worked example: a quartic equation"}
Solve $x^4 - 2x^3 - 7x^2 + 8x + 12 = 0$.

Testing $x=-1$: $1+2-7-8+12 = 0$ ✓, so $(x+1)$ is a factor.

Dividing gives $x^4-2x^3-7x^2+8x+12 = (x+1)(x^3-3x^2-4x+12)$.

**Check:** $(x+1)(x^3-3x^2-4x+12) = x^4-3x^3-4x^2+12x + x^3-3x^2-4x+12 = x^4-2x^3-7x^2+8x+12$. ✓

Now factorise the cubic $g(x)=x^3-3x^2-4x+12$. Testing $x=2$: $8-12-8+12=0$ ✓, so $(x-2)$ is a factor. Dividing: $g(x) = (x-2)(x^2-x-6) = (x-2)(x-3)(x+2)$.

**Check:** $(x-2)(x-3)(x+2) = (x-2)(x^2-x-6) = x^3-x^2-6x-2x^2+2x+12 = x^3-3x^2-4x+12$. ✓

So the quartic factorises completely as

$$
x^4-2x^3-7x^2+8x+12 = (x+1)(x-2)(x-3)(x+2),
$$

with roots $x = -1, \, 2, \, 3, \, -2$.
:::

A quartic like this one has up to four real roots, visible as up to four $x$-intercepts:

::widget{type="function-grapher" expr="x^4 - 2*x^3 - 7*x^2 + 8*x + 12" xmin=-3 xmax=4 ymin=-20 ymax=20}

:::callout{kind="warning"}
Not every quartic factorises into four linear factors over the real numbers — some quadratic factors may have no real roots (negative discriminant). At A-level, quartic questions are normally constructed so the full factorisation works out neatly, as here.
:::
