# Electric fields: point charges and uniform fields

Electric fields obey mathematics that looks strikingly similar to gravity's — an inverse-square force law, a field strength, and a potential — but with one crucial difference: electric charge comes in two signs, so electric forces can pull *or* push.

## Coulomb's law

For two point charges $Q_1$ and $Q_2$ with centres a distance $r$ apart, the electric force each exerts on the other has magnitude

$$
F = \frac{k Q_1 Q_2}{r^2}, \qquad k = \frac{1}{4\pi\varepsilon_0} \approx 8.99 \times 10^{9}\,\text{N m}^2\text{C}^{-2},
$$

where $\varepsilon_0 \approx 8.85 \times 10^{-12}\,\text{F m}^{-1}$ is the permittivity of free space. Unlike gravity, this force can be **attractive or repulsive**: like charges (same sign) repel, unlike charges (opposite sign) attract.

:::callout{kind="key"}
Coulomb's law has exactly the same $1/r^2$ shape as Newton's law of gravitation, with charge $Q$ playing the role mass $m$ played before, and $k$ playing the role $G$ played before. The physics is different — gravity is always attractive; the electric force depends on the signs of $Q_1$ and $Q_2$.
:::

For example, two charges of $+4\,\mu\text{C}$ and $+6\,\mu\text{C}$ placed $0.3\,\text{m}$ apart repel each other with force

$$
F = \frac{(8.99 \times 10^9)(4 \times 10^{-6})(6 \times 10^{-6})}{0.3^2} \approx 2.40\,\text{N},
$$

many orders of magnitude larger than any gravitational force between everyday masses.

## Electric field strength

The **electric field strength** $E$ at a point is the electric force per unit **positive** charge that a small test charge would experience there:

$$
E = \frac{F}{Q}.
$$

For a point charge $Q$, combining this with Coulomb's law gives another inverse-square law:

$$
E = \frac{kQ}{r^2}.
$$

$E$ is a vector, pointing away from a positive charge and towards a negative one. Try the code below: it computes $E$ (and the potential $V$, met next) at a chosen distance from a point charge — change `Q` and `r` and re-run to see how the field strength scales.

::widget{type="code-runner" language="python" starter="# Electric field strength and potential due to a point charge\nk = 8.99e9  # Coulomb constant, N m^2 C^-2\n\nQ = 2.0e-9   # charge in coulombs -- try changing this\nr = 0.30     # distance from the charge in metres -- try changing this\n\nE = k * Q / r**2\nV = k * Q / r\n\nprint(f\"E = {E:.4e} N/C (equivalently V/m)\")\nprint(f\"V = {V:.4e} V\")\n" rows=12}

## Electric potential

The **electric potential** $V$ at a point is the work done per unit positive charge to bring a small test charge from infinity to that point, taking $V = 0$ at infinity. For a point charge $Q$,

$$
V = \frac{kQ}{r}.
$$

Unlike gravitational potential, $V$ here takes the **sign of $Q$**: it is positive around a positive charge and negative around a negative charge. The potential energy of a charge $q$ at distance $r$ from $Q$ is $E_p = qV = \dfrac{kQq}{r}$.

## Uniform fields between parallel plates

Between two parallel conducting plates held at a potential difference $V$ and separated by a distance $d$, the electric field is (to a good approximation, away from the edges) **uniform**: the same magnitude and direction everywhere between the plates, pointing from the positive plate to the negative plate:

$$
E = \frac{V}{d}.
$$

This is different in character from the point-charge field above — it does not fall off with distance at all inside the plates. A parallel-plate arrangement with a $500\,\text{V}$ supply and a $0.02\,\text{m}$ gap produces a field of $E = 500/0.02 = 25{,}000\,\text{V m}^{-1}$.

:::reveal{title="Worked example: accelerating an electron between charged plates"}
Two plates $0.02\,\text{m}$ apart have a potential difference of $500\,\text{V}$ across them. Find the force and acceleration on an electron ($q = 1.60 \times 10^{-19}\,\text{C}$, $m_e = 9.11 \times 10^{-31}\,\text{kg}$) placed between them.

First, the field strength:

$$
E = \frac{V}{d} = \frac{500}{0.02} = 25{,}000\,\text{V m}^{-1}.
$$

The force on the electron has magnitude $F = qE$:

$$
F = (1.60 \times 10^{-19})(25{,}000) = 4.00 \times 10^{-15}\,\text{N}.
$$

Then by Newton's second law, $a = F/m_e$:

$$
a = \frac{4.00 \times 10^{-15}}{9.11 \times 10^{-31}} \approx 4.39 \times 10^{15}\,\text{m s}^{-2}.
$$

This staggering acceleration — around $4 \times 10^{14}$ times $g$ — is why electric fields, not gravity, are what accelerate particles in devices such as CRTs and particle accelerators.
:::

Both point-charge and uniform-field cases obey $E = F/Q$; only the formula for $E$ itself differs depending on the geometry. In the final lesson we line gravitational and electric fields up side by side.
