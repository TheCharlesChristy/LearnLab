# Logic operators

Every digital system, from a calculator to a CPU, is built from **logic gates** — tiny circuits that take one or more binary inputs (each $0$ or $1$) and produce a single binary output. The mathematics that describes them is **Boolean algebra**, where variables take only the values $0$ (false) and $1$ (true).

There are six operators you must know.

## NOT (inversion)

`NOT` takes one input and flips it: $0$ becomes $1$, and $1$ becomes $0$. It is written $\overline{A}$ or $\lnot A$.

| $A$ | $\overline{A}$ |
| --- | --- |
| 0 | 1 |
| 1 | 0 |

## AND, OR and XOR

These take two inputs.

- **AND** ($A \cdot B$): output is $1$ only when **both** inputs are $1$.
- **OR** ($A + B$): output is $1$ when **at least one** input is $1$.
- **XOR** ($A \oplus B$): "exclusive or" — output is $1$ only when the inputs **differ**.

| $A$ | $B$ | $A \cdot B$ | $A + B$ | $A \oplus B$ |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 1 | 1 |
| 1 | 0 | 0 | 1 | 1 |
| 1 | 1 | 1 | 1 | 0 |

:::callout{kind="key"}
Read the symbols as arithmetic: $\cdot$ behaves like multiply (a single $0$ forces the AND to $0$) and $+$ behaves like add-then-cap-at-1 (a single $1$ forces the OR to $1$).
:::

## NAND and NOR (the universal gates)

`NAND` and `NOR` are simply `AND` and `OR` followed by a `NOT`:

- **NAND** ($\overline{A \cdot B}$): the inverse of AND — output is $0$ **only** when both inputs are $1$.
- **NOR** ($\overline{A + B}$): the inverse of OR — output is $1$ **only** when both inputs are $0$.

| $A$ | $B$ | $\overline{A \cdot B}$ (NAND) | $\overline{A + B}$ (NOR) |
| --- | --- | --- | --- |
| 0 | 0 | 1 | 1 |
| 0 | 1 | 1 | 0 |
| 1 | 0 | 1 | 0 |
| 1 | 1 | 0 | 0 |

:::callout{kind="info"}
NAND and NOR are called **universal** gates because any other gate — AND, OR, NOT, XOR — can be built from copies of just one of them. Real chips often use only NAND gates for this reason.
:::

## Try the operators in code

In Python, `and`, `or` and `not` behave exactly like the Boolean operators above. Here is every gate for one pair of inputs:

```python
A = True
B = False
print('AND :', A and B)
print('OR  :', A or B)
print('NOT A:', not A)
print('XOR :', A != B)
print('NAND:', not (A and B))
print('NOR :', not (A or B))
```

Now try it yourself — run the playground below, then change the inputs and operators to watch each gate respond.

::widget{type="code-runner" language="python" starter="A = True; B = False; print('AND', A and B)" rows=8}

:::reveal{title="Worked example: evaluate a compound expression"}
Evaluate $A \cdot \overline{B} + C$ when $A = 1$, $B = 1$, $C = 0$.

1. Inner NOT first: $\overline{B} = \overline{1} = 0$.
2. The AND: $A \cdot \overline{B} = 1 \cdot 0 = 0$.
3. The OR: $0 + C = 0 + 0 = 0$.

So the expression evaluates to $0$. Operator precedence is **NOT, then AND, then OR** — just like "brackets, then multiply, then add" in ordinary arithmetic.
:::

## Practice

These questions are generated fresh each time — refresh for more.

::py{src="items/logic-quiz.py" params='{"questions": 5}'}
