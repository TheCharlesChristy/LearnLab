# The five SUVAT equations

When the acceleration is **constant**, the relationships between the five quantities collapse into five tidy equations. They are named after their five variables:

$$
s \;(\text{displacement}), \quad u \;(\text{initial velocity}), \quad v \;(\text{final velocity}), \quad a \;(\text{acceleration}), \quad t \;(\text{time}).
$$

## The equations

| Equation | Missing variable |
| --- | --- |
| $v = u + at$ | $s$ |
| $s = ut + \tfrac{1}{2}at^2$ | $v$ |
| $s = vt - \tfrac{1}{2}at^2$ | $u$ |
| $s = \tfrac{1}{2}(u + v)\,t$ | $a$ |
| $v^2 = u^2 + 2as$ | $t$ |

Each equation omits exactly one of the five variables. The art of a SUVAT problem is to list what you know, note what you want, and pick the equation that contains your four relevant quantities.

:::callout{kind="tip"}
Write down $s, u, v, a, t$ in a column, fill in the three values you are given, mark the one you want, and choose the equation that does **not** contain the fifth (the one you neither know nor need).
:::

## Where the equations come from

Two of the equations are definitions in disguise; the rest follow by substitution.

- **Acceleration is the gradient of the velocity-time line:** $a = \dfrac{v - u}{t}$, which rearranges to $v = u + at$.
- **Displacement is the area under that line** (a trapezium with parallel sides $u$ and $v$): $s = \tfrac{1}{2}(u + v)\,t$.

Substituting $v = u + at$ into the area formula gives $s = ut + \tfrac{1}{2}at^2$, and eliminating $t$ between the first two gives $v^2 = u^2 + 2as$.

:::reveal{title="Derivation: v^2 = u^2 + 2as"}
Start from $v = u + at$, so $t = \dfrac{v - u}{a}$. Substitute into $s = \tfrac{1}{2}(u + v)\,t$:

$$
s = \tfrac{1}{2}(u + v)\cdot \frac{v - u}{a} = \frac{(v + u)(v - u)}{2a} = \frac{v^2 - u^2}{2a}.
$$

Multiplying through by $2a$ gives $2as = v^2 - u^2$, that is

$$
v^2 = u^2 + 2as.
$$

This is the equation to reach for whenever the time $t$ is neither known nor wanted.
:::

## A complete worked example

A cyclist passes a marker at $u = 5\,\text{m s}^{-1}$ and accelerates uniformly at $a = 2\,\text{m s}^{-2}$ for $t = 4\,\text{s}$.

:::reveal{title="Worked example: find the final speed and distance"}
List: $u = 5$, $a = 2$, $t = 4$; find $v$ and $s$.

**Final velocity** (no $s$ needed) — use $v = u + at$:

$$
v = 5 + 2 \times 4 = 13\,\text{m s}^{-1}.
$$

**Distance** (no $v$ needed) — use $s = ut + \tfrac{1}{2}at^2$:

$$
s = 5 \times 4 + \tfrac{1}{2}\times 2 \times 4^2 = 20 + 16 = 36\,\text{m}.
$$

**Check** with the equation we did not use, $v^2 = u^2 + 2as$:

$$
13^2 = 5^2 + 2 \times 2 \times 36 \;\Longrightarrow\; 169 = 25 + 144 = 169. \;\checkmark
$$

The two independent routes agree, which is a reliable sign the working is correct.
:::

In the final lesson we apply exactly these equations to two dimensions at once — the physics of a thrown ball.
