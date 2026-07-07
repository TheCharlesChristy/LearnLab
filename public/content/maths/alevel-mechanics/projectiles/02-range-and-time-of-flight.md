# General range and time-of-flight formulas

## The general time of flight

For a projectile launched with speed $u$ at angle $\theta$ above the horizontal, from a height $h$ above the landing point, the previous lesson derived

$$
t_{\text{flight}} = \frac{u\sin\theta + \sqrt{(u\sin\theta)^2 + 2gh}}{g}.
$$

This is the **general** result. Two special cases you should recognise instantly:

- **Ground-level launch** ($h = 0$): the square root simplifies to $u\sin\theta$, giving back the familiar $t = \dfrac{2u\sin\theta}{g}$.
- **Horizontal launch** ($\theta = 0$, so $u_y = 0$): the formula collapses to $t = \sqrt{\dfrac{2h}{g}}$ — exactly the "how long does it take to fall a height $h$" result, since there is no initial vertical speed at all.

## The general range

Range is always horizontal speed times time of flight, whatever $h$ and $\theta$ are:

$$
R = u_x\,t_{\text{flight}} = u\cos\theta \left(\frac{u\sin\theta + \sqrt{u^2\sin^2\theta + 2gh}}{g}\right).
$$

:::callout{kind="key"}
You do **not** need to memorise this expanded form. In exam-style problems it is almost always faster to work in two clear steps, exactly as in the worked examples: (1) find $t_{\text{flight}}$ from the vertical equation $y = u_y t - \tfrac12 g t^2$ set equal to $-h$; (2) substitute that $t$ into $R = u_x t$. Quoting the one-line formula is only worth it when a question explicitly asks you to "show that" the general result holds.
:::

## Special case: horizontal launch

A ball rolling off a table, or a stone thrown horizontally from a cliff, has $\theta = 0$, so $u_y = 0$ and $u_x = u$. The vertical motion is then identical to an object simply dropped from height $h$:

$$
h = \tfrac12 g t^2 \quad\Rightarrow\quad t_{\text{flight}} = \sqrt{\frac{2h}{g}}, \qquad R = u\sqrt{\frac{2h}{g}}.
$$

:::reveal{title="Worked example: horizontal launch off a wall"}
A ball is launched horizontally at $u = 30\,\text{m s}^{-1}$ from the top of a $20\,\text{m}$ high wall. Find the time of flight and the range.

Since $\theta = 0$, $u_y = 0$, so
$$
t = \sqrt{\frac{2h}{g}} = \sqrt{\frac{2 \times 20}{9.81}} = \sqrt{4.077} = 2.02\,\text{s}.
$$
Range:
$$
R = u\,t = 30 \times 2.02 = 60.6\,\text{m}.
$$
:::

## Worked example: general angle and height

:::reveal{title="Worked example: general launch angle from a height"}
A projectile is launched at $u = 18\,\text{m s}^{-1}$, $\theta = 25^\circ$, from a platform $h = 12\,\text{m}$ above the ground.

**Components:**
$$
u_x = 18\cos25^\circ = 16.31\,\text{m s}^{-1}, \qquad u_y = 18\sin25^\circ = 7.61\,\text{m s}^{-1}.
$$

**Time of flight:**
$$
t = \frac{7.61 + \sqrt{7.61^2 + 2(9.81)(12)}}{9.81} = \frac{7.61 + \sqrt{57.9 + 235.4}}{9.81} = \frac{7.61 + \sqrt{293.3}}{9.81} = \frac{7.61 + 17.13}{9.81} = 2.52\,\text{s}.
$$

**Range:**
$$
R = u_x t = 16.31 \times 2.52 = 41.1\,\text{m}.
$$
:::

## Visualising range against launch height

::widget{type="data-plot" src="range-vs-height.json"}

The chart above shows the range of a projectile launched at a fixed speed $u = 20\,\text{m s}^{-1}$ and fixed angle $\theta = 30^\circ$, as the launch height $h$ increases from $0$ to $50\,\text{m}$. Range increases with $h$ because a longer fall gives the constant horizontal velocity more time to act — but the increase is not linear, since $t_{\text{flight}}$ grows like $\sqrt{h}$ for large $h$.

:::callout{kind="tip"}
A quick sanity check for any landing-from-a-height problem: your calculated time of flight must always be **larger** than the ground-level value $\dfrac{2u\sin\theta}{g}$ for the same $u$ and $\theta$ (assuming $h>0$), because the projectile has further to fall. If your answer comes out smaller, you have made a sign error in the quadratic.
:::
