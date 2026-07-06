# The photoelectric effect

Shine light on a clean metal surface and, under the right conditions, electrons are ejected from it — the **photoelectric effect**. Studying exactly which conditions matter turned out to be one of the most important experiments in physics: it showed that light itself is not a continuous wave, but arrives in discrete packets.

## What the wave model of light could not explain

Classically, light is a wave that carries energy continuously, spread evenly across its wavefront. That model predicts:

- A dim (low-intensity) light of *any* frequency should eventually eject electrons, if you wait long enough for enough energy to build up.
- Brighter light should eject electrons with *more* kinetic energy, because a brighter wave carries more energy.

Experiments showed the opposite:

- Below a certain **threshold frequency** $f_0$ (which depends on the metal), *no* electrons are ejected — no matter how intense the light is, or how long you shine it.
- Above $f_0$, electrons are ejected **instantly**, with no measurable delay.
- Increasing the intensity above $f_0$ increases the *number* of electrons ejected per second, but does **not** increase their maximum kinetic energy. Only increasing the *frequency* does that.

:::callout{kind="warning"}
None of these three observations makes sense if light delivers energy as a continuous wave. They are exactly what you'd expect if light delivers its energy in individual, indivisible packets.
:::

## Einstein's photon model

Einstein proposed that light of frequency $f$ is made of **photons**, each carrying a fixed quantum of energy

$$
E = hf,
$$

where $h = 6.63 \times 10^{-34}\,\text{J\,s}$ is the **Planck constant**. A photoelectron absorbs exactly *one* photon. To escape the metal's surface, the electron must first overcome the **work function** $\Phi$ — the minimum energy binding it to the metal (different for every metal). Whatever photon energy is left over becomes the electron's kinetic energy. This is **Einstein's photoelectric equation**:

$$
hf = \Phi + KE_{\max}.
$$

$KE_{\max}$ is the *maximum* kinetic energy because some electrons lose additional energy to collisions on their way out of the metal.

:::callout{kind="key"}
The **threshold frequency** $f_0$ is the minimum frequency that can eject an electron at all — i.e. the frequency at which $KE_{\max} = 0$, so $\Phi = hf_0$. Below $f_0$, a single photon never carries enough energy to free an electron, however many photons per second arrive (however bright the light).
:::

## The straight-line graph

Rearranging Einstein's equation as $KE_{\max} = hf - \Phi$ shows that a graph of $KE_{\max}$ against $f$ is a straight line: gradient $h$, $y$-intercept $-\Phi$, and $x$-intercept $f_0$. The grapher below plots this line for a metal with work function $\Phi = 2.30\,\text{eV}$ (close to potassium), with frequency $f$ measured in units of $10^{14}\,\text{Hz}$ along the $x$-axis and $KE_{\max}$ in $\text{eV}$ on the $y$-axis.

::widget{type="function-grapher" expr="0.414375*x - 2.30" xmin=0 xmax=10 grid=true}

Where the line crosses the $x$-axis ($KE_{\max}=0$) is the threshold frequency $f_0$ for this metal, at $x \approx 5.55$ (i.e. $f_0 \approx 5.55 \times 10^{14}\,\text{Hz}$).

:::reveal{title="Worked example: threshold frequency and maximum kinetic energy"}
A metal has work function $\Phi = 2.30\,\text{eV}$. (Recall $1\,\text{eV} = 1.60\times 10^{-19}\,\text{J}$, so $\Phi = 2.30 \times 1.60\times10^{-19} = 3.68\times10^{-19}\,\text{J}$.)

**Threshold frequency:**

$$
f_0 = \frac{\Phi}{h} = \frac{3.68\times10^{-19}}{6.63\times10^{-34}} = 5.55\times10^{14}\,\text{Hz}.
$$

**Maximum kinetic energy for light of frequency $f = 8.00\times10^{14}\,\text{Hz}$:**

$$
E_{\text{photon}} = hf = (6.63\times10^{-34})(8.00\times10^{14}) = 5.304\times10^{-19}\,\text{J} = 3.315\,\text{eV}.
$$

$$
KE_{\max} = E_{\text{photon}} - \Phi = 3.315 - 2.30 = 1.015\,\text{eV}.
$$

Since $f = 8.00\times10^{14}\,\text{Hz}$ is above $f_0 = 5.55\times10^{14}\,\text{Hz}$, photoemission does occur, with maximum kinetic energy $1.015\,\text{eV}$ (about $1.62\times10^{-19}\,\text{J}$).
:::

## Try it yourself

The code below computes a photon's energy and compares it with a metal's work function to decide whether photoemission occurs, and if so with what maximum kinetic energy. Run it, then try changing `f` and `phi_eV` to see how the outcome changes — in particular, try a frequency *below* the threshold and check that `ke_max_eV` comes out as zero.

```python
h = 6.63e-34   # J s (Planck constant)
e = 1.60e-19   # C (elementary charge, also gives 1 eV in joules)
f = 6.00e14    # Hz (incident light frequency)
phi_eV = 2.30  # eV (work function of the metal)

e_photon_eV = (h * f) / e
ke_max_eV = e_photon_eV - phi_eV if e_photon_eV > phi_eV else 0.0
print(f"photon energy = {e_photon_eV:.3f} eV")
print(f"KE_max = {ke_max_eV:.3f} eV")
```

::widget{type="code-runner" language="python" starter="h = 6.63e-34; e = 1.60e-19; f = 6.00e14; phi_eV = 2.30; e_photon_eV = (h * f) / e; ke_max_eV = e_photon_eV - phi_eV if e_photon_eV > phi_eV else 0.0; print(f'photon energy = {e_photon_eV:.3f} eV'); print(f'KE_max = {ke_max_eV:.3f} eV')" solutionTest="assert abs(ke_max_eV - 0.186) < 0.01" rows=10}

The photoelectric effect is direct evidence that light carries energy in discrete photons — the first crack in the purely wave-based picture of light. Next we push this particle-vs-wave idea further, in both directions.
