# Big-O notation and complexity classes

When we compare two algorithms that solve the same problem, we rarely care about exact running times in milliseconds — those depend on the CPU, the programming language and even how busy the machine is. Instead computer scientists ask: **how does the amount of work grow as the input gets bigger?** That question is answered with **time complexity**, and we describe it using **Big-O notation**.

There is a matching idea for memory: **space complexity** measures how much extra memory an algorithm needs as the input grows (for example, merge sort needs an extra array the same size as the input, so its space complexity is $O(n)$, while bubble sort sorts in place and needs only $O(1)$ extra memory).

## What Big-O measures

$O(f(n))$ describes the **worst-case growth rate** of the number of basic operations (comparisons, assignments, array accesses) an algorithm performs, as a function of the input size $n$, ignoring constant factors and lower-order terms. "Ignoring constants" is deliberate: $O(3n + 7)$ and $O(n)$ describe the same growth rate, because for large $n$ the shape of the curve — not the multiplier — is what matters.

## The complexity classes you need to know

From best (slowest-growing) to worst (fastest-growing):

| Class | Name | Example |
| --- | --- | --- |
| $O(1)$ | constant | array index lookup `a[i]` |
| $O(\log n)$ | logarithmic | binary search |
| $O(n)$ | linear | linear search |
| $O(n \log n)$ | linearithmic | merge sort |
| $O(n^2)$ | quadratic | bubble sort, insertion sort |
| $O(2^n)$ | exponential | brute-force subset generation |

The table below shows why the class matters far more than the hardware: it counts roughly how many operations each class needs for growing $n$.

| $n$ | $O(1)$ | $O(\log n)$ | $O(n)$ | $O(n \log n)$ | $O(n^2)$ | $O(2^n)$ |
| --- | --- | --- | --- | --- | --- | --- |
| 10 | 1 | ~3 | 10 | ~33 | 100 | 1,024 |
| 100 | 1 | ~7 | 100 | ~664 | 10,000 | ~$1.3 \times 10^{30}$ |
| 1,000 | 1 | ~10 | 1,000 | ~9,966 | 1,000,000 | astronomically large |

:::callout{kind="key"}
Constant and logarithmic algorithms barely notice a bigger input. Linear and linearithmic algorithms scale reasonably. Quadratic algorithms become painful past a few thousand items. Exponential algorithms are only usable for tiny $n$ — doubling the input roughly *squares* the work.
:::

## Grounding the classes in algorithms you already know

From `algorithms-1-search-sort`:

- **Linear search** scans the array from the start until it finds the target (or reaches the end). In the worst case it inspects every one of the $n$ elements, so it is $O(n)$.
- **Binary search** only works on a **sorted** array. Each comparison eliminates half of the remaining elements, so the search space shrinks $n \to n/2 \to n/4 \to \dots \to 1$. The number of halvings needed is $\log_2 n$, so binary search is $O(\log n)$.
- **Bubble sort** repeatedly steps through the array swapping adjacent out-of-order pairs. In the worst case (a reverse-sorted array) it needs about $n$ passes of about $n$ comparisons each, so it is $O(n^2)$.
- **Insertion sort** builds up a sorted section one element at a time, shifting existing elements along to make room. In the worst case (reverse-sorted input) each of the $n$ insertions shifts up to $n$ elements, so it too is $O(n^2)$.
- **Merge sort** splits the array in half recursively ($\log n$ levels of splitting) and merges each level back together in $O(n)$ work, giving $O(n \log n)$ overall — much better than the quadratic sorts for large inputs.

## Best, worst and average case

The same algorithm can behave very differently depending on the *arrangement* of the input, not just its size. We describe three cases:

- **Best case** — the most favourable input for the algorithm.
- **Worst case** — the least favourable input; this is what Big-O usually describes.
- **Average case** — the expected behaviour over all possible inputs (assuming, e.g., a random order).

| Algorithm | Best case | Worst case | Average case |
| --- | --- | --- | --- |
| Linear search | $O(1)$ — target is the first element | $O(n)$ — target is last, or absent | $O(n)$ — roughly $n/2$ comparisons |
| Binary search | $O(1)$ — target is the middle element | $O(\log n)$ | $O(\log n)$ |
| Bubble sort | $O(n)$ — already sorted (with an early-exit flag) | $O(n^2)$ — reverse sorted | $O(n^2)$ |
| Insertion sort | $O(n)$ — already sorted | $O(n^2)$ — reverse sorted | $O(n^2)$ |
| Merge sort | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ |

:::callout{kind="info"}
Merge sort's best, worst and average cases are all $O(n \log n)$ — it always splits and merges the same way regardless of the input order. That predictability is one reason it is preferred when worst-case guarantees matter.
:::

## See the growth rates for yourself

Run the code below, then edit `sizes` to see how quickly $O(n^2)$ overtakes $O(n \log n)$ and $O(n)$ as $n$ grows.

::widget{type="code-runner" language="python" starter="import math\n\ndef linear(n):\n    return n\n\ndef linearithmic(n):\n    return n * math.log2(n) if n > 1 else n\n\ndef quadratic(n):\n    return n * n\n\nfor n in [10, 100, 1000, 10000]:\n    print(f'n={n:>6}  O(n)={linear(n):>10.0f}  O(n log n)={linearithmic(n):>12.0f}  O(n^2)={quadratic(n):>12.0f}')" rows=14}

:::reveal{title="Worked example: comparisons for binary search on 16 items"}
How many comparisons does binary search need, worst case, on a sorted array of 16 elements?

Each comparison halves the remaining search space:

1. 16 items remain → compare → 8 items remain
2. 8 items remain → compare → 4 items remain
3. 4 items remain → compare → 2 items remain
4. 2 items remain → compare → 1 item remains (found, or search space exhausted)

That is **4 comparisons**, and $\log_2 16 = 4$ — matching the $O(\log n)$ prediction exactly. Compare that with linear search, which could need up to **16** comparisons on the same array (one per element).
:::

The next lesson moves from single sequences to a richer data structure — **graphs** — and asks the same complexity questions about how we store and search them.
