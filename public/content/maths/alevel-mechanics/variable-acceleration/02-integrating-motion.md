# Integrating motion: from acceleration back to displacement

Differentiation took us **down** the chain $s \to v \to a$. Integration reverses each step and takes us back **up**: $a \to v \to s$. This is the natural tool whenever a problem gives you the acceleration (or velocity) as a function of time and asks about velocity (or displacement).

:::callout{kind="key"}
$$
v = \int a \,\mathrm{d}t, \qquad s = \int v \,\mathrm{d}t.
$$
Each integral introduces an **arbitrary constant of integration**. That constant is not arbitrary in a real problem — it is fixed by an **initial condition**, such as knowing the velocity or displacement at $t = 0$.
:::

## Why there is always a constant

Integration is the reverse of differentiation, but differentiating a constant always gives zero — so when we reverse the process we cannot know what constant was "lost". For example, $\dfrac{\mathrm{d}}{\mathrm{d}t}(t^2) = 2t$ and $\dfrac{\mathrm{d}}{\mathrm{d}t}(t^2 + 5) = 2t$ too. Given only $v = 2t$, integrating gives $s = t^2 + C$ for *some* constant $C$ — we need extra information (an initial position) to pin down which curve we mean. This is exactly analogous to SUVAT, where $u$ (the initial velocity) plays the role of a known starting condition.

## Worked example

A particle moves in a straight line. Its acceleration at time $t$ seconds is
$$
a = 6t - 4 \quad (\text{m s}^{-2}).
$$
When $t = 0$, the particle has velocity $3\,\text{m s}^{-1}$ and is at the origin, $s = 0$.

:::reveal{title="Worked example: finding v(t) and s(t) from a(t)"}
**Step 1 — integrate $a$ to find $v$.**
$$
v = \int (6t - 4)\,\mathrm{d}t = 3t^2 - 4t + C.
$$

**Step 2 — use the initial condition to find $C$.** At $t=0$, $v = 3$:
$$
3 = 3(0)^2 - 4(0) + C \;\Longrightarrow\; C = 3.
$$
So
$$
v = 3t^2 - 4t + 3.
$$

**Step 3 — integrate $v$ to find $s$.**
$$
s = \int (3t^2 - 4t + 3)\,\mathrm{d}t = t^3 - 2t^2 + 3t + D.
$$

**Step 4 — use the initial condition to find $D$.** At $t = 0$, $s = 0$:
$$
0 = 0 - 0 + 0 + D \;\Longrightarrow\; D = 0.
$$
So
$$
s = t^3 - 2t^2 + 3t.
$$

**Check by differentiating back.** $\dfrac{\mathrm{d}s}{\mathrm{d}t} = 3t^2 - 4t + 3 = v$ ✓, and $\dfrac{\mathrm{d}v}{\mathrm{d}t} = 6t - 4 = a$ ✓ — always verify an integration this way if you have time.

At $t = 2\,\text{s}$: $v = 3(4) - 4(2) + 3 = 12 - 8 + 3 = 7\,\text{m s}^{-1}$, and $s = 8 - 8 + 6 = 6\,\text{m}$.
:::

The two curves below show $v(t)$ and $s(t)$ for this example, so you can see how the velocity (a parabola, since it came from integrating a linear acceleration) builds up the cubic displacement.

::widget{type="data-plot" src="vt-st-example.json"}

## Definite integrals: displacement over an interval

If you only want the **change** in displacement between two times $t_1$ and $t_2$ (rather than the constant $D$), you can use a definite integral and skip finding $D$ entirely:
$$
s(t_2) - s(t_1) = \int_{t_1}^{t_2} v \,\mathrm{d}t.
$$
This is directly analogous to "area under a velocity-time graph equals displacement" from the constant-acceleration case — it is simply the generalisation of that area rule to a curved velocity-time graph, using integration instead of trapezium/rectangle geometry.

:::callout{kind="warning"}
A definite integral of $v$ gives **displacement** (which can be negative or partially cancel if the particle reverses direction), not total **distance travelled**. If the particle changes direction within the interval (i.e. $v$ changes sign), you must split the integral at the point(s) where $v = 0$ and add the absolute values of each piece to get total distance. We return to this in the next lesson.
:::

:::callout{kind="tip"}
"Integrate to go **up** the chain $a \to v \to s$, and always use the given initial condition (the value at a *specific* time, usually $t=0$) to pin down the constant — never leave a $+C$ unresolved in a final answer unless the question explicitly asks for the general solution."
:::

Next, we put both directions of the chain together to solve realistic multi-part problems: finding turning points, maximum displacement, and total distance travelled.
