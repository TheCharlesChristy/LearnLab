# Work, energy and power

Energy gives mechanics a second, often faster, way to solve problems — one that can avoid finding accelerations or times altogether.

## Work done

Work is done whenever a force causes a displacement. If a constant force $F$ acts while an object moves through displacement $s$, and the angle between the force and the displacement is $\theta$,

$$
W = Fs\cos\theta.
$$

Work is measured in joules ($\text{J} = \text{N m}$). When the force acts exactly along the direction of motion, $\theta = 0$ and $W = Fs$; a force perpendicular to the motion ($\theta = 90^\circ$) does no work at all, since $\cos 90^\circ = 0$.

:::reveal{title="Worked example: work done at an angle"}
A sled is pulled $10\,\text{m}$ across level snow by a rope held at $30^\circ$ to the direction of travel, with tension $25\,\text{N}$. Find the work done by the rope.

$$
W = Fs\cos\theta = 25 \times 10 \times \cos 30^\circ = 250 \times 0.8660 = 216.5\,\text{J}.
$$
:::

## Kinetic and gravitational potential energy

Two forms of mechanical energy appear constantly:

$$
E_k = \tfrac{1}{2}mv^2 \qquad (\text{kinetic energy, from motion}),
$$

$$
E_p = mgh \qquad (\text{gravitational potential energy, from height } h \text{ above a reference level}).
$$

:::reveal{title="Worked example: KE and GPE"}
A $2\,\text{kg}$ ball moves at $6\,\text{m s}^{-1}$ while $1.5\,\text{kg}$ of stationary luggage sits on a shelf $4\,\text{m}$ above the floor.

$$
E_k = \tfrac{1}{2}(2)(6)^2 = \tfrac{1}{2}\times 2 \times 36 = 36\,\text{J}.
$$

$$
E_p = mgh = 1.5 \times 9.81 \times 4 = 58.86\,\text{J}.
$$
:::

## The work-energy theorem

Work done and kinetic energy are linked directly: the net work done on an object equals its change in kinetic energy. Step through the derivation below to see why this must follow from $F=ma$ and SUVAT alone.

::widget{type="step-reveal" src="work-energy-derivation.json"}

This theorem is a shortcut: if you know the net force and the distance over which it acts, you can find a final speed without ever computing an acceleration or a time.

## Conservation of mechanical energy

:::callout{kind="key"}
**Conservation of mechanical energy:** if no resistive forces (friction, air resistance) act, the total mechanical energy $E_k + E_p$ of a system stays constant. Energy converts between kinetic and potential form, but the total does not change.
:::

:::reveal{title="Worked example: a dropped object, two methods"}
An object is dropped from rest at height $h = 20\,\text{m}$. Find its speed just before landing, first using energy conservation, then checking with SUVAT.

**Energy conservation:** all the GPE converts to KE by the time it lands ($h=0$):

$$
mgh = \tfrac{1}{2}mv^2 \;\Longrightarrow\; v = \sqrt{2gh} = \sqrt{2 \times 9.81 \times 20} = \sqrt{392.4} = 19.81\,\text{m s}^{-1}.
$$

**SUVAT check**, with $u = 0$ and $a = g$: $v^2 = u^2 + 2as = 0 + 2(9.81)(20) = 392.4$, so $v = \sqrt{392.4} = 19.81\,\text{m s}^{-1}$ — the same answer, as it must be, since both methods describe the same free fall.
:::

Notice the mass $m$ cancelled out of the energy method entirely — in free fall (no air resistance), how fast something falls does not depend on its mass.

## Power

Power is the rate of doing work (or transferring energy):

$$
P = \frac{W}{t}.
$$

For a force acting at constant velocity $v$ in the direction of motion, this can be rewritten without needing the time explicitly, since $W = Fs$ and $s = vt$:

$$
P = \frac{Fs}{t} = Fv.
$$

Power is measured in watts ($\text{W} = \text{J s}^{-1}$).

:::reveal{title="Worked example: power of a crane"}
A crane lifts a $250\,\text{kg}$ load a height of $8\,\text{m}$ in $20\,\text{s}$ at constant velocity. Find the power output, two ways.

**Using $P = W/t$:**

$$
W = mgh = 250 \times 9.81 \times 8 = 19\,620\,\text{J}, \qquad P = \frac{W}{t} = \frac{19\,620}{20} = 981\,\text{W}.
$$

**Using $P = Fv$:** at constant velocity the lifting force equals the weight, $F = mg = 250 \times 9.81 = 2452.5\,\text{N}$, and the speed is $v = h/t = 8/20 = 0.4\,\text{m s}^{-1}$:

$$
P = Fv = 2452.5 \times 0.4 = 981\,\text{W}.
$$

Both methods agree, as they must: $P = Fv$ is just $P = W/t$ rewritten using $W = Fs$ and $v = s/t$.
:::

That completes the toolkit for this module: vectors and SUVAT to describe motion, Newton's laws and momentum to explain forces and collisions, and work, energy and power to track how a system's capacity to do work is stored, transferred and dissipated. The end-of-module assessment draws on all four lessons.
