# F = ma with friction on horizontal and inclined surfaces

Once a particle is sliding, friction takes its limiting value $F = \mu N$ and acts to oppose the motion. Newton's second law, $F = ma$, then combines with this friction force (and, on a slope, with a component of weight) to give the resultant force — and hence the acceleration.

## Horizontal surface: friction alone

Consider a particle of mass $m$ sliding across rough horizontal ground with no other applied horizontal force. The only horizontal force is friction, acting **backwards** (opposing the motion), with magnitude $F = \mu N$. Since the surface is horizontal, $N = mg$.

Taking the direction of motion as positive, Newton's second law gives

$$
-\mu N = ma \quad\Longrightarrow\quad -\mu m g = ma \quad\Longrightarrow\quad a = -\mu g.
$$

The mass cancels — **a sliding particle on a horizontal surface with friction alone always decelerates at $\mu g$, regardless of its mass.** The negative sign shows the acceleration acts opposite to the direction of travel, i.e. the particle slows down.

:::reveal{title="Worked example: a decelerating block"}
A block of mass $2\,\text{kg}$ slides across rough horizontal ground with initial speed $u = 9\,\text{m s}^{-1}$. The coefficient of friction is $\mu = 0.4$. Find the deceleration, and the distance travelled before the block stops.

**Normal reaction:** $N = mg = 2 \times 9.81 = 19.62\,\text{N}$.

**Friction force:** $F = \mu N = 0.4 \times 19.62 = 7.848\,\text{N}$.

**Newton's second law** (taking the direction of travel as positive, friction acting backwards):

$$
-F = ma \;\Longrightarrow\; a = -\frac{7.848}{2} = -3.924\,\text{m s}^{-2}.
$$

So the block decelerates at $3.924\,\text{m s}^{-2}$ (equivalently $a = -\mu g = -0.4 \times 9.81$, confirming the mass-independent shortcut above).

**Distance to stop** — use SUVAT with $u = 9$, $v = 0$, $a = -3.924$:

$$
v^2 = u^2 + 2as \;\Longrightarrow\; 0 = 9^2 + 2(-3.924)s \;\Longrightarrow\; s = \frac{81}{7.848} = 10.32\,\text{m} \;(\text{3 s.f.}).
$$
:::

The graph below plots $v = u - \mu g\,t$ for this block — a straight line, since the deceleration is constant. Drag the tangent point to confirm the gradient equals $-3.924\,\text{m s}^{-2}$ throughout.

::widget{type="function-grapher" expr="9 - 3.924*x" tangent=true xmin=0 xmax=2.5 ymin=0 ymax=10}

:::callout{kind="tip"}
"$a = \\mu g$" is a useful sanity-check shortcut for a horizontal surface with **friction as the only horizontal force**, but it is **not** a general formula — if there is also an applied force, or the surface is inclined, you must return to resolving forces and applying $F = ma$ from scratch.
:::

## Inclined surface: friction plus a component of weight

On a slope inclined at angle $\theta$ to the horizontal, resolve the weight $mg$ into components **parallel** to the slope ($mg\sin\theta$, acting down the slope) and **perpendicular** to it ($mg\cos\theta$, balanced by the normal reaction, so $N = mg\cos\theta$).

For a particle released from rest and sliding **down** a rough slope, both the weight component and friction act along the line of the slope, but in opposite senses: weight drives the motion down the slope, friction resists it (so friction acts up the slope). Taking down the slope as positive:

$$
mg\sin\theta - \mu N = ma \quad\Longrightarrow\quad mg\sin\theta - \mu mg\cos\theta = ma \quad\Longrightarrow\quad a = g(\sin\theta - \mu\cos\theta).
$$

Again the mass cancels. If instead the particle is sliding **up** the slope (e.g. given an initial push), both weight and friction act down the slope (friction now opposes the upward motion), giving a larger deceleration $a = -g(\sin\theta + \mu\cos\theta)$.

:::reveal{title="Worked example: a crate released on a slope"}
A crate of mass $10\,\text{kg}$ is released from rest on a rough slope inclined at $25^\circ$ to the horizontal, with $\mu = 0.3$. Find its acceleration down the slope.

**Normal reaction:** $N = mg\cos\theta = 10 \times 9.81 \times \cos 25^\circ = 88.91\,\text{N}$ (3 d.p.).

**Friction force** (acting up the slope, opposing the downward sliding): $F = \mu N = 0.3 \times 88.91 = 26.67\,\text{N}$.

**Weight component down the slope:** $mg\sin\theta = 10 \times 9.81 \times \sin 25^\circ = 41.46\,\text{N}$.

**Newton's second law** down the slope:

$$
mg\sin\theta - F = ma \;\Longrightarrow\; 41.46 - 26.67 = 10a \;\Longrightarrow\; a = 1.479\,\text{m s}^{-2} \;(\text{3 s.f.}).
$$

Since $41.46\,\text{N} > 26.67\,\text{N}$, the weight component exceeds the maximum friction, confirming the crate does indeed accelerate down the slope (it would not move at all if $\mu \ge \tan\theta$).
:::

:::callout{kind="key"}
A particle placed on a rough slope stays in equilibrium (does not slide) provided $mg\sin\theta \le \mu\,mg\cos\theta$, i.e. $\tan\theta \le \mu$. This threshold angle, $\theta = \arctan\mu$, is called the **angle of friction** — beyond it, no amount of friction can hold the particle still.
:::

Friction resists motion on a single particle; the final lesson extends $F = ma$ to **two** particles at once, linked by a string over a pulley, where friction may act on one of them but not the other.
