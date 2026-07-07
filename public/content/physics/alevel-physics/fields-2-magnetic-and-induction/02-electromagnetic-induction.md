# Electromagnetic induction

So far a magnetic field has been pushing on currents and charges. Electromagnetic induction runs the idea in reverse: a **changing** magnetic field (or a conductor moving through one) drives an EMF, and — if the circuit is complete — a current. This is the principle behind generators, transformers, microphones and induction hobs.

## Magnetic flux and flux linkage

**Magnetic flux**, $\Phi$, measures the total amount of magnetic field passing through an area. For a flat coil of cross-sectional area $A$ placed with its plane perpendicular to a uniform field of flux density $B$:

$$
\Phi = BA,
$$

measured in webers ($\text{Wb}$), where $1\,\text{Wb} = 1\,\text{T m}^2$. If the coil's plane instead makes an angle with the field, only the component of $B$ perpendicular to the plane contributes.

A coil rarely has just one turn. For a coil of $N$ turns, each turn links the same flux $\Phi$, so we define the **flux linkage** as

$$
\text{flux linkage} = N\Phi.
$$

Flux linkage is the quantity that actually determines the induced EMF, since every one of the $N$ turns contributes its own share of EMF as the flux through it changes.

## Faraday's law

**Faraday's law of electromagnetic induction** states that the magnitude of the induced EMF is equal to the rate of change of flux linkage:

$$
\varepsilon = -N\frac{\mathrm{d}\Phi}{\mathrm{d}t}.
$$

In words: the faster the flux through a coil changes — whether because the field strength changes, the coil's area changes, or the coil rotates relative to the field — the larger the induced EMF. A coil sitting in a constant, unchanging field has zero induced EMF, no matter how strong that field is.

The graph below shows the flux through a fixed coil as the field strength ramps up uniformly (a coil of area $0.015\,\text{m}^2$, field rising at a constant rate). Because the flux–time graph is a straight line, $\mathrm{d}\Phi/\mathrm{d}t$ — the gradient — is constant, so the induced EMF here is constant too.

::widget{type="data-plot" src="data/flux-vs-time.json"}

## Lenz's law: the minus sign

Faraday's law is often written with a minus sign, which encodes **Lenz's law**: the direction of the induced EMF (and any resulting current) is always such that it **opposes the change that produced it**.

:::callout{kind="key"}
Lenz's law: the induced current flows in the direction that opposes the change in flux causing it. This is a direct consequence of the **conservation of energy** — if the induced current instead reinforced the change, it would accelerate that change indefinitely, creating energy from nothing.
:::

For example, if you push the north pole of a magnet towards a coil, the flux through the coil (in that direction) increases. Lenz's law says the induced current must create its own magnetic field that **opposes** this increase — so the coil's near face effectively becomes a north pole too, repelling the incoming magnet. You have to do work against this repulsion to push the magnet in, and that work is exactly what supplies the electrical energy delivered to the circuit — energy is conserved, not created.

:::reveal{title="Worked example: EMF from a changing field"}
A coil of $N = 200$ turns has cross-sectional area $A = 0.015\,\text{m}^2$ and sits with its plane perpendicular to a magnetic field that increases uniformly from $0.10\,\text{T}$ to $0.40\,\text{T}$ in $0.50\,\text{s}$. Find the magnitude of the induced EMF.

First find the change in flux:

$$
\Delta\Phi = \Delta B \times A = (0.40 - 0.10) \times 0.015 = 0.0045\,\text{Wb}.
$$

Then apply Faraday's law (magnitude only):

$$
\varepsilon = N\frac{\Delta\Phi}{\Delta t} = 200 \times \frac{0.0045}{0.50} = 1.8\,\text{V}.
$$

The induced EMF is $1.8\,\text{V}$. By Lenz's law, the induced current flows in the direction that would create a magnetic field opposing the *increase* in flux — that is, opposing the applied field.
:::

## Why induction matters

Every generator, transformer, dynamo microphone, and induction charger relies on nothing more than Faraday's and Lenz's laws applied to a changing flux linkage. The next lesson looks at two of the most important applications: the AC generator and the transformer.
