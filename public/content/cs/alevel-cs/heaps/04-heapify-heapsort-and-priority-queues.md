# Heapify, heapsort and priority queues

The previous two lessons grew a heap one value at a time. This lesson covers three things built on top of insert/extract: turning a *whole* unsorted array into a heap in one pass, using a heap to sort a list in place, and the abstract data type — the **priority queue** — that a heap exists to implement efficiently.

## Building a heap from scratch: heapify

You could build a heap from $n$ unordered values by inserting them one at a time, but that costs $O(n \log n)$ overall ($n$ insertions, each up to $O(\log n)$). There is a faster way, called **heapify** or **build-heap**, that arranges the same $n$ values into a valid heap in $O(n)$ — genuinely faster, not just a smaller constant.

The trick: a single leaf node is *already* a valid (trivial) heap on its own — it has no children to violate the heap property with. So work from the **last non-leaf node backwards to the root**, sift-down-ing each one in turn. By the time sift-down runs on a given node, both of its subtrees are already valid heaps (because everything below it, and to its right at the same level, was already processed), so one sift-down per node is enough to fix that node's whole subtree.

```python
def sift_down(heap, i, n):
    while True:
        left, right = 2 * i + 1, 2 * i + 2
        smallest = i
        if left < n and heap[left] < heap[smallest]:
            smallest = left
        if right < n and heap[right] < heap[smallest]:
            smallest = right
        if smallest == i:
            break
        heap[i], heap[smallest] = heap[smallest], heap[i]
        i = smallest


def heapify(arr):
    n = len(arr)
    for i in range(n // 2 - 1, -1, -1):
        sift_down(arr, i, n)
```

`n // 2 - 1` is the index of the **last node that has any children** — every index from there upward through the tree needs checking; everything after it is already a leaf.

:::callout{kind="key"}
Heapify looks like it should cost $O(n \log n)$ — up to $n$ calls to an $O(\log n)$ operation — but the bound is actually $O(n)$. Most nodes are near the bottom of the tree and have very little distance left to sift down: only a small fraction of nodes are near the root, where a sift-down could actually take the full $O(\log n)$ steps. Summed across the whole tree, the work totals $O(n)$, not $O(n \log n)$. This is a classic case where the naive per-call bound overstates the true total cost — always worth watching for when many small operations of varying, height-dependent cost are chained together.
:::

:::reveal{title="Worked example: heapifying [4, 10, 3, 5, 1]"}
Array: `[4, 10, 3, 5, 1]` (indices 0–4, $n = 5$). Last non-leaf index: $n//2 - 1 = 1$.

**Sift down from index 1** (value `10`). Children: index 3 (`5`) and index 4 (`1`). Smaller child is `1` (index 4). $10 > 1$, swap → `[4, 1, 3, 5, 10]`. Continue from index 4 — no children (indices 9, 10 don't exist) — stop.

**Sift down from index 0** (value `4`). Children: index 1 (`1`) and index 2 (`3`). Smaller child is `1` (index 1). $4 > 1$, swap → `[1, 4, 3, 5, 10]`. Continue from index 1 (value `4`). Children: index 3 (`5`) and index 4 (`10`). Smaller child is `5`. $4 > 5$ is false — stop.

Final heap: `[1, 4, 3, 5, 10]`. Check: $1 \le 4$, $1 \le 3$, $4 \le 5$, $4 \le 10$ — a valid min-heap, built in two sift-downs rather than five insertions.
:::

Run the heapify above, then try it on your own unsorted list:

::widget{type="code-runner" language="python" starter="def sift_down(heap, i, n):\n    while True:\n        left, right = 2 * i + 1, 2 * i + 2\n        smallest = i\n        if left < n and heap[left] < heap[smallest]:\n            smallest = left\n        if right < n and heap[right] < heap[smallest]:\n            smallest = right\n        if smallest == i:\n            break\n        heap[i], heap[smallest] = heap[smallest], heap[i]\n        i = smallest\n\n\ndef heapify(arr):\n    n = len(arr)\n    for i in range(n // 2 - 1, -1, -1):\n        sift_down(arr, i, n)\n\n\ndef is_min_heap(arr):\n    for i in range(len(arr)):\n        left, right = 2 * i + 1, 2 * i + 2\n        if left < len(arr) and arr[i] > arr[left]:\n            return False\n        if right < len(arr) and arr[i] > arr[right]:\n            return False\n    return True\n\n\ndata = [4, 10, 3, 5, 1]\nheapify(data)\nprint('heapified:', data)\nprint('valid min-heap:', is_min_heap(data))" solutionTest="d = [4, 10, 3, 5, 1]\nheapify(d)\nassert d == [1, 4, 3, 5, 10]\nassert is_min_heap(d) is True" rows=20}

## Heapsort

**Heapsort** sorts an array in place using exactly the two heap operations already covered, applied to a **max-heap**:

1. **Build** a max-heap from the whole array — $O(n)$, by the same heapify idea above (comparisons flipped).
2. Repeatedly **swap the root (the current largest value) with the last element of the still-unsorted region**, shrink the "heap part" of the array by one, and sift-down the new root to restore the max-heap property over the smaller region. Do this $n - 1$ times.

Each of the $n$ extractions costs $O(\log n)$ for its sift-down, giving **heapsort an overall $O(n \log n)$ time complexity** — the same class as merge sort — but, unlike merge sort, heapsort needs no extra array: the largest values simply accumulate, already in their sorted final positions, at the end of the *same* array the heap lives in. That makes it $O(1)$ extra space, a genuine advantage over merge sort's $O(n)$.

```python
def heapsort(arr):
    n = len(arr)

    def sift_down_max(i, size):
        while True:
            left, right = 2 * i + 1, 2 * i + 2
            largest = i
            if left < size and arr[left] > arr[largest]:
                largest = left
            if right < size and arr[right] > arr[largest]:
                largest = right
            if largest == i:
                break
            arr[i], arr[largest] = arr[largest], arr[i]
            i = largest

    for i in range(n // 2 - 1, -1, -1):
        sift_down_max(i, n)

    for end in range(n - 1, 0, -1):
        arr[0], arr[end] = arr[end], arr[0]
        sift_down_max(0, end)
```

Try it, then compare against the sorting algorithms from *Algorithms 1*:

::widget{type="code-runner" language="python" starter="def heapsort(arr):\n    n = len(arr)\n\n    def sift_down_max(i, size):\n        while True:\n            left, right = 2 * i + 1, 2 * i + 2\n            largest = i\n            if left < size and arr[left] > arr[largest]:\n                largest = left\n            if right < size and arr[right] > arr[largest]:\n                largest = right\n            if largest == i:\n                break\n            arr[i], arr[largest] = arr[largest], arr[i]\n            i = largest\n\n    for i in range(n // 2 - 1, -1, -1):\n        sift_down_max(i, n)\n\n    for end in range(n - 1, 0, -1):\n        arr[0], arr[end] = arr[end], arr[0]\n        sift_down_max(0, end)\n\n\ndata = [8, 3, 5, 2, 9, 1, 7]\nheapsort(data)\nprint('sorted:', data)" solutionTest="d = [8, 3, 5, 2, 9, 1, 7]\nheapsort(d)\nassert d == [1, 2, 3, 5, 7, 8, 9]" rows=22}

## The priority queue ADT

A **priority queue** is an abstract data type that, unlike a plain queue's strict FIFO order, always serves the item with the **highest priority** next, regardless of arrival order. Its core operations are exactly the two a heap provides efficiently:

| Priority queue operation | Heap implementation | Complexity |
| --- | --- | --- |
| `insert(item, priority)` | Insert + sift-up | O(log n) |
| `pop()` — remove and return the highest-priority item | Extract root + sift-down | O(log n) |
| `peek()` — look at the highest-priority item | Read the root | O(1) |

A binary heap is the standard textbook implementation of a priority queue precisely because both operations it needs are $O(\log n)$ — a plain sorted list would need $O(n)$ to insert somewhere in the middle, and a plain unsorted list would need $O(n)$ to find the highest-priority item to pop.

:::callout{kind="info"}
Priority queues built on heaps turn up throughout algorithms you'll meet elsewhere in this course and beyond: **Dijkstra's algorithm** and **A\* search** both repeatedly pop "the unvisited node with the smallest known distance/cost so far" — exactly a priority queue's `pop()` — from a frontier that can hold many candidate nodes at once. Operating-system task schedulers and printer queues are everyday examples of priority queues outside pure algorithms, where "priority" might be job urgency rather than a numeric distance.
:::

## Choosing a structure — updated

Slotting the heap into the comparison from *Data Structures*:

| Structure | Find min/max | Insert | Extract min/max |
| --- | --- | --- | --- |
| Unsorted array/list | O(n) | O(1) | O(n) |
| Sorted array | O(1) | O(n) | O(1) (from the relevant end) |
| Binary heap | O(1) | O(log n) | O(log n) |

A heap is the balanced choice: it never needs the O(n) worst case that an unsorted list pays for finding the best value, or that a sorted array pays for inserting into the middle — every operation a priority queue actually needs stays at $O(\log n)$ or better.
