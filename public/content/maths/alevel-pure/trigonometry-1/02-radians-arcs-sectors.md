# Radians, arc length and sector area

## Why radians?

Degrees split a full turn into $360$ arbitrary parts. **Radians** measure an
angle by the length of arc it cuts on a circle of radius $1$, which makes
radians the natural unit for calculus and for arc/sector formulas.

$$
\pi \text{ radians} = 180^\circ
$$

From this single fact you can convert either way:

$$
\text{radians} = \text{degrees} \times \frac{\pi}{180}, \qquad
\text{degrees} = \text{radians} \times \frac{180}{\pi}
$$

:::callout{kind="key"}
Memorise the common angles in both units: $30^\circ = \frac{\pi}{6}$,
$45^\circ = \frac{\pi}{4}$, $60^\circ = \frac{\pi}{3}$, $90^\circ = \frac{\pi}{2}$,
$180^\circ = \pi$, $270^\circ = \frac{3\pi}{2}$, $360^\circ = 2\pi$.
:::

:::reveal{title="Worked example: converting degrees to radians"}
Convert $150^\circ$ to radians in terms of $\pi$.

$$
150 \times \frac{\pi}{180} = \frac{150\pi}{180} = \frac{5\pi}{6}
$$
:::

:::reveal{title="Worked example: converting radians to degrees"}
Convert $\frac{7\pi}{6}$ radians to degrees.

$$
\frac{7\pi}{6} \times \frac{180}{\pi} = \frac{7 \times 180}{6} = 210^\circ
$$
:::

## Arc length

For a circle of radius $r$, an arc subtending an angle $\theta$ **measured in
radians** at the centre has length:

$$
s = r\theta
$$

This is simply the fraction $\frac{\theta}{2\pi}$ of the full circumference
$2\pi r$. The formula only works directly when $\theta$ is in radians — if
you're given degrees, convert first.

:::reveal{title="Worked example: arc length"}
A circle has radius $r = 5\,\text{cm}$. Find the arc length cut off by an
angle of $\theta = 1.2$ radians at the centre.

$$
s = r\theta = 5 \times 1.2 = 6\,\text{cm}
$$
:::

## Sector area

A sector is the "pizza slice" region bounded by two radii and an arc. Its area
is the same fraction $\frac{\theta}{2\pi}$ of the full circle's area $\pi r^2$:

$$
\text{Area} = \frac{1}{2}r^2\theta \qquad (\theta \text{ in radians})
$$

:::callout{kind="tip"}
Both formulas, $s = r\theta$ and $\text{Area} = \frac{1}{2}r^2\theta$, need
$\theta$ in **radians**. A common exam error is plugging in degrees directly
— always check the units of $\theta$ first.
:::

:::reveal{title="Worked example: sector area"}
A sector has radius $12\,\text{cm}$ and angle $\theta = \frac{2\pi}{3}$
radians. Find its arc length and area exactly, in terms of $\pi$.

Arc length: $s = r\theta = 12 \times \frac{2\pi}{3} = 8\pi\,\text{cm}$.

Area: $\text{Area} = \frac{1}{2}r^2\theta = \frac{1}{2}(144)\left(\frac{2\pi}{3}\right) = \frac{144\pi}{3} = 48\pi\,\text{cm}^2$.
:::

## A quick geometric sense-check

The function-grapher below plots $y = \sin(x)$ where the horizontal axis
represents an angle **in radians** (all native widgets in this engine plot
`y = f(x)` with a plain numeric `x`-axis, so read the axis values here as
radians, from $0$ up to $2\pi \approx 6.28$). Notice how the "wavelength" of
one full cycle is $2\pi$ — exactly one full turn measured in radians.

::widget{type="function-grapher" expr="sin(x)" xmin=0 xmax=6.28 ymin=-1.5 ymax=1.5 grid=true}

:::callout{kind="info"}
One full period of $\sin$ takes $x$ from $0$ to $2\pi \approx 6.283$ — matching
the $2\pi$ radians in a full turn used in the arc length and sector area
formulas above. This connection between radians and periodicity is exactly
why calculus and trigonometric graphs are always done in radians.
:::
