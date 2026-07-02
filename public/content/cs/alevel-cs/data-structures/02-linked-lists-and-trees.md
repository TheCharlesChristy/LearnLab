# Linked lists and trees

## Linked lists

An array (or Python list) stores its elements in one contiguous block, so the computer can jump straight to element `i` by arithmetic — but inserting or deleting in the middle means shifting everything after it. A **linked list** takes the opposite trade-off: elements ("nodes") are scattered wherever there's free memory, and each node stores a **reference to the next node** so the structure can still be walked in order.

Each node bundles two things:

- `data` — the value stored at this node.
- `next` — a reference ("pointer") to the following node, or `None` if this is the last node.

The list itself only needs to remember one thing: `head`, a reference to the first node (or `None` for an empty list). Python doesn't expose raw memory pointers, but an object reference stored in an attribute behaves the same way for this purpose — following `.next` from node to node is exactly what "following a pointer" means.

```python
class Node:
    def __init__(self, data, next=None):
        self.data = data
        self.next = next

class LinkedList:
    def __init__(self):
        self.head = None
```

**Traversal** means starting at `head` and following `.next` until it is `None`, doing something with `.data` at each step:

```python
def traverse(self):
    values = []
    current = self.head
    while current is not None:
        values.append(current.data)
        current = current.next
    return values
```

**Insertion at the head** is O(1): make the new node's `next` point at the old head, then move `head` to the new node — nothing else in the list needs to change.

```python
def push_front(self, data):
    self.head = Node(data, self.head)
```

**Deletion** relinks around the removed node: if you are deleting the node *after* some node `prev`, you simply set `prev.next = prev.next.next`. The removed node still exists in memory for a moment, but nothing points to it any more, so it will never be reached by traversal.

:::callout{kind="key"}
The reason linked lists are interesting is this trade-off: once you already hold a reference to the right place, insertion and deletion are O(1) — no shifting. The cost is that you cannot jump straight to "element 5"; you must traverse from the head, which is O(n).
:::

:::reveal{title="Worked example: building and deleting from a list"}
Starting from an empty list, call `push_front(3)`, then `push_front(7)`, then `push_front(1)`.

1. `push_front(3)`: `head` → `Node(3, None)`. List: `3`.
2. `push_front(7)`: new node's `next` is the old head (`3`), then `head` moves to it. List: `7 → 3`.
3. `push_front(1)`: same pattern. List: `1 → 7 → 3`.

`traverse()` now returns `[1, 7, 3]` — most-recently-pushed-first, because every push happens at the head.

Now delete the node holding `7`. Its predecessor is the node holding `1`, so relink: `node(1).next = node(1).next.next`, i.e. `node(1).next` becomes `node(3)`. The list is now `1 → 3`, and the old node `7` is unreachable.
:::

Build and traverse a singly-linked list yourself:

::widget{type="code-runner" language="python" starter="class Node:\n    def __init__(self, data, next=None):\n        self.data = data\n        self.next = next\n\n\nclass LinkedList:\n    def __init__(self):\n        self.head = None\n\n    def push_front(self, data):\n        self.head = Node(data, self.head)\n\n    def traverse(self):\n        values = []\n        current = self.head\n        while current is not None:\n            values.append(current.data)\n            current = current.next\n        return values\n\n\nlst = LinkedList()\nfor value in [3, 7, 1]:\n    lst.push_front(value)\n\nprint(lst.traverse())" solutionTest="lst2 = LinkedList()\nfor v in [10, 20, 30]:\n    lst2.push_front(v)\nassert lst2.traverse() == [30, 20, 10]" rows=16}

## Trees

A **tree** is a hierarchical structure of nodes connected by edges, with no cycles. Some vocabulary you need:

- **Root** — the single node at the top, with no parent.
- **Parent / child** — a node directly above/below another, connected by one edge.
- **Leaf** — a node with no children.
- **Depth of a node** — the number of edges from the root down to that node (the root has depth 0).
- **Height of a tree** — the greatest depth of any node in it.

A **binary tree** restricts every node to at most two children, conventionally called `left` and `right`.

A **binary search tree (BST)** is a binary tree with an extra ordering rule: for every node, every value in its **left** subtree is smaller than the node's value, and every value in its **right** subtree is larger. That single property is what makes searching fast — at each node you can discard an entire half of the remaining tree, just as with binary search on a sorted array.

To **insert** into a BST, start at the root and repeatedly go left or right depending on the comparison, until you fall off the tree — that empty spot is where the new node goes.

:::reveal{title="Worked example: building a BST"}
Insert `5, 3, 8, 1, 4, 7, 9` in that order into an initially empty BST.

- Insert `5`: becomes the root.
- Insert `3`: `3 < 5`, go left of `5` — empty, so `3` becomes `5`'s left child.
- Insert `8`: `8 > 5`, go right of `5` — empty, so `8` becomes `5`'s right child.
- Insert `1`: `1 < 5` → left to `3`; `1 < 3` → left of `3` is empty, so `1` becomes `3`'s left child.
- Insert `4`: `4 < 5` → left to `3`; `4 > 3` → right of `3` is empty, so `4` becomes `3`'s right child.
- Insert `7`: `7 > 5` → right to `8`; `7 < 8` → left of `8` is empty, so `7` becomes `8`'s left child.
- Insert `9`: `9 > 5` → right to `8`; `9 > 8` → right of `8` is empty, so `9` becomes `8`'s right child.

```
        5
      /   \
     3     8
    / \   / \
   1   4 7   9
```

Depths: `5` is 0; `3` and `8` are 1; `1`, `4`, `7`, `9` are 2 (and are the leaves).
:::

There are three standard ways to visit every node of a binary tree:

- **Pre-order**: visit the node itself, then its left subtree, then its right subtree.
- **In-order**: visit the left subtree, then the node itself, then the right subtree.
- **Post-order**: visit the left subtree, then the right subtree, then the node itself.

All three are naturally written as a recursive function that does nothing when the current node is `None`.

:::reveal{title="Worked example: the three traversals of the tree above"}
Using the tree built above (root `5`, left subtree rooted at `3` with children `1` and `4`, right subtree rooted at `8` with children `7` and `9`):

- **Pre-order** (node, left, right): `5, 3, 1, 4, 8, 7, 9`.
- **In-order** (left, node, right): `1, 3, 4, 5, 7, 8, 9` — for a BST this is *always* the values in sorted, ascending order, which is a direct consequence of the BST property.
- **Post-order** (left, right, node): `1, 4, 3, 7, 9, 8, 5`.
:::

Run the same BST through an in-order traversal and confirm it comes out sorted:

::widget{type="code-runner" language="python" starter="class Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None\n        self.right = None\n\n\ndef insert(root, value):\n    if root is None:\n        return Node(value)\n    if value < root.value:\n        root.left = insert(root.left, value)\n    else:\n        root.right = insert(root.right, value)\n    return root\n\n\ndef in_order(root, out):\n    if root is not None:\n        in_order(root.left, out)\n        out.append(root.value)\n        in_order(root.right, out)\n\n\nroot = None\nfor v in [5, 3, 8, 1, 4, 7, 9]:\n    root = insert(root, v)\n\nresult = []\nin_order(root, result)\nprint(result)" solutionTest="assert result == [1, 3, 4, 5, 7, 8, 9]" rows=18}
