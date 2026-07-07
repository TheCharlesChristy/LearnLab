# Newton's laws and momentum

Kinematics (the previous two lessons) describes motion; **dynamics** explains what causes it. Newton's three laws of motion are the foundation.

## Newton's three laws

:::callout{kind="key"}
1. **First law:** an object remains at rest, or moving at constant velocity in a straight line, unless acted on by a resultant (net) external force. This is the property of **inertia**.
2. **Second law:** the resultant force on an object equals its rate of change of momentum. For an object of constant mass, this reduces to the familiar $F = ma$.
3. **Third law:** if object A exerts a force on object B, then object B exerts an equal and opposite force on object A. The two forces act on **different** objects, at the same instant, along the same line.
:::

A common misreading of the third law is to expect the two forces to cancel — they cannot, because they act on two different bodies. A table pushes up on a book with the same force the book pushes down on the table; the book stays still because *that* upward force is balanced by the book's own weight, a completely separate force acting on the book alone.

## Newton's second law in full: F = ma

Newton's second law, precisely, is

$$
F_{\text{net}} = \frac{\Delta p}{\Delta t}, \qquad p = mv \; (\text{momentum}).
$$

For constant mass this simplifies because $\Delta p = m\Delta v$, giving the version used throughout A-level mechanics:

$$
F_{\text{net}} = ma.
$$

$F_{\text{net}}$ must be the **resultant** of all forces acting — if several forces act on an object, add them as vectors first.

:::reveal{title="Worked example: a resultant force"}
A $4\,\text{kg}$ block on a frictionless horizontal surface has a $12\,\text{N}$ force applied to it. Find its acceleration.

Vertically, weight $mg = 4 \times 9.81 = 39.24\,\text{N}$ is balanced by the normal reaction, so there is no vertical acceleration — only the horizontal force matters here.

$$
a = \frac{F}{m} = \frac{12}{4} = 3\,\text{m s}^{-2}.
$$
:::

Try changing the mass and applied force below and watch the weight, normal reaction and computed acceleration update. Notice that only the horizontal force affects $a$: the vertical forces (weight and normal reaction) balance whenever the block stays on the surface.

::py{src="items/newtons-second-law.py" height=420}

## Momentum and its conservation

Momentum $p = mv$ is a vector, measured in $\text{kg m s}^{-1}$. Its importance comes from a conservation law:

:::callout{kind="key"}
**Conservation of momentum:** in any collision or interaction, provided no external resultant force acts on the system, the total momentum before equals the total momentum after.

$$
m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2.
$$
:::

This holds regardless of what happens to kinetic energy — momentum is conserved in **every** collision. Collisions are classified by what happens to kinetic energy:

- **Elastic collision:** kinetic energy is also conserved (no energy is converted to heat, sound, or permanent deformation). Common in idealised particle/gas collisions.
- **Inelastic collision:** kinetic energy is *not* conserved — some converts to other forms. Most everyday collisions are inelastic to some degree.
- **Perfectly inelastic collision:** a special inelastic case where the objects stick together and move off with one common velocity afterwards.

:::reveal{title="Worked example: a perfectly inelastic collision"}
A $3\,\text{kg}$ trolley moving at $4\,\text{m s}^{-1}$ collides with a stationary $2\,\text{kg}$ trolley, and they stick together. Find their common velocity afterwards, and compare kinetic energy before and after.

**Momentum before** $=$ **momentum after** (total mass $5\,\text{kg}$ moving at common velocity $v$):

$$
(3 \times 4) + (2 \times 0) = (3 + 2)v \;\Longrightarrow\; 12 = 5v \;\Longrightarrow\; v = 2.4\,\text{m s}^{-1}.
$$

**Kinetic energy before:**

$$
E_{k,\text{before}} = \tfrac{1}{2}(3)(4)^2 = \tfrac{1}{2}\times 3 \times 16 = 24\,\text{J}.
$$

**Kinetic energy after:**

$$
E_{k,\text{after}} = \tfrac{1}{2}(5)(2.4)^2 = \tfrac{1}{2}\times 5 \times 5.76 = 14.4\,\text{J}.
$$

Kinetic energy fell from $24\,\text{J}$ to $14.4\,\text{J}$ — a loss of $9.6\,\text{J}$, converted to heat and sound as the trolleys deform and lock together. Momentum, however, was conserved exactly: $12\,\text{kg m s}^{-1}$ both before and after. This is the signature of an inelastic (here, perfectly inelastic) collision.
:::

:::callout{kind="tip"}
When a question gives you "stick together" or "move off together", it is a perfectly inelastic collision: write momentum conservation with a single combined mass and a single final velocity, as above. When two separate final velocities are asked for, you need a second equation — for an elastic collision, that second equation is conservation of kinetic energy.
:::

With forces and momentum in hand, the final lesson turns to a different but closely related bookkeeping tool: energy.
