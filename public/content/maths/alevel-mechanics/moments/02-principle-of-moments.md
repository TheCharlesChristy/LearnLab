# The principle of moments

A rigid body is in **rotational equilibrium** — it does not start to spin — when the turning effects trying to rotate it one way exactly balance the turning effects trying to rotate it the other way. This is the **principle of moments**:

:::callout{kind="key"}
**Principle of moments.** For a rigid body in equilibrium, the sum of the clockwise moments about any point equals the sum of the anticlockwise moments about that *same* point.
:::

Crucially, the phrase "about any point" is doing real work: if a body is in full equilibrium, this balance holds about **every** choice of pivot, not just the physical hinge or support. Choosing a smart point — often one where an unknown force acts — makes that force's moment zero and removes it from the equation, which is usually the fastest route to a solution.

## A seesaw in balance

Two children sit on a seesaw pivoted at its centre. Child A, weighing $300\,\text{N}$, sits $1.5\,\text{m}$ from the pivot. Where must child B, weighing $250\,\text{N}$, sit on the other side for the seesaw to balance?

Taking moments about the pivot: child A's weight produces a moment turning the seesaw one way (say clockwise), and child B's weight must produce an equal moment the other way (anticlockwise).

$$
\underbrace{300 \times 1.5}_{\text{clockwise (A)}} = \underbrace{250 \times d_B}_{\text{anticlockwise (B)}}
\quad\Longrightarrow\quad
d_B = \frac{300 \times 1.5}{250} = \frac{450}{250} = 1.8\,\text{m}.
$$

Child B must sit $1.8\,\text{m}$ from the pivot.

## Centre of mass of a uniform rod

Many moments problems involve a rod or beam's own weight. For a **uniform** rod (or beam), the mass is spread evenly along its length, so its weight acts as a single force at its **midpoint** — the centre of mass. This is the modelling assumption you should state whenever a problem describes a rod, beam, plank or ladder as "uniform."

:::callout{kind="info"}
"Uniform" means constant mass per unit length. The consequence you'll use again and again: the weight of a uniform rod of length $L$ acts vertically downward through the point at distance $L/2$ from either end.
:::

## Worked example: a propped uniform rod

Follow the steps below for a complete worked example that combines the principle of moments with the centre of mass of a uniform rod.

::widget{type="step-reveal" src="steps/propped-rod.json"}

:::reveal{title="Same answer, different pivot"}
As a check, take moments instead about the far end of the rod (where the prop force $P$ acts), for the same setup: a uniform rod of length $4\,\text{m}$ and weight $50\,\text{N}$, hinged at one end, held horizontal by a vertical prop force $P$ at the other end.

Distance from this new pivot to the rod's weight is $4 - 2 = 2\,\text{m}$; distance to the hinge's reaction force is $4\,\text{m}$. Taking moments about the prop end:

$$
R_{\text{hinge}} \times 4 = 50 \times 2 \quad\Longrightarrow\quad R_{\text{hinge}} = 25\,\text{N}.
$$

By vertical equilibrium, $R_{\text{hinge}} + P = 50$, so $P = 50 - 25 = 25\,\text{N}$ — exactly the answer found by taking moments about the hinge. This is the point of the principle: **any** pivot gives a valid equation, and the answer never depends on which one you choose.
:::

The next lesson goes further: combining moment equilibrium *and* force equilibrium together to find every unknown reaction on a rigid body supported in more than one place.
