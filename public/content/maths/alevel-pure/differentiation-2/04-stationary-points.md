# Stationary points and curve sketching

A **stationary point** of a curve $y = f(x)$ is a point where the gradient is zero — the tangent is horizontal. These points are the peaks, troughs and "shoulders" that shape a curve's graph.

## Finding stationary points

At a stationary point, $f'(x) = 0$. To find them:

1. Differentiate $f(x)$ to get $f'(x)$.
2. Solve $f'(x) = 0$ for $x$.
3. Substitute each solution back into $f(x)$ to find the corresponding $y$-coordinate.

### Worked example

Find the stationary points of $y = x^3 - 3x^2 - 9x + 2$.

$$
\frac{\mathrm{d}y}{\mathrm{d}x} = 3x^2 - 6x - 9 = 3(x^2 - 2x - 3) = 3(x-3)(x+1).
$$

Setting $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 0$ gives $x = 3$ or $x = -1$.

- At $x = 3$: $y = 27 - 27 - 27 + 2 = -25$.
- At $x = -1$: $y = -1 - 3 + 9 + 2 = 7$.

So the stationary points are $(3, -25)$ and $(-1, 7)$.

## Classifying stationary points with the second derivative

Differentiating $f'(x)$ again gives the **second derivative**, $f''(x)$. Near a stationary point $x = a$:

$$
f''(a) > 0 \implies \text{local minimum}, \qquad
f''(a) < 0 \implies \text{local maximum}, \qquad
f''(a) = 0 \implies \text{inconclusive — investigate further (possible point of inflection).}
$$

:::callout{kind="key"}
Second-derivative test: at a stationary point, $f''(a) > 0$ means the curve is concave up (a minimum); $f''(a) < 0$ means concave down (a maximum). If $f''(a) = 0$, check the sign of $f'(x)$ either side of $a$ instead.
:::

### Worked example (continued)

For $y = x^3 - 3x^2 - 9x + 2$, we have $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 3x^2 - 6x - 9$, so

$$
\frac{\mathrm{d}^2y}{\mathrm{d}x^2} = 6x - 6.
$$

- At $x = 3$: $f''(3) = 18 - 6 = 12 > 0$, so $(3, -25)$ is a **local minimum**.
- At $x = -1$: $f''(-1) = -6 - 6 = -12 < 0$, so $(-1, 7)$ is a **local maximum**.

The grapher below plots this cubic; use the tangent tool near $x = -1$ and $x = 3$ to see the gradient pass through zero at each stationary point.

::widget{type="function-grapher" expr="x^3 - 3*x^2 - 9*x + 2" tangent=true xmin=-4 xmax=6 ymin=-30 ymax=15}

## Points of inflection

When $f''(a) = 0$, the point may be a **point of inflection** — where the curve changes concavity (from curving up to curving down, or vice versa) — rather than a maximum or minimum. A stationary point of inflection has $f'(a) = 0$ **and** $f''(a) = 0$, with $f'(x)$ having the *same* sign on both sides of $a$.

:::reveal{title="Worked example: y = x^3, a stationary point of inflection"}
For $y = x^3$: $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 3x^2$, so $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 0$ only at $x = 0$.

$$
\frac{\mathrm{d}^2y}{\mathrm{d}x^2} = 6x, \qquad \text{so } f''(0) = 0.
$$

The second derivative test is inconclusive, so check $f'(x) = 3x^2$ either side of $x=0$: it is positive for $x$ slightly less than $0$ *and* positive for $x$ slightly greater than $0$ (since squaring removes the sign). The gradient does not change sign, so $(0,0)$ is a **stationary point of inflection**, not a maximum or minimum.
:::

## Curve sketching

Combining everything from this module, a systematic curve sketch for $y = f(x)$ typically covers:

1. **Intercepts:** set $x = 0$ for the $y$-intercept; solve $f(x) = 0$ for $x$-intercepts (roots).
2. **Stationary points:** solve $f'(x) = 0$, then classify each with $f''(x)$.
3. **Behaviour for large $|x|$:** what does the curve do as $x \to \pm\infty$?
4. **Plot and connect:** mark the intercepts and stationary points, then join them consistently with the classifications found.

### Worked example

Sketch $y = x^3 - 3x^2 - 9x + 2$ using the results above.

- $y$-intercept: $x = 0 \Rightarrow y = 2$.
- Stationary points: local maximum at $(-1, 7)$, local minimum at $(3, -25)$ (found above).
- As $x \to \infty$, $y \to \infty$; as $x \to -\infty$, $y \to -\infty$ (odd-degree positive leading coefficient).

The curve rises from the bottom left, reaches a local maximum at $(-1,7)$, falls to a local minimum at $(3,-25)$, then rises again — matching the graph plotted above.

:::callout{kind="tip"}
Always state both coordinates of a stationary point (not just the $x$-value) and its classification (maximum, minimum, or point of inflection) — exam mark schemes usually require all three.
:::

## Practice

::widget{type="quiz" src="assessment.json" pick=6}

When you are ready, attempt the full end-of-module assessment.
