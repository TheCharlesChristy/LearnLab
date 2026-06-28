# Truth tables

A **truth table** lists the output of a Boolean expression for **every** possible combination of its inputs. It is the definitive way to describe what a circuit does — and to prove that two different expressions are actually the same.

## Counting the rows

With $n$ inputs there are $2^n$ combinations, so the table has $2^n$ rows:

| Inputs | Rows |
| --- | --- |
| 1 | 2 |
| 2 | 4 |
| 3 | 8 |

We always list the input combinations in **ascending binary order** — treat the inputs as a binary number counting up from $0$.

| $A$ | $B$ | $C$ |
| --- | --- | --- |
| 0 | 0 | 0 |
| 0 | 0 | 1 |
| 0 | 1 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 0 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |
| 1 | 1 | 1 |

:::callout{kind="tip"}
Build the table left-to-right: the rightmost input alternates every row ($0,1,0,1,\dots$), the next alternates every two rows, the next every four, and so on. This guarantees you never miss a combination.
:::

## Building a table for a compound expression

To fill in $A \cdot B + \overline{C}$, add a column for each intermediate result, then combine.

| $A$ | $B$ | $C$ | $A \cdot B$ | $\overline{C}$ | $A \cdot B + \overline{C}$ |
| --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 1 | 1 |
| 0 | 0 | 1 | 0 | 0 | 0 |
| 0 | 1 | 0 | 0 | 1 | 1 |
| 0 | 1 | 1 | 0 | 0 | 0 |
| 1 | 0 | 0 | 0 | 1 | 1 |
| 1 | 0 | 1 | 0 | 0 | 0 |
| 1 | 1 | 0 | 1 | 1 | 1 |
| 1 | 1 | 1 | 1 | 0 | 1 |

## Generate truth tables in code

The course library ships a `truth_table` helper. Here it is printing the table for XOR:

```python
from courselib.cs import truth_table

# output is 1 only when A and B differ -> XOR
for inputs, out in truth_table(lambda a, b: a != b, 2):
    A, B = int(inputs[0]), int(inputs[1])
    print(f'A={A} B={B} -> {int(out)}')
```

Run the playground below, then edit the lambda to explore your own expressions.

::widget{type="code-runner" language="python" starter="from courselib.cs import truth_table; print(truth_table(lambda a, b: a and b, 2))" rows=8}

:::reveal{title="Worked example: are two expressions equal?"}
Claim: $A + (A \cdot B)$ is the same as just $A$ (this is the **absorption law**). Build both columns and compare.

| $A$ | $B$ | $A \cdot B$ | $A + (A \cdot B)$ | $A$ |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 0 | 0 |
| 1 | 0 | 0 | 1 | 1 |
| 1 | 1 | 1 | 1 | 1 |

The last two columns are identical for every row, so $A + (A \cdot B) = A$. Two expressions are equal **if and only if** their output columns match on every row.
:::

## Practice

::py{src="items/logic-quiz.py" params='{"questions": 5}'}
