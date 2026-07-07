# Linear search and binary search

Searching is one of the most common tasks a program performs: given a list of
values, find out whether a target value is present and, if so, where. There
are two searching algorithms you need to know for A-level: **linear search**,
which works on any list, and **binary search**, which is much faster but only
works on **sorted** data.

## Linear search

Linear search is the simplest possible strategy: start at the first element
and check each element in turn until you find the target or run out of list.

```python
def linear_search(items, target):
    for index, value in enumerate(items):
        if value == target:
            return index
    return -1
```

Linear search makes no assumptions about the order of the data, so it works
on any list, sorted or not. Its cost is measured in **comparisons**: in the
worst case (the target is the last element, or is not present at all) a list
of $n$ elements needs $n$ comparisons. On average, if the target is equally
likely to be anywhere in the list, you need about $n/2$ comparisons.

## Binary search

If the list is **sorted**, we can do far better by repeatedly halving the
region we still need to search:

1. Look at the middle element of the remaining region.
2. If it equals the target, we are done.
3. If the middle element is **less than** the target, the target (if present)
   must be in the **right** half — discard the left half, including the
   middle element.
4. If the middle element is **greater than** the target, discard the
   **right** half instead.
5. Repeat on the remaining half until the target is found or the region is
   empty.

```python
def binary_search(items, target):
    low, high = 0, len(items) - 1
    while low <= high:
        mid = (low + high) // 2
        if items[mid] == target:
            return mid
        elif items[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
```

:::callout{kind="key"}
Binary search only works because the list is **sorted**: throwing away half
the list on the basis of one comparison is only valid if every element on
the "wrong" side of the midpoint is guaranteed to be on the wrong side of the
target too. On unsorted data that guarantee doesn't hold, so binary search
cannot be used — you would have to sort the list first (see the next two
lessons), which itself costs more comparisons than a single linear search.
:::

## Why binary search is faster

Each step of binary search discards **half** of the remaining elements, so
the size of the region left to search halves every time: $n$, then
$\frac{n}{2}$, then $\frac{n}{4}$, and so on. The search ends once one
element is left, after roughly $\log_2 n$ halvings. For a sorted list of
$n = 8$ elements, that means at most $\lfloor \log_2 8 \rfloor + 1 = 4$
comparisons — compared with up to $8$ for linear search. The gap widens
dramatically as $n$ grows: for a million-element sorted list, binary search
needs at most about $20$ comparisons, while linear search could need up to a
million. (You will study this growth formally, using Big‑O notation, in
*Algorithms 2: Complexity and Graphs* — for now, the informal idea that
binary search is "logarithmic" and linear search is "linear" in the list
size is enough.)

| | Linear search | Binary search |
| --- | --- | --- |
| Requires sorted data? | No | Yes |
| Worst case (comparisons, $n=8$) | 8 | 4 |
| Informal growth | linear in $n$ | logarithmic in $n$ |

:::reveal{title="Worked example: tracing binary search"}
Search the sorted list $[3, 7, 12, 19, 24, 31, 42, 50]$ (indices $0$–$7$) for
the target $24$.

| Step | `low` | `high` | `mid` | `items[mid]` | Comparison | Action |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 | 7 | 3 | 19 | $19 < 24$ | discard left half → `low = 4` |
| 2 | 4 | 7 | 5 | 31 | $31 > 24$ | discard right half → `high = 4` |
| 3 | 4 | 4 | 4 | 24 | $24 = 24$ | **found at index 4** |

Binary search needed **3 comparisons**. Linear search checking from the
start would compare $3, 7, 12, 19, 24$ — **5 comparisons** — before finding
the same value at index 4.
:::

## Try it yourself

Run the binary search below, then edit `data` or `target` and re-run to see
how the number of comparisons changes. Try searching for a value that isn't
in the list at all — how does the loop know when to stop?

::widget{type="code-runner" language="python" rows=14 starter="def binary_search(items, target):\n    low, high = 0, len(items) - 1\n    comparisons = 0\n    while low <= high:\n        mid = (low + high) // 2\n        comparisons += 1\n        print(f'checking index {mid} (value {items[mid]})')\n        if items[mid] == target:\n            return mid, comparisons\n        elif items[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1, comparisons\n\ndata = [3, 7, 12, 19, 24, 31, 42, 50]\ntarget = 42\nindex, comparisons = binary_search(data, target)\nprint('index:', index, '  comparisons:', comparisons)"}

:::callout{kind="tip"}
Binary search is a natural fit for a **recursive** definition too: search the
whole list, and if the midpoint isn't the target, recursively binary-search
just the correct half. The iterative version above does the same job with a
loop instead of recursive calls.
:::
