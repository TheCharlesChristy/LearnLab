# The laws of indices

An **index** (also called a **power** or **exponent**) records how many times a base is multiplied by itself: in $x^n$, $x$ is the base and $n$ is the index. This lesson introduces the basic rules for combining indices — skills you will use constantly in the rest of this course.

## Multiplying and dividing powers of the same base

When the bases match, multiplying powers **adds** the indices, and dividing powers **subtracts** them:

$$
x^a \times x^b = x^{a+b}, \qquad \frac{x^a}{x^b} = x^{a-b}.
$$

For example, $x^3 \times x^4 = x^{3+4} = x^7$, and $\dfrac{x^5}{x^2} = x^{5-2} = x^3$. With numbers: $2^3 \times 2^4 = 2^7 = 128$.

:::callout{kind="info"}
These laws only work directly when the bases are identical. $x^3 \times y^4$ cannot be simplified this way, because $x$ and $y$ are different bases.
:::

## Raising a power to a power

To raise a power to a further power, **multiply** the indices:

$$
(x^a)^b = x^{ab}.
$$

For example, $(x^2)^3 = x^{2 \times 3} = x^6$. Checking with numbers: $(2^3)^2 = 2^6 = 64$, and indeed $(2^3)^2 = 8^2 = 64$.

## The zero index

Any non-zero base raised to the power $0$ equals $1$:

$$
x^0 = 1 \quad (x \neq 0).
$$

:::reveal{title="Why does x^0 = 1?"}
Use the division law with $a = b$: $\dfrac{x^n}{x^n} = x^{n-n} = x^0$. But any non-zero number divided by itself equals $1$, so $x^0$ must equal $1$. This isn't a separate rule to memorise — it falls straight out of $x^a / x^b = x^{a-b}$.
:::

## The negative index

A negative index means "take the reciprocal":

$$
x^{-1} = \frac{1}{x}, \qquad \text{more generally } x^{-n} = \frac{1}{x^n}.
$$

For example, $x^{-1} = \dfrac{1}{x}$ and $2^{-3} = \dfrac{1}{2^3} = \dfrac{1}{8} = 0.125$.

:::reveal{title="Worked example: simplify using the laws of indices"}
Simplify $\dfrac{x^5 \times x^{-2}}{x^0}$.

**Numerator first:** $x^5 \times x^{-2} = x^{5+(-2)} = x^3$.

**Denominator:** $x^0 = 1$.

**Divide:** $\dfrac{x^3}{1} = x^3$.

So $\dfrac{x^5 \times x^{-2}}{x^0} = x^3$.
:::

## Fix the vocabulary and laws

Work through the flashcards below until you can state each law without looking — this is the single most useful piece of algebra to have automatic, since every later module (quadratics, graphs, trigonometry) leans on it.

::widget{type="flashcards" src="cards/laws-of-indices.json"}

:::callout{kind="key"}
The five core rules: $x^a \times x^b = x^{a+b}$, $\dfrac{x^a}{x^b} = x^{a-b}$, $(x^a)^b = x^{ab}$, $x^0 = 1$, and $x^{-1} = \dfrac{1}{x}$ (more generally $x^{-n} = \dfrac{1}{x^n}$). Together they let you simplify almost any expression built from powers of a single base.
:::
