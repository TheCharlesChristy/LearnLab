# Insertion and sift-up

Inserting into a heap has to do two things at once: keep the **shape rule** satisfied (still a complete binary tree) and restore the **heap-order rule** if the new value breaks it. The standard algorithm does this in two simple steps.

## The algorithm

1. **Append** the new value at the very end of the array. This is the one and only position that keeps the tree complete — the next open slot, left to right on the last level (or a fresh new level if the last one is full).
2. **Sift up** (also called **bubble up**): while the new node's value is smaller than its parent's (in a min-heap; larger, for a max-heap) and it isn't the root, swap it with its parent. Repeat until the value is no longer smaller than its parent, or it reaches the root.

```python
def insert(heap, value):
    heap.append(value)
    i = len(heap) - 1
    while i > 0:
        p = (i - 1) // 2
        if heap[i] < heap[p]:
            heap[i], heap[p] = heap[p], heap[i]
            i = p
        else:
            break
```

Because appending is O(1) and the tree's height is $O(\log n)$ (a complete binary tree on $n$ nodes has height $\lfloor \log_2 n \rfloor$), sift-up does at most $O(\log n)$ swaps — one per level, at worst. **Insertion is therefore O(log n)**, far better than the O(n) a sorted array would need to make room for the new value in the right place.

:::callout{kind="key"}
Only ONE root-to-leaf path is ever touched by sift-up — the path from the new leaf straight up to the root. Nothing elsewhere in the heap is examined or changed, which is exactly why the cost is proportional to the tree's height rather than to its size.
:::

:::reveal{title="Worked example: inserting 5, 3, 8, 1, 4 into an empty min-heap"}
Insert one value at a time, always appending then sifting up.

**Insert 5.** Heap: `[5]`. Only node — no parent to compare against.

**Insert 3.** Append: `[5, 3]`. Index 1's parent is index $(1-1)//2 = 0$, holding `5`. $3 < 5$, so swap. Heap: `[3, 5]`.

**Insert 8.** Append: `[3, 5, 8]`. Index 2's parent is index $(2-1)//2 = 0$, holding `3`. $8 < 3$ is false — stop. Heap: `[3, 5, 8]`.

**Insert 1.** Append: `[3, 5, 8, 1]`. Index 3's parent is index $(3-1)//2 = 1$, holding `5`. $1 < 5$, swap → `[3, 1, 8, 5]`. Now at index 1, parent is index $(1-1)//2 = 0$, holding `3`. $1 < 3$, swap → `[1, 3, 8, 5]`. Now at the root (index 0) — stop.

**Insert 4.** Append: `[1, 3, 8, 5, 4]`. Index 4's parent is index $(4-1)//2 = 1$, holding `3`. $4 < 3$ is false — stop. Heap: `[1, 3, 8, 5, 4]`.

Final heap array: `[1, 3, 8, 5, 4]`. As a tree:

```
        1
      /   \
     3     8
    / \
   5   4
```

Check the heap property: $1 \le 3$, $1 \le 8$, $3 \le 5$, $3 \le 4$ — every parent is $\le$ both children.
:::

Run the insertions above yourself, then try inserting your own sequence of numbers and check the result stays a valid min-heap:

::widget{type="code-runner" language="python" starter="def insert(heap, value):\n    heap.append(value)\n    i = len(heap) - 1\n    while i > 0:\n        p = (i - 1) // 2\n        if heap[i] < heap[p]:\n            heap[i], heap[p] = heap[p], heap[i]\n            i = p\n        else:\n            break\n\n\ndef is_min_heap(arr):\n    for i in range(len(arr)):\n        left, right = 2 * i + 1, 2 * i + 2\n        if left < len(arr) and arr[i] > arr[left]:\n            return False\n        if right < len(arr) and arr[i] > arr[right]:\n            return False\n    return True\n\n\nheap = []\nfor value in [5, 3, 8, 1, 4]:\n    insert(heap, value)\n\nprint('heap array:', heap)\nprint('valid min-heap:', is_min_heap(heap))" solutionTest="assert heap == [1, 3, 8, 5, 4]\nassert is_min_heap(heap) is True" rows=20}

## Why not sift down instead?

You might wonder why insertion appends at the end and sifts *up*, rather than starting at the root and sifting *down* to find a spot. The reason is the shape rule: the only position guaranteed to keep the tree complete, with no gaps and no calculation about tree shape needed, is "the next array slot". Starting there and sifting up is simple and always correct; starting at the root would require first figuring out *where* the next complete-tree slot even is before you could sift towards it.

The next lesson covers the opposite operation: removing the root — the smallest (or largest) value — and restoring the heap property afterwards with **sift-down**.
