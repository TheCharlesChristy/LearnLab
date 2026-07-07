# Wave properties, the wave equation and standing waves

A wave transfers **energy and information** from one place to another without transferring matter. Ripples on a pond, sound in air, and light from a distant star are all waves — but they fall into two distinct families depending on how the medium (or field) oscillates relative to the direction the wave travels.

## Transverse and longitudinal waves

In a **transverse** wave, the oscillation is **perpendicular** to the direction of energy transfer. A wiggled rope, water surface waves, and all electromagnetic waves (including light) are transverse.

In a **longitudinal** wave, the oscillation is **parallel** to the direction of energy transfer — the medium compresses and rarefies along the direction of travel. Sound waves in air, and a push-pull disturbance sent along a stretched slinky spring, are longitudinal.

:::callout{kind="key"}
Transverse: oscillation ⟂ direction of travel. Longitudinal: oscillation ∥ direction of travel. Only transverse waves can be **polarised** (see below) — this is one of the strongest pieces of evidence that light is transverse.
:::

## Describing a wave

| Quantity | Symbol | Unit | Meaning |
| --- | --- | --- | --- |
| Amplitude | $A$ | m | Maximum displacement from the undisturbed (equilibrium) position |
| Wavelength | $\lambda$ | m | Distance between two adjacent points oscillating in phase (e.g. crest to crest) |
| Period | $T$ | s | Time for one complete oscillation at a point |
| Frequency | $f$ | Hz | Number of complete oscillations per second, $f = \dfrac{1}{T}$ |
| Wave speed | $v$ | m s$^{-1}$ | Speed at which the disturbance (and hence energy) propagates |

A snapshot of a transverse wave at one instant looks like a sine curve — displacement $y$ plotted against distance $x$ along the wave:

::widget{type="function-grapher" expr="sin(x)" xmin=0 xmax=12.56 grid=true}

## The wave equation

Because a wave travels one wavelength in one period, its speed is

$$
v = \frac{\lambda}{T} = f\lambda.
$$

This **wave equation**, $v = f\lambda$, applies to every kind of wave — mechanical or electromagnetic.

:::reveal{title="Worked example: finding wave speed"}
A water wave has frequency $2.5\,\text{Hz}$ and wavelength $0.60\,\text{m}$. Find its speed.

$$
v = f\lambda = 2.5 \times 0.60 = 1.5\,\text{m s}^{-1}.
$$
:::

## Polarisation

Polarisation restricts the oscillations of a transverse wave to a **single plane** perpendicular to the direction of travel. Unpolarised light (e.g. from the sun or a bulb) oscillates in all perpendicular directions at once; passing it through a polaroid filter transmits only the component in the filter's transmission axis. A second polaroid ("analyser") at 90° to the first blocks (almost) all the light — a classic demonstration used to prove light is transverse. **Longitudinal waves cannot be polarised**, because there is no perpendicular oscillation direction to restrict.

## The principle of superposition

When two or more waves meet at a point, the **principle of superposition** states that the resultant displacement is the **vector sum** of the individual displacements. The waves then continue on their way unaffected — superposition is a temporary, local effect at the point(s) of overlap.

If two identical waves meet **in phase** (crest meets crest), they add constructively to give double the amplitude. If they meet **in antiphase** (crest meets trough), they cancel — destructive interference.

## Standing (stationary) waves

A **standing wave** forms when two waves of the **same frequency, wavelength and amplitude**, travelling in **opposite directions**, superpose — typically an incident wave and its reflection, as on a string fixed at both ends. Unlike a **progressive** wave, a standing wave does not transfer energy along its length; instead, energy is stored, oscillating between kinetic and potential energy at fixed points.

The resulting pattern has:

- **Nodes** — points of permanent zero displacement (destructive superposition always occurs there).
- **Antinodes** — points of maximum oscillation amplitude (constructive superposition always occurs there).

For a string fixed at both ends (nodes forced at each end), only wavelengths that fit a whole number of half-wavelengths into the string's length $L$ can resonate:

$$
L = n \cdot \frac{\lambda_n}{2}, \qquad n = 1, 2, 3, \dots
$$

$n = 1$ is the **fundamental** (first harmonic): one antinode, two nodes (the fixed ends), $\lambda_1 = 2L$. Higher $n$ gives the **harmonics** (overtones): the $n$-th harmonic has $n$ antinodes and $n+1$ nodes. A string (or air column, or any resonant system) driven at one of these natural frequencies undergoes **resonance** — a large-amplitude standing wave builds up because energy is fed in exactly in step with the natural oscillation.

Drag the slider below to see how the harmonic number changes the node/antinode pattern on a string fixed at both ends (red dots mark the nodes):

::py{src="items/standing-wave.py" params='{"harmonic": 1}' height=340}

:::reveal{title="Worked example: standing wave on a string"}
A string of length $0.80\,\text{m}$, fixed at both ends, vibrates in its second harmonic ($n = 2$). The wave speed on the string is $40\,\text{m s}^{-1}$. Find (a) the wavelength and (b) the frequency of vibration.

**(a)** Using $L = n\lambda_n/2$:

$$
\lambda_2 = \frac{2L}{n} = \frac{2 \times 0.80}{2} = 0.80\,\text{m}.
$$

**(b)** Using the wave equation $v = f\lambda$:

$$
f = \frac{v}{\lambda_2} = \frac{40}{0.80} = 50\,\text{Hz}.
$$
:::

## Practice

When you are confident with wave properties, the wave equation, polarisation, superposition and standing waves, move on to interference and diffraction.
