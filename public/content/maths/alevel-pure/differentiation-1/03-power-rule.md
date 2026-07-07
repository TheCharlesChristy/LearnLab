# The power rule

First principles gave us $\frac{\mathrm{d}}{\mathrm{d}x}(x^2) = 2x$ and $\frac{\mathrm{d}}{\mathrm{d}x}(x^3) = 3x^2$. The pattern is unmistakable, and it generalises to a single rule.

## The rule

If $f(x) = a x^n$ (where $a$ is a constant and $n$ is any real number) then

$$
f'(x) = a n x^{n-1}.
$$

In words: **multiply by the power, then reduce the power by one.**

:::callout{kind="key"}
To differentiate $ax^n$: bring the power $n$ down as a multiplier and subtract $1$ from the power, giving $anx^{n-1}$.
:::

## Two more facts you will use constantly

The derivative is **linear**, which means:

- The derivative of a constant is $0$. A constant graph is horizontal, so its gradient is everywhere zero.
- You differentiate a sum term by term: $\frac{\mathrm{d}}{\mathrm{d}x}\big(f(x) + g(x)\big) = f'(x) + g'(x)$.

## Examples

| $f(x)$ | $f'(x)$ |
| --- | --- |
| $x^5$ | $5x^4$ |
| $4x^3$ | $12x^2$ |
| $7x$ | $7$ |
| $9$ | $0$ |
| $3x^4 - 2x + 1$ | $12x^3 - 2$ |

The curve $y = x^2$ below has its tangent gradient given by $2x$ — exactly the power rule applied to $x^2$.

::widget{type="function-grapher" expr="x^2" tangent=true xmin=-4 xmax=4}

:::reveal{title="Worked example: differentiate and evaluate"}
Let $f(x) = 3x^4 - 5x^2 + 2$. Differentiate term by term using the power rule:

$$
f'(x) = 3 \cdot 4 x^{3} - 5 \cdot 2 x^{1} + 0 = 12x^3 - 10x.
$$

To find the gradient at $x = 2$:

$$
f'(2) = 12(2)^3 - 10(2) = 12 \times 8 - 20 = 96 - 20 = 76.
$$

So the gradient of the curve at $x = 2$ is $76$.
:::

## Practice

Try the questions below. They are generated fresh each time, so refresh for more practice.

::py{src="items/power-rule-quiz.py" params='{"questions": 4}'}

When you are confident, attempt the end-of-module assessment.
