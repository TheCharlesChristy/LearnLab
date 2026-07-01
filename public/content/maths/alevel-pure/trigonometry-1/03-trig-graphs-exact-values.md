# Graphs of sin, cos and tan, and exact values

## The graph of $y = \sin x$

- **Shape:** a smooth wave starting at $(0,0)$, rising to a maximum of $1$ at
  $x = \frac{\pi}{2}$ ($90^\circ$), back through $0$ at $x = \pi$ ($180^\circ$),
  down to a minimum of $-1$ at $x = \frac{3\pi}{2}$ ($270^\circ$), and back to
  $0$ at $x = 2\pi$ ($360^\circ$).
- **Period:** $2\pi$ radians ($360^\circ$) — the pattern repeats forever.
- **Range:** $-1 \le \sin x \le 1$.
- **Symmetry:** odd function, $\sin(-x) = -\sin(x)$; symmetric about the origin.

::widget{type="function-grapher" expr="sin(x)" xmin=-6.28 xmax=6.28 ymin=-1.5 ymax=1.5 grid=true}

## The graph of $y = \cos x$

- **Shape:** identical wave to $\sin x$ but shifted — starts at its maximum
  $(0, 1)$, crosses zero at $x = \frac{\pi}{2}$, reaches minimum $-1$ at
  $x = \pi$, crosses zero again at $x = \frac{3\pi}{2}$, back to maximum at
  $x = 2\pi$.
- **Period:** $2\pi$ radians ($360^\circ$).
- **Range:** $-1 \le \cos x \le 1$.
- **Symmetry:** even function, $\cos(-x) = \cos(x)$; symmetric about the
  $y$-axis. In fact $\cos x = \sin\left(x + \frac{\pi}{2}\right)$ — the cosine
  graph is the sine graph shifted left by $\frac{\pi}{2}$.

::widget{type="function-grapher" expr="cos(x)" xmin=-6.28 xmax=6.28 ymin=-1.5 ymax=1.5 grid=true}

:::callout{kind="key"}
Both $\sin x$ and $\cos x$ have period $2\pi$ and range $[-1, 1]$. The
difference is purely a horizontal shift (phase) of $\frac{\pi}{2}$.
:::

## The graph of $y = \tan x$

- **Shape:** repeating branches, each rising from $-\infty$ to $+\infty$,
  passing through $0$ at each multiple of $\pi$.
- **Period:** $\pi$ radians ($180^\circ$) — **half** the period of sine and
  cosine.
- **Range:** all real numbers (unbounded).
- **Asymptotes:** vertical asymptotes wherever $\cos x = 0$, i.e. at
  $x = \frac{\pi}{2} + k\pi$ for integer $k$ (so $90^\circ, 270^\circ, \dots$).
  This follows from $\tan x = \frac{\sin x}{\cos x}$: the function is
  undefined wherever the denominator is zero.

::widget{type="function-grapher" expr="tan(x)" xmin=-3 xmax=3 ymin=-10 ymax=10 grid=true}

:::callout{kind="warning"}
The grapher above samples $\tan x$ numerically, so near an asymptote (e.g.
$x = \frac{\pi}{2} \approx 1.571$) the plotted curve shoots off very steeply
rather than showing a true vertical line — the function is genuinely
undefined there, not just large.
:::

## Exact trigonometric values

These values come from two special right-angled triangles (a $45$–$45$–$90$
isosceles triangle with legs $1, 1$ and hypotenuse $\sqrt{2}$; and a
$30$–$60$–$90$ triangle with sides $1, \sqrt{3}, 2$) and must be memorised.

| Angle (deg) | Angle (rad)      | $\sin$               | $\cos$               | $\tan$               |
| ----------- | ---------------- | -------------------- | -------------------- | -------------------- |
| $0^\circ$   | $0$              | $0$                  | $1$                  | $0$                  |
| $30^\circ$  | $\frac{\pi}{6}$  | $\frac{1}{2}$        | $\frac{\sqrt{3}}{2}$ | $\frac{1}{\sqrt{3}}$ |
| $45^\circ$  | $\frac{\pi}{4}$  | $\frac{\sqrt{2}}{2}$ | $\frac{\sqrt{2}}{2}$ | $1$                  |
| $60^\circ$  | $\frac{\pi}{3}$  | $\frac{\sqrt{3}}{2}$ | $\frac{1}{2}$        | $\sqrt{3}$           |
| $90^\circ$  | $\frac{\pi}{2}$  | $1$                  | $0$                  | undefined            |

:::reveal{title="Where these come from: the 45-45-90 triangle"}
Take a right-angled isosceles triangle with both legs of length $1$. By
Pythagoras, the hypotenuse is $\sqrt{1^2 + 1^2} = \sqrt{2}$. Each of the two
equal angles is $45^\circ$. So:

$$
\sin 45^\circ = \cos 45^\circ = \frac{1}{\sqrt{2}} = \frac{\sqrt{2}}{2}, \qquad \tan 45^\circ = \frac{1}{1} = 1
$$
:::

:::reveal{title="Where these come from: the 30-60-90 triangle"}
Take an equilateral triangle with side length $2$ and drop a perpendicular
from one vertex to the midpoint of the opposite side. This splits it into two
right-angled triangles with hypotenuse $2$, one leg $1$ (half the base), and
the other leg $\sqrt{2^2 - 1^2} = \sqrt{3}$ (by Pythagoras). The angles are
$30^\circ$ and $60^\circ$. So:

$$
\sin 30^\circ = \frac{1}{2}, \quad \cos 30^\circ = \frac{\sqrt{3}}{2}, \quad \tan 30^\circ = \frac{1}{\sqrt{3}} = \frac{\sqrt{3}}{3}
$$

$$
\sin 60^\circ = \frac{\sqrt{3}}{2}, \quad \cos 60^\circ = \frac{1}{2}, \quad \tan 60^\circ = \sqrt{3}
$$
:::

:::callout{kind="tip"}
Sanity-check any exact value against the graphs above: $\sin$ and $\cos$ must
stay between $-1$ and $1$, $\tan 90^\circ$ is undefined because the tangent
graph has an asymptote there, and $\sin 0^\circ = \cos 90^\circ = 0$ matches
where each curve crosses the $x$-axis.
:::
