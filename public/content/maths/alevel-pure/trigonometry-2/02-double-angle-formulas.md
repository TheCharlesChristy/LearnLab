# Double angle formulas

The double angle formulas are the special case of the compound angle formulas when $B = A$, so $A + B = 2A$. They are used constantly throughout A-level trigonometry and calculus, so fluency here pays off later.

## Deriving sin(2A)

Starting from $\sin(A+B) = \sin A\cos B + \cos A \sin B$ and setting $B = A$:

$$
\sin(2A) = \sin(A+A) = \sin A \cos A + \cos A \sin A = 2\sin A \cos A.
$$

$$
\boxed{\sin(2A) = 2\sin A\cos A}
$$

## Deriving cos(2A) — three equivalent forms

Starting from $\cos(A+B) = \cos A\cos B - \sin A\sin B$ and setting $B = A$:

$$
\cos(2A) = \cos^2 A - \sin^2 A.
$$

Using $\sin^2 A = 1 - \cos^2 A$:

$$
\cos(2A) = \cos^2 A - (1-\cos^2A) = 2\cos^2 A - 1.
$$

Using $\cos^2 A = 1 - \sin^2 A$ instead:

$$
\cos(2A) = (1-\sin^2A) - \sin^2 A = 1 - 2\sin^2 A.
$$

$$
\boxed{\cos(2A) = \cos^2A - \sin^2A = 2\cos^2A - 1 = 1 - 2\sin^2A}
$$

:::callout{kind="key"}
All three forms of $\cos(2A)$ are equal — pick whichever is more useful for the problem. The $2\cos^2A - 1$ and $1 - 2\sin^2A$ forms are especially useful for solving equations or integrating, since they involve only one trig function.
:::

## Deriving tan(2A)

From $\tan(A+B) = \dfrac{\tan A + \tan B}{1-\tan A\tan B}$ with $B=A$:

$$
\boxed{\tan(2A) = \frac{2\tan A}{1-\tan^2A}} \qquad (\tan A \neq \pm1,\ A \neq 90°+180°n)
$$

:::reveal{title="Worked example: evaluating with given information"}
Given that $\sin A = \dfrac{3}{5}$ and $A$ is acute, find the exact value of $\sin(2A)$ and $\cos(2A)$.

Since $A$ is acute, $\cos A > 0$. Using $\sin^2A+\cos^2A=1$:

$$
\cos A = \sqrt{1-\left(\frac35\right)^2} = \sqrt{1-\frac{9}{25}} = \sqrt{\frac{16}{25}} = \frac45.
$$

Then:

$$
\sin(2A) = 2\sin A\cos A = 2\cdot\frac35\cdot\frac45 = \frac{24}{25}.
$$

$$
\cos(2A) = 1-2\sin^2A = 1-2\cdot\frac{9}{25} = 1-\frac{18}{25} = \frac{7}{25}.
$$

**Check** using the other form: $\cos(2A) = 2\cos^2A - 1 = 2\cdot\frac{16}{25}-1 = \frac{32}{25}-1=\frac{7}{25}$ ✓ — the two forms agree.
:::

:::reveal{title="Worked example: proving a double angle identity"}
Prove that $\dfrac{\sin(2A)}{1+\cos(2A)} \equiv \tan A$.

Using $\sin(2A) = 2\sin A\cos A$ and $\cos(2A) = 2\cos^2A - 1$ on the left-hand side:

$$
\frac{\sin(2A)}{1+\cos(2A)} = \frac{2\sin A\cos A}{1+(2\cos^2A-1)} = \frac{2\sin A\cos A}{2\cos^2A} = \frac{\sin A}{\cos A} = \tan A.
$$

This matches the right-hand side, so the identity is proved (for $\cos A \neq 0$).
:::

## Half-angle form and further practice

Because $\cos(2A) = 1-2\sin^2A$, rearranging gives $\sin^2A = \dfrac{1-\cos(2A)}{2}$, and similarly $\cos^2A = \dfrac{1+\cos(2A)}{2}$. These are sometimes called the half-angle identities and are especially useful for integrating $\sin^2x$ or $\cos^2x$ later in the course (Integration II).

:::callout{kind="tip"}
When a question gives you $\sin A$ or $\cos A$ and asks for $\sin(2A)$, $\cos(2A)$ or $\tan(2A)$: find the missing ratio first (using $\sin^2+\cos^2=1$ and the quadrant/sign information given), then substitute directly into the double angle formulas. Always sanity-check $\cos(2A)$ using a second form, as in the worked example above.
:::
