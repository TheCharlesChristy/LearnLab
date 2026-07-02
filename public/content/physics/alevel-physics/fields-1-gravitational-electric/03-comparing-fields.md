# Comparing gravitational and electric fields

Having studied gravitational and electric fields separately, we can now put them side by side. The mathematics is a close parallel — both are **inverse-square, radial fields** with a matching field-strength/potential structure — but a handful of physical differences matter a great deal.

## The formulas side by side

| Quantity | Gravitational | Electric (point charge) |
| --- | --- | --- |
| Source | mass $M$ | charge $Q$ |
| Force | $F = \dfrac{Gm_1m_2}{r^2}$ | $F = \dfrac{kQ_1Q_2}{r^2}$ |
| Constant | $G = 6.67 \times 10^{-11}\,\text{N m}^2\text{kg}^{-2}$ | $k = \dfrac{1}{4\pi\varepsilon_0} \approx 8.99 \times 10^{9}\,\text{N m}^2\text{C}^{-2}$ |
| Field strength | $g = \dfrac{F}{m} = \dfrac{GM}{r^2}$ | $E = \dfrac{F}{Q} = \dfrac{kQ}{r^2}$ |
| Potential | $V = -\dfrac{GM}{r}$ | $V = \dfrac{kQ}{r}$ |
| Direction | always towards $M$ | away from $+Q$, towards $-Q$ |

Both field strengths are defined the same way — force per unit "test quantity" ($g = F/m$, $E = F/Q$) — and both obey an inverse-square law with distance. Both potentials are defined as work done per unit test quantity bringing the test object from infinity, and both fall off as $1/r$.

:::callout{kind="key"}
The single biggest structural difference is sign. Mass is always positive, so gravity is **always attractive** and gravitational potential is **always negative** (zero only at infinity). Charge can be positive or negative, so the electric force can be attractive **or** repulsive, and electric potential can be positive **or** negative depending on the sign of the source charge.
:::

The data below shows this sign contrast directly: a gravitational potential (always negative, rising towards zero) alongside an electric potential due to a positive charge (always positive, falling towards zero) — mirror images of one another, both following the same $1/r$ shape.

::widget{type="data-plot" src="data/potential-comparison.json"}

## Relative strength

Even though the two laws have the same shape, their *magnitudes* are wildly different. Compare the electric and gravitational forces between two protons ($m_p = 1.67 \times 10^{-27}\,\text{kg}$, charge $e = 1.60 \times 10^{-19}\,\text{C}$) separated by any distance $r$:

$$
\frac{F_{\text{elec}}}{F_{\text{grav}}} = \frac{kQ_1Q_2/r^2}{Gm_1m_2/r^2} = \frac{ke^2}{Gm_p^2}.
$$

Notice the $r^2$ cancels — the *ratio* of the two forces is the same at every separation.

:::reveal{title="Worked example: electric force vs gravitational force between two protons"}
$$
\frac{ke^2}{Gm_p^2} = \frac{(8.99 \times 10^9)(1.60 \times 10^{-19})^2}{(6.67 \times 10^{-11})(1.67 \times 10^{-27})^2}.
$$

Numerator: $k e^2 = (8.99 \times 10^9)(2.56 \times 10^{-38}) \approx 2.30 \times 10^{-28}$.

Denominator: $G m_p^2 = (6.67 \times 10^{-11})(2.79 \times 10^{-54}) \approx 1.86 \times 10^{-64}$.

$$
\frac{F_{\text{elec}}}{F_{\text{grav}}} \approx \frac{2.30 \times 10^{-28}}{1.86 \times 10^{-64}} \approx 1.24 \times 10^{36}.
$$

The electric repulsion between two protons is about $10^{36}$ times stronger than their gravitational attraction. Gravity only matters on the scale of planets and stars because large objects are (almost) exactly electrically neutral, while every particle has mass — there is no negative mass to cancel gravity's pull.
:::

## Where the analogy breaks down

- **Sign of the source.** Mass is always positive; charge can be either sign. This is the root cause of every other difference in the table above.
- **Shielding.** A charged conducting shell can screen out an external electric field entirely (the field inside is zero). There is no equivalent "gravity shield" — you cannot block gravitational field lines.
- **Uniform fields.** Two oppositely charged parallel plates make a genuinely uniform electric field ($E = V/d$, no distance dependence within the gap). There is no simple two-object arrangement that creates an exactly uniform gravitational field over an extended, non-trivial region — although $g$ is *treated* as locally uniform near the Earth's surface because the radius of the Earth is so much larger than everyday heights.
- **Magnitude.** As the proton-pair calculation above shows, electric forces utterly dominate gravitational ones at the scale of atoms and molecules; gravity dominates only because large bodies are electrically neutral overall.

Despite these differences, the shared inverse-square mathematics is not a coincidence — both forces are described by fields whose "flux" spreads out over the surface of an expanding sphere, which is precisely why both fall off as $1/r^2$.
