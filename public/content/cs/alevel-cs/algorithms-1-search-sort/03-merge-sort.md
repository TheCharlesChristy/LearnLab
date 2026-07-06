# Merge sort

Bubble sort and insertion sort both work directly on the whole list. Merge
sort instead uses **divide and conquer**: split the problem into smaller
pieces, solve each piece, then combine the solutions.

## The idea

1. **Divide**: split the list into two halves.
2. **Conquer**: sort each half (by recursively applying merge sort to it —
   a half of size $1$ is already sorted, and is the base case).
3. **Combine**: **merge** the two now-sorted halves back into one sorted
   list.

```python
def merge_sort(items):
    if len(items) <= 1:
        return items
    mid = len(items) // 2
    left = merge_sort(items[:mid])
    right = merge_sort(items[mid:])
    return merge(left, right)
```

## The merge step

The clever part is `merge`: given two lists that are *already sorted*, it
builds a single sorted list by repeatedly comparing the two lists' front
elements and taking the smaller one.

```python
def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])   # copy across whatever is left of `left`
    result.extend(right[j:])  # ...or of `right`
    return result
```

Because both input lists are sorted, the smallest element overall must be at
the front of one of them, so a single left-to-right scan (never backtracking)
is enough to produce the merged, sorted result.

:::callout{kind="key"}
Merge sort needs extra memory to hold the two half-lists and the merged
result as it goes — unlike bubble sort and insertion sort, which sort **in
place**. In exchange, its performance does not depend on how the input was
originally ordered: dividing the list always takes the same shape (roughly
$\log_2 n$ levels of splitting), and each level does about $n$ work merging,
giving a far better informal growth rate than the $n^2$ behaviour of bubble
and insertion sort — you'll express this precisely, as $O(n \log n)$, in
*Algorithms 2: Complexity and Graphs*.
:::

:::reveal{title="Worked example: tracing merge sort"}
Sort $[8, 3, 5, 2]$ with merge sort.

**Divide.** Split into $[8, 3]$ and $[5, 2]$. Each of those splits again into
single elements: $[8]$, $[3]$, $[5]$, $[2]$ — all base cases, already
"sorted" on their own.

**Conquer (merge the smallest pairs back together).**

- Merge $[8]$ and $[3]$: compare $8$ and $3$ → take $3$ first, then the
  only element left, $8$ → $[3, 8]$.
- Merge $[5]$ and $[2]$: compare $5$ and $2$ → take $2$ first, then $5$ →
  $[2, 5]$.

**Combine (merge the two sorted halves).** Merge $[3, 8]$ with $[2, 5]$:

| Compare | Result so far |
| --- | --- |
| $3$ vs $2$ → take $2$ | $[2]$ |
| $3$ vs $5$ → take $3$ | $[2, 3]$ |
| $8$ vs $5$ → take $5$ | $[2, 3, 5]$ |
| only $8$ left → copy it across | $[2, 3, 5, 8]$ |

Final sorted list: $[2, 3, 5, 8]$.
:::

## Try it yourself

Run the merge sort below on the list `[8, 3, 5, 2, 9, 1]`, then edit the list
and re-run. Try a list that is already sorted, and one in reverse order —
does the number of comparisons change much? (Compare this with what you saw
for bubble sort and insertion sort in the previous lesson.)

::widget{type="code-runner" language="python" rows=16 starter="def merge(left, right):\n    result = []\n    i = j = 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            result.append(left[i]); i += 1\n        else:\n            result.append(right[j]); j += 1\n    result.extend(left[i:])\n    result.extend(right[j:])\n    return result\n\ndef merge_sort(items):\n    if len(items) <= 1:\n        return items\n    mid = len(items) // 2\n    left = merge_sort(items[:mid])\n    right = merge_sort(items[mid:])\n    return merge(left, right)\n\ndata = [8, 3, 5, 2, 9, 1]\nprint('sorted:', merge_sort(data))"}

## Choosing an algorithm

There is no single "best" sorting algorithm — the right choice depends on
the situation:

- **Bubble sort**: simple to write and explain, but slow on large lists;
  reasonable only for small or already-nearly-sorted data.
- **Insertion sort**: also simple, and genuinely efficient when the data is
  already close to sorted (each new element needs few shifts).
- **Merge sort**: consistently fast regardless of the input order, at the
  cost of using extra memory for the temporary lists created while merging.

You will make these comparisons precise — with formal Big-O time and space
complexity — in *Algorithms 2: Complexity and Graphs*.
