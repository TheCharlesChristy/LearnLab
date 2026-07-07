# Position vectors and geometric proofs

## Position vectors

The **position vector** of a point $P$ is the vector from the origin $O$ to $P$, written
$\overrightarrow{OP}$ or simply $\mathbf{p}$. If $P$ has coordinates $(p_1, p_2)$ then

$$
\mathbf{p} = \overrightarrow{OP} = \begin{pmatrix} p_1 \\ p_2 \end{pmatrix}
$$

Position vectors let us describe points algebraically and then use ordinary vector
arithmetic to answer geometric questions.

## The vector between two points

If $A$ and $B$ have position vectors $\mathbf{a}$ and $\mathbf{b}$, the vector from $A$ to
$B$ is:

$$
\overrightarrow{AB} = \mathbf{b} - \mathbf{a}
$$

(**end minus start** — this is the single most useful fact in this module.)

:::reveal{title="Worked example: the vector between two points"}
$A$ has position vector $\mathbf{a} = \begin{pmatrix} 1 \\ 2 \end{pmatrix}$ and $B$ has
position vector $\mathbf{b} = \begin{pmatrix} 7 \\ -3 \end{pmatrix}$. Find
$\overrightarrow{AB}$ and $|\overrightarrow{AB}|$.

$$
\overrightarrow{AB} = \mathbf{b} - \mathbf{a} = \begin{pmatrix} 7 - 1 \\ -3 - 2 \end{pmatrix} = \begin{pmatrix} 6 \\ -5 \end{pmatrix}
$$

$$
|\overrightarrow{AB}| = \sqrt{6^2 + (-5)^2} = \sqrt{36 + 25} = \sqrt{61}
$$
:::

## Midpoints

The midpoint $M$ of segment $AB$ has position vector equal to the average of the two
endpoints' position vectors:

$$
\overrightarrow{OM} = \frac{1}{2}(\mathbf{a} + \mathbf{b})
$$

:::callout{kind="tip"}
This is the vector version of the familiar coordinate midpoint formula
$\left(\frac{x_1+x_2}{2}, \frac{y_1+y_2}{2}\right)$ — it is the same calculation, one
component at a time.
:::

## Proving points are collinear

Three points $A$, $B$, $C$ are **collinear** (lie on a single straight line) if the
vectors $\overrightarrow{AB}$ and $\overrightarrow{BC}$ (or any other pair sharing a
point) are parallel — that is, one is a scalar multiple of the other **and** they share a
common point, so they must lie along the same line rather than merely being parallel
elsewhere in the plane.

:::reveal{title="Worked example: proving collinearity"}
$A$, $B$, $C$ have position vectors $\mathbf{a} = \begin{pmatrix} 1 \\ 1 \end{pmatrix}$,
$\mathbf{b} = \begin{pmatrix} 3 \\ 5 \end{pmatrix}$, $\mathbf{c} = \begin{pmatrix} 6 \\ 11 \end{pmatrix}$.
Show $A$, $B$, $C$ are collinear.

$$
\overrightarrow{AB} = \mathbf{b} - \mathbf{a} = \begin{pmatrix} 2 \\ 4 \end{pmatrix}, \qquad
\overrightarrow{BC} = \mathbf{c} - \mathbf{b} = \begin{pmatrix} 3 \\ 6 \end{pmatrix}
$$

$\overrightarrow{BC} = \tfrac{3}{2}\overrightarrow{AB}$ (check: $\tfrac{3}{2} \times 2 = 3$
and $\tfrac{3}{2} \times 4 = 6$ ✓), so $\overrightarrow{AB}$ and $\overrightarrow{BC}$ are
parallel. Since they also share the point $B$, the points $A$, $B$, $C$ must lie on the
same straight line — they are collinear.
:::

## Showing two lines are parallel

Two line segments (or two whole lines) are parallel exactly when their direction vectors
are scalar multiples of each other. Unlike collinearity, parallel lines do **not** need
to share a point.

:::reveal{title="Worked example: proving two lines are parallel (but distinct)"}
$A(0,0)$, $B(2,3)$, $C(5,5)$, $D(9,11)$. Show that $AB$ is parallel to $CD$ but the two
lines are not the same line.

$$
\overrightarrow{AB} = \begin{pmatrix} 2 \\ 3 \end{pmatrix}, \qquad
\overrightarrow{CD} = \begin{pmatrix} 9-5 \\ 11-5 \end{pmatrix} = \begin{pmatrix} 4 \\ 6 \end{pmatrix} = 2\begin{pmatrix} 2 \\ 3 \end{pmatrix}
$$

$\overrightarrow{CD} = 2\overrightarrow{AB}$, so the lines are parallel. They are distinct
lines (not collinear) because, for instance, $C(5,5)$ does not lie on line $AB$: points on
$AB$ satisfy $y = \tfrac{3}{2}x$, but at $x=5$ this gives $y = 7.5 \ne 5$.
:::

This diagram shows the two parallel segments from the worked example above — same
direction, different position:

::widget{type="function-grapher" expr="1.5*x" xmin=-1 xmax=10 ymin=-1 ymax=13 grid=true}

:::callout{kind="warning"}
A common error is to conclude two vectors are parallel just because they "look similar".
Always find (or attempt to find) a single scalar $k$ that maps every component of one
vector to the corresponding component of the other — if no consistent $k$ exists, the
vectors are **not** parallel.
:::
