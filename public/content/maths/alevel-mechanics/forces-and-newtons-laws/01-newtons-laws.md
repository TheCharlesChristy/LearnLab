# Newton's three laws of motion

Kinematics describes **how** things move. Now we ask **why**: forces are the cause of changes in motion. A force is a *vector* quantity — it has both magnitude and direction — measured in **newtons** ($\text{N}$), where $1\,\text{N} = 1\,\text{kg}\,\text{m}\,\text{s}^{-2}$.

Isaac Newton's three laws connect force to motion and underpin the whole of this course.

## Newton's first law

> A body remains at rest, or moves with constant velocity in a straight line, unless acted on by a resultant (net) external force.

In other words, an object does not need a force to keep moving — it needs a **resultant** force to change its velocity (speed up, slow down, or change direction). A book resting on a table stays at rest because the forces on it balance; a hockey puck sliding on frictionless ice keeps its velocity because no resultant force acts on it.

:::callout{kind="key"}
"No resultant force" does not mean "no forces at all". Several forces can act on a body and still sum to zero. Newton's first law is really a statement about **equilibrium**, which we study in detail in the last lesson of this module.
:::

## Newton's second law

> The resultant force on a body is proportional to its rate of change of momentum; for constant mass this gives $F = ma$.

Here $F$ is the resultant (net) force in newtons, $m$ is the mass in kilograms, and $a$ is the acceleration in $\text{m s}^{-2}$, all measured in the same direction. This is the single most useful equation in mechanics: it links force directly to the kinematics you already know from `kinematics-suvat`.

$$
F = ma
$$

Because $F$ and $a$ are vectors pointing the same way, the equation applies separately to any direction you choose to resolve in — this is exactly how we will handle inclined planes and lifts in the next lesson.

::widget{type="function-grapher" expr="4*x" xmin=0 xmax=5 ymin=0 ymax=20}

The graph above plots $F = ma$ for a fixed mass of $m = 4\,\text{kg}$, so $F = 4a$: force is directly proportional to acceleration when mass is constant, and the gradient of the line **is** the mass.

:::reveal{title="Worked example: applying F = ma"}
A resultant force of $20\,\text{N}$ acts on a particle of mass $4\,\text{kg}$. Find its acceleration.

Rearranging $F = ma$ for $a$:

$$
a = \frac{F}{m} = \frac{20}{4} = 5\,\text{m s}^{-2}.
$$

The particle accelerates at $5\,\text{m s}^{-2}$ in the direction of the resultant force.
:::

## Newton's third law

> If body A exerts a force on body B, then body B exerts an equal and opposite force on body A.

These "action–reaction" forces are often summarised as "every action has an equal and opposite reaction". Two crucial points trip people up:

- The two forces act on **different bodies** (one on A, one on B) — they never cancel each other out for a single object, because they are not both acting on the same thing.
- The two forces are always the **same type** of force acting along the same line: if A pushes B with a contact force, B pushes back on A with a contact force (not, say, a gravitational one).

:::callout{kind="tip"}
When you stand on the floor, gravity pulls you down (your weight) and the floor pushes up on you (the normal reaction). These are **not** a Newton's-third-law pair — they act on the *same* body (you) and happen to be different types of force. The true third-law pair to your weight is the gravitational pull *you* exert on the Earth; the pair to the normal reaction is the force *you* exert downward on the floor.
:::

## Why this matters

Every mechanics problem from here on is an exercise in identifying the forces acting on a body, choosing a positive direction, and applying $F = ma$ (or the equilibrium condition $F = 0$ from Newton's first law). The next lesson makes this concrete with weight, normal reaction, and worked $F = ma$ problems.
