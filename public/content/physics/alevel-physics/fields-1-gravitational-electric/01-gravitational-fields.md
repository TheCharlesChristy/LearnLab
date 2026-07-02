# Gravitational fields and orbits

Every object with mass attracts every other object with mass. This lesson makes that idea precise: Newton's law of gravitation, the field strength it produces, the potential energy stored in a gravitational field, and how all of this explains why satellites stay in orbit.

## Newton's law of gravitation

For two point masses $m_1$ and $m_2$ whose centres are a distance $r$ apart, the gravitational force each exerts on the other has magnitude

$$
F = \frac{G m_1 m_2}{r^2},
$$

where $G = 6.67 \times 10^{-11}\,\text{N m}^2\text{kg}^{-2}$ is the **universal gravitational constant**. The force is always **attractive**, and by Newton's third law the force on $m_1$ due to $m_2$ is equal and opposite to the force on $m_2$ due to $m_1$.

Because $G$ is so small, gravity is extremely weak unless at least one mass is astronomically large. Two people of mass $70\,\text{kg}$ standing $1\,\text{m}$ apart attract each other with a force of only

$$
F = \frac{(6.67 \times 10^{-11})(70)(70)}{1^2} \approx 3.3 \times 10^{-7}\,\text{N},
$$

far too small to notice. Gravity only dominates our experience because the Earth is so massive.

## Gravitational field strength

The **gravitational field strength** $g$ at a point is the gravitational force exerted per unit mass on a small test mass placed there:

$$
g = \frac{F}{m}.
$$

For a point mass (or a uniform sphere, measured outside its surface) of mass $M$, combining this with Newton's law of gravitation gives

$$
g = \frac{GM}{r^2}.
$$

This is an **inverse-square law**: doubling the distance from the mass reduces the field strength to a quarter. The graph below plots $g = GM/r^2$ for the Earth ($GM_{\text{Earth}} \approx 3.98 \times 10^{14}\,\text{m}^3\text{s}^{-2}$), with $r$ measured in millions of metres (Mm) from the Earth's centre — the field falls away quickly as you move from the surface ($r \approx 6.37\,\text{Mm}$) out towards geostationary orbit.

::widget{type="function-grapher" expr="398.2/x^2" xmin=6 xmax=45 grid=true}

:::callout{kind="key"}
Gravitational field strength $g = F/m = GM/r^2$ is a vector, always pointing towards the mass creating the field. At the Earth's surface $g \approx 9.81\,\text{N kg}^{-1}$, which is exactly the free-fall acceleration you meet in mechanics.
:::

At the International Space Station's altitude of $400\,\text{km}$, $r = 6.37 \times 10^6 + 4.00 \times 10^5 = 6.77 \times 10^6\,\text{m}$, so

$$
g = \frac{3.98 \times 10^{14}}{(6.77 \times 10^6)^2} \approx 8.7\,\text{N kg}^{-1}.
$$

Astronauts on the ISS are not "weightless" because gravity has vanished — it is still nearly 90% of its surface value — they are weightless because they and their spacecraft are in continuous free fall together.

## Gravitational potential

The **gravitational potential** $V$ at a point is the work done per unit mass to bring a small test mass from infinity to that point, taking $V = 0$ at infinity. For a point mass $M$,

$$
V = -\frac{GM}{r}.
$$

The potential is always **negative** (for $r > 0$) and increases (becomes less negative) as $r$ increases, reaching zero only at infinity — a mass sitting in a gravitational field is in a "potential well". The gravitational potential energy of a mass $m$ at distance $r$ from $M$ is

$$
E_p = mV = -\frac{GMm}{r}.
$$

Moving a mass further from $M$ increases (makes less negative) its potential energy, which is why you must do positive work to lift an object or launch a rocket away from a planet.

## Orbital motion

A satellite moving in a circular orbit of radius $r$ needs a centripetal force $mv^2/r$ directed towards the planet, and gravity supplies exactly that force:

$$
\frac{GMm}{r^2} = \frac{mv^2}{r} \quad\Longrightarrow\quad v = \sqrt{\frac{GM}{r}}.
$$

Faster orbits are needed closer in; further out, a satellite can orbit more slowly. Using $T = \dfrac{2\pi r}{v}$ and substituting $v = \sqrt{GM/r}$ gives

$$
T^2 = \frac{4\pi^2}{GM} r^3 \quad\Longrightarrow\quad T^2 \propto r^3,
$$

which is **Kepler's third law**. A **geostationary satellite** orbits directly above the equator, west to east, with a period equal to the Earth's rotation period ($T \approx 24$ hours), so that it stays above the same point on the ground at all times — essential for satellite TV and some communications links.

:::reveal{title="Worked example: radius of a geostationary orbit"}
Find the orbital radius $r$ of a geostationary satellite, given $T = 24$ hours $= 86400\,\text{s}$ and $GM_{\text{Earth}} = 3.98 \times 10^{14}\,\text{m}^3\text{s}^{-2}$.

Rearranging $T^2 = \dfrac{4\pi^2}{GM}r^3$ for $r$:

$$
r^3 = \frac{GM\,T^2}{4\pi^2} = \frac{(3.98 \times 10^{14})(86400)^2}{4\pi^2} \approx 7.53 \times 10^{22}\,\text{m}^3.
$$

Taking the cube root,

$$
r \approx 4.22 \times 10^7\,\text{m} \approx 42{,}200\,\text{km}.
$$

Subtracting the Earth's radius ($6.37 \times 10^6\,\text{m}$) gives an altitude of roughly $35{,}800\,\text{km}$ — consistent with the geostationary satellites you may have seen quoted in textbooks (about $35{,}786\,\text{km}$).
:::

In the next lesson we meet a second field that behaves almost identically in its mathematics — the electric field — before comparing the two directly.
