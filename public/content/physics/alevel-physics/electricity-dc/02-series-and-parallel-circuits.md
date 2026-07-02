# Series and parallel circuits

Real circuits combine components in two basic ways — **series** (one after another, forming a single loop) and **parallel** (side by side, forming separate branches). Each arrangement has its own simple rules for current, potential difference and total resistance, and every more complicated network can be broken down into series and parallel pieces.

## Series circuits: same current, shared pd

In a **series** circuit there is only one path for charge to flow, so:

- The **current is the same** at every point of the circuit (charge has nowhere else to go).
- The **potential differences share out**: the source pd equals the sum of the pds across each component, $V = V_1 + V_2 + \dots$
- The **total resistance is the sum** of the individual resistances:

$$
R_{\text{total}} = R_1 + R_2 + R_3 + \dots
$$

:::callout{kind="key"}
Series rule of thumb: current is shared *equally* (it's the same everywhere), pd is shared *proportionally* to resistance ($V_i = IR_i$), and resistances simply add.
:::

## Parallel circuits: same pd, shared current

In a **parallel** circuit each branch connects the same two points, so:

- The **potential difference is the same** across every branch (they all span the same two points).
- The **current splits** between branches: the total current equals the sum of the branch currents, $I = I_1 + I_2 + \dots$
- The **total resistance is found from the reciprocal rule**, and is always *less* than the smallest individual branch resistance (extra branches make it easier for charge to flow, not harder):

$$
\frac{1}{R_{\text{total}}} = \frac{1}{R_1} + \frac{1}{R_2} + \frac{1}{R_3} + \dots
$$

For exactly two resistors in parallel this simplifies to the handy "product over sum" form: $R_{\text{total}} = \dfrac{R_1 R_2}{R_1 + R_2}$.

| | Series | Parallel |
| --- | --- | --- |
| Current | same everywhere | shares out between branches |
| Potential difference | shares out between components | same across every branch |
| Total resistance | $R_{\text{total}} = \sum R_i$ (always bigger than the largest $R_i$) | $\dfrac{1}{R_{\text{total}}} = \sum \dfrac{1}{R_i}$ (always smaller than the smallest $R_i$) |

:::reveal{title="Worked example: a series circuit and a parallel circuit"}
**Series.** Resistors of $2\,\Omega$, $3\,\Omega$ and $5\,\Omega$ are connected in series across a $20\,\text{V}$ battery.

$$
R_{\text{total}} = 2 + 3 + 5 = 10\,\Omega, \qquad I = \frac{V}{R_{\text{total}}} = \frac{20}{10} = 2.0\,\text{A}.
$$

The same $2.0\,\text{A}$ flows through all three, so the pd across each is $V_i = IR_i$:
$$
V_1 = 2.0 \times 2 = 4\,\text{V}, \quad V_2 = 2.0 \times 3 = 6\,\text{V}, \quad V_3 = 2.0 \times 5 = 10\,\text{V}.
$$
Check: $4 + 6 + 10 = 20\,\text{V}$ — matches the supply, as it must.

**Parallel.** Resistors of $6\,\Omega$ and $12\,\Omega$ are connected in parallel across a $12\,\text{V}$ battery.

$$
\frac{1}{R_{\text{total}}} = \frac{1}{6} + \frac{1}{12} = \frac{2}{12} + \frac{1}{12} = \frac{3}{12} = \frac{1}{4} \;\Rightarrow\; R_{\text{total}} = 4\,\Omega.
$$

Both branches see the full $12\,\text{V}$:
$$
I_1 = \frac{12}{6} = 2.0\,\text{A}, \qquad I_2 = \frac{12}{12} = 1.0\,\text{A}.
$$
Check: $I_{\text{total}} = I_1 + I_2 = 3.0\,\text{A}$, and indeed $V / R_{\text{total}} = 12 / 4 = 3.0\,\text{A}$.
:::

## Combining series and parallel

Bigger networks are handled by simplifying one piece at a time: reduce a parallel group to its single equivalent resistance, then treat that as one resistor in the surrounding series chain (or vice versa).

:::reveal{title="Worked example: a mixed network"}
A resistor $R_1 = 4\,\Omega$ is in series with a parallel combination of $R_2 = 6\,\Omega$ and $R_3 = 3\,\Omega$. The whole network is connected across a $12\,\text{V}$ supply.

**Step 1 — reduce the parallel pair:**
$$
R_{23} = \frac{R_2 R_3}{R_2 + R_3} = \frac{6 \times 3}{6 + 3} = \frac{18}{9} = 2\,\Omega.
$$

**Step 2 — add the series resistor:**
$$
R_{\text{total}} = R_1 + R_{23} = 4 + 2 = 6\,\Omega.
$$

**Step 3 — total current from the supply:**
$$
I_{\text{total}} = \frac{V}{R_{\text{total}}} = \frac{12}{6} = 2.0\,\text{A}.
$$

**Step 4 — split the current across the parallel branches.** The pd across the parallel pair is $V_{23} = I_{\text{total}} R_{23} = 2.0 \times 2 = 4.0\,\text{V}$, so:
$$
I_2 = \frac{V_{23}}{R_2} = \frac{4.0}{6} = 0.667\,\text{A}, \qquad I_3 = \frac{V_{23}}{R_3} = \frac{4.0}{3} = 1.33\,\text{A}.
$$
Check: $I_2 + I_3 = 2.0\,\text{A} = I_{\text{total}}$. Also $V_1 = I_{\text{total}} R_1 = 2.0 \times 4 = 8.0\,\text{V}$, and $V_1 + V_{23} = 8.0 + 4.0 = 12\,\text{V}$ — matches the supply.
:::

## Try it: compute a network in code

The Python cell below sets up exactly the mixed network from the worked example above. Run it, then edit the resistor values or the supply voltage and re-run to see how the answers change.

::widget{type="code-runner" language="python" starter="# R1 in series with (R2 parallel R3), across supply voltage V\nR1 = 4\nR2 = 6\nR3 = 3\nV = 12\n\nR23 = (R2 * R3) / (R2 + R3)\nR_total = R1 + R23\nI_total = V / R_total\nV23 = I_total * R23\nI2 = V23 / R2\nI3 = V23 / R3\n\nprint(f\"R23 (parallel part) = {R23} ohm\")\nprint(f\"R_total = {R_total} ohm\")\nprint(f\"I_total = {I_total} A\")\nprint(f\"I2 = {I2:.3f} A, I3 = {I3:.3f} A\")" solutionTest="assert abs(R23 - 2.0) < 1e-9, 'R23 should be 2 ohm for the default values'\nassert abs(R_total - 6.0) < 1e-9, 'R_total should be 6 ohm for the default values'\nassert abs(I_total - 2.0) < 1e-9, 'I_total should be 2.0 A for the default values'\nassert abs((I2 + I3) - I_total) < 1e-9, 'the branch currents should add back up to the total current'" rows=14}

## Practice

::widget{type="quiz" src="assessment.json" pick=5}
