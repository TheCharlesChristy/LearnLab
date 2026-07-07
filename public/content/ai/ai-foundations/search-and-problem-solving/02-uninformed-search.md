# Uninformed search: breadth-first and depth-first

An **uninformed** (or *blind*) search strategy knows nothing about how close a state is to the goal — it only knows the problem's actions and transition model, and expands nodes using some fixed rule (e.g. "oldest first"). The two classic uninformed strategies differ only in the data structure used to manage the frontier.

We reuse the town network from Lesson 1: $S$'s neighbours are $A, B$; $A$'s are $C, D, S$; $B$'s are $D, G, S$; $C$'s is $A$; $D$'s are $A, B, G$; $G$'s are $B, D$. Every road costs $1$ to traverse, $S$ is the start, and $G$ is the goal. In every trace below, a node's neighbours are always considered in alphabetical order, so the traces are fully determined.

## Breadth-first search (BFS)

BFS keeps the frontier as a **queue** (first-in, first-out). It always expands the *oldest* node in the frontier — the one that has been waiting the longest — which means it explores the tree **level by level**: every node at depth $k$ is expanded before any node at depth $k+1$.

```
frontier ← queue containing just the start node
explored ← empty set
loop:
    if frontier is empty: return failure
    node ← frontier.dequeue()          # take the oldest node
    if node's state passes the goal test: return the path to node
    add node's state to explored
    for each neighbour, in order:
        if neighbour not in explored and not already in frontier:
            add a new node for neighbour to the frontier (parent = node)
```

Because every action costs the same ($1$), the first time BFS's goal test succeeds, it has found a path with the **fewest possible roads** — no path with fewer edges could exist, since BFS has already exhausted every path with fewer edges without finding the goal.

:::callout{kind="key"}
BFS is **complete** (it will find a goal if one exists in a finite graph) and, when every action has the same cost, it is **optimal**: the first solution it finds always has the fewest steps. Its cost is memory — the frontier can hold every node at the current depth, which grows exponentially with depth for a wide tree.
:::

:::reveal{title="Worked example: tracing BFS from S to G"}
Frontier starts as $[S]$, explored $= \{\}$.

| Step | Dequeue | Goal? | Mark explored | Neighbours considered | Newly added to frontier | Frontier after |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | $S$ | no | $\{S\}$ | $A, B$ | $A, B$ | $[A, B]$ |
| 2 | $A$ | no | $\{S,A\}$ | $C, D, S$(explored) | $C, D$ | $[B, C, D]$ |
| 3 | $B$ | no | $\{S,A,B\}$ | $D$(already in frontier), $G$, $S$(explored) | $G$ | $[C, D, G]$ |
| 4 | $C$ | no | $\{S,A,B,C\}$ | $A$(explored) | — | $[D, G]$ |
| 5 | $D$ | no | $\{S,A,B,C,D\}$ | $A$(explored), $B$(explored), $G$(in frontier) | — | $[G]$ |
| 6 | $G$ | **yes** | — | — | — | — |

BFS expands nodes in the order **S, A, B, C, D, G** and stops at step 6. Following parent pointers back from $G$ (its parent was $B$, and $B$'s parent was $S$) gives the path $S \to B \to G$, a path cost of $2$. Check: is there any 1-road path from $S$ to $G$? No — $S$ only connects directly to $A$ and $B$, not $G$ — so $2$ is indeed the fewest possible roads, exactly as BFS guarantees.
:::

## Depth-first search (DFS)

DFS keeps the frontier as a **stack** (last-in, first-out) — equivalently, it can be written as a recursive function that always plunges into the most recently discovered neighbour, going as deep as possible before **backtracking**.

```
def dfs(node):
    if node's state passes the goal test: return success
    mark node's state as visited
    for each neighbour, in order:
        if neighbour not visited:
            if dfs(neighbour) succeeds: return success
    return failure   # backtrack
```

DFS uses far less memory than BFS on a wide tree (it only needs to remember the single current path, plus the unexplored siblings along it), but it has none of BFS's step-count guarantee: the first path it finds can be much longer than the shortest one, because it commits to a branch and only gives up when that branch runs out of new states.

:::reveal{title="Worked example: tracing DFS from S to G"}
Call `dfs(S)`. Visit order and recursive calls, in the order they happen:

1. **Visit S** (not goal). Neighbours alphabetically: $A$, $B$. Try $A$ first.
2. **Visit A** (not goal). Neighbours: $C$, $D$, $S$($S$ already visited, skipped). Try $C$ first.
3. **Visit C** (not goal). Neighbours: $A$ (already visited). No unvisited neighbours — **backtrack** to $A$.
4. Back in $A$'s loop, try the next neighbour, $D$.
5. **Visit D** (not goal). Neighbours alphabetically: $A$(visited), $B$, $G$. Try $B$ *before* $G$, because $B$ comes first alphabetically.
6. **Visit B** (not goal). Neighbours: $D$(visited), $G$, $S$(visited). Try $G$.
7. **Visit G** — goal test succeeds!

The expansion order is **S, A, C, D, B, G**, and the path actually taken is $S \to A \to D \to B \to G$ — a path cost of $4$. Notice this is *worse* than BFS's $2$-road path, even though a shorter route ($S \to B \to G$) exists: DFS never tried the $B$ branch from $S$ until after it had exhausted the entire $A$ branch (including the dead end $C$, and even reaching $D$ before doubling back through $B$). This is the price of DFS's low memory use — it has no mechanism that prefers shorter paths.
:::

:::callout{kind="warning"}
DFS's path was 4 roads instead of the optimal 2 — and this is typical, not a one-off: with no way to prefer shorter branches, plain DFS gives no path-cost guarantee. It also is only complete on finite graphs *with* an explored/visited set — without one, it can loop forever around a cycle such as $S \to A \to S \to A \to \dots$.
:::

## Try it yourself

The code below defines the town network as an adjacency dictionary. Complete `bfs` so that it returns the list of towns on a shortest path from `start` to `goal`, exploring each town's neighbours in alphabetical order (matching the worked trace above). Use a queue (`collections.deque`) and a dictionary mapping each newly discovered town to the town it was reached from, then walk those parent links back from the goal once you find it.

::widget{type="code-runner" language="python" starter="from collections import deque\n\n# Adjacency list: each town maps to a list of neighbouring towns.\ngraph = {\n    'S': ['A', 'B'],\n    'A': ['C', 'D', 'S'],\n    'B': ['D', 'G', 'S'],\n    'C': ['A'],\n    'D': ['A', 'B', 'G'],\n    'G': ['B', 'D'],\n}\n\ndef bfs(graph, start, goal):\n    # TODO: return the list of nodes on a shortest path from start to\n    # goal, e.g. ['S', 'B', 'G'], using a queue and a dict of parents.\n    # Explore each node's neighbours in alphabetical order.\n    pass\n\nprint(bfs(graph, 'S', 'G'))" solutionTest="assert bfs(graph, 'S', 'G') == ['S', 'B', 'G'], 'expected the 2-step path S -> B -> G'\ntest_graph = {'1': ['2', '3'], '2': ['4'], '3': ['4'], '4': []}\nresult = bfs(test_graph, '1', '4')\nassert result in (['1', '2', '4'], ['1', '3', '4']), 'expected a shortest path from 1 to 4'" rows=16}

If your `bfs` is correct, running it prints `['S', 'B', 'G']` — exactly the path from the worked trace above, and the hidden check also runs it on a second, independent graph to make sure it generalises.

Both BFS and DFS ignore how "promising" a state looks — they only care about the *order* nodes were generated in. The next lesson introduces strategies that use an estimate of distance to the goal to search more cleverly.
