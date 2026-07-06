# Temperature, specific heat capacity and latent heat

Thermal physics is about energy — where it lives inside matter, and how it moves when things get hotter or colder, or change from solid to liquid to gas.

## Temperature scales

Two temperature scales are used side by side in physics: the **Celsius scale** ($^\circ\text{C}$), fixed by the freezing and boiling points of water, and the **thermodynamic (Kelvin) scale** (K), which starts at **absolute zero** — the coldest temperature physically possible, at which a substance has the minimum internal energy allowed by quantum mechanics. The two scales use the same size of degree, so converting between them is just a shift:

$$
T(\text{K}) = T(^\circ\text{C}) + 273
$$

Absolute zero is $0\,\text{K} = -273\,^\circ\text{C}$. Kelvin is the scale that must be used in every gas-law and kinetic-theory calculation in this module — plugging in a Celsius temperature directly is one of the most common exam errors.

:::callout{kind="warning"}
Always convert to kelvin before using $T$ in an equation such as $pV = nRT$ or $\tfrac12 m\langle c^2\rangle = \tfrac32 kT$. A temperature of $0\,^\circ\text{C}$ is **not** zero energy — it is $273\,\text{K}$.
:::

## Internal energy

The **internal energy** of a system is the sum of the randomly distributed kinetic and potential energies of all the particles that make up the system:

- **Random kinetic energy** — particles vibrate, rotate, or move about randomly; faster random motion means a higher temperature.
- **Random potential energy** — energy stored in the bonds and separations between particles, which changes when a substance changes state (e.g. melting) without vibrating any faster.

Heating a substance transfers energy to it, but that energy does not always show up as a temperature rise — sometimes it goes entirely into potential energy during a change of state, as you'll see below.

## Specific heat capacity

While a substance stays in one phase (solid, liquid or gas), supplying energy raises its temperature. The **specific heat capacity** $c$ of a material is the energy required to raise the temperature of $1\,\text{kg}$ of it by $1\,\text{K}$ (equivalently $1\,^\circ\text{C}$, since the scales have equal-sized degrees). For a mass $m$ undergoing a temperature change $\Delta T$:

$$
Q = mc\Delta T
$$

where $Q$ is the energy transferred in joules, $m$ is in kilograms, $c$ is in $\text{J}\,\text{kg}^{-1}\,\text{K}^{-1}$, and $\Delta T$ is in kelvin (or, equivalently, degrees Celsius, since a change of $1\,\text{K}$ equals a change of $1\,^\circ\text{C}$). Water has an unusually large specific heat capacity, $c_{\text{water}} = 4200\,\text{J}\,\text{kg}^{-1}\,\text{K}^{-1}$, which is why it is used in heating systems and why coastal climates change temperature slowly.

Try the calorimetry problem below: two masses of water at different temperatures are mixed in an insulated container, so no energy escapes. By conservation of energy, the heat lost by the hot water equals the heat gained by the cold water.

::widget{type="code-runner" language="python" starter="m1 = 0.20  # kg of hot water\nT1 = 80.0  # degC\nm2 = 0.30  # kg of cold water\nT2 = 15.0  # degC\nc = 4200   # J/(kg K), specific heat capacity of water\n\n# Conservation of energy (insulated container):\n# heat lost by hot water = heat gained by cold water\n# m1*c*(T1 - Tf) = m2*c*(T2 - Tf)\nTf = (m1 * T1 + m2 * T2) / (m1 + m2)\nprint(f'Final temperature = {Tf} degC')" solutionTest="assert abs(Tf - 41.0) < 0.1" rows=12}

:::reveal{title="Worked example: ice to steam"}
Calculate the total energy needed to convert $0.20\,\text{kg}$ of ice at $-10\,^\circ\text{C}$ completely into steam at $100\,^\circ\text{C}$.

Data: $c_{\text{ice}} = 2100\,\text{J}\,\text{kg}^{-1}\,\text{K}^{-1}$, $c_{\text{water}} = 4200\,\text{J}\,\text{kg}^{-1}\,\text{K}^{-1}$, specific latent heat of fusion $L_f = 3.34\times10^5\,\text{J}\,\text{kg}^{-1}$, specific latent heat of vaporisation $L_v = 2.26\times10^6\,\text{J}\,\text{kg}^{-1}$.

There are four stages, and the temperature only rises during the first and third:

1. Heat ice from $-10\,^\circ\text{C}$ to $0\,^\circ\text{C}$: $Q_1 = mc_{\text{ice}}\Delta T = 0.20 \times 2100 \times 10 = 4200\,\text{J}$.
2. Melt the ice at $0\,^\circ\text{C}$ (temperature constant): $Q_2 = mL_f = 0.20 \times 3.34\times10^5 = 66\,800\,\text{J}$.
3. Heat the water from $0\,^\circ\text{C}$ to $100\,^\circ\text{C}$: $Q_3 = mc_{\text{water}}\Delta T = 0.20 \times 4200 \times 100 = 84\,000\,\text{J}$.
4. Boil the water at $100\,^\circ\text{C}$ (temperature constant): $Q_4 = mL_v = 0.20 \times 2.26\times10^6 = 452\,000\,\text{J}$.

Total energy: $Q = Q_1 + Q_2 + Q_3 + Q_4 = 4200 + 66\,800 + 84\,000 + 452\,000 = 607\,000\,\text{J} = 607\,\text{kJ}$.
:::

## Specific latent heat

A **change of state** (melting/freezing, boiling/condensing) happens at a constant temperature: every joule supplied breaks intermolecular bonds (increasing potential energy) rather than speeding the particles up, so the thermometer does not move until the change of state is complete. The energy needed per unit mass to change state is the **specific latent heat** $L$:

$$
Q = mL
$$

There are two kinds: the **specific latent heat of fusion** $L_f$ (melting/freezing) and the **specific latent heat of vaporisation** $L_v$ (boiling/condensing). $L_v$ is always much larger than $L_f$ for the same substance, because vaporisation must separate particles completely (breaking essentially all the intermolecular bonds), while melting only needs to loosen the rigid structure of a solid.

:::callout{kind="key"}
During a change of state, temperature is constant even though energy is still being transferred. A temperature–time graph for steady heating shows flat plateaus at the melting point and the boiling point.
:::

The next lesson turns to gases, where the relationship between pressure, volume and temperature is captured by the ideal gas law.
