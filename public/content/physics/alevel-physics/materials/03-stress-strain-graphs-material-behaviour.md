# Stress-strain graphs and material behaviour

Plotting stress against strain for a material as it is loaded to breaking point produces a **stress-strain graph**. Because stress and strain are normalised for the sample's dimensions, this graph describes the *material*, not just the particular test piece — so it can be used to compare different materials directly.

## Key features of a stress-strain graph

Reading a stress-strain graph from the origin:

- **Limit of proportionality** — the point beyond which stress is no longer proportional to strain; the graph stops being a straight line.
- **Elastic limit** — the point beyond which the material no longer returns to its original length when the load is removed; deformation beyond here is at least partly plastic (permanent).
- **Yield point** — shortly after the elastic limit for many ductile materials, where the material suddenly extends much more for little or no increase in stress. The material undergoes large plastic deformation from this point on.
- **Ultimate tensile stress (UTS)** — the maximum stress the material can withstand; the peak of the graph.
- **Breaking stress (fracture point)** — the stress at which the material actually fractures. For many ductile metals this is *lower* than the UTS, because the sample "necks" (its cross-sectional area reduces sharply in one place) once the UTS is passed, so it fails at a lower nominal load even though the true, local stress at the neck keeps rising.

:::callout{kind="key"}
The gradient of the initial straight-line region of a stress-strain graph is the **Young modulus** of the material (previous lesson). Everything after the limit of proportionality tells you about strength and ductility, not stiffness.
:::

## Comparing brittle, ductile and polymeric materials

The overall *shape* of the stress-strain graph reveals what kind of material you are dealing with:

- **Brittle materials** (e.g. glass, ceramics, cast iron) deform elastically in an almost perfectly straight line, then **fracture suddenly** at a relatively small strain with little or no plastic deformation beforehand. There is no yield point and no warning before failure.
- **Ductile materials** (e.g. copper, mild steel, gold) have a clear elastic region, a yield point, and then a **long plastic region** in which they can be stretched considerably (and often drawn into wires) before fracturing. This large plastic region absorbs a lot of energy before failure, which is why ductile metals are used where a structure needs to fail gradually and visibly rather than snap without warning.
- **Polymeric materials** (e.g. rubber) behave very differently: many elastomers show a large **elastic** strain (often several hundred percent) with a non-linear stress-strain curve that does not obey Hooke's law over most of its range, yet the material can still return close to its original length when unloaded. Their molecular structure — long tangled chain molecules that uncoil under load and re-coil when released — is completely different from the crystalline lattice of a metal or the rigid bonded network of a ceramic.

The graph below compares a typical **ductile metal** with a typical **brittle ceramic** on the same axes.

::widget{type="data-plot" src="data/stress-strain-comparison.json"}

Notice how the ductile metal's curve bends over into a long, gently rising (then falling) plastic region after its yield point, whereas the brittle ceramic's curve stays almost perfectly straight right up until it fractures abruptly at a much smaller strain, with no plastic region at all.

:::reveal{title="Worked example: elastic strain energy per unit volume from a stress-strain graph"}
A sample reaches its elastic limit at a stress of $150\,\text{MPa}$, with a corresponding strain of $7.5 \times 10^{-4}$. Because this point is still within the (linear) Hookean region, the area under the graph up to this point is a triangle, giving the elastic strain energy stored **per unit volume**:

$$
\frac{E_{\text{el}}}{V} = \tfrac{1}{2}\sigma\varepsilon
$$

Substituting $\sigma = 150\,\text{MPa} = 150 \times 10^{6}\,\text{Pa}$ and $\varepsilon = 7.5 \times 10^{-4}$:

$$
\frac{E_{\text{el}}}{V} = \tfrac{1}{2} \times (150 \times 10^{6}) \times (7.5 \times 10^{-4}) = \tfrac{1}{2} \times 1.125 \times 10^{5} = 5.625 \times 10^{4}\,\text{J}\,\text{m}^{-3}
$$

This is the elastic energy stored in every cubic metre of the material when stressed to its elastic limit. Beyond the elastic limit, this simple triangular-area formula no longer applies, because the stress-strain relationship is no longer linear.
:::

:::callout{kind="warning"}
Don't confuse "brittle" with "weak", or "ductile" with "strong". Brittle materials can have a very high Young modulus and a high UTS (e.g. some ceramics are extremely stiff and strong) — they simply give no warning before fracturing, because they do not yield or deform plastically first.
:::

## Summary

Across this module you have met three related but distinct pairs of quantities: force and extension (Hooke's law, sample-specific), stress and strain (Young modulus, material-specific), and the shape of the full stress-strain graph (limit of proportionality, elastic limit, yield point, UTS, breaking stress, and the brittle/ductile/polymeric classification). Together these let you predict how a real structure — a bridge cable, a bone, a rubber band — will respond to a load, and whether it will fail safely or catastrophically.
