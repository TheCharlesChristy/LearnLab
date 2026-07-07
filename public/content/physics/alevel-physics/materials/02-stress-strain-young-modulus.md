# Stress, strain and the Young modulus

Force and extension depend on the size and shape of the particular sample being tested: a thick wire needs a bigger force than a thin wire of the same material to stretch by the same amount. To compare materials fairly — independent of the sample's dimensions — physicists use **stress** and **strain** instead of force and extension.

## Tensile stress

**Tensile stress** $\sigma$ is the force applied per unit cross-sectional area:

$$
\sigma = \frac{F}{A}
$$

where $F$ is the tension (in newtons) and $A$ is the cross-sectional area (in $\text{m}^2$) perpendicular to the force. Stress has units of $\text{N}\,\text{m}^{-2}$, which is the same as the pascal ($\text{Pa}$): $1\,\text{Pa} = 1\,\text{N}\,\text{m}^{-2}$. Because stresses in materials testing are often very large, they are commonly quoted in megapascals ($1\,\text{MPa} = 10^6\,\text{Pa}$) or gigapascals ($1\,\text{GPa} = 10^9\,\text{Pa}$).

## Tensile strain

**Tensile strain** $\varepsilon$ is the extension per unit original length:

$$
\varepsilon = \frac{x}{L}
$$

where $x$ is the extension and $L$ is the original (natural) length, both measured in the same units so that $\varepsilon$ is dimensionless — it has no units. Strain is often quoted as a percentage (multiply by $100\%$).

## The Young modulus

For a material that obeys Hooke's law, stress is directly proportional to strain, and the constant of proportionality is the **Young modulus** $E$:

$$
E = \frac{\sigma}{\varepsilon} = \frac{F/A}{x/L} = \frac{FL}{Ax}
$$

The Young modulus is measured in pascals ($\text{Pa}$), the same units as stress, since strain has no units. It is a property of the material only (not of the particular sample's dimensions), and it measures **stiffness**: a large $E$ means the material is very resistant to stretching for a given stress (e.g. steel, $E \approx 2 \times 10^{11}\,\text{Pa}$), while a small $E$ means it stretches easily (e.g. rubber, $E \approx 10^6$–$10^7\,\text{Pa}$).

:::callout{kind="key"}
$E = \dfrac{FL}{Ax}$ is only valid up to the limit of proportionality, where stress is proportional to strain. It is found experimentally as the **gradient of the linear region** of a stress-strain graph.
:::

:::reveal{title="Worked example: Young modulus of a wire"}
A wire of length $L = 2.0\,\text{m}$ and diameter $d = 0.80\,\text{mm}$ is loaded with a tension of $F = 40\,\text{N}$, producing an extension of $x = 1.2\,\text{mm}$.

**Step 1 — cross-sectional area.** The radius is $r = d/2 = 0.40\,\text{mm} = 0.40 \times 10^{-3}\,\text{m}$.

$$
A = \pi r^2 = \pi \times (0.40 \times 10^{-3})^2 = \pi \times 1.6 \times 10^{-7} = 5.03 \times 10^{-7}\,\text{m}^2
$$

**Step 2 — stress.**

$$
\sigma = \frac{F}{A} = \frac{40}{5.03 \times 10^{-7}} = 7.96 \times 10^{7}\,\text{Pa}
$$

**Step 3 — strain.**

$$
\varepsilon = \frac{x}{L} = \frac{1.2 \times 10^{-3}}{2.0} = 6.0 \times 10^{-4}
$$

**Step 4 — Young modulus.**

$$
E = \frac{\sigma}{\varepsilon} = \frac{7.96 \times 10^{7}}{6.0 \times 10^{-4}} = 1.33 \times 10^{11}\,\text{Pa}
$$

So $E \approx 1.3 \times 10^{11}\,\text{Pa}$ ($133\,\text{GPa}$) for this wire — a value typical of a metal.
:::

## Try it yourself: compute a Young modulus

Run the code below (edit the values of `F`, `L`, `d` and `x` to try your own numbers) to see the full calculation — area, stress, strain and Young modulus — carried out automatically. It reproduces the worked example above.

::widget{type="code-runner" language="python" starter="import math\n\n# Given data for the wire\nF = 40       # tension, N\nL = 2.0      # original length, m\nd = 0.8e-3   # diameter, m\nx = 1.2e-3   # extension, m\n\nr = d / 2\nA = math.pi * r ** 2\nstress = F / A\nstrain = x / L\nE = stress / strain\n\nprint(f'Cross-sectional area A = {A:.3e} m^2')\nprint(f'Tensile stress sigma = {stress:.3e} Pa')\nprint(f'Tensile strain epsilon = {strain:.3e}')\nprint(f'Young modulus E = {E:.3e} Pa')\n" rows=16}

:::callout{kind="tip"}
Because the diameter appears squared inside the area, a small error measuring the diameter of a wire causes a much larger error in the calculated Young modulus — this is why real experiments use a micrometer and take several readings along the wire's length.
:::

The next lesson looks at the full **stress-strain graph** all the way to breaking, and what its shape tells us about a material.
