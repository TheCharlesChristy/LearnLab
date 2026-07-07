# Circular motion: angular velocity, acceleration and force

An object moving at constant *speed* around a circle is still **accelerating**, because its velocity — speed *and* direction — is constantly changing direction. That acceleration, and the force that causes it, are the subject of this lesson.

## Angular velocity

Instead of tracking linear position, it is often easier to track the **angle** swept out. The angular velocity $\omega$ is the rate of change of angle, measured in radians per second ($\text{rad}\,\text{s}^{-1}$):

$$
\omega = \frac{2\pi}{T} = 2\pi f,
$$

where $T$ is the period (time for one full revolution, in seconds) and $f = 1/T$ is the frequency (revolutions per second, Hz). A point at radius $r$ from the centre, sweeping through angle $\theta$ in time $t$, moves a distance $r\theta$ along the arc, so its linear (tangential) speed is

$$
v = \omega r.
$$

:::callout{kind="info"}
$\omega$ is the *same* for every point on a rotating rigid body (a record turning on a turntable, say), but $v = \omega r$ means points further from the centre move faster in a straight-line sense.
:::

## Centripetal acceleration

Even at constant speed, an object moving in a circle accelerates because its direction of travel changes continuously. This acceleration is called **centripetal acceleration**: it always points from the object *towards the centre* of the circle (never outwards — there is no such thing as a real "centrifugal force" pushing objects out). Two equivalent forms:

$$
a = \frac{v^2}{r} = \omega^2 r.
$$

The graph below plots $a = v^2/r$ for a fixed radius $r = 5\,\text{m}$ (the widget's horizontal axis stands for speed $v$ in $\text{m}\,\text{s}^{-1}$, and the vertical axis for $a$ in $\text{m}\,\text{s}^{-2}$) — notice the quadratic relationship: doubling the speed *quadruples* the acceleration needed.

::widget{type="function-grapher" expr="x^2/5" xmin=0 xmax=20 grid=true}

## Centripetal force

By Newton's second law, an acceleration requires a resultant force in the same direction — here, towards the centre. This is the **centripetal force**:

$$
F = \frac{mv^2}{r} = m\omega^2 r.
$$

Centripetal force is not a new *kind* of force; it is whichever real force (tension, friction, gravity, the normal contact force, …) happens to supply the centre-seeking resultant. A car cornering relies on friction between tyres and road; the Moon orbiting Earth relies on gravity; a ball on a string relies on tension in the string.

:::callout{kind="key"}
Centripetal force and acceleration always point **towards the centre** of the circular path. If the centre-seeking force is removed (the string snaps), the object flies off in a straight line tangent to the circle — not radially outward — because that is the direction its velocity had at that instant (Newton's first law).
:::

:::reveal{title="Worked example: tension in a string"}
A ball of mass $m = 0.5\,\text{kg}$ is whirled in a horizontal circle of radius $r = 0.8\,\text{m}$ on a string, completing one revolution every $T = 0.5\,\text{s}$. Find the angular velocity, the linear speed, the centripetal acceleration, and the tension in the string.

**Angular velocity:**
$$
\omega = \frac{2\pi}{T} = \frac{2\pi}{0.5} \approx 12.57\,\text{rad}\,\text{s}^{-1}.
$$

**Linear speed:**
$$
v = \omega r = 12.57 \times 0.8 \approx 10.05\,\text{m}\,\text{s}^{-1}.
$$

**Centripetal acceleration:**
$$
a = \omega^2 r = 12.57^2 \times 0.8 \approx 126.3\,\text{m}\,\text{s}^{-2}.
$$

**Tension (the centripetal force here):**
$$
F = ma = 0.5 \times 126.3 \approx 63.2\,\text{N}.
$$

The string must supply about $63\,\text{N}$ of tension just to keep the ball moving in its circle — on top of anything needed to support its weight if the circle is not horizontal.
:::

Circular motion at constant speed is one route to a periodic, back-and-forth-looking motion: the *projection* of a point moving in a circle onto one axis oscillates exactly as described by simple harmonic motion, which is where we turn next.
