# Two-source interference and diffraction gratings

Standing waves showed what happens when two waves overlap along a line. Interference and diffraction are the same superposition principle at work in two (or three) dimensions — and they are the reason light shows wave behaviour at all.

## Path difference and coherence

When waves from two sources arrive at a point, what matters is their **path difference** — the difference in the distances travelled from each source to that point.

- If the path difference is a **whole number of wavelengths** ($0, \lambda, 2\lambda, \dots$), the waves arrive **in phase** and interfere **constructively** (a bright fringe, for light).
- If the path difference is a **whole number plus a half wavelength** ($\tfrac{1}{2}\lambda, \tfrac{3}{2}\lambda, \dots$), the waves arrive **in antiphase** and interfere **destructively** (a dark fringe).

For a stable (unchanging) interference pattern to be observed at all, the two sources must be **coherent**: they must have the same frequency and a **constant phase difference**. Two independent light bulbs are never coherent — their light is emitted in random, constantly-changing bursts — which is why Young's experiment (below) derives both beams from a single source.

## Young's double-slit experiment

Thomas Young shone light through two narrow, closely-spaced slits and observed a pattern of equally-spaced bright and dark fringes on a screen — direct evidence that light is a wave. Each slit acts as a coherent source (both are illuminated by the same wavefront), so the light from the two slits interferes on the screen.

For slit separation $a$, screen distance $D$ (with $D \gg a$), and fringe spacing $x$ (the distance between adjacent bright fringes), the relationship is

$$
\lambda = \frac{a x}{D}.
$$

:::callout{kind="tip"}
Rearranged forms are equally useful: $x = \dfrac{\lambda D}{a}$ (predict the fringe spacing) or $a = \dfrac{\lambda D}{x}$ (find the slit separation from a measured pattern).
:::

:::reveal{title="Worked example: finding wavelength from a fringe pattern"}
In a double-slit experiment the slits are $a = 0.25\,\text{mm}$ apart, the screen is $D = 2.4\,\text{m}$ away, and the measured fringe spacing is $x = 5.28\,\text{mm}$. Find the wavelength of the light.

$$
\lambda = \frac{a x}{D} = \frac{(0.25\times10^{-3})\times(5.28\times10^{-3})}{2.4} = 5.5\times10^{-7}\,\text{m} = 550\,\text{nm}.
$$

$550\,\text{nm}$ is in the green part of the visible spectrum — a sensible result.
:::

Use the calculator below to explore how fringe spacing depends on slit separation, screen distance and wavelength (edit the numbers and re-run):

::widget{type="code-runner" language="python" starter="# Young's double-slit: x = lambda * D / a\na = 0.25e-3   # slit separation, m\nD = 2.4       # slit-to-screen distance, m\nwavelength = 550e-9  # m\n\nx = wavelength * D / a\nprint(f'fringe spacing x = {x*1000:.3f} mm')" rows=10}

## Diffraction gratings

A **diffraction grating** is a plate ruled with many thousands of very closely and evenly spaced slits. Shining monochromatic light through it produces sharp, well-separated bright maxima (rather than the fainter fringes of a two-slit pattern), because light from **every** slit interferes constructively at only a few precise angles.

If the grating has $N$ lines per metre, the spacing between adjacent slits is $d = \dfrac{1}{N}$. Constructive interference (an "order" of maximum) occurs at angle $\theta$ to the normal when

$$
d \sin\theta = n\lambda, \qquad n = 0, 1, 2, \dots
$$

where $n$ is the **order** of the maximum ($n = 0$ is the undiffracted central beam, straight through at $\theta = 0$).

:::reveal{title="Worked example: grating spacing and first-order angle"}
A diffraction grating has $300$ lines per millimetre. Find (a) the grating spacing $d$ and (b) the angle of the first-order ($n=1$) maximum for light of wavelength $600\,\text{nm}$.

**(a)** $N = 300$ lines/mm $= 3.00\times10^{5}$ lines/m, so

$$
d = \frac{1}{N} = \frac{1}{3.00\times10^{5}} = 3.33\times10^{-6}\,\text{m}.
$$

**(b)** Rearranging $d\sin\theta = n\lambda$:

$$
\sin\theta = \frac{n\lambda}{d} = \frac{1 \times 600\times10^{-9}}{3.33\times10^{-6}} = 0.18 \implies \theta \approx 10.4^\circ.
$$
:::

:::callout{kind="key"}
A grating with more lines per millimetre has a **smaller** $d$, which — for a given $\lambda$ — pushes the diffraction angles **larger** ($\sin\theta = n\lambda/d$). Finer gratings spread orders out more, which is why they give sharper spectral resolution.
:::

## Practice

Work through the reveals above by hand before checking the numbers, then continue to refraction and total internal reflection.
