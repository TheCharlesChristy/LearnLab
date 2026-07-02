# Refraction and total internal reflection

Light changes direction when it crosses a boundary between two transparent media of different optical density — this is **refraction**, and it happens because the wave's speed changes while its frequency stays fixed.

## Refractive index and Snell's law

The **refractive index** $n$ of a medium describes how strongly it slows light compared with a vacuum (or, to good approximation, air):

$$
n = \frac{c}{v},
$$

where $c$ is the speed of light in a vacuum and $v$ is the speed of light in the medium. A higher $n$ means light travels slower in that medium and bends more strongly towards the normal on entering it.

For light crossing a boundary between two media, **Snell's law** relates the angles of incidence and refraction (both measured from the normal — the line perpendicular to the boundary) to the refractive indices:

$$
n_1 \sin\theta_1 = n_2 \sin\theta_2.
$$

In the common special case of light entering a medium of refractive index $n$ from air ($n_1 \approx 1$), this is often written as

$$
n = \frac{\sin\theta_1}{\sin\theta_2}
$$

with $\theta_1$ the angle in air and $\theta_2$ the angle in the medium. Light bends **towards** the normal when entering a denser medium ($\theta_2 < \theta_1$) and **away from** the normal when leaving it.

:::reveal{title="Worked example: applying Snell's law"}
Light travels from air ($n_1 = 1.00$) into water ($n_2 = 1.33$) at an angle of incidence of $40^\circ$. Find the angle of refraction.

Rearranging $n_1 \sin\theta_1 = n_2\sin\theta_2$:

$$
\sin\theta_2 = \frac{n_1 \sin\theta_1}{n_2} = \frac{1.00 \times \sin 40^\circ}{1.33} = \frac{0.643}{1.33} = 0.483.
$$

$$
\theta_2 = \sin^{-1}(0.483) \approx 28.9^\circ.
$$

As expected, the ray bends towards the normal ($28.9^\circ < 40^\circ$) on entering the denser medium.
:::

## Total internal reflection

When light travels from a **denser** medium into a **less dense** one (e.g. glass into air), it bends **away** from the normal, so the angle of refraction is always larger than the angle of incidence. As the angle of incidence increases, the refracted ray bends closer and closer to the boundary itself.

At a particular angle of incidence — the **critical angle**, $C$ — the refracted ray grazes exactly along the boundary ($\theta_2 = 90^\circ$). Beyond $C$, refraction becomes impossible and **all** of the light is reflected back into the denser medium: **total internal reflection (TIR)**.

Setting $\theta_1 = C$ and $\theta_2 = 90^\circ$ in Snell's law (with $n$ the refractive index of the denser medium relative to the less dense one it borders):

$$
n \sin C = 1 \times \sin 90^\circ = 1 \quad\Longrightarrow\quad \sin C = \frac{1}{n}.
$$

:::callout{kind="key"}
Total internal reflection requires **two conditions**: (1) light must be travelling from a denser medium towards a less dense one, and (2) the angle of incidence must **exceed** the critical angle $C = \sin^{-1}(1/n)$. Below $C$, the light simply refracts (with some partial reflection) as usual.
:::

The graph below shows how the critical angle depends on refractive index, $C = \sin^{-1}(1/n)$ — notice that a more strongly refracting medium (larger $n$) has a **smaller** critical angle, so light escapes it less easily:

::widget{type="data-plot" src="data/critical-angle.json"}

:::reveal{title="Worked example: critical angle of glass"}
A glass block has a refractive index of $1.50$ relative to air. Find its critical angle.

$$
\sin C = \frac{1}{n} = \frac{1}{1.50} = 0.667.
$$

$$
C = \sin^{-1}(0.667) \approx 41.8^\circ.
$$

Any ray hitting the glass–air boundary from inside the glass at more than $41.8^\circ$ to the normal undergoes total internal reflection.
:::

Total internal reflection is the physical principle behind **optical fibres** (a glass core with $n$ high enough that light launched down it always exceeds the critical angle at the core–cladding boundary) and the sparkle of a well-cut diamond (very high $n \approx 2.4$ gives a small critical angle, so light entering the top is very likely to totally internally reflect off the angled facets before it can exit).

## Practice

Work through the reveals above by hand, then attempt the end-of-module assessment below.
