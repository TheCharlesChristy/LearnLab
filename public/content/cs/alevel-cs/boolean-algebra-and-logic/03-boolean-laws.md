# Boolean laws and simplification

Truth tables prove that two expressions are equal, but they get unwieldy fast. **Boolean laws** let us rewrite and simplify expressions algebraically — exactly like factorising in ordinary algebra. Simpler expressions mean fewer gates, cheaper and faster circuits.

## The core laws

| Law | AND form | OR form |
| --- | --- | --- |
| Identity | $A \cdot 1 = A$ | $A + 0 = A$ |
| Null (annulment) | $A \cdot 0 = 0$ | $A + 1 = 1$ |
| Idempotent | $A \cdot A = A$ | $A + A = A$ |
| Complement | $A \cdot \overline{A} = 0$ | $A + \overline{A} = 1$ |
| Commutative | $A \cdot B = B \cdot A$ | $A + B = B + A$ |
| Associative | $(A \cdot B) \cdot C = A \cdot (B \cdot C)$ | $(A + B) + C = A + (B + C)$ |
| Distributive | $A \cdot (B + C) = A\cdot B + A\cdot C$ | $A + (B \cdot C) = (A + B)\cdot(A + C)$ |
| Absorption | $A \cdot (A + B) = A$ | $A + (A \cdot B) = A$ |

One more law applies to a single variable — **double negation** simply says two NOTs cancel: $\overline{\overline{A}} = A$.

:::callout{kind="key"}
The Boolean distributive law has a twist that ordinary numbers lack: you can distribute OR over AND as well as AND over OR — $A + (B \cdot C) = (A + B)\cdot(A + C)$.
:::

## De Morgan's laws

The two most important laws for negation. To negate a whole bracket, **break the bar and swap the operator**:

$$
\overline{A \cdot B} = \overline{A} + \overline{B}
\qquad\text{and}\qquad
\overline{A + B} = \overline{A} \cdot \overline{B}.
$$

We can check the first one with a truth table — the two output columns match on every row, so the identity holds.

| $A$ | $B$ | $\overline{A \cdot B}$ | $\overline{A} + \overline{B}$ |
| --- | --- | --- | --- |
| 0 | 0 | 1 | 1 |
| 0 | 1 | 1 | 1 |
| 1 | 0 | 1 | 1 |
| 1 | 1 | 0 | 0 |

:::callout{kind="warning"}
A common mistake is to "distribute" the NOT without swapping the operator, writing $\overline{A \cdot B} = \overline{A} \cdot \overline{B}$. That is **wrong** — the operator must flip. Break the bar, then change AND to OR (or OR to AND).
:::

## Simplification in practice

Apply the laws step by step. Use the interactive walk-through below to reveal each stage.

::widget{type="step-reveal" src="simplification-steps.json"}

:::reveal{title="Worked example: simplify a circuit"}
Simplify $A \cdot B + A \cdot \overline{B}$.

1. **Factor out $A$** (distributive law): $A \cdot (B + \overline{B})$.
2. **Complement law**: $B + \overline{B} = 1$, so we have $A \cdot 1$.
3. **Identity law**: $A \cdot 1 = A$.

The whole expression reduces to just $A$ — two gates become a wire. We can confirm with a truth table:

| $A$ | $B$ | $A \cdot B$ | $A \cdot \overline{B}$ | $A\cdot B + A\cdot\overline{B}$ | $A$ |
| --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 0 | 0 | 0 |
| 1 | 0 | 0 | 1 | 1 | 1 |
| 1 | 1 | 1 | 0 | 1 | 1 |

The final two columns agree on every row.
:::

## Practice

::py{src="items/logic-quiz.py" params='{"questions": 5}'}
