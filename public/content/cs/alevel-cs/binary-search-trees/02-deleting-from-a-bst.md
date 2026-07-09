# Deleting from a binary search tree

Insertion just adds a new leaf, and search just follows pointers without changing anything. Deletion is different: you are removing a node that other nodes may depend on to keep the tree in order, so simply severing its pointer can leave a hole or break the BST property.

Take this tree for the whole lesson:

```
              20
           /      \
         10        30
        /  \      /   \
       5    15   25    35
                   \
                   27
```

Deleting the leaf 5 is easy: just remove the pointer to it. But 20 itself has two children. If you delete 20, which single value could correctly take the root's place so the tree stays a valid BST?

::widget{type="quiz" src="quizzes/delete-hook.json"}

## Case 1: deleting a leaf

A leaf has no children, so there is nothing to reconnect. Find the node, then set its parent's pointer (left or right, whichever led to it) to `None`.

::widget{type="quiz" src="quizzes/delete-checkpoint-leaf.json"}

## Case 2: deleting a node with one child

If the node being deleted has exactly one child, that child simply takes the deleted node's place: redirect the parent's pointer straight to the child. No values need to move, because the child (and everything below it) already sits on the correct side of the parent.

::widget{type="quiz" src="quizzes/delete-checkpoint-one-child.json"}

## Case 3: deleting a node with two children

This is the case from the hook, and it needs a genuinely new idea. You cannot just promote one of the two children to the deleted node's spot, because whichever child you pick, the other one and its whole subtree would end up on the wrong side.

Instead, find a replacement value that is guaranteed to fit: the **in-order successor**, the smallest value bigger than the one you are deleting. That is always the leftmost node in the deleted node's right subtree (keep walking left from the right child until there is no left child left). Copy the successor's value into the node you wanted to delete, then delete the successor itself from where it originally sat, which is always a Case 1 or Case 2 deletion, since the successor can never have a left child of its own.

::widget{type="quiz" src="quizzes/delete-checkpoint-two-children.json"}

:::callout{kind="warning"}
A common mistake is assuming the successor is always the node's direct right child. That is only true when the right child happens to have no left child of its own; otherwise you must keep walking left. Always check for a left child before stopping.
:::

## Putting it together

```python
def find_min(root):
    current = root
    while current.left is not None:
        current = current.left
    return current


def delete(root, value):
    if root is None:
        return None
    if value < root.value:
        root.left = delete(root.left, value)
    elif value > root.value:
        root.right = delete(root.right, value)
    else:
        if root.left is None:
            return root.right
        if root.right is None:
            return root.left
        successor = find_min(root.right)
        root.value = successor.value
        root.right = delete(root.right, successor.value)
    return root
```

The two `if root.left is None` / `if root.right is None` lines handle Case 1 (both true, so `root.right`, which is `None`, is returned) and Case 2 in one go. The `else` branch is Case 3.

Before you run it: predict what an in-order traversal of the tree looks like after `delete(root, 20)`, then check.

::widget{type="code-runner" language="python" starter="class Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\n\ndef insert(root, value):\n    if root is None:\n        return Node(value)\n    if value < root.value:\n        root.left = insert(root.left, value)\n    else:\n        root.right = insert(root.right, value)\n    return root\n\n\ndef in_order(root, out):\n    if root is not None:\n        in_order(root.left, out)\n        out.append(root.value)\n        in_order(root.right, out)\n\n\ndef find_min(root):\n    current = root\n    while current.left is not None:\n        current = current.left\n    return current\n\n\ndef delete(root, value):\n    if root is None:\n        return None\n    if value < root.value:\n        root.left = delete(root.left, value)\n    elif value > root.value:\n        root.right = delete(root.right, value)\n    else:\n        if root.left is None:\n            return root.right\n        if root.right is None:\n            return root.left\n        successor = find_min(root.right)\n        root.value = successor.value\n        root.right = delete(root.right, successor.value)\n    return root\n\n\nroot = None\nfor v in [20, 10, 30, 5, 15, 25, 35, 27]:\n    root = insert(root, v)\n\nroot = delete(root, 20)\nresult = []\nin_order(root, result)\nprint(result)\nprint(root.value)" solutionTest="assert result == [5, 10, 15, 25, 27, 30, 35]\nassert root.value == 25\nassert root.right.left.value == 27" rows=28}

:::reveal{title="Worked example: deleting the root, 20"}
Delete 20 from the original tree.

1. 20 has two children (10 and 30), so this is Case 3.
2. Find the in-order successor: start at 20's right child, 30, and walk left. 30 has a left child, 25. Does 25 have a left child? No. So 25 is the in-order successor.
3. Copy 25's value into the root: the root node now holds the value 25 instead of 20.
4. Delete the original node that held 25 from the right subtree. That node has a right child, 27, and no left child, so this is a Case 2 deletion: 27 takes 25's old place, becoming 30's left child.

Before reading the final structure: why did the search for the successor in step 2 stop at 25 rather than continuing to 27?

The search for the in-order successor always walks **left**, not right, because the smallest value in a subtree is found by going left as far as possible. 27 is 25's right child, so it is bigger than 25, not smaller, and was never a candidate.

```
              25
           /      \
         10        30
        /  \      /   \
       5    15   27    35
```
:::

:::reveal{title="Your turn to finish: deleting 30"}
Delete 30 from the original tree (not the tree above, the one with 20 still at the root).

1. 30 has two children (25, which has a right child 27, and 35), so this is Case 3.
2. Find the in-order successor: start at 30's right child, 35, and walk left. 35 has no left child, so 35 is already the in-order successor.
3. Copy 35's value into the node that held 30.
4. Delete the original leaf node that held 35 (a Case 1 deletion, since it has no children).

Finish it yourself: what value replaces 30, and what happens to 25 and 27?
:::

::widget{type="quiz" src="quizzes/delete-faded-check.json"}

Deletion works correctly on this tree no matter what shape it happens to be in, bushy or lopsided. But that word, shape, matters more than it might seem: the next lesson looks at how a BST's shape, and therefore how fast search, insertion and deletion actually run, depends entirely on the order values were inserted in.
