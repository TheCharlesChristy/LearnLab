# Coordinates and function notation

Before we can draw a graph, we need a shared way to describe *where* a point is and a shared way to describe *how* a rule turns one number into another. This lesson covers both: the coordinate plane, and function notation.

## The Cartesian plane

The **Cartesian plane** (or coordinate plane) is formed by two perpendicular number lines that cross at a point called the **origin**, written $(0, 0)$:

- the horizontal line is the **$x$-axis**;
- the vertical line is the **$y$-axis**.

Every point on the plane is described by an ordered pair $(x, y)$: $x$ tells you how far to move **left/right** from the origin, and $y$ tells you how far to move **up/down**. The order always matters — $(2, 5)$ and $(5, 2)$ are different points.

:::callout{kind="key"}
In the pair $(x, y)$, $x$ always comes first. A useful memory aid: "along the corridor, then up the stairs" — move horizontally first, then vertically.
:::

The two axes divide the plane into four **quadrants**. Positive $x$ and positive $y$ put you in the top-right quadrant; negative $x$ with positive $y$ puts you top-left; and so on. A point with $x = 0$ lies on the $y$-axis, and a point with $y = 0$ lies on the $x$-axis.

:::reveal{title="Worked example: plotting points"}
Plot the points $A(3, 2)$, $B(-4, 1)$, $C(-2, -3)$ and $D(0, -5)$.

- $A(3, 2)$: from the origin, move 3 right and 2 up.
- $B(-4, 1)$: move 4 left and 1 up.
- $C(-2, -3)$: move 2 left and 3 down.
- $D(0, -5)$: don't move horizontally at all; move 5 down. $D$ lies exactly on the $y$-axis.
:::

## Function notation: $f(x)$

A **function** is a rule that takes an input number and produces exactly one output number. We name a function with a letter — usually $f$ — and write $f(x)$ to mean "the output you get when you substitute $x$ into the rule for $f$".

For example, if

$$
f(x) = 2x + 3,
$$

then $f(x)$ just means "double the input, then add 3". To find a specific output, replace $x$ with a number **everywhere it appears**:

$$
f(4) = 2(4) + 3 = 11.
$$

We read $f(4) = 11$ as "the function $f$, evaluated at $x = 4$, equals $11$", or more simply "$f$ of $4$ is $11$".

:::callout{kind="info"}
$f(x)$ does **not** mean "$f$ times $x$". It is a single piece of notation meaning "the output of the rule $f$ for the input $x$".
:::

:::reveal{title="Worked example: evaluating a function"}
If $g(x) = x^2 - 2x + 1$, find $g(-1)$.

Substitute $x = -1$ everywhere it appears in the rule:

$$
g(-1) = (-1)^2 - 2(-1) + 1 = 1 + 2 + 1 = 4.
$$

So $g(-1) = 4$. Notice the careful use of brackets around $-1$ — this avoids sign errors when squaring or multiplying a negative number.
:::

## Points on a graph *are* input–output pairs

The connection between coordinates and functions is this: if $f(x) = 2x + 3$, then every point $(x, f(x))$ can be plotted on the coordinate plane. For instance, since $f(4) = 11$, the point $(4, 11)$ lies on the graph of $f$. Building up a table of $(x, f(x))$ pairs and plotting them is exactly how every graph in the rest of this module is drawn — starting with straight lines in the next lesson.

:::reveal{title="Worked example: building a mini table of values"}
For $f(x) = 2x + 3$, find $f(x)$ for $x = -1, 0, 1, 2$.

| $x$      | $-1$ | $0$ | $1$ | $2$ |
|----------|------|-----|-----|-----|
| $f(x)$   | $1$  | $3$ | $5$ | $7$ |

- $f(-1) = 2(-1) + 3 = -2 + 3 = 1$
- $f(0) = 2(0) + 3 = 0 + 3 = 3$
- $f(1) = 2(1) + 3 = 2 + 3 = 5$
- $f(2) = 2(2) + 3 = 4 + 3 = 7$

Plotting $(-1,1)$, $(0,3)$, $(1,5)$, $(2,7)$ and joining them gives a straight line — we study exactly why in the next lesson.
:::
