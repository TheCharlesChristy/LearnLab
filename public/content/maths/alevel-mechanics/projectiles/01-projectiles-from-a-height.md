# Projectiles launched from a height

In *kinematics-suvat* you modelled a projectile launched **from ground level**: a ball thrown from the floor, landing back at the same height it started. This module goes further. Many real projectiles are launched from an **elevated point** — a stone thrown off a cliff, a shot put released above the ground, a ball struck from a raised tee — and land **below** their launch point. The extra vertical drop changes the time of flight and the range, and it breaks the neat symmetry you saw before.

:::callout{kind="info"}
Recap from *kinematics-suvat*: split the launch velocity $u$ at angle $\theta$ above the horizontal into components $u_x = u\cos\theta$ and $u_y = u\sin\theta$, then apply SUVAT to each direction independently, since the only acceleration is $g = 9.81\,\text{m s}^{-2}$ vertically downwards. Everything below builds directly on that model — we are not re-deriving it, only extending it.
:::

## Setting up the height

Put the origin at the **launch point**, with $x$ horizontal and $y$ vertically upwards. The projectile is launched from a height $h$ above the ground, so the ground is the line $y = -h$. As before:

$$
x = u_x t, \qquad y = u_y t - \tfrac{1}{2}g t^2, \qquad u_x = u\cos\theta, \quad u_y = u\sin\theta.
$$

The projectile lands when it reaches the ground, i.e. when $y = -h$ (not $y = 0$ as in the ground-level case). That single change is the crux of this whole module: every landing condition below comes from solving

$$
u_y t - \tfrac12 g t^2 = -h.
$$

:::callout{kind="key"}
Rearranged into standard quadratic form, the landing time satisfies
$$
\tfrac12 g t^2 - u_y t - h = 0.
$$
Because $h > 0$, this quadratic always has one positive and one negative root; the physically meaningful landing time is the **positive** root, given by the quadratic formula.
$$
t = \frac{u_y + \sqrt{u_y^2 + 2gh}}{g}.
$$
:::

## Why the flight is longer

Compare this to the ground-level result $t = \dfrac{2u_y}{g}$ from *kinematics-suvat*. Because $\sqrt{u_y^2 + 2gh} > u_y$ whenever $h > 0$, the elevated launch **always** gives a longer time of flight than launching the same $u_y$ from ground level — the extra height gives gravity more time to act before the projectile reaches the ground.

::widget{type="function-grapher" expr="12.5*x - 4.905*x^2 + 40" xmin=0 xmax=4.5 ymin=-5 ymax=50 grid=true}

The curve above plots height above the ground, $y + h = u_y t - \tfrac12 g t^2 + h$, against time for a launch with $u_y = 12.5\,\text{m s}^{-1}$ from a cliff of height $h = 40\,\text{m}$ (so $x$ on the graph represents $t$ in seconds). Notice the curve starts at $40\,\text{m}$ (not $0$), rises to a maximum, then falls past $0$ when the projectile reaches the ground — that crossing point is the time of flight.

:::reveal{title="Worked example: a stone thrown from a cliff"}
A stone is thrown from the top of a $40\,\text{m}$ cliff with speed $u = 25\,\text{m s}^{-1}$ at $\theta = 30^\circ$ above the horizontal. Find the time of flight and the range, using $g = 9.81\,\text{m s}^{-2}$.

**Components:**
$$
u_x = 25\cos 30^\circ = 21.65\,\text{m s}^{-1}, \qquad u_y = 25\sin 30^\circ = 12.5\,\text{m s}^{-1}.
$$

**Time of flight** — solve $\tfrac12(9.81)t^2 - 12.5t - 40 = 0$:
$$
t = \frac{12.5 + \sqrt{12.5^2 + 2(9.81)(40)}}{9.81} = \frac{12.5 + \sqrt{156.25 + 784.8}}{9.81} = \frac{12.5 + \sqrt{941.05}}{9.81}.
$$
$\sqrt{941.05} = 30.68$, so
$$
t = \frac{12.5 + 30.68}{9.81} = \frac{43.18}{9.81} = 4.40\,\text{s}.
$$

**Range** — horizontal motion is unaffected by the height, so simply
$$
R = u_x t = 21.65 \times 4.40 = 95.3\,\text{m}.
$$
:::

:::callout{kind="tip"}
The horizontal motion never "knows" about $h$ — the range is still just $u_x$ multiplied by whatever the (now longer) time of flight turns out to be. Only the vertical equation changes when you launch from a height.
:::

## What's next

The next lesson turns the working above into a general formula you can quote and apply directly, and treats the special case of a **horizontal** launch (like a ball rolling off a table) as $\theta = 0$.
