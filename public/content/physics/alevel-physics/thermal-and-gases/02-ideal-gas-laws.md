# The ideal gas laws

An ideal gas is a useful model in which molecules are treated as point particles that only interact during brief, perfectly elastic collisions. Real gases at everyday pressures and temperatures behave very close to this model, which is why a single equation can link pressure, volume, temperature and quantity so accurately.

## The ideal gas equation

For $n$ moles of an ideal gas:

$$
pV = nRT
$$

where $p$ is pressure in pascals (Pa), $V$ is volume in cubic metres (m³), $n$ is the amount of substance in moles, $T$ is the **absolute** temperature in kelvin, and $R = 8.31\,\text{J}\,\text{mol}^{-1}\,\text{K}^{-1}$ is the molar gas constant.

An equivalent form counts individual molecules $N$ instead of moles:

$$
pV = NkT
$$

where $k = 1.38\times10^{-23}\,\text{J}\,\text{K}^{-1}$ is the **Boltzmann constant**. Since $n = N / N_A$ (where $N_A$ is the Avogadro constant), the two forms are consistent provided $R = N_A k$.

:::reveal{title="Worked example: finding the amount of gas"}
A cylinder holds gas at a pressure of $1.5\times10^5\,\text{Pa}$, a volume of $0.030\,\text{m}^3$, and a temperature of $290\,\text{K}$. Find the number of moles present.

Rearranging $pV = nRT$:

$$
n = \frac{pV}{RT} = \frac{1.5\times10^5 \times 0.030}{8.31 \times 290} = \frac{4500}{2409.9} \approx 1.87\,\text{mol}.
$$
:::

## Boyle's, the pressure, and Charles's laws

Holding two of the three quantities $p$, $V$, $T$ fixed in $pV = nRT$ recovers three familiar laws, each just a special case of the same equation:

| Law             | Held constant | Relationship         |
| ---------------- | -------------- | --------------------- |
| Boyle's law       | $T$ (and $n$)  | $pV = \text{constant}$, so $p \propto \dfrac{1}{V}$ |
| Pressure law      | $V$ (and $n$)  | $\dfrac{p}{T} = \text{constant}$ |
| Charles's law     | $p$ (and $n$)  | $\dfrac{V}{T} = \text{constant}$ |

**Boyle's law** says that at fixed temperature, pressure and volume are inversely proportional: squeezing a fixed amount of gas into half the volume doubles its pressure. The graph of $p$ against $V$ at constant $T$ is a hyperbola — plotted below with $pV = 240$ (arbitrary units), i.e. $p = 240 / V$:

::widget{type="function-grapher" expr="240/x" xmin=1 xmax=12 grid=true}

:::callout{kind="tip"}
A graph of $p$ against $\dfrac{1}{V}$ (rather than against $V$) turns Boyle's law into a straight line through the origin — a useful way to check experimental data for the $pV=\text{constant}$ relationship.
:::

**The pressure law** applies when volume is fixed: heating a sealed, rigid container raises the pressure in direct proportion to the absolute temperature, $p/T = \text{constant}$, so $p_1/T_1 = p_2/T_2$.

**Charles's law** applies when pressure is fixed, for example a gas in a cylinder with a freely-moving piston: heating it makes it expand in direct proportion to the absolute temperature, $V/T = \text{constant}$, so $V_1/T_1 = V_2/T_2$.

:::reveal{title="Worked example: the pressure law"}
A fixed volume of gas is at a pressure of $1.0\times10^5\,\text{Pa}$ and a temperature of $300\,\text{K}$. It is heated at constant volume to $450\,\text{K}$. Find the new pressure.

Using $\dfrac{p_1}{T_1} = \dfrac{p_2}{T_2}$:

$$
p_2 = p_1 \times \frac{T_2}{T_1} = 1.0\times10^5 \times \frac{450}{300} = 1.5\times10^5\,\text{Pa}.
$$
:::

:::callout{kind="info"}
All three laws — and the full equation $pV = nRT$ — only work with **absolute** temperature in kelvin. Doubling a Celsius temperature does not double the absolute temperature, so it does not double $p$, $V$, or the product $pV$.
:::

The next lesson looks underneath these laws at the microscopic picture: what individual gas molecules are doing, and how their motion gives rise to pressure and temperature.
