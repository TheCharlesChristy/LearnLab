# Solving trig equations and the harmonic form

In this final lesson we use the identities from the previous two lessons to solve trigonometric equations over a given interval — finding **every** solution, not just one — and meet a powerful technique for equations involving both $\sin x$ and $\cos x$: the harmonic form.

## Solving equations: finding all solutions in an interval

Trig functions are periodic, so an equation like $\sin x = \tfrac12$ has infinitely many solutions in general. A question will restrict you to an interval (e.g. $0° \le x \le 360°$, or $0 \le x \le 2\pi$), and you must find **every** solution inside it — this is the single most common source of lost marks in this topic.

The method:

1. Find one solution using inverse functions (a calculator gives the *principal value*).
2. Use the symmetry of the graph (or the CAST diagram) to find every other solution in one full period.
3. Add or subtract multiples of the period until you have covered the whole given interval, discarding any solutions that fall outside it.

:::callout{kind="key"}
Over $0°$ to $360°$: for $\sin x = k$ ($k>0$) the two solutions are the principal value $x_1$ and $180° - x_1$. For $\cos x = k$ the two solutions are $x_1$ and $360° - x_1$. For $\tan x = k$ the two solutions are $x_1$ and $x_1 + 180°$. Always check whether the interval given produces two, one, or more solutions once periodicity is accounted for.
:::

:::reveal{title="Worked example: quadratic in sin x"}
Solve $2\sin^2x - \sin x - 1 = 0$ for $0° \le x \le 360°$.

This factorises as a quadratic in $\sin x$: let $s = \sin x$.

$$
2s^2 - s - 1 = 0 \implies (2s+1)(s-1) = 0 \implies s = -\tfrac12 \text{ or } s = 1.
$$

**Case $\sin x = 1$:** the only solution in $[0°,360°]$ is $x = 90°$.

**Case $\sin x = -\tfrac12$:** the principal value is $x_1 = -30°$ (outside the interval), so we use the sine graph's symmetry. Since sine is negative in the third and fourth quadrants, the solutions in $[0°,360°]$ are $180°+30°=210°$ and $360°-30°=330°$.

**All solutions:** $x = 90°,\ 210°,\ 330°$.

*Check:* substituting $x=210°$: $\sin(210°)=-\tfrac12$, so $2(-\tfrac12)^2-(-\tfrac12)-1 = 2(\tfrac14)+\tfrac12-1 = \tfrac12+\tfrac12-1=0$ ✓. The other two solutions check out the same way.
:::

:::reveal{title="Worked example: using a double angle formula first"}
Solve $\cos(2x) = \sin x$ for $0° \le x \le 360°$.

The equation mixes $\cos(2x)$ and $\sin x$, so first rewrite $\cos(2x)$ in terms of $\sin x$ using $\cos(2x) = 1-2\sin^2x$:

$$
1 - 2\sin^2x = \sin x \implies 2\sin^2x + \sin x - 1 = 0 \implies (2\sin x - 1)(\sin x+1) = 0.
$$

So $\sin x = \tfrac12$ or $\sin x = -1$.

**Case $\sin x=\tfrac12$:** principal value $30°$; sine positive in quadrants 1 and 2, so $x = 30°$ or $x=150°$.

**Case $\sin x=-1$:** only solution in the interval is $x=270°$.

**All solutions:** $x = 30°,\ 150°,\ 270°$.
:::

## Solving equations that mix sin and cos: the harmonic form

Some equations, such as $3\sin x + 4\cos x = 2$, cannot be solved by the methods above because they mix $\sin x$ and $\cos x$ with different coefficients and no obvious identity applies directly. The **harmonic form** rewrites $a\sin x + b\cos x$ as a single sinusoid $R\sin(x+\alpha)$ (or $R\cos(x-\alpha)$), which can then be solved like any single-function trig equation.

We want constants $R>0$ and $0°<\alpha<90°$ such that, for all $x$,

$$
a\sin x + b\cos x \equiv R\sin(x+\alpha).
$$

Expanding the right-hand side with the compound angle formula:

$$
R\sin(x+\alpha) = R\sin x\cos\alpha + R\cos x\sin\alpha.
$$

Matching coefficients of $\sin x$ and $\cos x$:

$$
R\cos\alpha = a, \qquad R\sin\alpha = b.
$$

Squaring and adding uses $\sin^2\alpha+\cos^2\alpha=1$:

$$
R^2\cos^2\alpha + R^2\sin^2\alpha = a^2+b^2 \implies R^2 = a^2+b^2 \implies R = \sqrt{a^2+b^2}.
$$

Dividing the two equations gives $\alpha$:

$$
\frac{R\sin\alpha}{R\cos\alpha} = \frac{b}{a} \implies \tan\alpha = \frac{b}{a}.
$$

(The signs of $a$ and $b$ tell you which quadrant $\alpha$ is in, in the general case; for A-level, $a,b>0$ is the standard case and $\alpha$ is taken acute.)

:::callout{kind="key"}
For $a\sin x + b\cos x \equiv R\sin(x+\alpha)$ with $a,b>0$: $R=\sqrt{a^2+b^2}$ and $\tan\alpha = \dfrac{b}{a}$, with $\alpha$ acute. The maximum value of $a\sin x+b\cos x$ is $R$ (when $x+\alpha=90°$) and the minimum is $-R$ (when $x+\alpha=270°$).
:::

The function-grapher below plots $y = 3\sin x + 4\cos x$ (in radians). Its shape is a single sine wave — a visual confirmation that $3\sin x+4\cos x$ really does behave like $R\sin(x+\alpha)$ for suitable $R$ and $\alpha$, with amplitude $R=5$ (matching the peak height you can read from the graph).

::widget{type="function-grapher" expr="3*sin(x)+4*cos(x)" xmin=-6.5 xmax=6.5 ymin=-6 ymax=6 grid=true}

:::reveal{title="Worked example: finding R and alpha"}
Express $3\sin x + 4\cos x$ in the form $R\sin(x+\alpha)$, where $R>0$ and $0°<\alpha<90°$, giving $\alpha$ to 1 decimal place.

$$
R = \sqrt{3^2+4^2} = \sqrt{9+16} = \sqrt{25} = 5.
$$

$$
\tan\alpha = \frac{4}{3} \implies \alpha = \arctan\left(\frac43\right) = 53.1° \ (\text{1 d.p.}).
$$

So $3\sin x + 4\cos x \equiv 5\sin(x+53.1°)$.

*Check* at $x=0°$: left-hand side $=3(0)+4(1)=4$; right-hand side $=5\sin(53.1°)\approx5(0.8)=4.0$ ✓.
:::

:::reveal{title="Worked example: solving an equation using the harmonic form"}
Solve $3\sin x + 4\cos x = 2$ for $0° \le x \le 360°$, giving answers to 1 decimal place.

Using the harmonic form found above, $5\sin(x+53.1°) = 2$, so

$$
\sin(x+53.1°) = \frac{2}{5} = 0.4.
$$

Let $u = x + 53.1°$. Since $0°\le x\le360°$, $u$ ranges over $53.1°\le u\le413.1°$. Solving $\sin u = 0.4$: principal value $u_1=\arcsin(0.4)=23.6°$ (1 d.p.), but this is below the range, so use the periodic solutions of $\sin u = 0.4$ instead: $u = 23.6°,\ 156.4°,\ 383.6°,\ 516.4°,\dots$

Keeping only values of $u$ in $[53.1°, 413.1°]$: $u = 156.4°$ and $u = 383.6°$.

Converting back with $x = u - 53.1°$:

$$
x = 156.4° - 53.1° = 103.3°, \qquad x = 383.6° - 53.1° = 330.4°.
$$

**Solutions:** $x = 103.3°$ or $x = 330.4°$ (1 d.p.).

*Check* at $x=103.3°$: $3\sin(103.3°)+4\cos(103.3°) \approx 3(0.973)+4(-0.231) \approx 2.92-0.92 = 2.0$ ✓.
:::

:::callout{kind="tip"}
When converting the angle range for $u=x+\alpha$, always shift the interval endpoints by $\alpha$ too — this is the step most often forgotten, and it is exactly what produces "extra" or "missing" solutions.
:::
