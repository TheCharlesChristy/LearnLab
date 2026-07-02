# Current, potential difference and Ohm's law

Every circuit is a story about charge on the move, and the energy that moves with it. This lesson builds the four quantities you will use in every calculation from here on: current, charge, potential difference and resistance — and the law (Ohm's law) that links them for the simplest components.

## Electric current and charge

**Electric current**, $I$, is the rate of flow of charge:

$$
I = \frac{\Delta Q}{\Delta t}.
$$

Current is measured in **amperes (A)**, where $1\,\text{A} = 1\,\text{C s}^{-1}$. Rearranging gives the charge that has flowed in a time $t$ at a (constant) current $I$:

$$
Q = It.
$$

:::callout{kind="info"}
By convention, current is taken to flow from the positive terminal of a source to the negative terminal round an external circuit — **conventional current**. In a metal the charge carriers are electrons, which actually drift the other way, but every circuit law in this course is stated in terms of conventional current.
:::

## Potential difference

The **potential difference (pd)** between two points is the energy transferred *per unit charge* as charge moves between them:

$$
V = \frac{W}{Q}.
$$

Potential difference is measured in **volts (V)**, where $1\,\text{V} = 1\,\text{J C}^{-1}$. A pd of $6\,\text{V}$ across a lamp means that $6$ joules of electrical energy are transferred to the lamp for every coulomb of charge that passes through it.

:::reveal{title="Worked example: charge and energy"}
A charger delivers a current of $3.0\,\text{A}$ for $40\,\text{s}$. How much charge flows, and how much energy is transferred if the pd across the device is $5.0\,\text{V}$?

**Charge:**
$$
Q = It = 3.0 \times 40 = 120\,\text{C}.
$$

**Energy:** rearrange $V = W/Q$ to get $W = VQ$:
$$
W = 5.0 \times 120 = 600\,\text{J}.
$$
:::

## Ohm's law and resistance

**Resistance** is defined for any component as

$$
R = \frac{V}{I},
$$

measured in **ohms ($\Omega$)**, where $1\,\Omega = 1\,\text{V A}^{-1}$. This definition applies to *any* conductor, ohmic or not.

**Ohm's law** is the extra, experimental statement that for a metallic conductor at constant temperature, current is directly proportional to potential difference:

$$
V = IR, \qquad R = \text{constant}.
$$

A component that obeys this — a fixed resistor at constant temperature — is called **ohmic**. Its $I$–$V$ graph is a straight line through the origin. Many real components are **not** ohmic: a filament lamp's resistance rises sharply as it heats up (its $I$–$V$ graph curves over), and a diode conducts almost no current at all until a threshold voltage is reached.

:::callout{kind="key"}
Ohm's law is a special case, not a universal law: $V = IR$ always defines resistance, but resistance is only *constant* — and the graph only a straight line — when physical conditions, especially temperature, are held constant.
:::

The graph below shows the $I$–$V$ line for an ohmic resistor of $R = 5\,\Omega$ (plotted with current $I$ on the horizontal axis and $V = IR$ on the vertical axis):

::widget{type="function-grapher" expr="5*x" xmin=0 xmax=6 ymin=0 ymax=30 grid=true}

## Resistivity

Resistance depends on what a conductor is made of *and* on its shape. **Resistivity**, $\rho$, is the material property alone, defined by

$$
R = \frac{\rho L}{A},
$$

where $L$ is the conductor's length and $A$ its cross-sectional area. Resistivity is measured in **ohm-metres ($\Omega\,\text{m}$)**. A long, thin wire has more resistance than a short, fat one of the same material — this formula makes that precise.

:::reveal{title="Worked example: resistance, current and power from resistivity"}
A nichrome heating wire has length $L = 2.0\,\text{m}$, cross-sectional area $A = 2.0 \times 10^{-7}\,\text{m}^2$, and resistivity $\rho = 1.10 \times 10^{-6}\,\Omega\,\text{m}$. It is connected across a $6.0\,\text{V}$ supply.

**Resistance:**
$$
R = \frac{\rho L}{A} = \frac{1.10 \times 10^{-6} \times 2.0}{2.0 \times 10^{-7}} = 11\,\Omega.
$$

**Current:**
$$
I = \frac{V}{R} = \frac{6.0}{11} = 0.545\,\text{A} \ (\text{3 s.f.}).
$$

**Power dissipated:**
$$
P = VI = 6.0 \times 0.545 = 3.27\,\text{W} \ (\text{3 s.f.}).
$$
:::

## Electrical power and energy

Power is the rate of transfer of energy. Combining $P = VI$ with $V = IR$ gives three equivalent forms, all worth knowing by heart:

$$
P = IV = I^2 R = \frac{V^2}{R}.
$$

Energy transferred in a time $t$ at constant power is

$$
E = Pt = IVt.
$$

| Quantity | Symbol | Unit |
| --- | --- | --- |
| Current | $I$ | ampere (A) |
| Charge | $Q$ | coulomb (C) |
| Potential difference | $V$ | volt (V) |
| Resistance | $R$ | ohm ($\Omega$) |
| Resistivity | $\rho$ | ohm-metre ($\Omega\,\text{m}$) |
| Power | $P$ | watt (W) |
| Energy | $E$ | joule (J) |

:::callout{kind="tip"}
Pick whichever power formula avoids a quantity you don't have. If you know $I$ and $R$ but not $V$, use $P = I^2R$ rather than finding $V$ first and using $P = IV$ — fewer steps, fewer chances to make an arithmetic slip.
:::

## Practice

Try the questions below to check your understanding before moving on to how these ideas combine in series and parallel circuits.

::widget{type="quiz" src="assessment.json" pick=5}
