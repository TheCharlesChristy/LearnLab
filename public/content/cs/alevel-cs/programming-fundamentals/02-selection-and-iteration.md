# Selection and iteration

Every program, no matter how complex, is built from just **three fundamental control structures**:

1. **Sequence** — statements execute one after another, top to bottom (this is the default; you have been using it since lesson 1).
2. **Selection** — the program chooses between different paths depending on a condition (`if` / `elif` / `else`).
3. **Iteration** — the program repeats a block of statements (`for` and `while` loops).

This lesson covers selection and iteration in Python, and gives you practice **tracing** code by hand — a core exam skill.

## Selection: if / elif / else

```python
age = 15
if age < 5:
    price = 0
elif age < 18:
    price = 5
else:
    price = 10
print(price)
```

Python checks each condition **in order** and runs the first block whose condition is `True`, skipping the rest. Indentation (4 spaces is conventional) — not braces — marks which statements belong to which branch; this is a hard rule in Python, not just a style choice.

Tracing this by hand: `age` is `15`. `age < 5` is `False`, so Python checks the `elif`: `age < 18` is `True`, so `price` is set to `5` and the `else` branch is skipped entirely. The program prints `5`.

:::callout{kind="info"}
`elif` and `else` are both optional, and there can be any number of `elif` branches, but at most one `else`, and it must come last.
:::

## Iteration: for loops

A `for` loop repeats a block **once for each item** in a sequence — typically a `range(...)` of numbers or a list:

```python
total = 0
for n in [3, 7, 2]:
    total = total + n
print(total)
```

Trace: `total` starts at `0`. First pass, `n = 3`: `total = 0 + 3 = 3`. Second pass, `n = 7`: `total = 3 + 7 = 10`. Third pass, `n = 2`: `total = 10 + 2 = 12`. The loop then ends (no more items), and the program prints `12`.

`range(start, stop)` generates the integers from `start` up to (but **not including**) `stop`:

```python
for i in range(1, 5):
    print(i)   # prints 1, 2, 3, 4 — 5 is excluded
```

## Iteration: while loops

A `while` loop repeats **as long as its condition stays `True`**, checking the condition **before** every pass (including the first) — so its body might run zero times if the condition is `False` immediately:

```python
count = 3
while count > 0:
    print(count)
    count = count - 1
print("done")
```

Trace: `count = 3`, condition `3 > 0` is `True` → prints `3`, `count` becomes `2`. Condition `2 > 0` is `True` → prints `2`, `count` becomes `1`. Condition `1 > 0` is `True` → prints `1`, `count` becomes `0`. Condition `0 > 0` is `False` → loop ends. Finally prints `done`. Output, in order: `3`, `2`, `1`, `done`.

:::callout{kind="key"}
Use a `for` loop when you know in advance how many times to repeat (or you are working through every item of a sequence). Use a `while` loop when the repetition depends on a condition that might change unpredictably — for example, repeating "ask the user for a password" until they get it right.
:::

## Practice: trace this loop yourself

::widget{type="code-runner" language="python" starter="numbers = [4, 9, 15, 22, 7, 10]\ntotal = 0\nfor n in numbers:\n    if n % 2 == 0:\n        total = total + n\nprint(total)" rows=10}

Before running it, trace the code by hand: which numbers in the list are even, and what should the final printed total be? Then run it to check yourself, and try changing the list or the condition (e.g. sum the odd numbers instead).

:::reveal{title="Worked example: tracing a while loop"}
What is printed by the following code?

```python
x = 1
i = 1
while i <= 4:
    x = x * i
    i = i + 1
print(x)
```

| Pass | Condition `i <= 4` | `x = x * i`      | `i = i + 1` |
| ---- | ------------------- | ---------------- | ----------- |
| 1    | `1 <= 4` → True      | `x = 1 * 1 = 1`   | `i = 2`     |
| 2    | `2 <= 4` → True      | `x = 1 * 2 = 2`   | `i = 3`     |
| 3    | `3 <= 4` → True      | `x = 2 * 3 = 6`   | `i = 4`     |
| 4    | `4 <= 4` → True      | `x = 6 * 4 = 24`  | `i = 5`     |
| —    | `5 <= 4` → False     | loop ends         | —           |

The program prints `24` — this loop computes $4! = 4 \times 3 \times 2 \times 1$, the factorial of 4, by repeated multiplication.
:::
