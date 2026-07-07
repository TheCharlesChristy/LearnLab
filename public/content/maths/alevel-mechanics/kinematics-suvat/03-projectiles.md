# Projectile motion

A projectile is an object moving freely under gravity alone — a thrown ball, a struck golf ball, a stream of water. The key modelling idea is simple but powerful:

:::callout{kind="key"}
Treat the horizontal and vertical motion **independently**. Horizontally there is no force, so the velocity is constant. Vertically the only acceleration is gravity, $g = 9.81\,\text{m s}^{-2}$ downwards. The two motions share only the time $t$.
:::

## Setting up the components

If a projectile is launched with speed $u$ at an angle $\theta$ above the horizontal, split the launch velocity into components:

$$
u_x = u\cos\theta \quad (\text{horizontal}), \qquad u_y = u\sin\theta \quad (\text{vertical}).
$$

Then apply SUVAT to each direction separately. Taking up as positive, the horizontal acceleration is $0$ and the vertical acceleration is $-g$:

$$
x = u_x\,t, \qquad y = u_y\,t - \tfrac{1}{2}g\,t^2.
$$

These are exactly the equations the simulation below integrates.

## Standard results

For a projectile launched from ground level, three quantities are worth knowing how to derive:

- **Time of flight** (when $y$ returns to $0$): $\;t = \dfrac{2u_y}{g} = \dfrac{2u\sin\theta}{g}$.
- **Range** (horizontal distance to landing): $\;R = u_x\,t = \dfrac{u^2 \sin 2\theta}{g}$.
- **Maximum height** (where the vertical velocity is momentarily zero): $\;H = \dfrac{u_y^2}{2g} = \dfrac{u^2\sin^2\theta}{2g}$.

The range formula is largest when $\sin 2\theta = 1$, i.e. $\theta = 45^\circ$ — the classic result that a projectile (with no air resistance) travels furthest when launched at $45^\circ$.

:::reveal{title="Worked example: a ball thrown at 20 m/s and 30 degrees"}
Launch speed $u = 20\,\text{m s}^{-1}$, angle $\theta = 30^\circ$, $g = 9.81\,\text{m s}^{-2}$.

Components: $u_x = 20\cos 30^\circ = 17.32\,\text{m s}^{-1}$ and $u_y = 20\sin 30^\circ = 10\,\text{m s}^{-1}$.

**Time of flight** — vertical motion returns to $y = 0$:

$$
t = \frac{2u_y}{g} = \frac{2 \times 10}{9.81} = 2.039\,\text{s}.
$$

**Range** — horizontal motion at constant $u_x$:

$$
R = u_x\,t = 17.32 \times 2.039 = 35.3\,\text{m}.
$$

**Maximum height** — using $v_y^2 = u_y^2 - 2gH$ with $v_y = 0$:

$$
H = \frac{u_y^2}{2g} = \frac{10^2}{2 \times 9.81} = 5.10\,\text{m}.
$$
:::

## Experiment with the model

The simulation below launches a projectile under exactly these equations, updating $30$ times per second. Change the launch **angle** and **speed**, press **Launch**, and watch the path trace out. Notice how the range peaks near $45^\circ$ and how the best range you have achieved is remembered between launches.

::py{src="items/projectile.py" height=360}

:::callout{kind="tip"}
Try fixing the speed and sweeping the angle from $10^\circ$ to $80^\circ$. The range is symmetric about $45^\circ$: for example $30^\circ$ and $60^\circ$ give the same range, because $\sin 2\theta$ takes the same value for both.
:::

That symmetry is the geometric heart of projectile motion, and it falls straight out of the same SUVAT equations you have used throughout this module.
