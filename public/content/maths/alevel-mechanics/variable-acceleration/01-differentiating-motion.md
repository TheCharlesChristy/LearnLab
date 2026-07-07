# Differentiating motion: from displacement to acceleration

In *Kinematics — Motion with Constant Acceleration* every problem had a fixed, constant acceleration, so the five SUVAT equations were enough. Real motion is often not like that: a car's acceleration changes as the driver eases off the throttle, a rocket's acceleration grows as it burns fuel, a rollercoaster speeds up and slows down continuously. Whenever the acceleration is a **function of time** rather than a constant, SUVAT no longer applies and we need calculus instead.

:::callout{kind="key"}
If displacement is given as a function of time, $s(t)$, then
$$
v = \frac{\mathrm{d}s}{\mathrm{d}t}, \qquad a = \frac{\mathrm{d}v}{\mathrm{d}t} = \frac{\mathrm{d}^2s}{\mathrm{d}t^2}.
$$
Velocity is the first derivative of displacement; acceleration is the second derivative of displacement, or the first derivative of velocity. This holds **whether or not** the acceleration is constant — SUVAT is just the special case where $a$ happens not to depend on $t$.
:::

## Why this generalises SUVAT

You already know that on a displacement-time graph the gradient is the velocity, and on a velocity-time graph the gradient is the acceleration. Differentiation is exactly the tool that finds a gradient at an instant, so it applies to *any* smooth motion, not only the straight-line and parabolic graphs produced by constant acceleration. In A-level mechanics, $s$, $v$ and $a$ are almost always given as **polynomials in $t$**, so the power rule you met in differentiation is all you need:

$$
\text{if } s = t^n \text{ then } \frac{\mathrm{d}s}{\mathrm{d}t} = nt^{n-1}.
$$

Differentiate term by term, exactly as with any polynomial.

## Worked example

A particle moves along a straight line so that its displacement from a fixed point $O$, in metres, at time $t$ seconds is
$$
s = t^3 - 6t^2 + 9t.
$$

::widget{type="function-grapher" expr="x^3-6*x^2+9*x" xmin=0 xmax=4 grid=true}

The graph shows $s$ against $t$ (the horizontal axis plays the role of $t$). Notice it rises, turns, falls, turns again and rises — exactly the shape we'd expect if the velocity changes sign twice.

:::reveal{title="Worked example: velocity, acceleration and when the particle is at rest"}
**Velocity.** Differentiate $s$ term by term using the power rule:
$$
v = \frac{\mathrm{d}s}{\mathrm{d}t} = 3t^2 - 12t + 9.
$$

**Acceleration.** Differentiate again:
$$
a = \frac{\mathrm{d}v}{\mathrm{d}t} = 6t - 12.
$$

**When is the particle instantaneously at rest?** Set $v = 0$:
$$
3t^2 - 12t + 9 = 0 \;\Longrightarrow\; t^2 - 4t + 3 = 0 \;\Longrightarrow\; (t-1)(t-3) = 0,
$$
so $t = 1$ or $t = 3$ seconds.

**Position and acceleration at those instants.**

At $t = 1$: $\;s = 1^3 - 6(1)^2 + 9(1) = 1 - 6 + 9 = 4\,\text{m}$, and $a = 6(1) - 12 = -6\,\text{m s}^{-2}$.

At $t = 3$: $\;s = 3^3 - 6(3)^2 + 9(3) = 27 - 54 + 27 = 0\,\text{m}$, and $a = 6(3) - 12 = 6\,\text{m s}^{-2}$.

Since the acceleration is non-zero at both instants, the particle is not permanently at rest — it momentarily stops and reverses direction each time (a negative acceleration while $v=0$ means it is about to move backwards; a positive acceleration means it is about to move forwards again).
:::

## A note on units and interpretation

- Differentiating $s$ (metres) with respect to $t$ (seconds) once gives units of $\text{m s}^{-1}$ (velocity); differentiating twice gives $\text{m s}^{-2}$ (acceleration) — the units fall out automatically because differentiation is a rate with respect to time.
- A common error is to stop at $v$ when a question asks for acceleration, or to forget that "instantaneously at rest" means $v = 0$, **not** $s = 0$ (the particle can be at rest away from the origin, as in the example above).
- Just as with SUVAT, direction matters: a negative $v$ means moving in the negative direction, and a negative $a$ means the velocity is decreasing (which is *deceleration* only while $v>0$).

:::callout{kind="tip"}
"Differentiate to go **down** the chain $s \to v \to a$." Keep the chain in mind — most exam questions tell you where you are starting (often $s$ or $v$) and where they want you to go, and differentiation is the tool whenever you are moving from position towards acceleration.
:::

The reverse question — given the acceleration, find the velocity and displacement — needs the opposite operation: integration. That is the subject of the next lesson.
