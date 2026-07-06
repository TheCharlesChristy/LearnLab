# Density and Hooke's law

Every material has physical properties that determine how it behaves when you push, pull, squeeze or load it. This lesson covers two of the simplest and most useful: **density**, which tells you how much mass is packed into a given volume, and **Hooke's law**, which describes how a material stretches under a force — at least while the force is small enough.

## Density

The density $\rho$ of a material is its mass per unit volume:

$$
\rho = \frac{m}{V}
$$

where $m$ is mass in kilograms and $V$ is volume in cubic metres, giving $\rho$ in $\text{kg}\,\text{m}^{-3}$. Density is a property of the *material*, not of any particular object made from it: a small block of lead and a large block of lead have the same density even though their masses and volumes are very different.

:::callout{kind="info"}
Densities are often quoted in $\text{g}\,\text{cm}^{-3}$ in data books. To convert to SI units, multiply by $1000$: $1\,\text{g}\,\text{cm}^{-3} = 1000\,\text{kg}\,\text{m}^{-3}$, because $1\,\text{cm}^3 = 10^{-6}\,\text{m}^3$ and $1\,\text{g} = 10^{-3}\,\text{kg}$.
:::

:::reveal{title="Worked example: density of a glass block"}
A rectangular block of glass has mass $750\,\text{g}$ and dimensions $5.0\,\text{cm} \times 5.0\,\text{cm} \times 12\,\text{cm}$.

Volume: $V = 5.0 \times 5.0 \times 12 = 300\,\text{cm}^3 = 300 \times 10^{-6}\,\text{m}^3 = 3.0 \times 10^{-4}\,\text{m}^3$.

Mass: $m = 750\,\text{g} = 0.750\,\text{kg}$.

$$
\rho = \frac{m}{V} = \frac{0.750}{3.0 \times 10^{-4}} = 2500\,\text{kg}\,\text{m}^{-3}
$$

This matches the accepted density of ordinary glass.
:::

## Hooke's law

When you apply a force to a spring, or to a wire, it extends. For many materials, over a limited range, the extension $x$ is directly proportional to the applied force $F$. This is **Hooke's law**:

$$
F = kx
$$

where $k$ is the **spring constant** (or, for a wire, the **stiffness**), measured in $\text{N}\,\text{m}^{-1}$. A stiffer spring has a larger $k$: it takes a bigger force to produce the same extension.

Hooke's law only holds up to a certain point called the **limit of proportionality**: the point on a force-extension graph beyond which extension is no longer directly proportional to force. Below this limit, doubling the force doubles the extension; beyond it, the graph starts to curve.

:::reveal{title="Worked example: spring constant and extension"}
A spring has a natural (unstretched) length of $12\,\text{cm}$. When a $4.0\,\text{N}$ weight is hung from it, its length becomes $15\,\text{cm}$.

Extension: $x = 15 - 12 = 3\,\text{cm} = 0.03\,\text{m}$.

$$
k = \frac{F}{x} = \frac{4.0}{0.03} = 133.3\,\text{N}\,\text{m}^{-1}
$$

Provided the spring is still within its limit of proportionality, we can use this same $k$ to predict the extension for a different load. For a $6.0\,\text{N}$ weight:

$$
x = \frac{F}{k} = \frac{6.0}{133.3} = 0.045\,\text{m} = 4.5\,\text{cm}
$$
:::

## Elastic and plastic deformation

- **Elastic deformation**: the material returns to its original shape and size once the force is removed. This is true for any extension up to the **elastic limit**.
- **Plastic deformation**: the material is permanently stretched and does *not* return to its original shape when the force is removed, because some of the bonds between atoms or molecules have been permanently rearranged.

The elastic limit is very close to (and, for many materials in practice, taken to occur at) the limit of proportionality, but the two are conceptually distinct: the limit of proportionality is about the *shape of the graph* (where it stops being a straight line), while the elastic limit is about *whether the deformation is reversible*.

## The force-extension graph and elastic strain energy

Plotting force against extension as a wire is loaded produces a **force-extension graph**. The graph below shows a typical test on a copper wire: a straight-line (Hookean) region up to about $2.0\,\text{mm}$ extension, followed by a curved region where extension grows much faster than force (plastic deformation), before the force needed actually falls as the wire "necks" and finally breaks.

::widget{type="data-plot" src="data/force-extension.json"}

The **area under a force-extension graph** is the work done stretching the material, which — provided no energy is lost as heat — is stored as **elastic strain energy** (elastic potential energy) in the material. For a material obeying Hooke's law (the straight-line region only), the area under the graph is a triangle, giving:

$$
E_{\text{el}} = \tfrac{1}{2}Fx = \tfrac{1}{2}kx^2
$$

Beyond the limit of proportionality the graph is curved, so this simple formula no longer applies; the energy stored must instead be found from the actual area under the curve (e.g. by counting squares), and only part of that energy is recovered elastically — the rest remains as permanent (plastic) deformation.

:::reveal{title="Worked example: elastic strain energy in a spring"}
Using the spring from the earlier example ($k = 133.3\,\text{N}\,\text{m}^{-1}$), find the elastic strain energy stored when it is extended by $0.03\,\text{m}$ (still within the limit of proportionality).

Using $E_{\text{el}} = \tfrac{1}{2}Fx$ with $F = 4.0\,\text{N}$ and $x = 0.03\,\text{m}$:

$$
E_{\text{el}} = \tfrac{1}{2} \times 4.0 \times 0.03 = 0.06\,\text{J}
$$

Check using $E_{\text{el}} = \tfrac{1}{2}kx^2$:

$$
E_{\text{el}} = \tfrac{1}{2} \times 133.3 \times (0.03)^2 = \tfrac{1}{2} \times 133.3 \times 0.0009 = 0.06\,\text{J}
$$

Both methods agree, as they must — they are algebraically the same expression after substituting $F = kx$.
:::

:::callout{kind="key"}
$E_{\text{el}} = \tfrac{1}{2}Fx = \tfrac{1}{2}kx^2$ only applies in the region where Hooke's law holds. Beyond the limit of proportionality, use the actual area under the force-extension graph.
:::

The next lesson generalises force and extension to **stress** and **strain**, so that we can compare different sizes and shapes of sample on equal terms, and defines the **Young modulus**.
