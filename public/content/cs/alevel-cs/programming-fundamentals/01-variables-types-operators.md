# Variables, data types and operators

Every program is built from the same small set of ingredients: places to store data, ways to combine and compare that data, and instructions that decide what happens next. This module uses **Python** as the teaching language throughout — the code-runner widgets below execute real Python in your browser, so you can test every idea as you read.

## Variables and assignment

A **variable** is a named location that holds a value. In Python you create one simply by assigning to it with `=` — there is no separate declaration step:

```python
age = 17
pi = 3.14159
name = "Ada"
is_registered = True
```

Python is **dynamically typed**: it works out the type of a variable from the value assigned to it, and a variable can be reassigned to a value of a different type later (though good style avoids doing this without reason). Variable names are case-sensitive, cannot start with a digit, and cannot be a reserved word (`if`, `for`, `return`, …).

## The four primitive data types

A-level specifications require four core primitive types:

| Type    | Holds                        | Example literals      |
| ------- | ----------------------------- | ---------------------- |
| `int`   | whole numbers (no size limit) | `7`, `-3`, `1000`      |
| `float` | numbers with a decimal point  | `3.14`, `-0.5`, `2.0`  |
| `str`   | text, in quotes                | `"hello"`, `'A'`       |
| `bool`  | truth values                   | `True`, `False`        |

The built-in `type()` function reports a value's type, and `int()`, `float()`, `str()` and `bool()` **convert** a value to that type:

```python
x = "42"
print(type(x))        # <class 'str'>
y = int(x)             # convert the string "42" to the integer 42
print(type(y), y)      # <class 'int'> 42
z = float(y)            # 42 -> 42.0
print(z)
```

:::callout{kind="warning"}
`int("3.5")` raises an error — a string containing a decimal point cannot be converted straight to `int`. Convert to `float` first, then to `int`: `int(float("3.5"))` gives `3` (conversion to `int` **truncates**, it does not round).
:::

## Arithmetic operators

| Operator | Meaning              | Example  | Result |
| -------- | -------------------- | -------- | ------ |
| `+`      | addition              | `5 + 2`  | `7`    |
| `-`      | subtraction           | `5 - 2`  | `3`    |
| `*`      | multiplication        | `5 * 2`  | `10`   |
| `/`      | division (always returns a `float`) | `7 / 2` | `3.5` |
| `//`     | integer (floor) division | `7 // 2` | `3` |
| `%`      | modulus (remainder)  | `7 % 2`  | `1`    |
| `**`     | exponent (power)     | `2 ** 3` | `8`    |

`//` and `%` are especially useful together: for any positive integers `a` and `b`, `a == (a // b) * b + a % b`.

## Comparison operators

Comparison operators compare two values and always produce a `bool` (`True` or `False`): `==` (equal to), `!=` (not equal to), `<`, `>`, `<=`, `>=`. Note the double equals sign `==` for comparison — a single `=` is assignment, not comparison, and using it where a comparison is expected is a syntax error.

## Boolean (logical) operators

`and`, `or` and `not` combine or invert `bool` values, exactly as in Boolean algebra:

- `A and B` is `True` only when **both** `A` and `B` are `True`.
- `A or B` is `True` when **at least one** of `A`, `B` is `True`.
- `not A` flips `True` to `False` and vice versa.

```python
raining = True
has_umbrella = False
print(raining and has_umbrella)   # False — only True if both are True
print(raining or has_umbrella)    # True  — at least one is True
print(not raining)                # False — flips True to False
```

## Operator precedence

When an expression mixes several operators, Python evaluates in a fixed order: **exponent, then multiply/divide/floor-divide/modulus, then add/subtract, then comparisons, then `not`, then `and`, then `or`** — brackets `()` always evaluate first and can force a different order.

::widget{type="code-runner" language="python" starter="a = 7\nb = 2\nprint(a / b)\nprint(int(a / b))\nprint(a // b)\nprint(a % b)\nprint(a ** b)" rows=10}

Predict each of the five printed values before you press Run, then check your working against the output.

:::reveal{title="Worked example: evaluating a compound expression"}
Evaluate `x + y * 2 > 10 and not (x == y)` when `x = 5` and `y = 2`.

1. Multiplication first: `y * 2 = 2 * 2 = 4`.
2. Addition: `x + 4 = 5 + 4 = 9`.
3. Comparison: `9 > 10` is `False`.
4. Inside the brackets: `x == y` is `5 == 2`, which is `False`.
5. `not False` is `True`.
6. Finally, `and`: `False and True` is `False`.

So the whole expression evaluates to `False`. Working outward from the brackets and highest-precedence operators first, exactly as with ordinary arithmetic (BIDMAS), avoids mistakes.
:::

:::callout{kind="key"}
A common exam mistake is assuming `and`/`or` are evaluated left-to-right at the same "level" as comparisons. They are not — comparisons always bind tighter than `and`, which binds tighter than `or`. When in doubt, add brackets to make your intention explicit.
:::
