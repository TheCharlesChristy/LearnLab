# Weight, normal reaction and F = ma

To apply Newton's second law to real situations we need to identify every force acting on a particle. The two forces that appear in almost every problem are **weight** and **normal reaction**.

## Mass vs weight

**Mass** $m$ is a scalar property of an object — the amount of matter it contains, measured in kilograms ($\text{kg}$). It does not depend on location.

**Weight** $W$ is a force — the pull of gravity on that mass — measured in newtons ($\text{N}$). Near the Earth's surface,

$$
W = mg, \qquad g = 9.81\,\text{m s}^{-2}.
$$

Weight always acts **vertically downwards**, towards the centre of the Earth, regardless of how a surface is tilted.

:::callout{kind="warning"}
Mass and weight are often confused in everyday speech ("how much do you weigh, in kg?") but in mechanics they are different physical quantities with different units. A mass of $70\,\text{kg}$ has a weight of $70 \times 9.81 = 686.7\,\text{N}$.
:::

## Normal reaction

When a particle rests on a surface, the surface pushes back on it with a **normal reaction force** $R$ (or $N$), acting **perpendicular to the surface**, away from it. For a particle on a horizontal surface with no other vertical forces, Newton's first law (equilibrium) gives

$$
R = W = mg,
$$

because the vertical resultant force must be zero for the particle to stay on the surface without accelerating vertically.

:::reveal{title="Worked example: normal reaction with an extra vertical force"}
A crate of mass $12\,\text{kg}$ rests on horizontal ground. A rope pulls upward on the crate with a force of $30\,\text{N}$ at an angle straight up (vertical). Find the normal reaction.

Weight: $W = mg = 12 \times 9.81 = 117.72\,\text{N}$.

Resolving vertically (taking up as positive), the crate is in equilibrium:

$$
R + 30 - W = 0 \implies R = 117.72 - 30 = 87.72\,\text{N}.
$$

The rope reduces the normal reaction because it shares the job of supporting the crate's weight.
:::

## Applying F = ma: a lift (elevator)

A powerful use of $F = ma$ is a particle whose weight is **not** balanced by the other vertical forces, so it accelerates. The classic example is a person of mass $m$ standing on a lift floor (or hanging from a rope), where the cable tension $T$ is the only other vertical force.

Taking **up** as positive, Newton's second law along the vertical gives

$$
T - mg = ma \quad\Longrightarrow\quad T = m(g + a),
$$

where $a$ is positive when the lift accelerates upward and negative when it accelerates downward.

The chart below shows the tension in a lift's supporting cable for a passenger of mass $60\,\text{kg}$ ($W = 60 \times 9.81 = 588.6\,\text{N}$) through four phases of a journey, using $a = 1.5\,\text{m s}^{-2}$ during the accelerating phases:

::widget{type="data-plot" src="data/lift-tension.json"}

- **At rest or constant velocity** ($a=0$): $T = mg = 588.6\,\text{N}$.
- **Accelerating upward** ($a = +1.5\,\text{m s}^{-2}$): $T = 60(9.81+1.5) = 678.6\,\text{N}$ — tension is *greater* than weight, which is why you feel heavier as a lift sets off upward.
- **Accelerating downward** ($a = -1.5\,\text{m s}^{-2}$): $T = 60(9.81-1.5) = 498.6\,\text{N}$ — tension is *less* than weight, so you feel lighter.

:::callout{kind="tip"}
Always start an $F=ma$ problem by choosing a positive direction, drawing every force acting on the particle, and writing the resultant force in that direction equal to $ma$. Getting a sign wrong for one force is the single most common mechanics mistake.
:::

## Applying F = ma: a particle on an inclined plane

On a frictionless slope inclined at angle $\theta$ to the horizontal, weight $mg$ still acts vertically downward, but it is easier to resolve it into two perpendicular directions: **along the slope** and **perpendicular to the slope**.

$$
\text{Component along the slope (down-slope)} = mg\sin\theta, \qquad \text{Component perpendicular to the slope} = mg\cos\theta.
$$

Because the particle cannot accelerate through the surface, the perpendicular direction is in equilibrium, giving the normal reaction $R = mg\cos\theta$. Along the slope, if there is no friction, the only force is the weight component, so Newton's second law gives

$$
mg\sin\theta = ma \quad\Longrightarrow\quad a = g\sin\theta.
$$

:::reveal{title="Worked example: particle sliding down a smooth slope"}
A particle of mass $5\,\text{kg}$ is released from rest on a smooth (frictionless) plane inclined at $30^\circ$ to the horizontal. Find its acceleration down the slope and the normal reaction.

Weight: $W = mg = 5 \times 9.81 = 49.05\,\text{N}$.

**Along the slope** (no friction, so weight component is the only force):

$$
a = g\sin\theta = 9.81 \times \sin 30^\circ = 9.81 \times 0.5 = 4.905\,\text{m s}^{-2}.
$$

**Perpendicular to the slope** (equilibrium in this direction):

$$
R = mg\cos\theta = 5 \times 9.81 \times \cos 30^\circ = 49.05 \times 0.8660 = 42.48\,\text{N} \; (\text{to 2 d.p.}).
$$

Note that $R < W$: the surface only has to support the *perpendicular* component of the weight, not all of it.
:::

The next lesson brings these ideas together: combining several forces acting on a particle at once, and using the condition "resultant force = 0" to solve equilibrium problems.
