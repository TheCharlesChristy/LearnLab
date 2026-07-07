# Maximising range and harder problems

## Why $45^\circ$ is optimal from ground level

For a launch from **ground level** ($h = 0$), the range formula from *kinematics-suvat* is
$$
R(\theta) = \frac{u^2 \sin 2\theta}{g}.
$$
Since $u$ and $g$ are fixed, $R$ is largest exactly when $\sin 2\theta$ is largest. The sine function has a maximum value of $1$, attained when its argument is $90^\circ$:
$$
\sin 2\theta = 1 \quad\Longleftrightarrow\quad 2\theta = 90^\circ \quad\Longleftrightarrow\quad \theta = 45^\circ.
$$

:::callout{kind="key"}
For a projectile launched and landing at the **same height**, the maximum possible range (for a given launch speed $u$) is achieved at $\theta = 45^\circ$, and equals $R_{\max} = \dfrac{u^2}{g}$. This only holds when $h = 0$ — the rest of this lesson looks at what changes when it doesn't.
:::

Because $\sin 2\theta = \sin(180^\circ - 2\theta)$, angles equally spaced either side of $45^\circ$ give equal ranges: $30^\circ$ and $60^\circ$ produce the same range, and so do $20^\circ$ and $70^\circ$. That symmetry is exactly what you may have noticed experimenting with the simulation in *kinematics-suvat*.

## Visualising range against angle

::widget{type="function-grapher" expr="(20^2/9.81)*sin(2*x*3.14159265/180)" xmin=0 xmax=90 ymin=0 ymax=45 grid=true}

This graphs $R(\theta) = \dfrac{u^2\sin 2\theta}{g}$ for $u = 20\,\text{m s}^{-1}$ against $\theta$ in degrees (the horizontal axis reads $\theta$ from $0^\circ$ to $90^\circ$). The peak sits exactly at $\theta = 45^\circ$, and the curve is symmetric about that peak — confirming the algebra above.

## What changes when the launch is elevated

When $h > 0$, the range no longer follows the clean $\sin 2\theta$ formula, because the extra fall time depends on $\theta$ in a more complicated way (through $u_y = u\sin\theta$ inside the square root of $t_{\text{flight}}$). Two things are still true, and one changes:

- Range still increases with $h$ for a fixed $\theta$ (a longer fall gives the constant $u_x$ more time to act) — you saw this in the previous lesson's chart.
- The optimal launch angle is **no longer symmetric** about $45^\circ$: because a shallower launch keeps more speed directed horizontally while gravity is going to add extra "free" flight time from the height anyway, the optimal angle for $h > 0$ is **always less than $45^\circ$**, and it decreases further as $h$ increases relative to $u^2/g$.

:::callout{kind="tip"}
You are not expected to derive a general closed-form optimal angle for $h > 0$ (it involves solving a quartic and is beyond A-level). What you should be able to do is: (a) state and justify the $45^\circ$ ground-level result, and (b) reason qualitatively — or check numerically by trying a few angles — that raising the launch point favours flatter (smaller-angle) trajectories.
:::

## Harder problem: maximum height above the ground

For a launch from height $h$, the projectile's greatest height **above the ground** is the launch height plus the extra height gained above the launch point:

$$
H_{\text{above ground}} = h + \frac{u_y^2}{2g}.
$$

:::reveal{title="Worked example: maximum height above the ground"}
Using the cliff example from Lesson 1 ($u = 25\,\text{m s}^{-1}$, $\theta = 30^\circ$, $h = 40\,\text{m}$, so $u_y = 12.5\,\text{m s}^{-1}$):

$$
\frac{u_y^2}{2g} = \frac{12.5^2}{2\times 9.81} = \frac{156.25}{19.62} = 7.96\,\text{m}.
$$

So the maximum height above the ground is
$$
H_{\text{above ground}} = 40 + 7.96 = 47.96\,\text{m}.
$$
:::

## Harder problem: speed on landing

A useful shortcut avoids recomputing the full trajectory: since horizontal speed never changes and vertical speed obeys $v_y^2 = u_y^2 + 2gh$ (SUVAT, "downhill" over the full drop from the peak or directly from launch — the constant-acceleration equation doesn't care about the path), the **landing speed** satisfies

$$
v_{\text{land}}^2 = u_x^2 + v_y^2 = u_x^2 + \left(u_y^2 + 2gh\right) = u^2 + 2gh,
$$

using $u_x^2 + u_y^2 = u^2$. This is really an energy statement ($\tfrac12 v_{\text{land}}^2 = \tfrac12 u^2 + gh$ per unit mass) in disguise.

:::reveal{title="Worked example: landing speed off a cliff"}
Same data as before: $u = 25\,\text{m s}^{-1}$, $h = 40\,\text{m}$.
$$
v_{\text{land}} = \sqrt{u^2 + 2gh} = \sqrt{25^2 + 2\times 9.81\times 40} = \sqrt{625 + 784.8} = \sqrt{1409.8} = 37.5\,\text{m s}^{-1}.
$$
Notice the launch angle $\theta$ never entered this calculation — the landing speed from a given height depends only on $u$ and $h$, not on the direction of launch.
:::

## Summary

You have now extended the ground-level projectile model from *kinematics-suvat* to:

1. Launches from a height $h$, with a general time-of-flight formula involving a square root.
2. The special case of a horizontal launch, which reduces to simple free-fall timing.
3. A rigorous derivation of the $45^\circ$ maximum-range result at ground level, and a qualitative understanding of how that angle shifts for elevated launches.
4. Two common "harder problem" shortcuts: maximum height above the ground, and landing speed via $v_{\text{land}}^2 = u^2 + 2gh$.

Take the end-of-module assessment to check your understanding.
