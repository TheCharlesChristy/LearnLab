# Hash tables

The structures so far each have a weakness. An array gives instant O(1) access — but only if you already know the numeric index. A linked list gives cheap insertion — but finding a value means walking from the head, O(n). A balanced binary search tree gives O(log n) search — good, but not as good as O(1). A **hash table** (Python's built-in `dict` is one) is designed to give **O(1) average-case** lookup, insertion and deletion, keyed by an arbitrary value such as a string, not a position.

## Hashing

A **hash function** takes a key and produces an integer, which is then reduced (usually with `% table_size`) to a valid index into a fixed-size array of **buckets**. Storing under a key becomes: hash the key, go straight to that bucket, store the value there. Looking a key up is the identical calculation — no searching required, provided each bucket holds only a handful of entries.

A simple (if not especially good) hash function for a string is "sum the character codes, then take the result modulo the table size":

```python
def hash_key(key, table_size):
    return sum(ord(c) for c in key) % table_size
```

## Collisions

Two different keys can hash to the same index — a **collision**. This is unavoidable in general (there are far more possible keys than table slots), so every hash table needs a collision policy. Two common ones:

- **Chaining**: each bucket holds a small list of `(key, value)` pairs. On a collision, just append to that bucket's list; looking a key up means hashing to the bucket, then scanning its (short) list for the matching key.
- **Open addressing** (e.g. *linear probing*): all entries live directly in the array. On a collision, probe forward — try index `+1`, then `+2`, and so on (wrapping around) — until an empty slot is found.

:::callout{kind="key"}
A hash table gives O(1) **average-case** lookup because a well-chosen hash function spreads keys roughly evenly across the buckets, so — as long as the table isn't overloaded — each bucket holds only a small, roughly constant number of entries. The **worst case is still O(n)**: if every key happened to hash to the same bucket (a bad hash function, or a table that's too small for how many keys it holds), chaining degrades to searching one long list, no better than a linked list.
:::

:::reveal{title="Worked example: hashing with chaining"}
Use `hash_key(key, 5)` — sum of character codes, modulo 5 — and insert `"cat"`, `"dog"`, `"bat"`, `"rat"` into a table of 5 buckets using chaining.

| Key | Character codes | Sum | Sum mod 5 (bucket) |
| --- | --- | --- | --- |
| `"cat"` | `99, 97, 116` | 312 | 2 |
| `"dog"` | `100, 111, 103` | 314 | 4 |
| `"bat"` | `98, 97, 116` | 311 | 1 |
| `"rat"` | `114, 97, 116` | 327 | 2 |

`"cat"` and `"rat"` both land in bucket 2 — a collision. With chaining, bucket 2 simply holds both: `[("cat", …), ("rat", …)]`, in the order they were inserted. Buckets 0 and 3 stay empty; bucket 1 holds only `"bat"`; bucket 4 holds only `"dog"`.
:::

Build a tiny hash table with chaining and confirm the collision above by running it:

::widget{type="code-runner" language="python" starter="TABLE_SIZE = 5\n\n\ndef hash_key(key):\n    return sum(ord(c) for c in key) % TABLE_SIZE\n\n\ntable = [[] for _ in range(TABLE_SIZE)]\n\n\ndef insert(key, value):\n    index = hash_key(key)\n    for pair in table[index]:\n        if pair[0] == key:\n            pair[1] = value\n            return\n    table[index].append([key, value])\n\n\ndef lookup(key):\n    index = hash_key(key)\n    for k, v in table[index]:\n        if k == key:\n            return v\n    raise KeyError(key)\n\n\ninsert('cat', 1)\ninsert('dog', 2)\ninsert('bat', 3)\ninsert('rat', 4)\n\nprint('bucket 2:', table[2])\nprint(lookup('rat'))" solutionTest="assert lookup('cat') == 1\nassert lookup('rat') == 4\nassert table[2] == [['cat', 1], ['rat', 4]]" rows=20}

## Choosing a structure

Each structure earns its place by being the best fit for a particular access pattern. As an average-case summary:

| Structure | Access by position | Search by value | Insert | Delete |
| --- | --- | --- | --- | --- |
| Stack / queue | — | O(n) | O(1) (at the relevant end) | O(1) (at the relevant end) |
| Singly-linked list | O(n) | O(n) | O(1) (at head, or given a node reference) | O(1) (given the predecessor) |
| Balanced BST | — | O(log n) | O(log n) | O(log n) |
| Hash table | — | O(1) average, O(n) worst | O(1) average | O(1) average |

Use a stack or queue when order of processing (LIFO/FIFO) is what matters; a linked list when you need cheap insertion/deletion at known points; a BST when you need fast search *and* to keep data in sorted order; a hash table when you need the fastest possible lookup by key and don't care about order.
