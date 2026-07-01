# Trig identities and compound angle formulas

In Trigonometry I you met $\sin\theta$, $\cos\theta$ and $\tan\theta$ as ratios in a right-angled triangle, and their graphs and exact values for special angles. Here we build the identities that let you simplify expressions, prove results, and (in the next two lessons) solve equations.

## The Pythagorean identity

For any angle $\theta$,

$$
\sin^2\theta + \cos^2\theta = 1.
$$

This follows directly from Pythagoras' theorem applied to a point $(\cos\theta, \sin\theta)$ on the unit circle: $x^2 + y^2 = 1$.

Two useful rearrangements:

$$
\sin^2\theta = 1 - \cos^2\theta, \qquad \cos^2\theta = 1 - \sin^2\theta.
$$

## The quotient identity

$$
\tan\theta = \frac{\sin\theta}{\cos\theta}, \qquad \cos\theta \neq 0.
$$

Together, these two identities let you rewrite trig expressions in terms of a single function, which is often the key step in simplifying an expression or proving that two expressions are equal.

:::callout{kind="key"}
$\sin^2\theta + \cos^2\theta = 1$ and $\tan\theta = \dfrac{\sin\theta}{\cos\theta}$ are the two identities you already know from Trigonometry I. Every identity in this module is either one of these, a combination of them, or a compound/double angle formula built on top of them.
:::

:::reveal{title="Worked example: simplifying an expression"}
Simplify $\dfrac{\sin\theta}{\tan\theta}$.

$$
\frac{\sin\theta}{\tan\theta} = \sin\theta \div \frac{\sin\theta}{\cos\theta} = \sin\theta \times \frac{\cos\theta}{\sin\theta} = \cos\theta.
$$

So $\dfrac{\sin\theta}{\tan\theta} \equiv \cos\theta$ (for $\sin\theta \neq 0$).
:::

:::reveal{title="Worked example: proving an identity"}
Prove that $(\sin\theta + \cos\theta)^2 \equiv 1 + 2\sin\theta\cos\theta$.

Starting from the left-hand side and expanding:

$$
(\sin\theta + \cos\theta)^2 = \sin^2\theta + 2\sin\theta\cos\theta + \cos^2\theta.
$$

Using $\sin^2\theta + \cos^2\theta = 1$:

$$
= 1 + 2\sin\theta\cos\theta,
$$

which is the right-hand side, so the identity is proved.
:::

## Compound angle formulas

These formulas expand $\sin$, $\cos$ and $\tan$ of a *sum or difference* of two angles in terms of the sines, cosines and tangents of the individual angles. They are given (you do not need to derive them from scratch), but you must be able to apply them fluently:

$$
\sin(A + B) = \sin A \cos B + \cos A \sin B
$$

$$
\sin(A - B) = \sin A \cos B - \cos A \sin B
$$

$$
\cos(A + B) = \cos A \cos B - \sin A \sin B
$$

$$
\cos(A - B) = \cos A \cos B + \sin A \sin B
$$

$$
\tan(A + B) = \frac{\tan A + \tan B}{1 - \tan A \tan B}, \qquad
\tan(A - B) = \frac{\tan A - \tan B}{1 + \tan A \tan B}
$$

(the tangent versions require $A$, $B$ and $A \pm B$ to avoid odd multiples of $90°$, where $\tan$ is undefined).

:::callout{kind="tip"}
A common memory aid: in $\sin(A \pm B)$ the sign in the middle matches the sign in the formula; in $\cos(A \pm B)$ the sign *flips*. There is no such flip for $\tan$ — the sign in the numerator matches, and the denominator always has the opposite sign in front of $\tan A \tan B$.
:::

:::reveal{title="Worked example: exact value using a compound angle formula"}
Find the exact value of $\sin(75°)$ using $75° = 45° + 30°$.

$$
\sin(75°) = \sin(45° + 30°) = \sin 45° \cos 30° + \cos 45° \sin 30°.
$$

Using exact values $\sin 45° = \cos 45° = \dfrac{\sqrt2}{2}$, $\cos 30° = \dfrac{\sqrt3}{2}$, $\sin 30° = \dfrac12$:

$$
\sin(75°) = \frac{\sqrt2}{2}\cdot\frac{\sqrt3}{2} + \frac{\sqrt2}{2}\cdot\frac12 = \frac{\sqrt6}{4} + \frac{\sqrt2}{4} = \frac{\sqrt6+\sqrt2}{4}.
$$

Checking numerically: $\dfrac{\sqrt6+\sqrt2}{4} \approx \dfrac{2.449+1.414}{4} \approx 0.9659$, which matches $\sin(75°) \approx 0.9659$. ✓
:::

## A quick numerical check of the formulas

The plot below draws $y = \sin(x + 30°)$ (in degrees, treated as a variable in $x$) two ways: it is worth confirming for yourself, by substituting a value of $x$, that $\sin(x+30°)$ really does equal $\sin x\cos 30° + \cos x \sin 30°$ — both curves below coincide exactly because they are the same function written two ways.

::widget{type="function-grapher" expr="sin(x+0.5236)" xmin=-10 xmax=10 grid=true}

:::callout{kind="info"}
$0.5236$ radians is $30°$ ($\pi/6$). The grapher works in radians, so compound angle formulas you check numerically here should use radian equivalents of the degree values used in worked examples above.
:::
