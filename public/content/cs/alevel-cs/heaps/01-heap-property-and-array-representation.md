# The heap property and array representation

A binary search tree keeps values fully ordered, left-to-right, so an in-order traversal always comes out sorted. A **heap** relaxes that a great deal, keeping only a much weaker ordering rule — and in exchange it gives O(1) access to the smallest (or largest) value and O(log n) insertion and removal, which is exactly what's needed for repeatedly asking "what's next most urgent?".

## The heap property

A **binary heap** is a binary tree with two rules:

1. **Shape rule**: it is a **complete binary tree** — every level is completely filled, except possibly the last, which fills strictly left to right with no gaps.
2. **Heap-order rule**: every node satisfies a fixed ordering relationship with its children.

There are two flavours:

- A **min-heap**: every node's value is **less than or equal to** the values of its children. The smallest value in the whole heap is therefore always at the root.
- A **max-heap**: every node's value is **greater than or equal to** the values of its children. The largest value is always at the root.

:::callout{kind="warning"}
The heap-order rule only constrains a node against its *own children* — it says nothing about how left and right subtrees compare to each other, and nothing about siblings, cousins, or any node's grandchildren directly. A min-heap is **not** a sorted structure: unlike a BST, an in-order (or any other) traversal of a heap does not generally produce sorted output. The only value a heap promises to have found for you, instantly, is the overall smallest (min-heap) or largest (max-heap) — at the root.
:::

For example, this is a valid min-heap — every parent is $\le$ both of its children, even though $5$ and $9$ are "out of order" left-to-right:

```
        2
      /   \
     5     3
    / \   /
   8   9 7
```

## Why store it as an array?

Because the shape rule forces the tree to fill level by level with no gaps, a heap never needs `left`/`right` node references at all — it can be packed directly into a plain array, level by level, left to right. For the heap above: `[2, 5, 3, 8, 9, 7]`.

Given a node at index $i$ (0-indexed):

- its **parent** is at index $\lfloor (i - 1) / 2 \rfloor$ (for $i > 0$; the root, $i = 0$, has no parent);
- its **left child** is at index $2i + 1$;
- its **right child** is at index $2i + 2$.

A child index that is $\ge$ the array's length simply means that child doesn't exist.

:::reveal{title="Worked example: reading the array back into a tree"}
Take the array `[2, 5, 3, 8, 9, 7]` (indices 0–5) and rebuild the tree it represents.

- Index 0 (`2`) is the root. Its children are at $2(0)+1=1$ and $2(0)+2=2$: `5` and `3`.
- Index 1 (`5`)'s children are at $2(1)+1=3$ and $2(1)+2=4$: `8` and `9`.
- Index 2 (`3`)'s children are at $2(2)+1=5$ and $2(2)+2=6$: `7`, and index 6 doesn't exist (array length is 6), so `3` has only a left child.
- Indices 3, 4 and 5 (`8`, `9`, `7`) would have children at indices 7–11, none of which exist — they are the leaves.

This reconstructs exactly the tree drawn above, with no pointers anywhere: just arithmetic on array indices.
:::

This is a real practical win over a pointer-based tree: no per-node memory overhead for `left`/`right` references, and excellent cache locality since related elements sit close together in memory.

## Why not just keep the array sorted?

A sorted array also gives O(1) access to the minimum (it's just the front) — but keeping it sorted after every insertion or removal costs O(n), because elements have to shift to make room or close a gap. A heap gives up full sorted order and, in exchange, only needs O(log n) work — proportional to the tree's height, never to $n$ itself — to restore the (much weaker) heap property after a change. The next two lessons show exactly how.

Build the array above and check the heap property holds — that every parent is `<=` both of its children:

::widget{type="code-runner" language="python" starter="heap = [2, 5, 3, 8, 9, 7]\n\n\ndef parent(i):\n    return (i - 1) // 2\n\n\ndef children(i):\n    return 2 * i + 1, 2 * i + 2\n\n\ndef is_min_heap(arr):\n    for i in range(len(arr)):\n        left, right = children(i)\n        if left < len(arr) and arr[i] > arr[left]:\n            return False\n        if right < len(arr) and arr[i] > arr[right]:\n            return False\n    return True\n\n\nprint('parent of index 4:', parent(4))\nprint('children of index 1:', children(1))\nprint('is_min_heap:', is_min_heap(heap))" solutionTest="assert parent(4) == 1\nassert children(1) == (3, 4)\nassert is_min_heap(heap) is True\nassert is_min_heap([2, 5, 1]) is False" rows=18}

## Terminology check

::widget{type="matching-pairs" src="terms.json"}

The next lesson covers how a heap actually grows — inserting a new value without breaking the heap property.
