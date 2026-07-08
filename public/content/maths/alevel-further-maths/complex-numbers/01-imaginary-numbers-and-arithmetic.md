# Imaginary numbers, complex arithmetic, and the Argand diagram

Try solving $x^2 + 1 = 0$. Rearranging gives $x^2 = -1$ — and no real number
squares to give a negative result, so this equation has no solution among the
numbers you already know. For centuries mathematicians treated that as the
end of the story: some quadratics simply don't have solutions.

Then it turned out that pretending they *did* — inventing a number whose
square is $-1$ — didn't just make the algebra work. It turned out to be
exactly what was needed to describe alternating current, analyse vibrations
and signals, and (much later) write the equations of quantum mechanics. This
lesson introduces that number, the arithmetic it obeys, and a picture — the
Argand diagram — that makes it concrete rather than mysterious.

## The imaginary unit

Define $i$ so that

$$
i^2 = -1.
$$

That's the entire definition — one equation. Every other property of $i$
follows from ordinary algebra plus this one substitution rule.

A **complex number** is then a number of the form $a + bi$, where $a$ and $b$
are real numbers: $a$ is called the **real part** and $b$ the **imaginary
part** (note: the imaginary part is the real number $b$, not $bi$). For
example, in $z = 3 - 4i$, the real part is $3$ and the imaginary part is $-4$.
A real number like $7$ is still a complex number — just one with imaginary
part $0$ (i.e. $7 + 0i$).

::widget{type="flashcards" src="cards/key-terms.json"}

## Adding and subtracting complex numbers

Complex numbers add and subtract exactly like you'd combine like terms in
algebra — real parts with real parts, imaginary parts with imaginary parts:

$$
(a+bi) + (c+di) = (a+c) + (b+d)i.
$$

:::reveal{title="Worked example: adding two complex numbers"}
Let $z = 3 + 4i$ and $w = 1 - 2i$. Then

$$
z + w = (3+1) + (4-2)i = 4 + 2i.
$$

Subtraction works the same way: $z - w = (3-1) + (4-(-2))i = 2 + 6i$.
:::

::widget{type="quiz" src="arithmetic-check.json"}

## Multiplying complex numbers

Multiplication uses ordinary expansion (like FOIL for two binomials) — the
only new step is substituting $i^2 = -1$ wherever it appears:

$$
(a+bi)(c+di) = ac + adi + bci + bdi^2 = (ac - bd) + (ad+bc)i.
$$

:::reveal{title="Worked example: multiplying two complex numbers"}
Let $z = 2 + i$ and $w = 1 - i$. Expand term by term:

$$
zw = (2)(1) + (2)(-i) + (i)(1) + (i)(-i) = 2 - 2i + i - i^2.
$$

Substitute $i^2 = -1$, so $-i^2 = 1$:

$$
zw = 2 - i + 1 = 3 - i.
$$
:::

This is the step worth practising until it's automatic — every product of two
complex numbers boils down to expand, substitute $i^2=-1$, then collect real
and imaginary parts.

::widget{type="matching-pairs" src="cards/multiplication-pairs.json"}

:::callout{kind="key"}
The **complex conjugate** of $a+bi$ is $a-bi$ — same real part, opposite sign
on the imaginary part. Multiplying a complex number by its own conjugate
always gives a real number (you saw this above: $(1+i)(1-i)=2$). The
conjugate is the key tool for *dividing* complex numbers — that's coming in
the next lesson.
:::

## Picturing complex numbers: the Argand diagram

Because a complex number $a+bi$ is really a pair of real numbers $(a, b)$, it
can be plotted as a point on a plane: $a$ along a horizontal **real axis**,
$b$ along a vertical **imaginary axis**. This picture is called the **Argand
diagram**, and it turns "adding two complex numbers" into "adding two
position vectors" — a preview of why complex numbers turn out to be so useful
for describing anything with both a size and a direction.

Three points are already plotted below. Read off their coordinates and check
they match the labels, then drag the fourth point, $Z_4$, to where you think
the complex number $4 - i$ should sit.

::widget{type="geometry-canvas" src="scenes/argand-diagram.json" width=420 height=420}

If you dragged $Z_4$ to $x=4$, $y=-1$, you've placed $4-i$ correctly — four
across on the real axis, one down on the imaginary axis.

Next lesson builds directly on this picture: once a complex number is a point
on a plane, it also has a distance from the origin (its **modulus**) and an
angle from the real axis (its **argument**) — and those turn multiplication
into something even simpler than the expand-and-substitute method above.
