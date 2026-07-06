# Wave-particle duality and energy levels

The photoelectric effect showed that light — usually described as a wave — behaves like a stream of particles. Louis de Broglie asked the reverse question: if waves can behave like particles, can particles behave like waves?

## De Broglie's hypothesis

De Broglie proposed that **every** moving particle has an associated wavelength, called the **de Broglie wavelength**:

$$
\lambda = \frac{h}{p},
$$

where $p$ is the particle's momentum ($p = mv$ for a non-relativistic particle) and $h$ is the Planck constant. This single formula applies equally to photons (where $p = E/c$, giving back $\lambda = h/(E/c) = c/f$, consistent with the familiar wave relation) and to matter particles like electrons.

:::callout{kind="key"}
$\lambda = \dfrac{h}{p} = \dfrac{h}{mv}$. Larger momentum means a *shorter* wavelength — this is why the wave nature of everyday, massive objects is utterly undetectable, while electrons (extremely light) have wavelengths comparable to atomic spacings.
:::

The clinching evidence came from **electron diffraction**: firing a beam of electrons at a thin crystalline sample produces a diffraction pattern of concentric rings, exactly as light does when passing through a diffraction grating. A stream of particles cannot produce a diffraction pattern by any classical mechanism — only a wave can. This confirmed that electrons genuinely have wave-like properties, with a wavelength given correctly by de Broglie's formula.

:::reveal{title="Worked example: de Broglie wavelength of an electron"}
An electron (mass $m = 9.11\times10^{-31}\,\text{kg}$) travels at $v = 2.00\times10^{6}\,\text{m s}^{-1}$.

**Momentum:**

$$
p = mv = (9.11\times10^{-31})(2.00\times10^{6}) = 1.822\times10^{-24}\,\text{kg m s}^{-1}.
$$

**Wavelength:**

$$
\lambda = \frac{h}{p} = \frac{6.63\times10^{-34}}{1.822\times10^{-24}} = 3.64\times10^{-10}\,\text{m}.
$$

This is about $0.36\,\text{nm}$ — comparable to the spacing between atoms in a crystal, which is exactly why crystals act as a diffraction grating for electrons of this speed.
:::

## Try it yourself

Run the code below (it reproduces the worked example above), then change `v` to see how a faster electron has a *shorter* de Broglie wavelength.

```python
h = 6.63e-34   # J s
m = 9.11e-31   # kg (electron mass)
v = 2.00e6     # m/s

p = m * v
wavelength = h / p
print(f"momentum = {p:.3e} kg m/s")
print(f"de Broglie wavelength = {wavelength:.3e} m")
```

::widget{type="code-runner" language="python" starter="h = 6.63e-34; m = 9.11e-31; v = 2.00e6; p = m * v; wavelength = h / p; print(f'momentum = {p:.3e} kg m/s'); print(f'de Broglie wavelength = {wavelength:.3e} m')" solutionTest="assert abs(wavelength - 3.64e-10) < 0.03e-10" rows=10}

## Energy levels and line spectra

Electrons in an atom cannot have just any energy — they are confined to a discrete set of allowed **energy levels**. For hydrogen, the $n$-th level has energy

$$
E_n = -\frac{13.6}{n^2}\,\text{eV},
$$

(negative because the electron is bound to the nucleus; $n = 1$ is the lowest, most tightly bound level — the **ground state**). The chart below shows the first five levels.

::widget{type="data-plot" src="hydrogen-energy-levels.json"}

When an electron falls from a higher level to a lower one, the atom emits a single photon whose energy exactly matches the gap between the two levels:

$$
hf = E_{\text{high}} - E_{\text{low}}.
$$

The reverse also happens: an atom can *absorb* a photon of exactly the right energy to lift an electron from a lower level to a higher one. Because only a few discrete energy gaps exist, only a few discrete photon frequencies can be emitted or absorbed — this is why hot gases produce **emission line spectra** (bright lines on a dark background, at specific frequencies) and cool gases in front of a bright source produce **absorption line spectra** (dark lines on a continuous bright background, at the *same* specific frequencies). A continuous range of energies, and hence a continuous spectrum, is exactly what you would *not* expect if energy levels were discrete — the existence of line spectra is direct evidence that atomic energy levels are quantised.

:::reveal{title="Worked example: the photon emitted in an n = 3 → n = 2 transition"}
$$
E_3 = -\frac{13.6}{3^2} = -1.511\,\text{eV}, \qquad E_2 = -\frac{13.6}{2^2} = -3.4\,\text{eV}.
$$

$$
\Delta E = E_3 - E_2 = -1.511 - (-3.4) = 1.889\,\text{eV}.
$$

Converting to joules: $\Delta E = 1.889 \times 1.60\times10^{-19} = 3.022\times10^{-19}\,\text{J}$.

$$
f = \frac{\Delta E}{h} = \frac{3.022\times10^{-19}}{6.63\times10^{-34}} = 4.56\times10^{14}\,\text{Hz}.
$$

$$
\lambda = \frac{c}{f} = \frac{3.00\times10^{8}}{4.56\times10^{14}} = 6.58\times10^{-7}\,\text{m} = 658\,\text{nm}.
$$

This is red light — and indeed the real $n=3 \to n=2$ transition in hydrogen produces the red $H_\alpha$ line (at $656\,\text{nm}$) seen in the hydrogen emission spectrum; the small difference is just rounding in the energy-level values used here.
:::

Between them, the photoelectric effect, electron diffraction, and atomic line spectra show that energy and matter share the same underlying quantum character: light can behave as particles, matter can behave as waves, and the energy exchanged between them is always quantised in units of $hf$.
