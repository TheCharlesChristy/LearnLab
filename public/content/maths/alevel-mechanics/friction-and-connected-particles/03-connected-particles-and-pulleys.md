# Connected particles: strings, pulleys and simultaneous equations

Many mechanics problems involve **two particles joined by a string**, often passing over a pulley — one particle resting on a table, the other hanging freely; or two masses hanging on either side of a pulley. The string ties the motion of the two particles together, and that link is the key modelling idea of this lesson.

:::callout{kind="key"}
For a **light** (massless) and **inextensible** string passing over a **light, smooth** (frictionless) pulley:

- The tension $T$ is the **same throughout the string** (a massless string cannot have unbalanced forces on any segment; a smooth, light pulley changes the string's direction without changing its tension).
- Both particles move with the **same magnitude of acceleration** $a$ at every instant — the string cannot stretch, so if one particle speeds up, the other must speed up by exactly the same amount.
:::

## Setting up the two equations

Treat each particle **separately**, drawing its own force diagram, and apply $F = ma$ to each one individually — using the *same* symbols $T$ and $a$ in both equations is what lets you solve them together.

A classic arrangement: particle $A$ of mass $m_A$ sits on a rough horizontal table (coefficient of friction $\mu$), connected by a string over a smooth pulley at the edge of the table to particle $B$ of mass $m_B$, which hangs freely and pulls $A$ towards the pulley as it falls.

Work through the setup step by step:

::widget{type="step-reveal" src="steps/pulley-simultaneous-equations.json"}

## A fully worked example

:::reveal{title="Worked example: mass on a rough table, mass hanging"}
Particle $A$, mass $3\,\text{kg}$, lies on a rough horizontal table with $\mu = 0.2$. It is connected by a light inextensible string over a smooth pulley at the table's edge to particle $B$, mass $2\,\text{kg}$, hanging freely. The system is released from rest. Find the acceleration of the system and the tension in the string.

**Particle A** (perpendicular to the table): $N = m_Ag = 3 \times 9.81 = 29.43\,\text{N}$.

**Friction on A** (opposing its motion towards the pulley): $F = \mu N = 0.2 \times 29.43 = 5.886\,\text{N}$.

**Particle A** (along the table, direction of motion positive):

$$
T - F = m_A a \;\Longrightarrow\; T - 5.886 = 3a. \qquad (1)
$$

**Particle B** (vertically, downward positive):

$$
m_Bg - T = m_B a \;\Longrightarrow\; 2(9.81) - T = 2a \;\Longrightarrow\; 19.62 - T = 2a. \qquad (2)
$$

**Adding (1) and (2)** to eliminate $T$:

$$
19.62 - 5.886 = 5a \;\Longrightarrow\; 13.734 = 5a \;\Longrightarrow\; a = 2.747\,\text{m s}^{-2} \;(\text{3 d.p.}).
$$

**Substituting back into (2):**

$$
T = 19.62 - 2(2.747) = 19.62 - 5.494 = 14.13\,\text{N} \;(\text{3 s.f.}).
$$

**Check using (1):** $T = 3(2.747) + 5.886 = 8.240 + 5.886 = 14.13\,\text{N}$ ✓ — the two routes agree.
:::

:::callout{kind="tip"}
Adding the two equations is the standard trick because $T$ appears with **opposite signs** once you have chosen each particle's own direction of motion as positive: it drives $A$ forward but holds $B$ back. Adding cancels it immediately, leaving one equation in $a$ alone.
:::

## Two hanging masses (no friction)

The same method applies when both particles hang freely either side of a smooth pulley (an **Atwood machine**), with no table or friction involved. If $m_1 > m_2$, particle 1 falls and particle 2 rises, both with acceleration $a$:

$$
m_1g - T = m_1a, \qquad T - m_2g = m_2a.
$$

Adding: $m_1g - m_2g = (m_1+m_2)a$, so

$$
a = \frac{(m_1-m_2)g}{m_1+m_2}, \qquad T = \frac{2m_1m_2g}{m_1+m_2}.
$$

Notice that if $m_1 = m_2$ this correctly gives $a = 0$ (balanced) — a good check to keep in mind for any connected-particles answer.

## How the answer depends on the masses

The chart below sweeps the hanging mass $m_B$ (with $A$ fixed at $3\,\text{kg}$ on the table and $\mu = 0.2$ as before, but recomputed for a range of $m_B$ from $1\,\text{kg}$ to $8\,\text{kg}$) and plots both the resulting acceleration and tension.

::widget{type="data-plot" src="data/pulley-mass-sweep.json"}

:::callout{kind="info"}
Notice the acceleration is **not** proportional to $m_B$ — it levels off as $m_B$ grows, because a larger $m_B$ also adds more mass for the *same* net driving force to accelerate. At the smallest $m_B$ shown, the acceleration approaches zero: below a critical hanging mass, the friction on $A$ would be enough to prevent the system moving at all (limiting equilibrium, from the first lesson).
:::

You now have the complete toolkit for this module: identify whether friction is limiting or found from equilibrium, apply $F = ma$ to a single particle with friction, and — for connected particles — apply $F = ma$ separately to each particle before combining the equations using the shared $T$ and $a$.
