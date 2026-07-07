# What is a quadratic? Expanding brackets

So far in **Algebra Essentials** you have expanded brackets and factorised simple expressions. This module takes that a step further and looks at one particular, very common type of expression: the **quadratic**.

## Recognising a quadratic

An expression is **quadratic** in $x$ if, once fully expanded, its highest power of $x$ is $x^2$. The standard form is

$$
ax^2 + bx + c, \qquad a \neq 0,
$$

where $a$, $b$ and $c$ are numbers (they can be positive, negative, or zero — except $a$, which can never be $0$, otherwise there would be no $x^2$ term and the expression would just be linear).

- $a$ is the **coefficient of $x^2$**.
- $b$ is the **coefficient of $x$**.
- $c$ is the **constant term**.

For example, in $3x^2 - 5x + 2$ we have $a = 3$, $b = -5$, $c = 2$. In $x^2 - 9$ we have $a = 1$, $b = 0$, $c = -9$ — $b$ is allowed to be $0$, we just don't usually write "$+0x$".

:::callout{kind="info"}
An expression like $2x + 7$ is **linear** (highest power of $x$ is $x^1$), and $x^3 + x$ is **cubic** (highest power is $x^3$). Only an $x^2$ term as the *highest* power makes an expression quadratic.
:::

## Where do quadratics come from? Expanding two brackets

One of the most common ways a quadratic expression appears is by multiplying out ("expanding") two linear brackets. Recall from Algebra Essentials that each term in the first bracket multiplies each term in the second bracket — this is often remembered as **FOIL** (First, Outer, Inner, Last).

**Example.** Expand $(x + 3)(x + 5)$.

$$
(x+3)(x+5) = x \cdot x + x \cdot 5 + 3 \cdot x + 3 \cdot 5 = x^2 + 5x + 3x + 15 = x^2 + 8x + 15.
$$

Collecting the two "middle" terms ($5x$ and $3x$) into $8x$ gives the quadratic $x^2 + 8x + 15$, so here $a=1$, $b=8$, $c=15$.

Notice a useful pattern: the constant term ($15$) is the **product** of $3$ and $5$, and the coefficient of $x$ ($8$) is their **sum**. This pattern is the key to the whole of the next lesson, where we go the other way — starting from the quadratic and finding the brackets.

:::reveal{title="Worked example: expanding brackets with negative numbers"}
Expand $(x - 5)(x + 3)$ and write the result as $x^2 + bx + c$.

$$
(x-5)(x+3) = x^2 + 3x - 5x - 15 = x^2 - 2x - 15.
$$

Check against the pattern: the numbers in the brackets are $-5$ and $3$. Their product is $(-5)(3) = -15$ — matches $c$. Their sum is $-5 + 3 = -2$ — matches $b$. So $a = 1$, $b = -2$, $c = -15$.
:::

## When the brackets aren't "plain x"

The same method works even when the coefficient of $x$ inside a bracket isn't $1$.

**Example.** Expand $(2x + 1)(x - 4)$.

$$
(2x+1)(x-4) = 2x \cdot x + 2x \cdot (-4) + 1 \cdot x + 1 \cdot (-4) = 2x^2 - 8x + x - 4 = 2x^2 - 7x - 4.
$$

Here $a = 2$, $b = -7$, $c = -4$. This module will mostly focus on the simpler case $a = 1$ (i.e. plain $x^2 + bx + c$), which is enough to build solid factorising skills — but it's worth knowing that quadratics with $a \neq 1$ expand the same way, just with an extra term to track.

You can check any expansion by substituting a number for $x$ into both the original brackets and your expanded answer — they must give the same value.

:::callout{kind="tip"}
**Checking an expansion:** for $(x-5)(x+3) = x^2-2x-15$, try $x=1$. Brackets: $(1-5)(1+3) = (-4)(4) = -16$. Expanded: $1^2 - 2(1) - 15 = 1 - 2 - 15 = -16$. They match, so the expansion is very likely correct.
:::

## Try it yourself

::widget{type="code-runner" language="python" starter="# Check an expansion by substituting a number for x.\n# Edit x, or the two bracket values, and see if both sides match.\nx = 2\n\nleft = (x - 5) * (x + 3)      # the two brackets multiplied directly\nright = x**2 - 2*x - 15        # the claimed expanded form\n\nprint('brackets  :', left)\nprint('expanded  :', right)\nprint('match?    :', left == right)\n" rows=10}

Change `x` to a few different values (including negative ones) and confirm the two sides always agree — that's what it means for an expansion to be correct for *all* $x$, not just one lucky value.

Next lesson, we reverse this whole process: given a quadratic like $x^2 + 8x + 15$, how do we find the brackets it came from?
