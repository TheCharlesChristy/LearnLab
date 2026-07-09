# Extraction and sift-down

The whole point of a heap is instant access to the best value at the root. **Extraction** removes that value and returns it — but simply deleting the root would leave a hole and break the tree's shape. The fix mirrors insertion: move a value into the gap first, then fix the ordering.

## The algorithm

To extract the root of a min-heap (the process is identical for a max-heap, just with the comparison flipped):

1. Remember the root's value — that's what will be returned.
2. Move the **last** element in the array into the root position, then remove the last slot. This keeps the shape rule intact: the tree is still complete, just one node smaller.
3. **Sift down** (also called **bubble down**) the new root: repeatedly compare it with its children and swap with the **smaller** child (min-heap) if that child is smaller than the current node. Stop when the node is no longer bigger than either child, or it has no children left.

```python
def extract_min(heap):
    root = heap[0]
    last = heap.pop()
    if heap:
        heap[0] = last
        i = 0
        n = len(heap)
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
    return root
```

:::callout{kind="warning"}
At each step, sift-down must compare against the **smaller of the two children**, not just the left one. Swapping with a child that isn't the smallest can leave the *other* child bigger than the node that just moved down, silently breaking the heap property instead of fixing it.
:::

As with sift-up, sift-down only ever follows a single path — this time from the root down towards a leaf — so it makes at most $O(\log n)$ comparisons and swaps. **Extraction is therefore O(log n)**, and peeking at the minimum without removing it (just reading `heap[0]`) is O(1).

:::reveal{title="Worked example: extracting from [1, 3, 8, 5, 4]"}
Starting heap (from the previous lesson): `[1, 3, 8, 5, 4]`.

**Step 1.** Remember the root, `1` — this is the return value.

**Step 2.** Move the last element, `4`, into the root, and shrink the array: `[4, 3, 8, 5]`.

**Step 3 — sift down from index 0** (value `4`). Children are at indices 1 and 2: `3` and `8`. The smaller child is `3` (index 1). Since $4 > 3$, swap: `[3, 4, 8, 5]`. Continue from index 1 (value `4`). Its only child is at index $2(1)+1=3$: `5` (index $2(1)+2=4$ doesn't exist — the array has length 4). $4 \le 5$, so no swap needed — stop.

Final heap: `[3, 4, 8, 5]`, and the extracted value was `1`.

```
        3
      /   \
     4     8
    /
   5
```

Check: $3 \le 4$, $3 \le 8$, $4 \le 5$ — still a valid min-heap, and its new minimum, `3`, is correctly at the root.
:::

Run the extraction above, then repeat it — extracting the min from a heap, one at a time, always returns values in ascending order (this is exactly the idea behind heapsort, next lesson):

::widget{type="code-runner" language="python" starter="def extract_min(heap):\n    root = heap[0]\n    last = heap.pop()\n    if heap:\n        heap[0] = last\n        i = 0\n        n = len(heap)\n        while True:\n            left, right = 2 * i + 1, 2 * i + 2\n            smallest = i\n            if left < n and heap[left] < heap[smallest]:\n                smallest = left\n            if right < n and heap[right] < heap[smallest]:\n                smallest = right\n            if smallest == i:\n                break\n            heap[i], heap[smallest] = heap[smallest], heap[i]\n            i = smallest\n    return root\n\n\nheap = [1, 3, 8, 5, 4]\nfirst = extract_min(heap)\nprint('extracted:', first, '  remaining heap:', heap)\n\norder = []\nwhile heap:\n    order.append(extract_min(heap))\nprint('extraction order:', [first] + order)" solutionTest="h = [1, 3, 8, 5, 4]\nassert extract_min(h) == 1\nassert h == [3, 4, 8, 5]" rows=20}

## Trace it step by step

::widget{type="step-reveal" src="sift-down-trace.json"}

## Insert and extract together: heap operations at a glance

| Operation | What it does | Time complexity |
| --- | --- | --- |
| Peek | Read the root without removing it | O(1) |
| Insert | Append, then sift up | O(log n) |
| Extract (min/max) | Replace root with last element, then sift down | O(log n) |

The final lesson puts these two operations to work: turning a whole unsorted array into a heap in one go, using a heap to sort a list in place, and the priority queue abstraction that heaps exist to serve.
