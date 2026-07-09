# Searching a binary search tree

Recall the tree from Data Structures, built by inserting 5, 3, 8, 1, 4, 7, 9 in that order:

```
        5
      /   \
     3     8
    / \   / \
   1   4 7   9
```

Before you read on: to find out whether 7 is in this tree, how many of its 7 nodes will a sensible search actually need to compare it against?

::widget{type="quiz" src="quizzes/search-hook.json"}

## The search algorithm

Searching a BST reuses the exact comparison you already used to insert into one. Start at the root and repeat:

- If the current node is empty (`None`), the value is not in the tree. Stop.
- If the target equals the current node's value, you have found it. Stop.
- If the target is smaller, move to the left child and repeat.
- If the target is bigger, move to the right child and repeat.

```python
def search(root, target):
    if root is None:
        return False
    if target == root.value:
        return True
    if target < root.value:
        return search(root.left, target)
    return search(root.right, target)
```

Every comparison rules out an entire subtree, exactly the way it did during insertion: if `target` is bigger than the current node, nothing in that node's left subtree could possibly hold it, since every value there is smaller still.

Trace searching for 6 in the tree above and count the comparisons before the search gives up.

::widget{type="quiz" src="quizzes/search-checkpoint-1.json"}

## Why not just use a sorted array?

You already know binary search on a sorted array from Algorithms 1: repeatedly compare against the middle element and halve the remaining range. A BST search does the same halving, just by following `left`/`right` pointers instead of jumping to an array midpoint.

:::callout{kind="key"}
The comparison counts are the same order of growth, so a BST is not "faster to search" than a sorted array. Its real advantage is that inserting or deleting a value is a pointer update, not a shift of every element after it, the way inserting into a sorted array would require.
:::

::widget{type="quiz" src="quizzes/search-checkpoint-2.json"}

## Try it yourself

Predict whether `search(root, 6)` finds a match before you run the code, then check.

::widget{type="code-runner" language="python" starter="class Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\n\ndef insert(root, value):\n    if root is None:\n        return Node(value)\n    if value < root.value:\n        root.left = insert(root.left, value)\n    else:\n        root.right = insert(root.right, value)\n    return root\n\n\ndef search(root, target):\n    if root is None:\n        return False\n    if target == root.value:\n        return True\n    if target < root.value:\n        return search(root.left, target)\n    return search(root.right, target)\n\n\nroot = None\nfor v in [5, 3, 8, 1, 4, 7, 9]:\n    root = insert(root, v)\n\nprint(search(root, 7))\nprint(search(root, 6))" solutionTest="assert search(root, 7) == True\nassert search(root, 6) == False\nassert search(root, 1) == True\nassert search(root, 0) == False" rows=20}

## What limits how long a search can take

A search moves down one edge per comparison, so the worst case (the target is missing, or it sits at the deepest possible node) can never take more comparisons than the tree is tall.

::widget{type="quiz" src="quizzes/search-checkpoint-3.json"}

:::reveal{title="Worked example: searching for 4"}
Search the tree above for the value 4.

1. Compare 4 with the root, 5. `4 < 5`, so go left to 3.
2. Compare 4 with 3. `4 > 3`, so go right to 4.
3. Compare 4 with 4. Equal, found.

Before reading on: why did the search go left at the root, even though it had not yet looked at the root's left child?

Because the BST property guarantees the answer without checking: if 4 belongs anywhere in this tree, the ordering rule says it must be smaller than 5, so it can only live in 5's left subtree. Comparing against the root is enough to eliminate the entire right subtree, 8 nodes and all, without looking at a single one of them.
:::

:::reveal{title="Your turn to finish: searching for 2"}
Search the same tree for the value 2, which is not in the tree.

1. Compare 2 with the root, 5. `2 < 5`, so go left to 3.
2. Compare 2 with 3. `2 < 3`, so go left to 1.
3. Compare 2 with 1. `2 > 1`, so go right, but 1 has no right child.

Finish it yourself: how many comparisons did that take in total, and what does the search report?
:::

::widget{type="quiz" src="quizzes/search-faded-check.json"}

You predicted, at the top of this lesson, how many of the 7 nodes a search for 7 would touch. Trace it yourself: 7 vs 5 (bigger, go right), 7 vs 8 (smaller, go left), 7 vs 7 (equal, found). Three comparisons, exactly the answer above, and five of the seven nodes were never even looked at.

Searching and inserting are both quick, but neither one ever has to move an existing node. Deleting does, and that turns out to need real care: the next lesson covers exactly that.
