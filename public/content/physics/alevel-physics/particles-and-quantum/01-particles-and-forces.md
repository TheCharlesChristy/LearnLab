# Particles and fundamental forces

Every atom is built from three particles: the **proton**, the **neutron** and the **electron**. Protons and neutrons live in a tiny, dense **nucleus**; electrons occupy the much larger volume around it.

| Particle | Charge | Relative mass | Location |
| --- | --- | --- | --- |
| Proton | $+1e$ | $1$ | nucleus |
| Neutron | $0$ | $1$ | nucleus |
| Electron | $-1e$ | $\dfrac{1}{1836}$ | around the nucleus |

:::callout{kind="info"}
Here $e = 1.60 \times 10^{-19}\,\text{C}$ is the **elementary charge** — the smallest unit of charge seen in an isolated particle. Charges are usually quoted as multiples of $e$.
:::

## Quarks: what protons and neutrons are made of

The proton and neutron are not fundamental — each is built from three smaller particles called **quarks**. A-level physics needs only two types:

| Quark | Symbol | Charge |
| --- | --- | --- |
| Up | $\text{u}$ | $+\dfrac{2}{3}e$ |
| Down | $\text{d}$ | $-\dfrac{1}{3}e$ |

- **Proton** = up + up + down (uud): charge $= \dfrac{2}{3}e + \dfrac{2}{3}e - \dfrac{1}{3}e = +1e$. ✓
- **Neutron** = up + down + down (udd): charge $= \dfrac{2}{3}e - \dfrac{1}{3}e - \dfrac{1}{3}e = 0$. ✓

:::callout{kind="key"}
Any particle built from quarks is a **hadron**. A hadron made of exactly three quarks (like the proton and neutron) is a **baryon**.
:::

## Leptons: the electron's family

The **electron** *is* fundamental — it is not made of anything smaller. It belongs to a class of fundamental particles called **leptons**, which never feel the strong force. Its lepton partner is the (almost massless, chargeless) **electron neutrino**, $\nu_e$, produced in many decays.

## The four fundamental forces

Every interaction between particles is one of exactly four fundamental forces. Each has an approximate relative strength (compared with the strong force, taken as $1$) and a range over which it acts.

| Force | Acts between | Relative strength | Range | Carrier (boson) |
| --- | --- | --- | --- | --- |
| Strong nuclear | quarks; nucleons in a nucleus | $1$ | $\sim 10^{-15}\,\text{m}$ (nuclear size) | gluon |
| Electromagnetic | charged particles | $\sim 10^{-2}$ | infinite | photon |
| Weak nuclear | all particles; causes some decays | $\sim 10^{-6}$ | $\sim 10^{-18}\,\text{m}$ | W and Z bosons |
| Gravitational | all particles with mass | $\sim 10^{-38}$ | infinite | (graviton, unobserved) |

:::callout{kind="tip"}
The strong force is what holds quarks together inside a proton or neutron, **and** what holds protons and neutrons together in a nucleus, overcoming the electromagnetic repulsion between protons. Its short range ($\sim 10^{-15}\,\text{m}$) is why it has no effect beyond the nucleus.
:::

Use the flashcards below to test yourself on the vocabulary introduced so far — quark, lepton, hadron, baryon, and the force-carrying bosons.

::widget{type="flashcards" src="particle-terms.json"}

## Particle interactions and conservation laws

When particles interact or a particle decays, several quantities must balance on both sides of the process, in addition to the energy and momentum conservation you already know:

- **Charge** ($Q$): the total electric charge before and after must be equal.
- **Baryon number** ($B$): every baryon (proton, neutron) has $B = +1$, every antibaryon has $B = -1$, and every other particle (leptons, photons) has $B = 0$. Total $B$ is conserved.
- **Lepton number** ($L$): every lepton (electron, electron neutrino) has $L = +1$, every antilepton (positron, electron antineutrino) has $L = -1$, and every other particle has $L = 0$. Total $L$ is conserved.

:::reveal{title="Worked example: checking conservation in beta-minus decay"}
In beta-minus decay, a neutron inside a nucleus decays into a proton, an electron, and an electron antineutrino:

$$
\text{n} \rightarrow \text{p} + e^- + \bar{\nu}_e
$$

**Charge:** neutron $Q=0$. Products: proton $Q=+1$, electron $Q=-1$, antineutrino $Q=0$. Total $= +1 - 1 + 0 = 0$. ✓ matches the left-hand side.

**Baryon number:** neutron $B=+1$. Products: proton $B=+1$, electron $B=0$, antineutrino $B=0$. Total $=+1$. ✓ matches.

**Lepton number:** neutron $L=0$. Products: proton $L=0$, electron $L=+1$ (it's a lepton), antineutrino $L=-1$ (it's an *anti*lepton). Total $= 0 + 1 - 1 = 0$. ✓ matches.

All three quantities balance, so this decay is allowed. If any one of them failed to balance, the decay could not happen.
:::

Conservation laws like these are exactly how physicists work out which particle interactions are possible and which are forbidden — a theme we return to throughout this course. Next, we look at what happens when light itself is treated as a stream of particles.
