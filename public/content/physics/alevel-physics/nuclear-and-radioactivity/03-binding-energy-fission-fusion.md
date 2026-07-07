# Mass-energy equivalence, binding energy, fission and fusion

So far we have described *how* nuclei change. This lesson asks *why* — and where the huge amounts of energy released in nuclear decay, fission and fusion actually come from.

## Mass-energy equivalence

Einstein's famous result is that mass and energy are two forms of the same thing, related by

$$
E = mc^2,
$$

where $c = 3.00\times10^{8}\,\text{m s}^{-1}$ is the speed of light in a vacuum. Because $c^2$ is enormous ($9.00\times10^{16}\,\text{m}^2\text{s}^{-2}$), converting even a tiny mass into energy releases a huge amount of it.

:::reveal{title="Worked example: energy from a small mass"}
**Question.** Calculate the energy released if a mass of $1.00\times10^{-5}\,\text{kg}$ were converted completely into energy. Use $c = 3.00\times10^{8}\,\text{m s}^{-1}$.

$$
E = mc^2 = (1.00\times10^{-5}) \times (3.00\times10^{8})^2 = (1.00\times10^{-5}) \times (9.00\times10^{16}) = 9.00\times10^{11}\ \text{J}.
$$

For comparison, that is roughly the energy released by 200 tonnes of TNT — from ten micrograms of mass.
:::

## Mass defect and binding energy

If you add up the individual (separated, at rest) masses of the protons and neutrons that make up a nucleus, the total is always **greater** than the actual measured mass of the nucleus itself. The difference is the **mass defect** $\Delta m$:

$$
\Delta m = \big(Z m_p + N m_n\big) - m_{\text{nucleus}}.
$$

By $E = mc^2$, this "missing" mass corresponds to an energy $\Delta m\, c^2$ that was released when the nucleons bound together to form the nucleus — equivalently, it is the energy you would need to supply to pull the nucleus apart again into separate protons and neutrons. This is the **binding energy**:

$$
E_b = \Delta m\, c^2.
$$

The **binding energy per nucleon**, $E_b / A$, measures how tightly bound (how stable) a nucleus is — the larger it is, the more stable the nucleus, per nucleon.

:::reveal{title="Worked example: binding energy of helium-4"}
**Question.** A proton has mass $m_p = 1.007276\,\text{u}$, a neutron has mass $m_n = 1.008665\,\text{u}$, and a helium-4 nucleus (2 protons + 2 neutrons) has a measured mass of $4.001506\,\text{u}$. ($1\,\text{u}$, the atomic mass unit, is equivalent to $931.5\,\text{MeV}$ of energy.) Find (a) the mass defect and (b) the binding energy per nucleon of helium-4.

**(a)** Total separated mass of the nucleons:

$$
2m_p + 2m_n = 2(1.007276) + 2(1.008665) = 2.014552 + 2.017330 = 4.031882\ \text{u}.
$$

Mass defect:

$$
\Delta m = 4.031882 - 4.001506 = 0.030376\ \text{u} \approx 0.0304\ \text{u}.
$$

**(b)** Convert to energy using $1\,\text{u} = 931.5\,\text{MeV}$:

$$
E_b = 0.030376 \times 931.5 = 28.3\ \text{MeV}.
$$

There are $A = 4$ nucleons, so the binding energy per nucleon is

$$
\frac{E_b}{A} = \frac{28.3}{4} = 7.07\ \text{MeV per nucleon}.
$$
:::

## The binding-energy-per-nucleon curve

Plotting $E_b/A$ against mass number $A$ for all known nuclides gives one of the most important graphs in nuclear physics:

::widget{type="data-plot" src="data/binding-energy-curve.json"}

Key features:

- $E_b/A$ rises sharply for the lightest nuclei, has a broad maximum around $A \approx 56$ (iron/nickel — the most stable nuclides), then falls slowly for heavier nuclei.
- **Any process that moves nuclei up the curve — toward the peak — releases energy**, because the products end up more tightly bound (more negative total energy) than the reactants.

:::callout{kind="key"}
Fusing light nuclei together, or splitting heavy nuclei apart, both move the resulting nucleon(s) toward the peak of the curve (higher $E_b/A$) — so both release energy. This single idea explains both fission and fusion.
:::

## Nuclear fission

**Fission** is the splitting of a heavy nucleus (e.g. uranium-235) into two lighter "daughter" nuclei, usually triggered by absorbing a slow-moving neutron, and releasing further neutrons plus a large amount of energy:

$$
{}^{235}_{92}\text{U} + {}^{1}_{0}\text{n} \;\rightarrow\; {}^{141}_{56}\text{Ba} + {}^{92}_{36}\text{Kr} + 3\,{}^{1}_{0}\text{n} \;+\; \text{energy}.
$$

Check: mass numbers balance ($235 + 1 = 236 = 141 + 92 + 3$) and proton numbers balance ($92 + 0 = 92 = 56 + 36 + 0$). Since heavy nuclei like uranium-235 sit on the right-hand, downward-sloping part of the binding-energy curve, the two medium-mass daughter nuclei are more tightly bound (per nucleon) than the original uranium nucleus was — the energy difference is released, overwhelmingly as kinetic energy of the fragments.

Because each fission event releases *more than one* neutron, and each of those neutrons can trigger a further fission in a neighbouring nucleus, a self-sustaining **chain reaction** is possible: one fission causes (on average) more than one further fission, so the number of fissions per second grows. This is controlled in a nuclear reactor (moderators slow neutrons, control rods absorb some of them to hold the reaction rate steady) and uncontrolled in a fission weapon.

## Nuclear fusion

**Fusion** is the joining of two light nuclei into a single heavier nucleus. Because light nuclei sit on the steeply-rising left-hand part of the binding-energy curve, fusing them produces a nucleus with substantially higher $E_b/A$ than the reactants, releasing energy. The overall reaction that powers the Sun (the proton-proton chain, net effect) converts hydrogen into helium:

$$
4\,{}^{1}_{1}\text{H} \;\rightarrow\; {}^{4}_{2}\text{He} + 2\,{}^{0}_{+1}\text{e} + 2\nu \;+\; \text{energy}.
$$

Fusion needs extremely high temperature and pressure (as found in stellar cores) because two positively charged nuclei strongly repel each other electrostatically; only at very high speeds (high temperature) can they get close enough for the short-range strong nuclear force to take over and bind them together. This is also why controlled fusion power on Earth is such a difficult engineering challenge — sustaining the required temperature and confinement is extremely demanding — even though the fuel (isotopes of hydrogen) is abundant and the energy released per kilogram of fuel is far greater than for fission.

:::callout{kind="info"}
Fission (heavy → medium nuclei) and fusion (light → heavier nuclei) are, in this sense, mirror images: both are simply nature moving nuclei toward the most stable point on the binding-energy curve, and releasing the energy difference as it does so.
:::

You have now met the whole picture: what a nucleus is made of, how it can decay, the statistical law governing decay over time, and where the energy in all these nuclear processes comes from. The end-of-module assessment brings all of this together.
