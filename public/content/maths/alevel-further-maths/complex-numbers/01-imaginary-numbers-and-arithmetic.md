# Imaginary numbers, complex arithmetic, and the Argand diagram

Every journey into new territory starts with hitting a wall. Ours starts with
$x^2 + 1 = 0$. Rearrange it and you need a number that squares to give $-1$,
and if you search every real number you know, positive or negative, none of
them do. For centuries, that wall was the end of the road: mathematicians
wrote "no solution" and turned back.

Then, gradually, a handful of them asked a different question: what if we
don't turn back? What if we invent the number we need, give it a name, and
see where it leads? It turned out to be exactly what was needed to describe
alternating current, analyse vibrations and signals, and, much later, write
the equations of quantum mechanics. This lesson retraces that journey:
naming the number, learning to work with it, and, by the end, drawing an
actual map of the territory it opens up.

## Naming what we found

Call the new number $i$, defined by exactly one property:

$$
i^2 = -1.
$$

That's the entire definition: one equation. Everything else about $i$
follows from ordinary algebra plus this one substitution rule, applied
wherever a stray $i^2$ turns up.

Once you have $i$, you can build **complex numbers**: numbers of the form
$a + bi$, where $a$ and $b$ are ordinary real numbers. $a$ is called the
**real part** and $b$ the **imaginary part** (note: the imaginary part is the
real number $b$, not $bi$ itself). In $z = 3 - 4i$, for instance, the real
part is $3$ and the imaginary part is $-4$. Nothing you already knew got
thrown away, either: an everyday real number like $7$ is still a complex
number, just one with imaginary part $0$ (i.e. $7 + 0i$).

Before going further, it's worth making sure these new names actually stick.

::widget{type="flashcards" src="cards/key-terms.json"}

## Learning to move around

Every new territory needs rules for getting from one place to another. For
complex numbers, addition and subtraction are the easiest: they work exactly
like collecting like terms in ordinary algebra, real parts with real parts
and imaginary parts with imaginary parts.

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

Try a few of these yourself before moving on.

::widget{type="quiz" src="arithmetic-check.json"}

## The one rule that unlocks everything

Addition was easy because it never really needed $i^2 = -1$ at all.
Multiplication is where that rule finally earns its keep. Expand two complex
numbers exactly as you would any two brackets, then substitute $i^2 = -1$ the
moment it appears:

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

This substitution is the one move that makes the whole subject work, and
it's worth practising until it's automatic.

::widget{type="matching-pairs" src="cards/multiplication-pairs.json"}

:::callout{kind="key"}
One useful discovery along the way: the **complex conjugate** of $a+bi$ is
$a-bi$, the same real part with the sign of the imaginary part flipped.
Multiply a complex number by its own conjugate and the $i$s always cancel
out completely, leaving a real number (you saw this above:
$(1+i)(1-i)=2$). That trick is the key to *dividing* complex numbers, a stop
on the next leg of this journey, not this one.
:::

## Drawing the map

Here's the payoff for all that groundwork: because a complex number $a+bi$ is
really just a pair of real numbers $(a, b)$, you can plot it, with $a$ along
a horizontal **real axis** and $b$ along a vertical **imaginary axis**. This
picture is called the **Argand diagram**, and it turns the number you
couldn't find at the start of this lesson into a perfectly ordinary point on
a page.

It does more than that, too: plotted this way, "adding two complex numbers"
turns out to be exactly "adding two position vectors", a first hint of why
this new territory turns out to be so useful for describing anything that
has both a size and a direction.

Three points are already plotted below. Check their coordinates against
their labels, then drag the fourth point, $Z_4$, to where you think $4 - i$
belongs.

::widget{type="geometry-canvas" src="scenes/argand-diagram.json" width=420 height=420}

If you placed $Z_4$ at $x=4$, $y=-1$, that's exactly right: four across on
the real axis, one down on the imaginary axis.

## Where the journey goes next

Look back at where you started: an equation with "no solution." You now have
a number that solves it, rules for adding and multiplying it, and a map
showing exactly where it lives. That map has one more secret still to give
up: every point on it also has a distance from the origin and a direction
from the real axis, its **modulus** and **argument**, and those two ideas
turn multiplication into something even simpler than the
expand-and-substitute method above. That's the next leg of the trip.
