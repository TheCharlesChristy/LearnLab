# BST performance and balance

Every BST operation you have learned, search, insert, delete, does the same amount of work per step (one comparison, one move to a child) and stops once it reaches the bottom of the tree. That means the true cost of every operation is set by exactly one number: the tree's height.

Before you trace it: insert 1, 2, 3, 4, 5, 6, 7 into an empty BST, in that increasing order. What will the resulting tree look like?

::widget{type="quiz" src="quizzes/performance-hook.json"}

## When a BST stops looking like a tree

Insert 1 first: it becomes the root. Insert 2: `2 > 1`, so it goes right of 1. Insert 3: `3 > 1`, go right to 2; `3 > 2`, go right of 2. Every value after the first is bigger than everything already inserted, so it is always placed as the right child of the current rightmost node.

```
1
 \
  2
   \
    3
     \
      4
       \
        5
         \
          6
           \
            7
```

This is a **degenerate** (or skewed) tree: every node has at most one child, so it behaves exactly like a linked list. `left`/`right` pointers and BST vocabulary are still technically true of it, but the shape has lost the property that made searching fast: there is no longer a subtree to discard at each step, because there is only ever one branch to follow.

::widget{type="quiz" src="quizzes/performance-checkpoint-1.json"}

## Best case vs worst case

- **Best case**: the tree is roughly balanced, each subtree holding about half the remaining nodes. Height grows as log2(n): doubling the number of nodes only adds one more level.
- **Worst case**: the tree is degenerate. Height grows as n minus 1: every extra node adds a full extra level.

Since every operation's cost is proportional to height, this gives:

| | Best case (balanced) | Worst case (degenerate) |
|---|---|---|
| Search / insert / delete | O(log n) | O(n) |

::widget{type="quiz" src="quizzes/performance-checkpoint-2.json"}

Watch both curves diverge as n grows. The gap is not small: by n = 20, the worst case is already about five times taller than the best case, and the ratio keeps growing.

::widget{type="data-plot" src="data/height-vs-n.json"}

Before scrolling back to check: at n = 20, roughly how many times taller is the worst-case tree than the best-case tree? Read the two lines above and compare.

## Insertion order decides the shape

The tree's shape is entirely a consequence of the order values were inserted in, nothing else. Sorted (or reverse-sorted) insertion order is the worst possible case, because every new value is always the biggest (or always the smallest) so far. Insertion in a random order tends to produce a tree that is close to balanced on average, though not guaranteed to be, since it depends on the specific sequence.

Predict which build produces the taller tree before you run this, then check both heights.

::widget{type="code-runner" language="python" starter="import random\n\n\nclass Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\n\ndef insert(root, value):\n    if root is None:\n        return Node(value)\n    if value < root.value:\n        root.left = insert(root.left, value)\n    else:\n        root.right = insert(root.right, value)\n    return root\n\n\ndef height(root):\n    if root is None:\n        return -1\n    return 1 + max(height(root.left), height(root.right))\n\n\nsorted_root = None\nfor v in range(1, 11):\n    sorted_root = insert(sorted_root, v)\n\nrandom.seed(42)\nshuffled = list(range(1, 11))\nrandom.shuffle(shuffled)\nrand_root = None\nfor v in shuffled:\n    rand_root = insert(rand_root, v)\n\nprint('sorted insert order, height:', height(sorted_root))\nprint('shuffled insert order, height:', height(rand_root))" solutionTest="assert height(sorted_root) == 9\nassert height(rand_root) <= 6" rows=26}

:::callout{kind="warning"}
It is tempting to assume every BST is O(log n) simply because BSTs are "supposed to be fast." That is only true of a roughly balanced tree. Nothing about the data structure itself prevents a degenerate shape; it depends entirely on what order values arrive in.
:::

## Guaranteeing the best case: self-balancing trees

If insertion order is outside your control, for example values arriving already sorted, the plain BST you have built in this module offers no protection against the worst case. **Self-balancing trees**, such as AVL trees and red-black trees, solve this by automatically restructuring themselves (an operation called rotation) after every insertion or deletion, guaranteeing the height always stays proportional to log n regardless of insertion order. Tracing the rotation algorithms themselves is beyond this module; what matters here is the problem they exist to solve and why a plain BST cannot solve it on its own.

::widget{type="quiz" src="quizzes/performance-checkpoint-3.json"}

:::reveal{title="Worked example: heights at n = 31"}
31 nodes is one short of 32 = 2^5.

Best case: a perfectly balanced tree of 31 nodes is a complete binary tree with 5 levels (depths 0 to 4), so its height is 4.

Worst case: a degenerate tree of 31 nodes is one long chain, so its height is n minus 1 = 30.

Before reading on: why does the best-case height stay so small even though n has roughly quadrupled compared to n = 7 from the hook at the top of this lesson?

Because height grows as log2(n) in the best case, and log2 grows extremely slowly: going from 7 nodes to 31 nodes is more than a fourfold increase in n, but the height only grows from 2 to 4.
:::

:::reveal{title="Your turn to finish: heights at n = 63"}
63 nodes is one short of 64 = 2^6.

Best case: a perfectly balanced tree of 63 nodes is a complete binary tree with 6 levels (depths 0 to 5).

Worst case: a degenerate tree of 63 nodes is one long chain.

Finish it yourself: what is the best-case height, and what is the worst-case height?
:::

::widget{type="quiz" src="quizzes/performance-faded-check.json"}

Back at the top of this lesson you predicted that inserting 1 through 7 in order produces a single lopsided chain of height 6, not a bushy balanced tree. That is exactly what happened, and you now know why: sorted insertion order is the one input a plain BST can never protect itself against. Search, insertion and deletion all still work correctly on a degenerate tree, they are just no faster than working through a linked list, node by node.
