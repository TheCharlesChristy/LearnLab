# Combining forces and equilibrium

Real objects rarely feel just one force. To use Newton's second law we must first reduce all the forces acting on a particle to a single **resultant force** — their vector sum.

## Combining forces as vectors

Because force is a vector, two or more forces are combined by adding their components, exactly as you would add displacement or velocity vectors. If a particle experiences forces $\mathbf{F_1}$ and $\mathbf{F_2}$ at right angles to each other, the magnitude of the resultant is found with Pythagoras' theorem, and its direction with trigonometry:

$$
R = \sqrt{F_1^2 + F_2^2}, \qquad \tan\theta = \frac{F_2}{F_1},
$$

where $\theta$ is the angle the resultant makes with $\mathbf{F_1}$.

:::reveal{title="Worked example: resultant of two perpendicular forces"}
A particle experiences a force of $30\,\text{N}$ due east and a force of $40\,\text{N}$ due north. Find the magnitude and direction of the resultant force.

**Magnitude:**

$$
R = \sqrt{30^2 + 40^2} = \sqrt{900 + 1600} = \sqrt{2500} = 50\,\text{N}.
$$

**Direction** (measured from east, towards north):

$$
\tan\theta = \frac{40}{30} \implies \theta = \tan^{-1}(1.\overline{3}) = 53.1^\circ \; (\text{to 1 d.p.}).
$$

So the resultant is $50\,\text{N}$ at $53.1^\circ$ north of east.
:::

More generally, when forces act at arbitrary angles, resolve each one into two perpendicular directions (usually horizontal and vertical, or along/perpendicular to a slope), add the components in each direction separately, then recombine with Pythagoras if you need the resultant's magnitude and direction.

::widget{type="function-grapher" expr="sqrt(30^2+x^2)" xmin=0 xmax=40 ymin=0 ymax=55}

The graph shows how the resultant magnitude $R=\sqrt{30^2+F_2^2}$ grows as the second perpendicular force $F_2$ increases while the first force stays fixed at $30\,\text{N}$ — notice $R$ is never less than $30\,\text{N}$, and reaches $50\,\text{N}$ exactly when $F_2 = 40\,\text{N}$, matching the worked example above.

## Resolving a single force into components

The reverse process — splitting one force into perpendicular components — is just as important, and is exactly what we did with weight on an inclined plane in the previous lesson. A force $F$ acting at angle $\theta$ to a chosen axis has components

$$
F_x = F\cos\theta, \qquad F_y = F\sin\theta
$$

along and perpendicular to that axis respectively.

## Equilibrium

Newton's first law tells us a particle stays at rest or at constant velocity precisely when the **resultant force is zero**:

$$
\sum F_x = 0 \qquad \text{and} \qquad \sum F_y = 0.
$$

This gives us two independent equations (one per direction) to solve for unknown forces — exactly the technique used for a particle "in equilibrium" or "on the point of moving" in exam questions.

:::callout{kind="key"}
Equilibrium means the **vector sum** of all forces is zero, not that only one force acts. A particle held still by three ropes pulling in different directions is in equilibrium because those three forces sum to zero, even though none of them is zero individually.
:::

:::reveal{title="Worked example: three forces in equilibrium"}
A ring is held in equilibrium by three horizontal strings. Two strings pull with forces $8\,\text{N}$ due east and $6\,\text{N}$ due north. Find the magnitude and direction of the third force needed to keep the ring in equilibrium.

The first two forces have a resultant $R = \sqrt{8^2+6^2} = \sqrt{64+36} = \sqrt{100} = 10\,\text{N}$, at angle $\tan^{-1}(6/8) = 36.9^\circ$ north of east.

For equilibrium, the resultant of **all three** forces must be zero, so the third force must be equal in magnitude and exactly opposite in direction to this resultant:

$$
F_3 = 10\,\text{N}, \quad \text{directed } 36.9^\circ \text{ south of west (i.e. } 180^\circ + 36.9^\circ = 216.9^\circ \text{ from east)}.
$$
:::

:::reveal{title="Worked example: equilibrium on an inclined plane with friction removed"}
A block of mass $2\,\text{kg}$ is held at rest on a smooth plane inclined at $20^\circ$ to the horizontal by a string running up the line of greatest slope. Find the tension in the string.

Weight: $W = mg = 2 \times 9.81 = 19.62\,\text{N}$. Resolving **along the slope**, with the tension $T$ up the slope and the weight component $mg\sin\theta$ down the slope, equilibrium gives

$$
T = mg\sin\theta = 19.62 \times \sin 20^\circ = 19.62 \times 0.3420 = 6.71\,\text{N} \; (\text{to 2 d.p.}).
$$

(The normal reaction $R = mg\cos 20^\circ$ balances the perpendicular component but does not affect the tension, since $R$ has no component along the slope.)
:::

## Summary

Across this module you have met the three tools needed for almost every mechanics problem: **Newton's laws** to connect force and motion, **weight/normal reaction/F=ma** to model specific forces, and **combining and resolving forces** to reduce a messy diagram to one or two equations. The next modules in this course — moments, projectiles, and friction and connected particles — build directly on this foundation.
