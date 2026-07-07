# Nuclear structure and types of decay

Every atom has a tiny, dense nucleus at its centre, made of two kinds of nucleon: protons (positive charge) and neutrons (no charge). The electrons that surround the nucleus contribute almost nothing to the atom's mass but define its chemistry. Nuclear physics is concerned with the nucleus itself — its make-up, and the ways it can spontaneously change.

## Nuclide notation

A nucleus (or **nuclide**) is written as

$$
{}^{A}_{Z}X
$$

where $X$ is the chemical symbol, $Z$ is the **proton number** (or atomic number — the number of protons, which fixes the element), and $A$ is the **mass number** (the total number of nucleons, protons plus neutrons). The number of neutrons is therefore $N = A - Z$.

:::callout{kind="key"}
$A$ = number of protons + number of neutrons (total nucleons).
$Z$ = number of protons (defines the element).
$N = A - Z$ = number of neutrons.
:::

For example, the isotope carbon-14, written ${}^{14}_{6}\text{C}$, has $Z = 6$ protons and $N = 14 - 6 = 8$ neutrons.

**Isotopes** are atoms of the same element (same $Z$, same chemistry) with different numbers of neutrons, and therefore different $A$. Carbon-12 (${}^{12}_{6}\text{C}$) and carbon-14 (${}^{14}_{6}\text{C}$) are isotopes of carbon: both have 6 protons, but 6 and 8 neutrons respectively.

:::reveal{title="Worked example: protons and neutrons in a nuclide"}
How many protons and neutrons are there in a nucleus of uranium-235, ${}^{235}_{92}\text{U}$?

Reading the notation directly: $Z = 92$, so there are **92 protons**. The mass number is $A = 235$, so the number of neutrons is

$$
N = A - Z = 235 - 92 = 143.
$$

So ${}^{235}_{92}\text{U}$ has 92 protons and 143 neutrons.
:::

## The four types of radioactive decay

An unstable nucleus can become more stable by emitting radiation. There are four types you need to know, each with its own nuclear equation, penetrating power and ionising ability.

### Alpha ($\alpha$) decay

An alpha particle is a helium nucleus, ${}^{4}_{2}\text{He}$ (2 protons + 2 neutrons), ejected from the nucleus. Because it carries away 2 protons and 2 neutrons, the daughter nucleus has $A$ reduced by 4 and $Z$ reduced by 2:

$$
{}^{A}_{Z}X \;\rightarrow\; {}^{A-4}_{\,Z-2}Y \;+\; {}^{4}_{2}\text{He}.
$$

Alpha particles are heavy (relative to $\beta$) and doubly charged, so they interact strongly with matter: **highly ionising**, but consequently **weakly penetrating** — stopped by a few centimetres of air or a sheet of paper.

### Beta-minus ($\beta^-$) decay

A neutron in the nucleus converts into a proton, emitting an electron (the "beta particle") and an electron antineutrino ($\bar{\nu}_e$):

$$
{}^{1}_{0}\text{n} \rightarrow {}^{1}_{1}\text{p} + {}^{0}_{-1}\text{e} + \bar{\nu}_e.
$$

For the nucleus as a whole, $A$ is unchanged (a neutron became a proton — the nucleon count stays the same) and $Z$ increases by 1:

$$
{}^{A}_{Z}X \;\rightarrow\; {}^{A}_{\,Z+1}Y \;+\; {}^{0}_{-1}\text{e} \;+\; \bar{\nu}_e.
$$

Beta particles are light and singly charged: **moderately ionising**, **moderately penetrating** — stopped by a few millimetres of aluminium.

### Beta-plus ($\beta^+$) decay

Some proton-rich nuclides instead convert a proton into a neutron, emitting a positron (the antiparticle of the electron) and an electron neutrino ($\nu_e$):

$$
{}^{A}_{Z}X \;\rightarrow\; {}^{A}_{\,Z-1}Y \;+\; {}^{0}_{+1}\text{e} \;+\; \nu_e.
$$

Here $A$ is unchanged and $Z$ decreases by 1.

### Gamma ($\gamma$) decay

After an $\alpha$ or $\beta$ decay the daughter nucleus is often left in an excited (higher-energy) state, exactly as an electron can be left in an excited atomic state. It relaxes by emitting a high-energy photon, a gamma ray:

$$
{}^{A}_{Z}X^{*} \;\rightarrow\; {}^{A}_{Z}X \;+\; \gamma.
$$

A gamma ray has no charge and no mass, so $A$ and $Z$ are **unchanged** — it is pure electromagnetic radiation carrying away energy. Gamma rays are uncharged and interact weakly with matter: **weakly ionising** but **highly penetrating**, requiring several centimetres of lead or metres of concrete to substantially reduce intensity.

:::callout{kind="info"}
Penetrating power and ionising ability trade off against each other: the more strongly a radiation type ionises the matter it passes through, the faster it loses its own energy, so the less far it penetrates. Alpha (strong ioniser) barely penetrates; gamma (weak ioniser) penetrates a long way.
:::

:::reveal{title="Worked example: balancing nuclear equations"}
**(a)** Radium-226 undergoes alpha decay. Write the nuclear equation.

Start from ${}^{226}_{88}\text{Ra}$. Alpha decay reduces $A$ by 4 and $Z$ by 2:

$$
A' = 226 - 4 = 222, \qquad Z' = 88 - 2 = 86.
$$

$Z = 86$ is radon (Rn), so

$$
{}^{226}_{88}\text{Ra} \rightarrow {}^{222}_{86}\text{Rn} + {}^{4}_{2}\text{He}.
$$

Check: mass numbers balance ($226 = 222 + 4$) and proton numbers balance ($88 = 86 + 2$).

**(b)** Carbon-14 undergoes beta-minus decay. Write the nuclear equation.

Start from ${}^{14}_{6}\text{C}$. Beta-minus decay leaves $A$ unchanged and increases $Z$ by 1:

$$
A' = 14, \qquad Z' = 6 + 1 = 7.
$$

$Z = 7$ is nitrogen (N), so

$$
{}^{14}_{6}\text{C} \rightarrow {}^{14}_{7}\text{N} + {}^{0}_{-1}\text{e} + \bar{\nu}_e.
$$

Check: mass numbers balance ($14 = 14 + 0$) and charges balance ($6 = 7 + (-1)$).
:::

## Randomness and spontaneity

Radioactive decay is both **spontaneous** and **random**:

- **Spontaneous** — a decay is not triggered by any external factor. It happens regardless of temperature, pressure, chemical bonding, or any other physical/chemical condition the nucleus experiences.
- **Random** — it is impossible to predict *which* nucleus in a sample will decay next, or exactly *when* any individual nucleus will decay. Every unstable nucleus of a given isotope has the same constant probability of decaying in the next second, no matter how long it has already existed.

These two facts do not mean decay is unpredictable overall: with a very large number of nuclei (of order $10^{20}$ or more in a real sample), the *statistical* behaviour of the whole sample is highly predictable, even though any one nucleus's decay moment is not. This statistical regularity is exactly what the decay constant and half-life (next lesson) capture.

::widget{type="data-plot" src="data/decay-detection-counts.json"}

The chart above shows the number of decays detected by a Geiger counter in successive 2-second intervals from a radioactive source — the counts fluctuate irregularly around a smoothly falling trend, illustrating randomness (individual counts) sitting on top of an overall statistical pattern (the trend).

In the next lesson we turn this statistical pattern into a precise mathematical law: the exponential decay law.
