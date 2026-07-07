# Friction and the F ≤ μN model

Whenever two surfaces are in contact and one tends to slide (or is sliding) over the other, a resistive force called **friction** acts along the surface, opposing the relative motion or the *tendency* of relative motion.

:::callout{kind="key"}
Friction always acts **along the contact surface**, in the direction that opposes motion (or opposes the direction an object would move if it *could* move). It never acts perpendicular to the surface — that is the job of the **normal reaction** $N$.
:::

## Static and limiting friction

Push gently on a heavy box and it may not move at all: friction adjusts itself, up to a maximum, to balance the force you apply. This is **static friction** — the box is in equilibrium, and the friction force $F$ takes whatever value (between $0$ and its maximum) is needed to keep it that way.

As you push harder, $F$ grows to match, until it reaches its greatest possible value. At that point the box is on the point of slipping — this is called **limiting equilibrium**, and the friction is described as **limiting friction**. Push any harder and the box starts to move; once moving, friction still opposes the motion but is normally modelled as staying at this same limiting value (**kinetic friction**, modelled here as equal to limiting friction — the standard A-level assumption).

## The coefficient of friction

Experimentally, the maximum friction force between two surfaces is proportional to the normal reaction $N$ between them. The constant of proportionality is the **coefficient of friction**, $\mu$ (a property of the *pair* of surfaces, with no units, typically $0 < \mu < 1$ for ordinary materials, though it can exceed $1$).

:::callout{kind="key"}
**The limiting friction law:**

$$
F \le \mu N,
$$

with **equality**, $F = \mu N$, exactly when the object is in limiting equilibrium (on the point of slipping) or is actually sliding. If the object is safely in equilibrium and not on the point of moving, $F$ can be *anything* up to $\mu N$ — you find its actual value from the equilibrium equations, not from $\mu N$.
:::

A large $\mu$ (e.g. rubber on tarmac, $\mu \approx 0.7$) means surfaces grip strongly; a small $\mu$ (e.g. ice on ice, $\mu \approx 0.05$) means they slip easily. A **smooth** surface, used throughout earlier mechanics work, is the idealisation $\mu = 0$ — no friction at all.

## Finding the normal reaction

To use $F \le \mu N$ you first need $N$, found from the equilibrium of forces perpendicular to the surface.

- **Horizontal surface, no other vertical forces:** $N = mg$ (the normal reaction simply balances weight).
- **Inclined surface at angle $\theta$ to the horizontal:** resolving perpendicular to the slope, $N = mg\cos\theta$ (only the component of weight perpendicular to the surface is balanced by $N$; the component $mg\sin\theta$ acts down the slope).

::widget{type="step-reveal" src="steps/identifying-friction.json"}

:::reveal{title="Worked example: is the block moving?"}
A block of weight $50\,\text{N}$ rests on rough horizontal ground with $\mu = 0.4$. A horizontal force of $15\,\text{N}$ is applied. Does the block move?

**Normal reaction:** with no other vertical forces, $N = 50\,\text{N}$.

**Maximum available friction:** $F_{\max} = \mu N = 0.4 \times 50 = 20\,\text{N}$.

Since the applied force ($15\,\text{N}$) is **less than** the maximum available friction ($20\,\text{N}$), friction can balance it exactly. The block stays in equilibrium, with actual friction $F = 15\,\text{N}$ (not $20\,\text{N}$ — friction only rises to meet what is needed).

If the applied force were instead $25\,\text{N}$, it would exceed $F_{\max} = 20\,\text{N}$, friction could not hold it back, and the block would accelerate with resultant force $25 - 20 = 5\,\text{N}$.
:::

:::callout{kind="tip"}
A very common error is to assume $F = \mu N$ always. It is only true **at the point of slipping or while sliding**. If a body is in equilibrium and not stated to be on the point of moving, find $F$ from the equilibrium equations first, and only compare it with $\mu N$ to check the motion is actually possible.
:::

The next lesson puts a moving particle into this picture: once an object *is* sliding, friction takes its limiting value $\mu N$ and Newton's second law, $F = ma$, tells us how quickly it decelerates.
