# Functional programming

Functional programming builds programs out of **functions that transform data**, avoiding hidden state and side effects. Four ideas from the A-level specification sit at the core of it: pure functions, immutability, recursion, and higher-order functions.

## Pure functions

A **pure function** has two properties:

1. **No side effects** — it does not change anything outside itself: no modifying a global variable, no printing, no writing to a file, no mutating an object or list passed in.
2. **Same input, same output, always** — given the same arguments, it always returns the same result, no matter how many times it is called or what else has happened in the program.

```python
# Pure: depends only on its arguments, changes nothing outside itself
def add(a, b):
    return a + b

# Impure: depends on / mutates state outside the function
total = 0
def add_to_total(x):
    global total
    total += x        # side effect: changes a variable outside the function
    return total
```

`add(2, 3)` always returns `5`, however many times you call it. `add_to_total(2)` returns a *different* result depending on what `total` already was — call it twice and you get two different answers for the same argument, because it depends on (and changes) state outside the function.

Pure functions are easier to test, reason about, and run in parallel, because you never have to ask "what else might this have changed?" or "what happened earlier that affects this call?".

## Immutability

**Immutability** means data, once created, cannot be changed in place — instead of modifying a structure, a function that "changes" it returns a **new** structure with the change applied, leaving the original untouched.

```python
original = (1, 2, 3)          # a tuple is immutable in Python
# original[0] = 99            # would raise TypeError — cannot assign to a tuple

def with_first_doubled(t):
    return (t[0] * 2,) + t[1:]   # builds and returns a NEW tuple

doubled = with_first_doubled(original)
print(original, doubled)      # (1, 2, 3) (2, 2, 3)  -- original unchanged
```

Because `original` is never mutated, any other part of the program still holding a reference to it can trust that its value never silently changes underneath it — a common source of bugs in code that freely mutates shared lists/objects.

## Recursion

A **recursive function** calls itself to solve a smaller version of the same problem. Every correct recursive function needs two parts:

- a **base case** — the simplest version of the problem, solved directly without a further recursive call (this is what stops the recursion);
- a **recursive case** — solves the problem by calling itself on a smaller/simpler input, then combines that result to answer the original call.

```python
def factorial(n):
    if n == 0:              # base case
        return 1
    return n * factorial(n - 1)   # recursive case
```

`factorial(0)` is defined directly as `1` (the base case). Any other `factorial(n)` is defined as `n` multiplied by `factorial(n - 1)` — a smaller problem that eventually reaches the base case.

```python
def fibonacci(n):
    if n == 0:
        return 0
    if n == 1:               # two base cases
        return 1
    return fibonacci(n - 1) + fibonacci(n - 2)   # recursive case
```

`fibonacci` needs **two** base cases (`n == 0` and `n == 1`) because its recursive case refers two steps back.

::widget{type="code-runner" language="python" starter="def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)\n\ndef fibonacci(n):\n    if n == 0:\n        return 0\n    if n == 1:\n        return 1\n    return fibonacci(n - 1) + fibonacci(n - 2)\n\nprint('factorial(5) =', factorial(5))\nprint('fibonacci(7) =', fibonacci(7))" rows=14}

Try changing the argument to `factorial` to `0` (should print `1` directly from the base case) or to a small negative number and see why that breaks the base case (it never reaches `n == 0`, so it recurses forever until Python raises `RecursionError`).

:::callout{kind="warning"}
Every recursive case must move **strictly closer** to a base case (e.g. `n - 1`, never `n` or `n + 1`), or the recursion never terminates. Missing or unreachable base cases are the most common recursion bug.
:::

## Higher-order functions

A **higher-order function** either takes another function as an argument, returns a function, or both. Python's built-in `map` and `filter` are the classic examples:

- `map(function, iterable)` applies `function` to every element and returns an iterator of the results.
- `filter(function, iterable)` keeps only the elements for which `function` returns `True`.

```python
numbers = [1, 2, 3, 4, 5, 6]

squares = list(map(lambda x: x ** 2, numbers))
evens = list(filter(lambda x: x % 2 == 0, numbers))

print(squares)   # [1, 4, 9, 16, 25, 36]
print(evens)     # [2, 4, 6]
```

`map` and `filter` are higher-order because they take a function (here, a small anonymous `lambda` function) as an argument, and use it to decide what to do with each element — no explicit `for` loop is written by the caller. This is a functional style: describe *what transformation/condition* you want, and let `map`/`filter` apply it, rather than writing the loop mechanics by hand.

A function can also **return** a function, which also makes it higher-order:

```python
def make_multiplier(factor):
    def multiplier(x):
        return x * factor
    return multiplier             # returns a function

double = make_multiplier(2)
triple = make_multiplier(3)
print(double(5), triple(5))       # 10 15
```

:::reveal{title="Worked example: tracing the recursive call stack for factorial(4)"}
Trace `factorial(4)` for:

```python
def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)
```

Each call is **suspended** waiting for the value of its recursive call before it can compute and return its own result — this builds a stack of pending calls that only starts resolving once the base case is hit:

```
factorial(4)
 -> n=4, not base case, needs factorial(3)
   factorial(3)
    -> n=3, not base case, needs factorial(2)
      factorial(2)
       -> n=2, not base case, needs factorial(1)
         factorial(1)
          -> n=1, not base case, needs factorial(0)
            factorial(0)
             -> n=0, BASE CASE -> returns 1
         factorial(1) returns 1 * 1 = 1
       factorial(2) returns 2 * 1 = 2
    factorial(3) returns 3 * 2 = 6
 factorial(4) returns 4 * 6 = 24
```

Unwinding step by step:

1. `factorial(0)` hits the base case directly and returns `1`.
2. `factorial(1) = 1 * factorial(0) = 1 * 1 = 1`.
3. `factorial(2) = 2 * factorial(1) = 2 * 1 = 2`.
4. `factorial(3) = 3 * factorial(2) = 3 * 2 = 6`.
5. `factorial(4) = 4 * factorial(3) = 4 * 6 = 24`.

So `factorial(4)` returns **24**. Five calls are made in total (`factorial(4)`, `factorial(3)`, `factorial(2)`, `factorial(1)`, `factorial(0)`), and none of them return a value until `factorial(0)` returns first — recursive calls build up, then unwind.
:::
