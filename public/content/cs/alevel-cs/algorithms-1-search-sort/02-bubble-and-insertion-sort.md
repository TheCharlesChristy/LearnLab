# Bubble sort and insertion sort

A sorting algorithm rearranges a list into order (usually ascending). We now
meet two simple sorting algorithms, both of which sort **in place** by
repeatedly comparing and moving pairs of elements.

## Bubble sort

Bubble sort repeatedly scans the list, comparing each pair of **adjacent**
elements and swapping them if they are in the wrong order. Each full scan is
called a **pass**. After the first pass, the largest element is guaranteed to
have "bubbled" up to the last position, so the second pass never needs to
look at it; after the second pass the two largest elements are fixed, and so
on.

```python
def bubble_sort(items):
    n = len(items)
    for i in range(n):
        swapped = False
        for j in range(n - 1 - i):
            if items[j] > items[j + 1]:
                items[j], items[j + 1] = items[j + 1], items[j]
                swapped = True
        if not swapped:
            break   # no swaps this pass -> already sorted, stop early
    return items
```

The `swapped` flag is an important optimisation: if a whole pass completes
without a single swap, the list is already sorted and the algorithm can stop
without running the remaining passes.

:::callout{kind="key"}
Bubble sort's **worst case** (a list sorted in reverse order) needs a full
pass for every element, giving roughly $n^2$ comparisons for a list of $n$
elements — it gets slow quickly as lists grow. Its **best case** (a list
that is already sorted) needs only a single pass of comparisons and zero
swaps, thanks to the early-stopping check above.
:::

Use the interactive walk-through below to see every comparison and swap of
each pass, one step at a time.

::widget{type="step-reveal" src="bubble-sort-steps.json"}

## Insertion sort

Insertion sort builds up a **sorted prefix** at the start of the list, one
element at a time. At each step it takes the next unsorted element (the
"key") and shifts the sorted prefix's elements rightwards until it finds the
key's correct position, then inserts it there — much like sorting a hand of
playing cards by picking up one card at a time and sliding it into place
among the cards you're already holding.

```python
def insertion_sort(items):
    for i in range(1, len(items)):
        key = items[i]
        j = i - 1
        while j >= 0 and items[j] > key:
            items[j + 1] = items[j]   # shift this element right
            j -= 1
        items[j + 1] = key            # insert key into the gap
    return items
```

:::callout{kind="info"}
Insertion sort's worst case is also around $n^2$ comparisons (a reverse
sorted list, where every new key has to shift all the way to the front). Its
best case is a list that is **already sorted**: each key only needs a single
comparison against the element to its left, giving roughly $n$ comparisons in
total — insertion sort is a good choice when data is already close to
sorted.
:::

:::reveal{title="Worked example: tracing insertion sort"}
Sort $[5, 2, 9, 1, 6]$ with insertion sort. The sorted prefix starts as just
the first element, $[5]$.

| Key inserted | Shifts needed | List after this step |
| --- | --- | --- |
| $2$ | shift $5$ right, insert $2$ at index 0 | $[2, 5, 9, 1, 6]$ |
| $9$ | $9 > 5$, no shift needed | $[2, 5, 9, 1, 6]$ |
| $1$ | shift $9$, $5$, $2$ right, insert $1$ at index 0 | $[1, 2, 5, 9, 6]$ |
| $6$ | shift $9$ right only ($6 > 5$ stops the shifting) | $[1, 2, 5, 6, 9]$ |

The list is sorted after the fourth key is inserted: $[1, 2, 5, 6, 9]$.
Notice that inserting $9$ needed **no shifts at all**, since it was already
bigger than everything to its left — this is why insertion sort does very
little work on data that is already mostly in order.
:::

## Comparing the two

Both algorithms are easy to implement and both are, informally, "$n^2$"
algorithms in the worst case — you'll make this precise with Big-O notation
in *Algorithms 2: Complexity and Graphs*. Bubble sort's characteristic
behaviour is repeated adjacent swaps that gradually move each element towards
its final position; insertion sort's characteristic behaviour is a
growing sorted prefix that is never disturbed once built. Neither requires
the input to be sorted first — unlike binary search from the previous
lesson, they are exactly how you would *produce* sorted data in the first
place.
