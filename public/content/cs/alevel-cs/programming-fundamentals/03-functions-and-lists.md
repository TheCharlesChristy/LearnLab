# Functions and lists

## Functions and procedures

A **function** is a named, reusable block of code that can take **parameters** (inputs) and **return** a value. In Python both functions and procedures are written with `def`; the distinction taught at A-level is about behaviour, not syntax:

- A **function** returns a value with a `return` statement, and is typically called where a value is expected, e.g. `total = square(5)`.
- A **procedure** performs an action (such as printing) but does not return a useful value — in Python it simply has no `return` statement (it implicitly returns `None`).

```python
def square(n):
    return n * n

print(square(5))
```

Trace: calling `square(5)` sets the **parameter** `n` to `5` inside the function; `n * n = 5 * 5 = 25` is evaluated and returned by `return`; that returned value is what `print` then displays. Output: `25`.

```python
def greet(name):
    print("Hello, " + name)

greet("Ada")
```

Here `greet` is a procedure — it prints a message itself and returns nothing. Output: `Hello, Ada`.

:::callout{kind="key"}
The **parameter** is the name used inside the function definition (`name` above). The **argument** is the actual value supplied when the function is called (`"Ada"` above). It is easy to conflate the two, but exam mark schemes distinguish them.
:::

A function can take more than one parameter, separated by commas, and parameters can have **default values** used when the caller omits that argument:

```python
def power(base, exponent=2):
    return base ** exponent

print(power(3))       # exponent defaults to 2: 3 ** 2 = 9
print(power(3, 3))    # exponent given explicitly: 3 ** 3 = 27
```

## Lists: 1D arrays

A **list** stores an ordered sequence of values in a single named variable — the closest Python equivalent to the "array" of most exam specifications. Lists are created with square brackets, and elements are accessed by a zero-based **index**:

```python
scores = [10, 20, 30, 40]
print(scores[0])     # 10  -- the first element
print(scores[3])     # 40  -- the fourth element
print(scores[-1])    # 40  -- negative indices count from the end
print(len(scores))   # 4   -- the number of elements
scores[1] = 99        # modify an element in place
print(scores)         # [10, 99, 30, 40]
```

Negative indexing counts backwards from the end of the list: `scores[-1]` is the **last** element, `scores[-2]` is the second-to-last, and so on.

You can iterate over every element of a list directly with a `for` loop, or, if you also need the position, over `range(len(...))`:

```python
scores = [10, 20, 30, 40]
for value in scores:
    print(value)

for i in range(len(scores)):
    print(i, scores[i])
```

## Lists of lists: basic 2D usage

A **2D list** (a list of lists) models a grid or table — for instance, rows and columns of data:

```python
grid = [
    [1, 2, 3],
    [4, 5, 6],
]
print(grid[0])       # [1, 2, 3]        -- the first row (itself a list)
print(grid[1][2])    # 6                -- row 1, column 2
grid[1][0] = 40        # modify a single cell
print(grid)            # [[1, 2, 3], [40, 5, 6]]
```

`grid[1][2]` is read "row 1, column 2": Python first indexes into `grid` to get row `1` (`[4, 5, 6]`), then indexes into that row to get element `2` (`6`, since indexing starts at 0: elements `4, 5, 6` are at indices `0, 1, 2`).

To visit every element of a 2D list, nest one `for` loop inside another — the outer loop walks the rows, the inner loop walks the values within the current row:

```python
grid = [[1, 2, 3], [4, 5, 6]]
total = 0
for row in grid:
    for value in row:
        total = total + value
print(total)
```

Trace: row `[1, 2, 3]` contributes `1 + 2 + 3`; row `[4, 5, 6]` contributes `4 + 5 + 6`. Running total: `0 → 1 → 3 → 6 → 10 → 15 → 21`. The program prints `21`.

## Practice: write a function that processes a list

::widget{type="code-runner" language="python" starter="def double_all(nums):\n    result = []\n    for n in nums:\n        result.append(n * 2)\n    return result\n\nprint(double_all([1, 2, 3]))" rows=10}

Trace this by hand first: `result` starts as an empty list `[]`; for each element of `[1, 2, 3]` its double is appended. What list should be printed? Run the code to check, then try editing `double_all` to triple each value instead, or write a new function `total(nums)` that returns the sum of a list.

:::reveal{title="Worked example: a function that returns the sum of a list"}
```python
def total(nums):
    result = 0
    for n in nums:
        result = result + n
    return result

print(total([5, 1, 9]))
```

Trace: `result` starts at `0`. First pass, `n = 5`: `result = 0 + 5 = 5`. Second pass, `n = 1`: `result = 5 + 1 = 6`. Third pass, `n = 9`: `result = 6 + 9 = 15`. The loop ends (no more elements) and `return result` sends `15` back to the caller, which `print` displays.

Output: `15`.
:::

:::callout{kind="info"}
Writing a function that loops over a parameter (like `total` above) is one of the most common exam question patterns: define a function, pass it a list, and trace what it returns. Practise by predicting the output *before* running the code.
:::
