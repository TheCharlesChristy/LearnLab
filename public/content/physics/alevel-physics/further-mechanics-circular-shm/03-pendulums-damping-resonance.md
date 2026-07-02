# Pendulums, springs, damping and resonance

Two systems dominate A-level treatments of SHM: the simple pendulum and the mass-spring system. Both give a period that depends only on the properties of the system, never on the amplitude — one of the defining features of SHM.

## The simple pendulum

For a pendulum of length $l$ swinging through **small angles** (below about $10°$, so that $\sin\theta \approx \theta$ in radians), the motion is simple harmonic with period

$$
T = 2\pi\sqrt{\frac{l}{g}},
$$

where $g$ is the gravitational field strength. Notice $T$ does not depend on the mass of the bob or (for small angles) on the amplitude of the swing — only on $l$ and $g$. This is why pendulum clocks keep time reliably regardless of small variations in how far they swing.

## The mass-spring system

A mass $m$ attached to a spring of spring constant $k$, obeying Hooke's law $F = -kx$, also executes SHM. Newton's second law gives $ma = -kx$, so $a = -(k/m)x$ — matching the SHM defining equation $a = -\omega^2 x$ with $\omega^2 = k/m$. The period is therefore

$$
T = 2\pi\sqrt{\frac{m}{k}}.
$$

Unlike the pendulum, this period depends on **mass**, not on $g$ — it works identically in orbit or on the Moon, which is why spring-based mass measurements are used in space.

:::reveal{title="Worked example: pendulum and spring periods"}
**Pendulum:** a pendulum has length $l = 1.0\,\text{m}$. Using $g = 9.81\,\text{m}\,\text{s}^{-2}$,
$$
T = 2\pi\sqrt{\frac{1.0}{9.81}} = 2\pi\sqrt{0.10194} \approx 2\pi \times 0.3193 \approx 2.01\,\text{s}.
$$

**Spring:** a mass $m = 0.5\,\text{kg}$ hangs from a spring of constant $k = 40\,\text{N}\,\text{m}^{-1}$.
$$
T = 2\pi\sqrt{\frac{0.5}{40}} = 2\pi\sqrt{0.0125} \approx 2\pi \times 0.1118 \approx 0.702\,\text{s}.
$$

Doubling $l$ (pendulum) or $m$ (spring) does **not** double the period, because both formulae involve a square root — the period scales with $\sqrt{l}$ or $\sqrt{m}$.
:::

Try your own numbers: edit the length `l` (or adapt the code for a spring, replacing `l/g` with `m/k`) and run it to compute a period.

::widget{type="code-runner" language="python" starter="import math\n\nl = 0.9   # pendulum length in metres\ng = 9.81  # gravitational field strength in N/kg\n\nT = 2 * math.pi * math.sqrt(l / g)\nprint(f'Period T = {T:.3f} s')" rows=10}

## Free, damped and forced oscillations

- A **free oscillation** has no external periodic driving force and no resistive (dissipative) force acting on it: once started, it oscillates forever at its **natural frequency** $f_0$ with constant amplitude — the idealised SHM described above.
- A **damped oscillation** loses energy to resistive forces (friction, air resistance, fluid viscosity), so its amplitude decreases over time. Three regimes matter:
  - **Light damping** — amplitude decays gradually while the system still oscillates many times (a pendulum in air).
  - **Critical damping** — the system returns to equilibrium in the *shortest possible time* without oscillating at all (car suspension and door closers are deliberately designed this way).
  - **Heavy damping** (overdamping) — the system returns to equilibrium *without* oscillating, but more slowly than the critically damped case (a heavy door closing very slowly).
- A **forced oscillation** occurs when a periodic external driving force is applied to a system, at a driving frequency $f$ that need not match the system's natural frequency $f_0$.

:::callout{kind="info"}
"Damping" and "forcing" are independent ideas: a real driven system (e.g. a car's suspension responding to bumps) is normally both damped *and* forced at once.
:::

## Resonance

When a system is forced at a driving frequency $f$ close to its **natural frequency** $f_0$, the amplitude of the resulting oscillation becomes very large — this is **resonance**. The lighter the damping, the sharper and taller the resonance peak (heavily damped systems barely show a peak at all, and their amplitude changes little with driving frequency).

Resonance is exploited deliberately (a child's swing pushed at its natural frequency builds up large amplitude with little effort; a microwave oven's frequency is tuned to resonate with water molecules) and guarded against carefully (the Tacoma Narrows Bridge (1940) famously oscillated with catastrophic amplitude when wind-induced forces coupled with its natural frequency; engineers now add damping — e.g. tuned mass dampers in skyscrapers — specifically to limit resonant amplitudes).

:::callout{kind="key"}
Resonance: maximum amplitude when the **driving frequency equals the natural frequency** of the system. Damping reduces the peak amplitude at resonance and broadens the range of driving frequencies over which a large response occurs.
:::

This completes the further mechanics topic: circular motion supplies the geometric picture (uniform circular motion projects onto SHM), the SHM equations describe displacement, velocity, acceleration and energy, and pendulums and springs are the two standard physical realisations — refined by the ideas of damping and resonance whenever real energy losses or external driving are involved.
