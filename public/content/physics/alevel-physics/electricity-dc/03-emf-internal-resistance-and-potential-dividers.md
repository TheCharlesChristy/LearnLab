# EMF, internal resistance and potential dividers

So far every source has been treated as an ideal supply that delivers its full voltage no matter what is connected to it. Real cells and batteries fall short of this, and understanding why leads directly to one of the most useful circuit building blocks: the potential divider.

## EMF: the energy a source can give

The **electromotive force (emf)**, $\varepsilon$, of a source is the total electrical energy converted from other forms (chemical, in a cell) *per unit charge* driven round the whole circuit:

$$
\varepsilon = \frac{W}{Q}.
$$

Emf is measured in volts, just like pd — but it is a different quantity. Potential difference is energy transferred *between two points*; emf is the total energy supplied *per coulomb*, including the energy used up inside the source itself.

## Internal resistance and terminal pd

Every real source has some **internal resistance**, $r$ — due to the chemicals in a cell, or the wire in a power supply — and charge must be driven through it just like through any other resistor. If a source of emf $\varepsilon$ and internal resistance $r$ drives a current $I$ through an external resistance $R$:

$$
\varepsilon = I(R + r) = IR + Ir.
$$

The term $Ir$ is the **"lost volts"** — the pd used up pushing current through the source itself. What is left over to drive the external circuit is the **terminal potential difference**:

$$
V = \varepsilon - Ir.
$$

Note that $V = IR$ still holds for the external resistor, so both expressions for $V$ must agree.

:::callout{kind="key"}
A real battery's terminal pd *drops* as it supplies more current, because more current means more lost volts ($Ir$) inside it. This is why a car battery's headlights dim slightly the moment the starter motor draws a large current.
:::

:::reveal{title="Worked example: current, terminal pd and power with internal resistance"}
A battery has emf $\varepsilon = 9.0\,\text{V}$ and internal resistance $r = 0.50\,\Omega$. It is connected to an external resistor $R = 4.0\,\Omega$.

**Current:**
$$
I = \frac{\varepsilon}{R + r} = \frac{9.0}{4.0 + 0.50} = \frac{9.0}{4.5} = 2.0\,\text{A}.
$$

**Terminal pd:**
$$
V = \varepsilon - Ir = 9.0 - (2.0 \times 0.50) = 9.0 - 1.0 = 8.0\,\text{V}.
$$
(Check: $V = IR = 2.0 \times 4.0 = 8.0\,\text{V}$ — consistent.)

**Power dissipated in $R$:**
$$
P_R = I^2 R = (2.0)^2 \times 4.0 = 16\,\text{W}.
$$

**Power wasted inside the battery** ($I^2 r$) and the **total power delivered by the emf** ($\varepsilon I$) should also balance:
$$
P_r = I^2 r = (2.0)^2 \times 0.50 = 2.0\,\text{W}, \qquad P_{\text{total}} = \varepsilon I = 9.0 \times 2.0 = 18\,\text{W} = P_R + P_r.
$$
:::

## Potential dividers

A **potential divider** is two (or more) resistors in series across a supply, with the output taken from the junction between them. It is one of the most common building blocks in electronics — used to produce a chosen fraction of a supply voltage, or (with a thermistor or LDR in place of one resistor) to produce a voltage that varies with temperature or light level.

For two fixed resistors $R_1$ and $R_2$ in series across a supply $V_{\text{in}}$, with the output tapped across $R_2$:

$$
V_{\text{out}} = V_{\text{in}} \times \frac{R_2}{R_1 + R_2}.
$$

This follows directly from the series-circuit rules of the previous lesson: the same current $I = V_{\text{in}} / (R_1+R_2)$ flows through both resistors, and $V_{\text{out}} = IR_2$.

:::reveal{title="Worked example: potential divider output"}
A $10\,\text{V}$ supply is connected across resistors $R_1 = 2\,\text{k}\Omega$ and $R_2 = 8\,\text{k}\Omega$ in series, with the output taken across $R_2$.

$$
V_{\text{out}} = V_{\text{in}} \times \frac{R_2}{R_1 + R_2} = 10 \times \frac{8}{2 + 8} = 10 \times \frac{8}{10} = 8.0\,\text{V}.
$$

Making $R_2$ larger relative to $R_1$ pushes $V_{\text{out}}$ closer to the full supply voltage; making $R_2$ smaller relative to $R_1$ pushes $V_{\text{out}}$ towards zero.
:::

## Explore it: a live potential divider

Drag the sliders below to change the supply voltage and the two resistances, and watch $V_{\text{out}}$ update on the circuit diagram.

::py{src="items/potential-divider-explorer.py" params='{"vin": 12, "r1": 8, "r2": 4}' height=420}

:::callout{kind="tip"}
A potential divider's output depends only on the **ratio** $R_2 : (R_1+R_2)$, never on the absolute size of the resistors alone — doubling both $R_1$ and $R_2$ leaves $V_{\text{out}}$ unchanged (though it does change the current drawn from the supply).
:::

## Practice

::widget{type="quiz" src="assessment.json" pick=6}
