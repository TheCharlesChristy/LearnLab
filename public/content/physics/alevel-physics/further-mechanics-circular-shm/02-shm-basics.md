# Simple harmonic motion: defining equations and energy

Simple harmonic motion (SHM) is the most important pattern of oscillation in physics: a pendulum swinging through small angles, a mass bouncing on a spring, a guitar string vibrating, and the voltage in an AC circuit all obey the same mathematics.

## The defining equation

An oscillator undergoes SHM if its acceleration is always directed towards a fixed equilibrium point and is **proportional to its displacement** from that point:

$$
a = -\omega^2 x.
$$

Here $x$ is the displacement from equilibrium, $a$ is the acceleration, and $\omega$ is the angular frequency (in $\text{rad}\,\text{s}^{-1}$ — the same quantity as in circular motion, which is no coincidence: SHM is the projection of uniform circular motion onto one axis). The minus sign is essential: it says the acceleration (and hence the restoring force $F = ma$) always points **back towards equilibrium**, opposing the displacement. This is what makes the motion oscillate rather than run away.

:::callout{kind="key"}
Any equation of the form $a = -\omega^2 x$ describes SHM, whatever the physical system. Spot this pattern (e.g. in $F = -kx$ for a spring, since $a = F/m = -(k/m)x$) and you immediately know $\omega = \sqrt{k/m}$.
:::

## Displacement, velocity and the standard solutions

Solving $a = -\omega^2 x$ gives sinusoidal displacement. If the oscillator starts at maximum displacement $x = A$ (the **amplitude**) at $t = 0$:

$$
x = A\cos(\omega t).
$$

(If instead it starts at $x = 0$ moving through equilibrium, $x = A\sin(\omega t)$ describes the same motion with a different starting point in the cycle.) Differentiating gives the velocity, which can also be written directly in terms of displacement:

$$
v = \pm\omega\sqrt{A^2 - x^2}.
$$

Two important extreme values follow directly:

- **Maximum speed**, at the equilibrium position ($x = 0$): $v_{\max} = \omega A$.
- **Maximum acceleration**, at maximum displacement ($x = \pm A$): $a_{\max} = \omega^2 A$.

Explore this yourself: the widget below plots $x(t) = A\cos(\omega t)$ (its horizontal axis is time $t$ in seconds) — drag the sliders for amplitude $A$ and angular frequency $\omega$ and watch the period shorten as $\omega$ increases.

::py{src="items/shm-oscillator.py" height=420}

## Energy in SHM

An oscillating system continuously exchanges energy between kinetic energy (KE) and potential energy (PE — elastic PE in a spring, gravitational PE in a pendulum), while the **total mechanical energy stays constant** (for an undamped, "free" oscillator):

$$
E_{\text{total}} = \tfrac{1}{2}m\omega^2 A^2.
$$

At any displacement $x$, the split between the two is

$$
E_k = \tfrac{1}{2}m\omega^2\left(A^2 - x^2\right), \qquad E_p = \tfrac{1}{2}m\omega^2 x^2,
$$

which always sum to $E_{\text{total}}$. At $x = 0$ (equilibrium) all the energy is kinetic — this is where speed, and hence KE, is greatest. At $x = \pm A$ (maximum displacement) the oscillator is momentarily at rest, so all the energy is potential.

:::reveal{title="Worked example: displacement, velocity and energy at a given time"}
A mass on a spring oscillates with amplitude $A = 0.08\,\text{m}$ and angular frequency $\omega = 5\,\text{rad}\,\text{s}^{-1}$, starting at maximum displacement. Find its displacement and speed at $t = 0.2\,\text{s}$, and the total energy if $m = 0.3\,\text{kg}$.

**Displacement:**
$$
x = A\cos(\omega t) = 0.08 \times \cos(5 \times 0.2) = 0.08\cos(1.0) \approx 0.08 \times 0.540 \approx 0.0432\,\text{m}.
$$

**Speed** (using $v = \omega\sqrt{A^2 - x^2}$ as a check on the calculus result):
$$
v = 5\sqrt{0.08^2 - 0.0432^2} = 5\sqrt{0.0064 - 0.00187} = 5\sqrt{0.00453} \approx 5 \times 0.0673 \approx 0.337\,\text{m}\,\text{s}^{-1}.
$$

**Maximum speed and acceleration**, for comparison:
$$
v_{\max} = \omega A = 5 \times 0.08 = 0.4\,\text{m}\,\text{s}^{-1}, \qquad a_{\max} = \omega^2 A = 25 \times 0.08 = 2.0\,\text{m}\,\text{s}^{-2}.
$$

**Total energy:**
$$
E_{\text{total}} = \tfrac{1}{2}m\omega^2 A^2 = 0.5 \times 0.3 \times 25 \times 0.08^2 = 0.5 \times 0.3 \times 25 \times 0.0064 = 0.024\,\text{J}.
$$

Since $v < v_{\max}$ at this instant, the mass has not yet reached equilibrium — some of that $0.024\,\text{J}$ is still stored as elastic potential energy in the spring.
:::

Next we apply this framework to two familiar real oscillators — the simple pendulum and the mass-spring system — and see what happens when energy is *not* conserved (damping) or is topped up from outside (forced oscillation and resonance).
