# Solving linear equations and rearranging formulae

A **linear equation** contains an unknown (usually $x$) with no powers higher than $1$. Solving it means finding the value of the unknown that makes the equation true. **Rearranging a formula** uses exactly the same moves, but the goal is a new formula rather than a number.

## The balance method

Think of an equation as a set of balanced scales: whatever you do to one side, you must do to the other, so the balance is preserved. The usual strategy is to undo operations in reverse order, working towards the unknown on its own.

$$
3x + 5 = 17 \;\Rightarrow\; 3x = 12 \;\text{(subtract 5 from both sides)}\;\Rightarrow\; x = 4 \;\text{(divide both sides by 3)}.
$$

## Equations with brackets

If the equation has a bracket, expand it first, then solve as usual:

$$
2(x + 3) = 16 \;\Rightarrow\; 2x + 6 = 16 \;\Rightarrow\; 2x = 10 \;\Rightarrow\; x = 5.
$$

## Unknowns on both sides

When $x$ appears on both sides, collect all the $x$-terms on one side and all the number terms on the other before dividing:

$$
5x - 3 = 2x + 9.
$$

Subtract $2x$ from both sides: $3x - 3 = 9$. Add $3$ to both sides: $3x = 12$. Divide by $3$: $x = 4$.

:::reveal{title="Worked example: solve 4(x-1) = 2x + 10"}
Solve $4(x - 1) = 2x + 10$.

**Expand the bracket:** $4x - 4 = 2x + 10$.

**Collect $x$-terms on the left:** subtract $2x$ from both sides: $2x - 4 = 10$.

**Collect numbers on the right:** add $4$ to both sides: $2x = 14$.

**Divide by 2:** $x = 7$.

**Check:** $4(7-1) = 4 \times 6 = 24$, and $2(7) + 10 = 14 + 10 = 24$. Both sides match. ✓
:::

## Rearranging formulae (changing the subject)

A formula like $y = 3x + 2$ has $y$ as its **subject** — it is written in terms of the other letters. To make $x$ the subject instead, apply the balance method to isolate $x$:

$$
y = 3x + 2 \;\Rightarrow\; y - 2 = 3x \;\text{(subtract 2)}\;\Rightarrow\; x = \frac{y-2}{3} \;\text{(divide by 3)}.
$$

Another example: make $r$ the subject of the circle circumference formula $C = 2\pi r$.

$$
C = 2\pi r \;\Rightarrow\; r = \frac{C}{2\pi} \;\text{(divide both sides by } 2\pi\text{)}.
$$

:::callout{kind="tip"}
Rearranging is solving "for a letter" instead of solving "for a number" — the same balance moves (add, subtract, multiply, divide, expand brackets) apply in exactly the same way.
:::

## Check your working

Use the code runner to verify a solved equation by substituting the answer back into both sides — if they're equal, the solution is correct.

::widget{type="code-runner" language="python" starter="# Check the solution to 5x - 3 = 2x + 9\nx = 4  # the claimed solution\n\nlhs = 5*x - 3\nrhs = 2*x + 9\n\nprint('Left-hand side:', lhs)\nprint('Right-hand side:', rhs)\nprint('Solution checks out?', lhs == rhs)" rows=10}

:::callout{kind="key"}
Solve linear equations by undoing operations in reverse (expand brackets first, then collect unknowns on one side and numbers on the other). Rearranging a formula to change the subject uses identical balance moves, applied to letters instead of numbers.
:::
