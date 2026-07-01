# Vectors, magnitude and component form

A **vector** is a quantity with both size (**magnitude**) and **direction** — contrast this
with a **scalar**, which has size only (e.g. temperature, mass, time).

## Component (column) form

In two dimensions we write a vector as a column of components:

$$
\mathbf{v} = \begin{pmatrix} x \\ y \end{pmatrix}
$$

The top number $x$ is the horizontal displacement and the bottom number $y$ is the
vertical displacement. For example $\begin{pmatrix} 3 \\ 4 \end{pmatrix}$ means "3 units
across, 4 units up".

The same vector can be written using $\mathbf{i}$–$\mathbf{j}$ notation, where $\mathbf{i}$
is the unit vector $\begin{pmatrix} 1 \\ 0 \end{pmatrix}$ (one unit across) and
$\mathbf{j}$ is the unit vector $\begin{pmatrix} 0 \\ 1 \end{pmatrix}$ (one unit up):

$$
\begin{pmatrix} 3 \\ 4 \end{pmatrix} = 3\mathbf{i} + 4\mathbf{j}
$$

In three dimensions we add a third component $z$ and a third unit vector $\mathbf{k} =
\begin{pmatrix} 0 \\ 0 \\ 1 \end{pmatrix}$:

$$
\mathbf{v} = \begin{pmatrix} x \\ y \\ z \end{pmatrix} = x\mathbf{i} + y\mathbf{j} + z\mathbf{k}
$$

This module works mainly in 2D, with 3D used briefly where the ideas extend directly.

:::callout{kind="info"}
Vectors are usually printed in **bold** ($\mathbf{v}$) and handwritten with an underline
or arrow ($\underline{v}$ or $\vec{v}$). A vector drawn from point $A$ to point $B$ is
written $\overrightarrow{AB}$.
:::

## Magnitude

The magnitude (length) of a vector is found using Pythagoras' theorem, since the
components form the two shorter sides of a right-angled triangle:

$$
|\mathbf{v}| = \sqrt{x^2 + y^2} \qquad \text{(2D)} \qquad\qquad |\mathbf{v}| = \sqrt{x^2 + y^2 + z^2} \qquad \text{(3D)}
$$

Magnitude is always a non-negative scalar.

:::reveal{title="Worked example: finding a magnitude"}
Find the magnitude of $\mathbf{a} = \begin{pmatrix} 5 \\ -12 \end{pmatrix}$.

$$
|\mathbf{a}| = \sqrt{5^2 + (-12)^2} = \sqrt{25 + 144} = \sqrt{169} = 13
$$

Note that a negative component is simply squared, so its sign does not affect the
magnitude.
:::

Here is the vector $\begin{pmatrix} 5 \\ -12 \end{pmatrix}$ plotted as a directed segment
from the origin — the straight-line distance to the point $(5, -12)$ is its magnitude,
$13$.

::widget{type="data-plot" src="vector-example.json"}

:::callout{kind="key"}
$|\mathbf{v}|$ (or sometimes $v$) always denotes the magnitude of $\mathbf{v}$ — a
non-negative real number, never a vector itself.
:::

## Equal and parallel vectors

Two vectors are **equal** if and only if all their corresponding components are equal —
position does not matter, only length and direction. Two non-zero vectors are
**parallel** if and only if one is a scalar multiple of the other (more on this in the
next lesson).

:::reveal{title="Worked example: reading off components from a diagram"}
A vector starts at $(1, 2)$ and ends at $(4, 6)$. Write it in component form and find its
magnitude.

The displacement is (change in $x$, change in $y$) $= (4 - 1, 6 - 2) = (3, 4)$, so

$$
\mathbf{v} = \begin{pmatrix} 3 \\ 4 \end{pmatrix}, \qquad |\mathbf{v}| = \sqrt{3^2 + 4^2} = \sqrt{25} = 5
$$
:::
