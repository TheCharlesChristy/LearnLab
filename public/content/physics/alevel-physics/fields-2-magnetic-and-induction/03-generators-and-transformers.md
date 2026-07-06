# Generators and transformers

Faraday's and Lenz's laws are not just abstract rules — they are the entire operating principle behind two of the most important devices in electrical engineering: the generator, which creates an EMF by changing flux, and the transformer, which uses a changing flux to move electrical energy between two circuits at different voltages.

## The simple AC generator

A simple AC generator consists of a rectangular coil of $N$ turns and area $A$, rotating at a constant angular velocity $\omega$ (in $\text{rad s}^{-1}$) inside a uniform magnetic field of flux density $B$. As the coil turns, the flux through it changes continuously, so an EMF is induced continuously.

If the coil's plane is at angle $\omega t$ to the field at time $t$, the flux linkage is $N\Phi = NBA\cos(\omega t)$. Differentiating (Faraday's law) gives the induced EMF:

$$
\varepsilon = -\frac{\mathrm{d}(N\Phi)}{\mathrm{d}t} = NBA\omega\sin(\omega t).
$$

This is a sinusoidal EMF with **peak value**

$$
\varepsilon_0 = NBA\omega,
$$

reached whenever the coil's plane is parallel to the field (the flux is changing fastest at that instant, even though the flux itself is momentarily zero there). The EMF is zero when the coil's plane is perpendicular to the field, because at that instant the flux is at a maximum but momentarily *not changing* — the coil is turning "into" the field symmetrically.

:::callout{kind="info"}
This is exactly why the EMF is a sine wave: it depends on the *rate of change* of a cosine-shaped flux, and the derivative of a cosine is a (scaled) sine.
:::

:::reveal{title="Worked example: peak EMF of a generator"}
A generator coil has $N = 100$ turns, cross-sectional area $A = 0.02\,\text{m}^2$, and rotates in a uniform magnetic field of flux density $B = 0.05\,\text{T}$ at an angular frequency $\omega = 50\,\text{rad s}^{-1}$. Find the peak EMF.

$$
\varepsilon_0 = NBA\omega = 100 \times 0.05 \times 0.02 \times 50 = 5.0\,\text{V}.
$$

The generator's EMF varies sinusoidally between $+5.0\,\text{V}$ and $-5.0\,\text{V}$, completing one full cycle every $T = 2\pi/\omega \approx 0.126\,\text{s}$.
:::

The graph below plots exactly this generator's output, $\varepsilon(t) = 5\sin(50t)$, over one cycle.

::widget{type="function-grapher" expr="5*sin(50*x)" xmin=0 xmax=0.13 ymin=-6 ymax=6}

## Transformers

A transformer transfers electrical energy between two coils — a **primary** (input) and a **secondary** (output) — that are not electrically connected but are wound on the same iron core. An alternating current in the primary coil creates a continuously changing magnetic flux in the core; this changing flux links the secondary coil and, by Faraday's law, induces an EMF in it. (This is precisely why transformers only work with **alternating** current: a steady DC current produces a constant flux, and a constant flux induces no EMF.)

For an ideal transformer, every turn of the primary and every turn of the secondary links the same changing flux, so the EMF induced per turn is the same in both coils. This gives the transformer equation:

$$
\frac{V_p}{V_s} = \frac{N_p}{N_s},
$$

where $V_p, V_s$ are the primary and secondary voltages (r.m.s. or peak, as long as both sides use the same convention) and $N_p, N_s$ are the numbers of turns on the primary and secondary coils. A **step-up** transformer has $N_s > N_p$ (raises the voltage); a **step-down** transformer has $N_s < N_p$ (lowers it).

An ideal transformer is assumed to be $100\%$ efficient, so no electrical power is lost — power in equals power out:

$$
I_pV_p = I_sV_s.
$$

Combining the two relations shows that whatever voltage gains you make, you pay for in current: a step-up transformer (higher $V_s$) always delivers a *lower* secondary current than the primary current, and vice versa for a step-down transformer.

:::callout{kind="key"}
Transformer equations (ideal transformer): $\dfrac{V_p}{V_s} = \dfrac{N_p}{N_s}$ and $I_pV_p = I_sV_s$. Voltage and turns are directly proportional; voltage and current are inversely related when power is conserved.
:::

:::reveal{title="Worked example: transformer voltage and current"}
A transformer has $N_p = 800$ turns on the primary and $N_s = 40$ turns on the secondary. The primary is connected to the $230\,\text{V}$ mains supply.

**Secondary voltage:**

$$
V_s = V_p \times \frac{N_s}{N_p} = 230 \times \frac{40}{800} = 11.5\,\text{V}.
$$

This is a step-down transformer (fewer secondary turns, lower secondary voltage) — the kind used in a low-voltage mains adapter.

**Primary current**, if the secondary supplies a current of $I_s = 2.5\,\text{A}$ to its load: assuming an ideal (100% efficient) transformer, $I_pV_p = I_sV_s$, so

$$
I_p = \frac{I_sV_s}{V_p} = \frac{2.5 \times 11.5}{230} = 0.125\,\text{A}.
$$

Notice the secondary current ($2.5\,\text{A}$) is much larger than the primary current ($0.125\,\text{A}$) — exactly what we expect for a step-down transformer, since power ($I_pV_p = I_sV_s = 28.75\,\text{W}$) must balance.
:::

You now have the full toolkit for this module: magnetic field patterns and the two force laws ($F = BIL\sin\theta$, $F = BQv\sin\theta$), flux and flux linkage, Faraday's and Lenz's laws, and the two devices — generators and transformers — that put induction to practical use. Attempt the end-of-module assessment to check your understanding.
