# Integration by parts and the area between two curves

Substitution reverses the chain rule. **Integration by parts** reverses the **product rule**, and lets you integrate a genuine product of two different types of function, such as $x e^x$ or $x\sin(x)$.

## The formula

$$
\int u \, \frac{\mathrm{d}v}{\mathrm{d}x} \, \mathrm{d}x = uv - \int v \, \frac{\mathrm{d}u}{\mathrm{d}x} \, \mathrm{d}x.
$$

You choose which factor is $u$ and which is $\dfrac{\mathrm{d}v}{\mathrm{d}x}$. A good choice makes $\dfrac{\mathrm{d}u}{\mathrm{d}x}$ **simpler** than $u$ (so the remaining integral is easier), while $\dfrac{\mathrm{d}v}{\mathrm{d}x}$ must still be something you can integrate.

:::callout{kind="tip"}
A common mnemonic is **LATE** (Logarithmic, Algebraic, Trigonometric, Exponential) — prefer to choose $u$ from earlier in that list, since differentiating it tends to simplify things, e.g. for $x e^x$ choose $u = x$ (algebraic) and $\dfrac{\mathrm{d}v}{\mathrm{d}x} = e^x$ (exponential).
:::

## Worked example: $\displaystyle\int x e^x \, \mathrm{d}x$

Let $u = x$ and $\dfrac{\mathrm{d}v}{\mathrm{d}x} = e^x$, so $\dfrac{\mathrm{d}u}{\mathrm{d}x} = 1$ and $v = e^x$. Substituting into the formula:

$$
\int x e^x \, \mathrm{d}x = x e^x - \int e^x \cdot 1 \, \mathrm{d}x = xe^x - e^x + C.
$$

**Check by differentiating back:** by the product rule, $\dfrac{\mathrm{d}}{\mathrm{d}x}(xe^x - e^x) = (e^x + xe^x) - e^x = xe^x$, which matches the original integrand. ✓

## Worked example: $\displaystyle\int x \sin(x) \, \mathrm{d}x$

Let $u = x$ and $\dfrac{\mathrm{d}v}{\mathrm{d}x} = \sin(x)$, so $\dfrac{\mathrm{d}u}{\mathrm{d}x} = 1$ and $v = -\cos(x)$:

$$
\int x\sin(x)\,\mathrm{d}x = -x\cos(x) - \int (-\cos(x)) \cdot 1 \, \mathrm{d}x = -x\cos(x) + \sin(x) + C.
$$

**Check by differentiating back:** $\dfrac{\mathrm{d}}{\mathrm{d}x}\big(-x\cos x + \sin x\big) = \big(-\cos x + x\sin x\big) + \cos x = x\sin x$. ✓

::widget{type="step-reveal" src="steps/by-parts-example.json"}

## The area between two curves

To find the area of the region enclosed between two curves $y = f(x)$ and $y = g(x)$ between their intersection points $x=a$ and $x=b$ (with $f(x) \ge g(x)$ on $[a,b]$), integrate the **difference** of the two functions:

$$
\text{Area} = \int_a^b \big(f(x) - g(x)\big) \, \mathrm{d}x.
$$

This works because subtracting removes the "overlapping" area beneath the lower curve, leaving only the region strictly between them — it is equivalent to (area under the upper curve) − (area under the lower curve).

:::callout{kind="key"}
Always find the intersection points first (solve $f(x) = g(x)$) — these become your limits $a$ and $b$. Then check which curve is on top between them before subtracting, otherwise you can get a negative area.
:::

## Worked example: area between $y = x+2$ and $y = x^2$

First find where the curves meet: $x^2 = x + 2 \implies x^2 - x - 2 = 0 \implies (x-2)(x+1) = 0$, so $x = -1$ or $x = 2$.

Between $x=-1$ and $x=2$, the line $y=x+2$ lies above the parabola $y=x^2$ (check at $x=0$: line gives $2$, parabola gives $0$). So

$$
\text{Area} = \int_{-1}^{2} \big[(x+2) - x^2\big] \, \mathrm{d}x = \left[\frac{x^2}{2} + 2x - \frac{x^3}{3}\right]_{-1}^{2}.
$$

At $x=2$: $\frac{4}{2} + 4 - \frac{8}{3} = 2 + 4 - \frac{8}{3} = 6 - \frac{8}{3} = \frac{10}{3}$.

At $x=-1$: $\frac{1}{2} - 2 - \left(\frac{-1}{3}\right) = \frac{1}{2} - 2 + \frac{1}{3} = -\frac{7}{6}$.

$$
\text{Area} = \frac{10}{3} - \left(-\frac{7}{6}\right) = \frac{20}{6} + \frac{7}{6} = \frac{27}{6} = 4.5.
$$

The two functions are plotted separately below on the same $x$-range — compare them to see the enclosed region between $x=-1$ and $x=2$.

::widget{type="function-grapher" expr="x^2" xmin=-3 xmax=4 ymin=-2 ymax=10}

::widget{type="function-grapher" expr="x+2" xmin=-3 xmax=4 ymin=-2 ymax=10}

:::reveal{title="Worked example: area between a curve and the x-axis using a standard integral"}
Find the area between $y = \cos(x)$ and the line $y = 0$ (the $x$-axis) for $0 \le x \le \dfrac{\pi}{2}$.

Here $g(x) = 0$, so the area is simply $\displaystyle\int_0^{\pi/2} \cos(x) \, \mathrm{d}x = \Big[\sin(x)\Big]_0^{\pi/2} = \sin\left(\frac{\pi}{2}\right) - \sin(0) = 1 - 0 = 1$.

**Check by differentiating back:** $\dfrac{\mathrm{d}}{\mathrm{d}x}(\sin x) = \cos x$, confirming the antiderivative used. ✓
:::

## Practice

You have now met every technique in this module: standard integrals, substitution, integration by parts, and areas between curves. Attempt the end-of-module assessment to check your understanding.
