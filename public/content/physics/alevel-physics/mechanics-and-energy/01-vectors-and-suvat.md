# Scalars, vectors and the SUVAT equations

Mechanics is built from two kinds of quantity.

:::callout{kind="key"}
A **scalar** has magnitude only: mass, distance, speed, time, energy. A **vector** has both magnitude and direction: displacement, velocity, acceleration, force, momentum. Two vectors are equal only if they have the same magnitude **and** the same direction.
:::

## Resolving a vector into components

Working in two dimensions is much easier once a vector is split into perpendicular components, usually horizontal ($x$) and vertical ($y$). If a vector of magnitude $F$ points at angle $\theta$ above the horizontal,

$$
F_x = F\cos\theta, \qquad F_y = F\sin\theta.
$$

The two components act independently — a step used constantly throughout this module, especially for projectile motion (next lesson) and for resolving forces (later in this module).

:::reveal{title="Worked example: resolving a force"}
A rope pulls on a sledge with a force of $40\,\text{N}$ at $60^\circ$ above the horizontal. Find the horizontal and vertical components.

$$
F_x = 40\cos 60^\circ = 40 \times 0.5 = 20\,\text{N}.
$$

$$
F_y = 40\sin 60^\circ = 40 \times 0.8660 = 34.6\,\text{N}.
$$

Check using Pythagoras: $\sqrt{20^2 + 34.6^2} = \sqrt{400 + 1197.2} = \sqrt{1597.2} = 40.0\,\text{N}$ — the original magnitude, as expected. ✓
:::

## Motion with constant acceleration: the SUVAT equations

When acceleration $a$ is constant, five quantities — displacement $s$, initial velocity $u$, final velocity $v$, acceleration $a$, and time $t$ — are linked by five standard equations, each omitting exactly one variable:

| Equation | Missing variable |
| --- | --- |
| $v = u + at$ | $s$ |
| $s = ut + \tfrac{1}{2}at^2$ | $v$ |
| $s = vt - \tfrac{1}{2}at^2$ | $u$ |
| $s = \tfrac{1}{2}(u + v)\,t$ | $a$ |
| $v^2 = u^2 + 2as$ | $t$ |

The first comes straight from the definition of acceleration as the rate of change of velocity, $a = \dfrac{v-u}{t}$. The second follows from the area under a velocity-time graph (a trapezium of parallel sides $u$ and $v$ over time $t$), and the rest follow by substitution.

:::callout{kind="tip"}
List the values you know for $s, u, v, a, t$, mark the one you want, and choose the equation that does **not** contain the one variable you neither know nor need. This "cover-up" strategy avoids solving simultaneous equations.
:::

The graph below shows displacement against time, $s(t) = ut + \tfrac{1}{2}at^2$, for an object starting at $u = 0\,\text{m s}^{-1}$ with constant acceleration $a = 2\,\text{m s}^{-2}$:

::widget{type="function-grapher" expr="0.5*2*x^2" xmin=0 xmax=6 grid=true}

Notice that the curve is a parabola (not a straight line) — displacement grows with the square of time under constant acceleration, which is exactly what $s = \tfrac{1}{2}at^2$ (with $u=0$) predicts.

:::reveal{title="Worked example: a car accelerating from a junction"}
A car pulls away from rest... no, this car already has some speed: it passes a marker at $u = 6\,\text{m s}^{-1}$ and accelerates uniformly at $a = 1.5\,\text{m s}^{-2}$ for $t = 8\,\text{s}$. Find its final velocity and the distance travelled.

**Final velocity** (no $s$ needed) — use $v = u + at$:

$$
v = 6 + 1.5 \times 8 = 6 + 12 = 18\,\text{m s}^{-1}.
$$

**Distance** (no $v$ needed) — use $s = ut + \tfrac{1}{2}at^2$:

$$
s = 6 \times 8 + \tfrac{1}{2}\times 1.5 \times 8^2 = 48 + 48 = 96\,\text{m}.
$$

**Check** with the equation not yet used, $v^2 = u^2 + 2as$:

$$
18^2 = 6^2 + 2 \times 1.5 \times 96 \;\Longrightarrow\; 324 = 36 + 288 = 324. \;\checkmark
$$
:::

With one-dimensional motion secure, the next lesson extends exactly the same equations to two dimensions at once: a projectile launched into the air.
