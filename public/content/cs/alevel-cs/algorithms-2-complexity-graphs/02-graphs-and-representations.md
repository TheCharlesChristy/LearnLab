# Graphs and their representations

So far the data structures in this course — arrays, lists, stacks, queues — store items in a line. A **graph** is different: it is an abstract data structure for modelling *relationships* between items, and those relationships don't have to be linear. Road networks, social networks, web links and dependency chains between tasks are all naturally graphs.

## Vertices and edges

A graph $G$ consists of:

- a set of **vertices** (also called **nodes**) — the "things", drawn as points;
- a set of **edges** — the "connections" between pairs of vertices, drawn as lines.

We will use this graph throughout the rest of the module:

```
    A --- B --- D
    |     |
    C     E --- F
     \_________/
```

Its vertices are $\{A, B, C, D, E, F\}$ and its edges connect $A$–$B$, $A$–$C$, $B$–$D$, $B$–$E$, $C$–$F$ and $E$–$F$.

## Directed vs undirected

- In an **undirected** graph, an edge $A$–$B$ can be travelled in both directions (a two-way friendship, a two-way road). The example above is undirected.
- In a **directed** graph (a **digraph**), each edge has a direction, drawn as an arrow, e.g. $A \rightarrow B$ means you can go from $A$ to $B$ but not necessarily back. Web pages linking to each other, or "must complete before" dependencies, are naturally directed.

## Weighted vs unweighted

- In an **unweighted** graph, every edge is equivalent — we only care *whether* two vertices are connected. The graph above is unweighted.
- In a **weighted** graph, every edge carries a number (the **weight** or **cost**), e.g. a distance in km, a journey time, or a price. Dijkstra's algorithm, in the next lesson, works on weighted graphs to find the cheapest route.

:::callout{kind="info"}
A graph can be both directed *and* weighted at once, e.g. a one-way street with a distance attached. The four properties (directed/undirected, weighted/unweighted) are independent choices.
:::

## Representing a graph in memory

To write programs that work with graphs, we need to store them. There are two standard representations, and — just like Big-O in the previous lesson — the right choice depends on a **time/space trade-off**.

### Adjacency list

Store, for each vertex, the list of vertices it connects to. For our example graph:

| Vertex | Neighbours |
| --- | --- |
| A | B, C |
| B | A, D, E |
| C | A, F |
| D | B |
| E | B, F |
| F | C, E |

This is usually implemented as a dictionary/hash map from vertex to a list. Space used is $O(V + E)$ (one entry per vertex, one list slot per edge-endpoint) — efficient when the graph is **sparse** (few edges relative to the number of possible pairs). Checking "are $X$ and $Y$ connected?" costs $O(\deg(X))$ — you must scan $X$'s neighbour list.

### Adjacency matrix

Store a $V \times V$ grid where cell $(i, j)$ is $1$ if there is an edge between vertex $i$ and vertex $j$ (or the edge's weight, for a weighted graph), and $0$/blank otherwise. In vertex order A, B, C, D, E, F:

|   | A | B | C | D | E | F |
| --- | --- | --- | --- | --- | --- | --- |
| **A** | 0 | 1 | 1 | 0 | 0 | 0 |
| **B** | 1 | 0 | 0 | 1 | 1 | 0 |
| **C** | 1 | 0 | 0 | 0 | 0 | 1 |
| **D** | 0 | 1 | 0 | 0 | 0 | 0 |
| **E** | 0 | 1 | 0 | 0 | 0 | 1 |
| **F** | 0 | 0 | 1 | 0 | 1 | 0 |

Space used is always $O(V^2)$, regardless of how many edges actually exist — expensive for sparse graphs, but checking "are $X$ and $Y$ connected?" is a single lookup, $O(1)$. The matrix is symmetric about the diagonal for an undirected graph (cell $(i,j)$ always equals cell $(j,i)$), which is a quick way to spot that a matrix represents an undirected graph.

:::callout{kind="key"}
Adjacency list: $O(V + E)$ space, slower edge lookup — good for sparse, real-world graphs (most graphs are sparse). Adjacency matrix: $O(V^2)$ space, instant edge lookup — good for dense graphs or when you need fast "is there an edge?" queries.
:::

## Build a representation in code

Adjacency lists are naturally a dictionary of lists in Python. Run the code below to build one for our example graph and print each vertex's neighbours and degree (number of edges touching it):

::widget{type="code-runner" language="python" starter="graph = {\n    'A': ['B', 'C'],\n    'B': ['A', 'D', 'E'],\n    'C': ['A', 'F'],\n    'D': ['B'],\n    'E': ['B', 'F'],\n    'F': ['C', 'E'],\n}\n\nfor vertex, neighbours in graph.items():\n    print(f'{vertex}: neighbours={neighbours}  degree={len(neighbours)}')" rows=12}

:::reveal{title="Worked example: counting edges from a matrix"}
How many edges does the adjacency matrix above represent?

Sum every `1` in the matrix (36 cells) and divide by 2, because an undirected edge $A$–$B$ is stored **twice**: once at $(A,B)$ and once at $(B,A)$.

Row totals: A=2, B=3, C=2, D=1, E=2, F=2. Sum $= 2+3+2+1+2+2 = 12$. Dividing by 2 gives **6 edges** — exactly the six edges listed at the top of this lesson ($A$–$B$, $A$–$C$, $B$–$D$, $B$–$E$, $C$–$F$, $E$–$F$).

This "sum the row totals, divide by 2" trick works for any undirected graph, and the row total for a vertex is exactly its **degree**.
:::

The next lesson puts this representation to work: visiting every vertex of a graph in a systematic order, and finding the shortest route between two of them.
