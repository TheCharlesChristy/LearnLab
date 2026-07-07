# Stacks and queues

Before looking at any specific structure, it is worth separating two ideas that are easy to blur together.

An **abstract data type (ADT)** is a specification of *what* a data structure does: the operations it supports and the rules those operations obey — for example "a stack supports `push` and `pop`, and `pop` always removes the most recently pushed item that hasn't yet been removed." A **concrete implementation** is the actual code and storage used to realise that specification — a Python `list`, a fixed-size array, a linked list of nodes. The same ADT can have several implementations with different performance trade-offs, and this module works through the classic ones.

## Stacks: last-in, first-out (LIFO)

A **stack** supports:

- `push(x)` — add `x` to the top.
- `pop()` — remove and return the item on top.
- `peek()` (sometimes `top()`) — look at the top item without removing it.
- `is_empty()` — is the stack empty?

The defining rule is **LIFO — last in, first out**: whatever was pushed most recently is the first thing popped.

A Python `list` is a natural concrete implementation: treat the **end** of the list as the top of the stack. `list.append(x)` adds to the end and `list.pop()` (with no argument) removes and returns the last element — both run in O(1) (amortised) time, because no other elements need to move. Using the *front* of the list instead (`insert(0, x)` / `pop(0)`) would work logically but is a poor implementation choice: every other element has to shift along, making each operation O(n).

Stacks show up constantly:

- **Undo in an editor** — every action is pushed onto a stack; "undo" pops the most recent one and reverses it.
- **Function calls** — a program's call stack pushes a frame on every call and pops it on return, which is exactly why deeply recursive functions can overflow it.
- **Checking balanced brackets** — push every opening bracket; on a closing bracket, pop and check it matches.

:::reveal{title="Worked example: tracing a stack"}
Start with an empty stack and perform, in order: `push(4)`, `push(7)`, `push(2)`, `pop()`, `push(9)`, `pop()`, `pop()`.

| Operation | Stack after (bottom → top) | Value returned |
| --- | --- | --- |
| `push(4)` | `[4]` | — |
| `push(7)` | `[4, 7]` | — |
| `push(2)` | `[4, 7, 2]` | — |
| `pop()` | `[4, 7]` | `2` |
| `push(9)` | `[4, 7, 9]` | — |
| `pop()` | `[4, 7]` | `9` |
| `pop()` | `[4]` | `7` |

The stack finishes as `[4]` — only the item pushed first, and never yet popped, remains.
:::

:::reveal{title="Worked example: balanced brackets with a stack"}
Check whether `([)]` is balanced, pushing every opening bracket and popping on every closing bracket:

1. `(` — opening, push. Stack: `['(']`.
2. `[` — opening, push. Stack: `['(', '[']`.
3. `)` — closing. Pop the top, which is `[`. It does **not** match `)`, so the string is rejected immediately.

Compare with `([]{})`, which is balanced: every closing bracket pops a matching opener, and the stack is empty again at the end.
:::

Try building a stack yourself below. The starter code implements `push`/`pop` on top of a Python list and uses it to reverse a short sequence of values.

::widget{type="code-runner" language="python" starter="class Stack:\n    def __init__(self):\n        self.items = []\n\n    def push(self, x):\n        self.items.append(x)\n\n    def pop(self):\n        return self.items.pop()\n\n    def peek(self):\n        return self.items[-1]\n\n    def is_empty(self):\n        return len(self.items) == 0\n\n\ns = Stack()\nfor value in [4, 7, 2]:\n    s.push(value)\n\nreversed_values = []\nwhile not s.is_empty():\n    reversed_values.append(s.pop())\n\nprint(reversed_values)" solutionTest="s2 = Stack()\nfor x in [1, 2, 3]:\n    s2.push(x)\nassert s2.pop() == 3\nassert s2.pop() == 2\nassert s2.items == [1]" rows=14}

## Queues: first-in, first-out (FIFO)

A **queue** supports:

- `enqueue(x)` — add `x` to the back.
- `dequeue()` — remove and return the item at the front.
- `is_empty()`

The rule is **FIFO — first in, first out**: whoever joined the queue first leaves it first, exactly like a real-world queue at a checkout.

A plain Python list can represent a queue (front = index 0), but `dequeue()` implemented as `pop(0)` is O(n): removing the first element forces every remaining element to shift down one place. The standard fix is `collections.deque`, which is implemented as a doubly-linked structure of blocks and gives O(1) `append()` (enqueue) and `popleft()` (dequeue) at both ends.

:::callout{kind="info"}
A **circular queue** solves the same shifting problem a different way: a fixed-size array is used as if its ends were joined into a circle. Two indices, `front` and `rear`, track the current ends of the queue; enqueuing writes at `rear` and then advances it with `rear = (rear + 1) % capacity`, and dequeuing reads at `front` and advances it the same way. Because the indices wrap around with the modulo operator, the slots freed by earlier dequeues are reused without ever shifting the remaining elements — the whole array is used as if it had no fixed start or end.
:::

:::reveal{title="Worked example: tracing a queue"}
Start with an empty queue and perform, in order: `enqueue(A)`, `enqueue(B)`, `dequeue()`, `enqueue(C)`, `dequeue()`, `dequeue()`.

| Operation | Queue after (front → back) | Value returned |
| --- | --- | --- |
| `enqueue(A)` | `[A]` | — |
| `enqueue(B)` | `[A, B]` | — |
| `dequeue()` | `[B]` | `A` |
| `enqueue(C)` | `[B, C]` | — |
| `dequeue()` | `[C]` | `B` |
| `dequeue()` | `[]` | `C` |

Notice the return order is exactly the enqueue order (`A`, `B`, `C`) — the defining FIFO behaviour.
:::
