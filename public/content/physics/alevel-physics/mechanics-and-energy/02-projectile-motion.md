# Projectile motion

A projectile is any object moving freely under gravity alone once it has been launched — a thrown ball, a kicked football, a jet of water. It is a two-dimensional motion problem, but it collapses into two easy one-dimensional SUVAT problems once you separate the directions.

:::callout{kind="key"}
Treat the horizontal and vertical motion **independently**. Horizontally there is no force (ignoring air resistance), so velocity is constant. Vertically the only acceleration is gravity, $g = 9.81\,\text{m s}^{-2}$ downwards. The two motions are linked only by the time $t$, which is the same for both.
:::

## Setting up the components

For a projectile launched with speed $u$ at angle $\theta$ above the horizontal, the launch velocity splits into

$$
u_x = u\cos\theta \quad (\text{horizontal, constant}), \qquad u_y = u\sin\theta \quad (\text{vertical, decelerated by } g).
$$

Taking "up" as positive, the horizontal acceleration is $0$ and the vertical acceleration is $-g$, so

$$
x = u_x\,t, \qquad y = u_y\,t - \tfrac{1}{2}g\,t^2.
$$

## Standard results for a level launch and landing

For a projectile launched from and landing at the same height, three results are worth being able to derive on demand:

- **Time of flight** (when $y$ returns to $0$): $\;t_{\text{flight}} = \dfrac{2u_y}{g} = \dfrac{2u\sin\theta}{g}$.
- **Range** (horizontal distance travelled): $\;R = u_x\,t_{\text{flight}} = \dfrac{u^2\sin 2\theta}{g}$.
- **Maximum height** (where the vertical velocity is momentarily $0$): $\;H = \dfrac{u_y^2}{2g} = \dfrac{u^2\sin^2\theta}{2g}$.

Because $\sin 2\theta$ is largest when $2\theta = 90^\circ$, the range is greatest at a launch angle of $\theta = 45^\circ$ (with no air resistance).

:::reveal{title="Worked example: a ball launched at 16 m/s and 50 degrees"}
Launch speed $u = 16\,\text{m s}^{-1}$, angle $\theta = 50^\circ$, $g = 9.81\,\text{m s}^{-2}$.

**Components:**

$$
u_x = 16\cos 50^\circ = 16 \times 0.6428 = 10.28\,\text{m s}^{-1}, \qquad u_y = 16\sin 50^\circ = 16 \times 0.7660 = 12.26\,\text{m s}^{-1}.
$$

**Time of flight:**

$$
t_{\text{flight}} = \frac{2u_y}{g} = \frac{2 \times 12.26}{9.81} = \frac{24.51}{9.81} = 2.50\,\text{s}.
$$

**Range:**

$$
R = u_x\,t_{\text{flight}} = 10.28 \times 2.50 = 25.7\,\text{m}.
$$

**Maximum height:**

$$
H = \frac{u_y^2}{2g} = \frac{12.26^2}{2 \times 9.81} = \frac{150.3}{19.62} = 7.66\,\text{m}.
$$
:::

## How the height changes with time

The graph below plots vertical height $y$ against time $t$ for a launch with $u = 20\,\text{m s}^{-1}$ at $\theta = 30^\circ$, so $u_y = 20\sin 30^\circ = 10\,\text{m s}^{-1}$ exactly, giving $y(t) = 10t - 4.905t^2$:

::widget{type="function-grapher" expr="10*x - 4.905*x^2" xmin=0 xmax=2.1 grid=true}

The curve is a symmetric parabola: height rises, peaks halfway through the flight (at $t = u_y/g \approx 1.02\,\text{s}$), then falls back to zero at $t_{\text{flight}} = 2u_y/g \approx 2.04\,\text{s}$ — matching the standard-results formula above.

## How range depends on launch angle

Holding the launch speed fixed at $u = 20\,\text{m s}^{-1}$ and varying only the angle gives the range curve below:

::widget{type="data-plot" src="range-vs-angle.json"}

The curve peaks at $45^\circ$ and is symmetric about it — for example $30^\circ$ and $60^\circ$ give the same range, because $\sin 2\theta$ takes the same value for both ($\sin 60^\circ = \sin 120^\circ$).

## Calculate it yourself

Edit the launch speed and angle below and run the code to compute the time of flight and range for a level launch.

::widget{type="code-runner" language="python" starter="import math\n\nu = 18          # launch speed, m/s\ntheta_deg = 35  # launch angle above horizontal, degrees\ng = 9.81\n\ntheta = math.radians(theta_deg)\nux = u * math.cos(theta)\nuy = u * math.sin(theta)\nt_flight = 2 * uy / g\nR = ux * t_flight\n\nprint(f'u_x = {ux:.2f} m/s, u_y = {uy:.2f} m/s')\nprint(f'time of flight = {t_flight:.2f} s')\nprint(f'range = {R:.2f} m')" solutionTest="assert abs(R - 31.0) < 1.0" rows=12}

:::callout{kind="tip"}
A quick sanity check for any level-launch projectile problem: doubling the launch speed $u$ quadruples the range (since $R \propto u^2$) but only doubles the time of flight (since $t_{\text{flight}} \propto u$). If your numbers don't scale that way when you double $u$ with the angle fixed, look for an arithmetic slip.
:::

That same idea — splitting motion into independent components and applying SUVAT to each — reappears throughout mechanics. Next we turn to *why* objects accelerate at all: Newton's laws of motion.
