# Applications: turning points, extremes and multi-part problems

With both directions of the chain $s \leftrightarrow v \leftrightarrow a$ available, we can now answer the questions that make variable-acceleration problems distinctive: *when* is the particle at rest, *where* is displacement greatest, and how far does it *actually* travel if it changes direction along the way?

## Turning points of displacement

Displacement $s(t)$ has a stationary value (a local maximum or minimum) exactly when its gradient is zero — that is, when $v = 0$. This is the same idea as finding stationary points of any curve using $\dfrac{\mathrm{d}s}{\mathrm{d}t} = 0$, then using the second derivative (or a sign check either side) to classify it:

:::callout{kind="key"}
- $v = 0$ locates candidate turning points of displacement.
- If $\dfrac{\mathrm{d}v}{\mathrm{d}t} = a < 0$ at that instant, $s$ has a **local maximum** there (displacement is momentarily greatest before decreasing).
- If $a > 0$ at that instant, $s$ has a **local minimum** there.
- The same logic applies one level up: $a = 0$ locates candidate turning points (max/min) of the **velocity**.
:::

## Worked example: locating and classifying a maximum displacement

A particle moves so that its velocity, in $\text{m s}^{-1}$, at time $t$ seconds ($t \ge 0$) is
$$
v = 12t - 3t^2,
$$
and it starts at the origin, $s(0) = 0$.

::widget{type="function-grapher" expr="12*x-3*x^2" xmin=0 xmax=5 grid=true}

:::reveal{title="Worked example: maximum displacement and maximum speed"}
**Find $s(t)$.** Integrate $v$, using $s(0) = 0$ to fix the constant:
$$
s = \int (12t - 3t^2)\,\mathrm{d}t = 6t^2 - t^3 + D, \qquad s(0)=0 \Rightarrow D = 0,
$$
so $s = 6t^2 - t^3$.

**When is displacement stationary?** Set $v = 0$:
$$
12t - 3t^2 = 0 \;\Longrightarrow\; 3t(4 - t) = 0 \;\Longrightarrow\; t = 0 \text{ or } t = 4.
$$

**Classify $t = 4$.** Differentiate $v$ to get $a = 12 - 6t$. At $t = 4$: $a = 12 - 24 = -6 < 0$, so this is a **maximum** of $s$. The maximum displacement is
$$
s(4) = 6(4)^2 - 4^3 = 96 - 64 = 32\,\text{m}.
$$

**Maximum speed on $[0,4]$?** The velocity itself is stationary when $a = 0$:
$$
12 - 6t = 0 \;\Longrightarrow\; t = 2, \qquad v(2) = 12(2) - 3(2)^2 = 24 - 12 = 12\,\text{m s}^{-1}.
$$
Since $v$ is a downward parabola in $t$ (coefficient of $t^2$ is negative), $t=2$ gives the **maximum** velocity on this interval, $12\,\text{m s}^{-1}$.
:::

## Displacement versus distance travelled

If the velocity changes sign during the interval you care about, the particle reverses direction, and **total distance travelled is not the same as displacement**. Displacement is the net change in position; distance is the total length of path covered, so you must add up the size of each "leg" of the journey between direction changes.

:::reveal{title="Worked example: distance travelled when the particle reverses"}
A particle has velocity $v = 6t^2 - 30t + 24\;(\text{m s}^{-1})$ and starts at the origin, $s(0) = 0$. Find the distance travelled between $t=0$ and $t=5\,\text{s}$.

**Step 1 — find $s(t)$.**
$$
s = \int (6t^2 - 30t + 24)\,\mathrm{d}t = 2t^3 - 15t^2 + 24t + D, \qquad D = 0 \text{ (since } s(0)=0).
$$

**Step 2 — find when the particle reverses**, i.e. $v = 0$:
$$
6t^2 - 30t + 24 = 0 \;\Longrightarrow\; t^2 - 5t + 4 = 0 \;\Longrightarrow\; (t-1)(t-4) = 0 \;\Longrightarrow\; t = 1, 4.
$$
Both lie inside $[0,5]$, so the motion has **three** legs: $t\in[0,1]$, $t\in[1,4]$, $t\in[4,5]$.

**Step 3 — evaluate $s$ at each boundary.**
$$
s(0) = 0, \quad s(1) = 2 - 15 + 24 = 11, \quad s(4) = 128 - 240 + 96 = -16, \quad s(5) = 250 - 375 + 120 = -5.
$$

**Step 4 — length of each leg** (as positive distances):
$$
|s(1)-s(0)| = 11, \qquad |s(4)-s(1)| = |-16-11| = 27, \qquad |s(5)-s(4)| = |-5-(-16)| = 11.
$$

**Total distance** $= 11 + 27 + 11 = 49\,\text{m}$.

**Compare with displacement**, which is simply $s(5) - s(0) = -5\,\text{m}$ — the particle ends up $5\,\text{m}$ on the negative side of the origin, even though it travelled $49\,\text{m}$ in total. The two numbers are very different precisely because the particle changed direction twice.
:::

:::callout{kind="warning"}
Always check for sign changes of $v$ inside the interval before computing a definite integral for "distance". If you integrate straight through a sign change without splitting, the positive and negative areas will cancel and silently understate the true distance travelled.
:::

## Putting it all together

A typical exam-style question mixes several of these ideas in one scenario: differentiate to find velocity or acceleration, integrate (with an initial condition) to find displacement, solve $v=0$ or $a=0$ to locate special instants, and finally interpret the physical meaning (rest, direction reversal, maximum height, maximum speed) correctly. The self-test below draws on exactly this range of skills.

::widget{type="quiz" src="assessment.json"}

:::callout{kind="tip"}
Before touching any calculus, write down what you are given ($s$, $v$, or $a$, as a function of $t$) and what you are asked to find. That single step tells you immediately whether you need to differentiate (moving towards acceleration) or integrate (moving towards displacement) — and whether you will need an initial condition to fix a constant.
:::
