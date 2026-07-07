# Graph traversal: BFS, DFS and Dijkstra's algorithm

Once a graph is stored as an adjacency list or matrix, the next question is: how do we **visit every vertex** systematically, and how do we find the **shortest route** between two vertices? This lesson covers two traversal algorithms — breadth-first search and depth-first search — and the greedy idea behind Dijkstra's shortest-path algorithm.

We reuse the graph from the previous lesson, with this adjacency list (neighbours listed alphabetically):

| Vertex | Neighbours |
| --- | --- |
| A | B, C |
| B | A, D, E |
| C | A, F |
| D | B |
| E | B, F |
| F | C, E |

## Breadth-first search (BFS)

BFS explores a graph **layer by layer**: it visits the start vertex, then all of its direct neighbours, then all of *their* unvisited neighbours, and so on. It uses a **queue** (first-in, first-out) to keep track of which vertex to process next.

```
BFS(graph, start):
    create an empty queue and an empty visited set
    add start to the queue and to visited
    while the queue is not empty:
        vertex = dequeue the front of the queue
        visit vertex (e.g. print it)
        for each neighbour of vertex, in order:
            if neighbour is not in visited:
                add neighbour to visited
                enqueue neighbour
```

Marking a vertex as visited **as soon as it is enqueued** (not when it is dequeued) is essential — otherwise the same vertex can be queued multiple times.

:::reveal{title="Worked trace: BFS from A"}
Process neighbours in alphabetical order. "Queue" is shown left (front) to right (back).

| Action | Queue after action | Visited set |
| --- | --- | --- |
| Start: enqueue A | [A] | {A} |
| Dequeue A, visit A. Enqueue unvisited neighbours B, C | [B, C] | {A, B, C} |
| Dequeue B, visit B. Neighbours A (visited), D, E → enqueue D, E | [C, D, E] | {A, B, C, D, E} |
| Dequeue C, visit C. Neighbours A (visited), F → enqueue F | [D, E, F] | {A, B, C, D, E, F} |
| Dequeue D, visit D. Neighbour B already visited | [E, F] | {A, B, C, D, E, F} |
| Dequeue E, visit E. Neighbours B, F already visited | [F] | {A, B, C, D, E, F} |
| Dequeue F, visit F. Neighbours C, E already visited | [] | {A, B, C, D, E, F} |

**BFS visit order: A, B, C, D, E, F.**
:::

## Depth-first search (DFS)

DFS explores as **deep as possible** down one path before backtracking. It uses a **stack** (last-in, first-out) — either an explicit stack, or the **call stack** via recursion, which is why the recursive version is so short:

```
DFS(graph, vertex, visited):
    add vertex to visited
    visit vertex (e.g. print it)
    for each neighbour of vertex, in order:
        if neighbour is not in visited:
            DFS(graph, neighbour, visited)
```

An iterative version uses an explicit stack instead of recursion: push the start vertex; while the stack is not empty, pop a vertex, and if unvisited, visit it and push its unvisited neighbours (pushing them in *reverse* order reproduces the same left-to-right visiting order as the recursive version, because the stack reverses the order again when popping).

:::reveal{title="Worked trace: DFS from A"}
Following the recursive definition, processing neighbours in alphabetical order:

1. Visit **A** (mark visited). Neighbours: B, C. B is unvisited → recurse into B.
2. Visit **B** (mark visited). Neighbours: A (visited), D, E. D is unvisited → recurse into D.
3. Visit **D** (mark visited). Neighbour: B (visited). No unvisited neighbours — backtrack to B.
4. Back in B, next unvisited neighbour is E → recurse into E.
5. Visit **E** (mark visited). Neighbours: B (visited), F. F is unvisited → recurse into F.
6. Visit **F** (mark visited). Neighbours: C, E (visited). C is unvisited → recurse into C.
7. Visit **C** (mark visited). Neighbours: A (visited), F (visited). No unvisited neighbours — backtrack all the way to F, then E, then B, then A.
8. Back in A, the only other neighbour, C, is already visited. Done.

**DFS visit order: A, B, D, E, F, C.**

Notice this differs from the BFS order — DFS commits to the B → D branch fully before ever reaching C, whereas BFS visits every neighbour of A before going any deeper.
:::

## Try BFS yourself

Run this implementation of the BFS pseudocode above on the example graph — the printed order should match the worked trace exactly.

::widget{type="code-runner" language="python" starter="from collections import deque\n\ngraph = {\n    'A': ['B', 'C'],\n    'B': ['A', 'D', 'E'],\n    'C': ['A', 'F'],\n    'D': ['B'],\n    'E': ['B', 'F'],\n    'F': ['C', 'E'],\n}\n\ndef bfs(graph, start):\n    visited = {start}\n    queue = deque([start])\n    order = []\n    while queue:\n        vertex = queue.popleft()\n        order.append(vertex)\n        for neighbour in graph[vertex]:\n            if neighbour not in visited:\n                visited.add(neighbour)\n                queue.append(neighbour)\n    return order\n\nprint('BFS order:', bfs(graph, 'A'))" rows=18}

## Dijkstra's algorithm: shortest paths in a weighted graph

BFS finds the *fewest edges* between two vertices, but it ignores weights. **Dijkstra's algorithm** finds the shortest **total weight** path from a start vertex to every other vertex in a weighted graph (with no negative weights). The core idea is **greedy**:

```
Dijkstra(graph, start):
    set dist[start] = 0, and dist[v] = infinity for every other vertex v
    mark every vertex unvisited
    while there are unvisited vertices:
        u = the unvisited vertex with the smallest dist[u]   <- the greedy step
        mark u as visited
        for each neighbour v of u with edge weight w:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w      (relax the edge)
```

At every step, Dijkstra picks the closest **unvisited** vertex and "locks in" its distance — once a vertex is visited, its shortest distance is final. This works because edge weights are never negative, so no shortcut through an unvisited (and therefore farther) vertex could ever be shorter.

:::callout{kind="warning"}
Dijkstra's algorithm assumes **non-negative** edge weights. If the graph has a negative-weight edge, the greedy "lock in the closest vertex" step can be wrong, and a different algorithm (e.g. Bellman–Ford) is needed.
:::

Consider this weighted, undirected graph, given as an edge list:

| Edge | Weight |
| --- | --- |
| $A$–$B$ | 7 |
| $A$–$C$ | 9 |
| $A$–$F$ | 14 |
| $B$–$C$ | 10 |
| $B$–$D$ | 15 |
| $C$–$D$ | 11 |
| $C$–$F$ | 2 |
| $D$–$E$ | 6 |
| $F$–$E$ | 9 |

:::reveal{title="Worked trace: Dijkstra's algorithm from A"}
Start: $dist[A]=0$, all others $= \infty$. All vertices unvisited.

| Step | Visit (smallest unvisited dist) | Distances updated | Running distances (A,B,C,D,E,F) |
| --- | --- | --- | --- |
| 1 | A (0) | $B = 0+7=7$; $C=0+9=9$; $F=0+14=14$ | 0, 7, 9, ∞, ∞, 14 |
| 2 | B (7) | via B: $C=\min(9,7+10{=}17)=9$ (no change); $D=7+15=22$ | 0, 7, 9, 22, ∞, 14 |
| 3 | C (9) | via C: $D=\min(22,9+11{=}20)=20$; $F=\min(14,9+2{=}11)=11$ | 0, 7, 9, 20, ∞, 11 |
| 4 | F (11) | via F: $E=11+9=20$ | 0, 7, 9, 20, 20, 11 |
| 5 | D (20) *(tie with E; take alphabetically first)* | via D: $E=\min(20,20+6{=}26)=20$ (no change) | 0, 7, 9, 20, 20, 11 |
| 6 | E (20) | no unvisited neighbours left | 0, 7, 9, 20, 20, 11 |

Final shortest distances from A: $A{=}0$, $B{=}7$, $C{=}9$, $D{=}20$, $E{=}20$, $F{=}11$.

**Shortest path from A to E has length 20**, reconstructed by following each vertex back to the neighbour that produced its final distance: $E$ was last updated from $F$ ($11+9=20$), $F$ was updated from $C$ ($9+2=11$), $C$ was updated from $A$ ($0+9=9$). So the path is $A \to C \to F \to E$, with weights $9 + 2 + 9 = 20$.
:::

:::callout{kind="tip"}
Dijkstra's algorithm is closely related to BFS: BFS is exactly Dijkstra's algorithm on a graph where every edge has weight 1 (fewest edges = shortest total weight when all weights are equal).
:::

## Summary

- **BFS** visits layer by layer using a **queue** — finds the path with the fewest edges.
- **DFS** visits as deep as possible before backtracking, using a **stack** (explicit, or the recursion call stack).
- **Dijkstra's algorithm** greedily locks in the closest unvisited vertex, giving the shortest total-weight path in a graph with non-negative weights.
