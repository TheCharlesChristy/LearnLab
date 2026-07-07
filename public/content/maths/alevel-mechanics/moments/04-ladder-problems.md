# A stretch topic: the ladder problem

The classic "ladder against a wall" problem is a favourite in A-level mechanics because it forces you to use **three** equilibrium equations together: two force resolutions and one moment equation. It is a natural capstone for everything in this module.

## Setting up the model

A uniform ladder $AB$ rests with its foot $A$ on rough horizontal ground and its top $B$ against a **smooth** (frictionless) vertical wall. Because the wall is smooth, it can only push the ladder horizontally — it exerts no vertical or frictional force. All of the ladder's weight is ultimately supported by the ground at $A$, which can push vertically (normal reaction) and can also resist sliding horizontally via **friction**.

The forces acting on the ladder are:

- Weight $W$, acting vertically downward at the ladder's midpoint (uniform ladder — centre of mass at the midpoint).
- Normal reaction $N_A$ from the ground at $A$, acting vertically upward.
- Friction $F_A$ from the ground at $A$, acting horizontally (toward the wall, preventing the foot sliding away).
- Normal reaction $N_B$ from the wall at $B$, acting horizontally (away from the wall).

:::callout{kind="info"}
A **smooth** surface in mechanics means frictionless: it can only exert a force perpendicular (normal) to itself. A **rough** surface can additionally exert a frictional force along the surface, opposing relative sliding (or impending sliding).
:::

## A worked example

A uniform ladder of weight $W = 200\,\text{N}$ has length $5\,\text{m}$. It rests with its foot on rough ground, $3\,\text{m}$ horizontally from the wall, and its top touching a smooth wall $4\,\text{m}$ above the ground — a $3$–$4$–$5$ right-angled triangle, so $\sin\theta = \tfrac{4}{5}$, $\cos\theta = \tfrac{3}{5}$ and $\tan\theta = \tfrac{4}{3}$, where $\theta$ is the angle the ladder makes with the ground.

:::reveal{title="Worked example: finding all three unknown forces"}
**Vertical equilibrium** (only $W$ and $N_A$ have vertical components, since the wall is smooth):

$$
N_A = W = 200\,\text{N}.
$$

**Horizontal equilibrium** (only $F_A$ and $N_B$ have horizontal components):

$$
F_A = N_B.
$$

**Moments about $A$** (this eliminates both $N_A$ and $F_A$, since both act at $A$):

The weight acts at the midpoint, a horizontal distance $\tfrac{3}{2} = 1.5\,\text{m}$ from $A$; its perpendicular distance from the *vertical* through $A$ is exactly this horizontal offset, so the weight's moment about $A$ is $W \times 1.5$. The wall's force $N_B$ is horizontal, acting at $B$, whose height above the ground is $4\,\text{m}$; the moment of a horizontal force about $A$ is $N_B \times (\text{height of } B) = N_B \times 4$.

$$
N_B \times 4 = W \times 1.5 = 200 \times 1.5 = 300 \quad\Longrightarrow\quad N_B = \frac{300}{4} = 75\,\text{N}.
$$

From horizontal equilibrium, $F_A = N_B = 75\,\text{N}$.

**Summary:** $N_A = 200\,\text{N}$, $N_B = 75\,\text{N}$, $F_A = 75\,\text{N}$.
:::

## The minimum coefficient of friction

The ladder can only stay in equilibrium if the ground can actually supply the required friction. If the coefficient of friction between the ladder and the ground is $\mu$, the maximum friction available is $\mu N_A$; equilibrium requires $F_A \le \mu N_A$, i.e.

$$
\mu \ge \frac{F_A}{N_A} = \frac{75}{200} = 0.375.
$$

So the ground must supply a coefficient of friction of at least $0.375$ for this ladder not to slip — any rougher ground is more than sufficient; anything smoother and the foot slides out.

:::callout{kind="tip"}
This is the standard shape of every ladder problem: resolve vertically, resolve horizontally, then take moments about the point where the *most* unknowns act (usually the foot) to isolate the wall's reaction in one equation. A full treatment of *when* a ladder slips (including a person climbing partway up it) belongs to a later module on friction — here, the goal is simply fluency with combining all three equilibrium equations on one rigid body.
:::

## Bringing it together

Across this module you have met the moment of a single force, the principle of moments for a body in rotational equilibrium, the centre of mass of a uniform rod, and full equilibrium of a rigid body under combined force and moment conditions — including the three-equation ladder problem. These are the tools you need for almost any statics problem in A-level mechanics. The end-of-module assessment checks all four ideas.
