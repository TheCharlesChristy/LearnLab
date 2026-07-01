# Rigid bodies in equilibrium: combining forces and moments

A rigid body resting on two supports — a plank on two trestles, a footbridge on two piers, a diving board — is a genuinely two-equation problem. **Force equilibrium** alone (all forces balance) is not enough to find two unknown reactions; you also need **moment equilibrium** (turning effects balance). Together, they are always enough.

:::callout{kind="key"}
For a rigid body in equilibrium under coplanar forces, you may write:

1. **Resolve forces** (e.g. vertically): the sum of upward forces equals the sum of downward forces.
2. **Take moments** about any convenient point: sum of clockwise moments equals sum of anticlockwise moments.

Two independent equations are enough to find two unknowns.
:::

## A uniform beam on two supports

A uniform beam $AB$ has length $6\,\text{m}$ and weight $200\,\text{N}$, acting (since the beam is uniform) at its midpoint, $3\,\text{m}$ from $A$. The beam rests horizontally on two supports: one at $A$ ($x = 0$) and one at $C$, $4\,\text{m}$ from $A$. Find the reaction forces $R_A$ and $R_C$.

**Step 1 — take moments about $A$** (this eliminates $R_A$, since it acts at $A$ and has zero perpendicular distance from that point):

$$
R_C \times 4 = 200 \times 3 \quad\Longrightarrow\quad R_C = \frac{600}{4} = 150\,\text{N}.
$$

Wait — check this against vertical equilibrium before moving on.

**Step 2 — resolve vertically:**

$$
R_A + R_C = 200 \quad\Longrightarrow\quad R_A = 200 - 150 = 50\,\text{N}.
$$

:::reveal{title="Worked example: adding a person standing on the beam"}
Now suppose a person weighing $80\,\text{N}$ stands on the same beam at $x = 5\,\text{m}$ from $A$ (between $C$ and $B$). Find the new reactions $R_A$ and $R_C$.

Take moments about $A$ again, so $R_A$ still drops out:

$$
R_C \times 4 = 200 \times 3 + 80 \times 5 = 600 + 400 = 1000
\quad\Longrightarrow\quad
R_C = \frac{1000}{4} = 250\,\text{N}.
$$

Resolve vertically: total downward force is $200 + 80 = 280\,\text{N}$, so

$$
R_A = 280 - R_C = 280 - 250 = 30\,\text{N}.
$$

Both reactions are positive, confirming both supports genuinely push up on the beam (a negative reaction would mean that support would need to *pull down* — a sign the beam would lift off it).
:::

## How the reaction changes as the load moves

The plot below shows how $R_A$ (the reaction at the end support) changes as the $80\,\text{N}$ person walks from $A$ ($x=0$) to $B$ ($x=6$) along the same beam. As the person moves away from $A$ and towards $C$ and beyond, more of their weight is carried by $C$, so $R_A$ falls steadily.

::widget{type="data-plot" src="data/reaction-vs-position.json"}

Notice $R_A$ is a straight line in the load's position — this always happens for a single point load, because moments are linear in distance.

:::callout{kind="tip"}
**Sanity checks that catch mistakes fast:** (1) all reactions should come out positive for a beam resting on top of its supports; (2) the two reactions should sum to the total weight; (3) taking moments about a *different* point should give the same answer (as in the previous lesson) — always worth doing if you have time in an exam.
:::

Beams and seesaws are one application of the principle of moments. The next lesson tackles a classic, slightly trickier case: a ladder leaning against a wall, where the moment equation works alongside horizontal *and* vertical force equilibrium.
