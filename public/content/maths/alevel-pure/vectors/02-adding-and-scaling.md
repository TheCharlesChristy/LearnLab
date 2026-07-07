# Adding, subtracting and scaling vectors

## Addition and subtraction

Vectors add and subtract **component-wise**: add (or subtract) the top components
together, and the bottom components together.

$$
\begin{pmatrix} a \\ b \end{pmatrix} + \begin{pmatrix} c \\ d \end{pmatrix} = \begin{pmatrix} a+c \\ b+d \end{pmatrix}
\qquad\qquad
\begin{pmatrix} a \\ b \end{pmatrix} - \begin{pmatrix} c \\ d \end{pmatrix} = \begin{pmatrix} a-c \\ b-d \end{pmatrix}
$$

Geometrically, adding $\mathbf{a} + \mathbf{b}$ means placing the tail of $\mathbf{b}$ at
the head of $\mathbf{a}$; the sum is the vector from the start of $\mathbf{a}$ to the end
of $\mathbf{b}$ (the "triangle rule").

:::reveal{title="Worked example: adding and subtracting"}
Let $\mathbf{a} = \begin{pmatrix} 2 \\ 5 \end{pmatrix}$ and $\mathbf{b} = \begin{pmatrix} -3 \\ 1 \end{pmatrix}$. Find $\mathbf{a} + \mathbf{b}$ and $\mathbf{a} - \mathbf{b}$.

$$
\mathbf{a} + \mathbf{b} = \begin{pmatrix} 2 + (-3) \\ 5 + 1 \end{pmatrix} = \begin{pmatrix} -1 \\ 6 \end{pmatrix}
$$

$$
\mathbf{a} - \mathbf{b} = \begin{pmatrix} 2 - (-3) \\ 5 - 1 \end{pmatrix} = \begin{pmatrix} 5 \\ 4 \end{pmatrix}
$$
:::

## Scalar multiplication

Multiplying a vector by a scalar $k$ multiplies **every** component by $k$:

$$
k\begin{pmatrix} a \\ b \end{pmatrix} = \begin{pmatrix} ka \\ kb \end{pmatrix}
$$

If $k > 0$ the result points in the same direction as the original vector; if $k < 0$ it
points in the opposite direction. In both cases the magnitude scales by $|k|$:

$$
|k\mathbf{v}| = |k|\,|\mathbf{v}|
$$

:::callout{kind="key"}
Two non-zero vectors $\mathbf{a}$ and $\mathbf{b}$ are **parallel** if and only if
$\mathbf{a} = k\mathbf{b}$ for some non-zero scalar $k$. This is the standard test used to
show two lines (or two displacements) are parallel.
:::

:::reveal{title="Worked example: scalar multiplication and testing for parallel vectors"}
Let $\mathbf{a} = \begin{pmatrix} 4 \\ -6 \end{pmatrix}$ and $\mathbf{b} = \begin{pmatrix} -6 \\ 9 \end{pmatrix}$. Show that $\mathbf{a}$ and $\mathbf{b}$ are parallel.

Try to find $k$ such that $\mathbf{b} = k\mathbf{a}$: comparing top components,
$-6 = 4k \Rightarrow k = -\tfrac{3}{2}$. Check the bottom components:
$4 \times \left(-\tfrac{3}{2}\right) \times (-1) \dots$ more directly,
$-\tfrac{3}{2} \times (-6) = 9$, which matches the bottom component of $\mathbf{b}$.

Since $\mathbf{b} = -\tfrac{3}{2}\mathbf{a}$ with a single consistent scalar, $\mathbf{a}$
and $\mathbf{b}$ are parallel (and point in opposite directions, since $k < 0$).
:::

## Unit vectors

A **unit vector** has magnitude exactly $1$. To find the unit vector in the same
direction as a non-zero vector $\mathbf{v}$, divide $\mathbf{v}$ by its own magnitude:

$$
\hat{\mathbf{v}} = \frac{1}{|\mathbf{v}|}\mathbf{v}
$$

This works because scaling by $k = \frac{1}{|\mathbf{v}|}$ gives a new magnitude of
$|k| \times |\mathbf{v}| = \frac{1}{|\mathbf{v}|} \times |\mathbf{v}| = 1$.

:::reveal{title="Worked example: finding a unit vector"}
Find the unit vector in the direction of $\mathbf{v} = \begin{pmatrix} 3 \\ -4 \end{pmatrix}$.

$$
|\mathbf{v}| = \sqrt{3^2 + (-4)^2} = \sqrt{9+16} = \sqrt{25} = 5
$$

$$
\hat{\mathbf{v}} = \frac{1}{5}\begin{pmatrix} 3 \\ -4 \end{pmatrix} = \begin{pmatrix} 0.6 \\ -0.8 \end{pmatrix}
$$

Check: $|\hat{\mathbf{v}}| = \sqrt{0.6^2 + 0.8^2} = \sqrt{0.36 + 0.64} = \sqrt{1} = 1$. ✓
:::

Test yourself on the key definitions and formulae from this lesson before moving on:

::widget{type="flashcards" src="vector-key-terms.json"}

You can also check your own arithmetic by computing a magnitude programmatically —
useful for verifying answers on longer questions with several steps:

::widget{type="code-runner" language="python" starter="import math\n\n# Edit the components below and run to check |v|\nx, y = 3, -4\nmagnitude = math.sqrt(x**2 + y**2)\nprint(f'|v| = {magnitude}')" rows=8}
