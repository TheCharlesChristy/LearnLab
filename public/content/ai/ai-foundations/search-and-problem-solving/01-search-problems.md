# Search problems: states, actions, and goals

A surprising amount of AI can be reduced to one idea: **search**. Route planners, puzzle solvers, game-playing programs, and even parts of robotics all work by exploring a space of possible situations to find one that satisfies some goal. Before we can search for anything, we need to describe the problem precisely enough for a machine to attack it.

## The five ingredients of a search problem

Formally, a search problem is specified by:

1. **Initial state** — the situation the agent starts in.
2. **Actions** — the set of moves available in a given state, often written $\text{actions}(s)$.
3. **Transition model** — what state results from taking an action in a state, written $\text{result}(s, a)$. Together, the actions and transition model define the *state space*: every state reachable from the initial state by some sequence of actions.
4. **Goal test** — a check that decides whether a given state counts as a solution.
5. **Path cost** — a function that assigns a numeric cost to a sequence of actions, usually the sum of the cost of each individual step.

:::callout{kind="key"}
A search problem is completely defined by these five things: initial state, actions, transition model, goal test, and path cost. Once you can write these down for a problem, you already know enough to hand it to a search algorithm.
:::

## A running example: the town network

Throughout this module we will reuse one small example: six towns connected by roads, which we will treat as an unweighted graph of six *states* $\{S, A, B, C, D, G\}$. $S$ is where our agent starts; $G$ is the destination.

| Town | Roads to |
| --- | --- |
| $S$ | $A$, $B$ |
| $A$ | $C$, $D$, $S$ |
| $B$ | $D$, $G$, $S$ |
| $C$ | $A$ |
| $D$ | $A$, $B$, $G$ |
| $G$ | $B$, $D$ |

Every road is two-way, so this table lists each town's neighbours. Written as the search-problem ingredients:

- **Initial state:** $S$.
- **Actions:** "drive along a road to an adjacent town" — in state $X$, the available actions are one per neighbour of $X$ in the table above.
- **Transition model:** driving from $X$ to a listed neighbour $Y$ results in state $Y$.
- **Goal test:** is the current state $G$?
- **Path cost:** the number of roads driven so far (each road costs $1$). Later in this module we will attach different costs to different roads.

## Search trees, nodes, and expanding

Solving the problem means searching through the state space for a sequence of actions from $S$ to $G$. We organise this search using a **search tree**: the root is a node holding the initial state; every other node is reached from its parent by one action.

A few pieces of vocabulary you will see constantly from here on:

- **Expanding** a node means generating all of its children — one child per available action — by applying the transition model. This is also called *generating successors*.
- The **frontier** (sometimes called the *fringe*) is the set of nodes that have been generated but not yet expanded — the "edge" of the explored region, waiting to be looked at.
- The **explored set** is the set of states whose nodes have already been expanded. Search algorithms check it so they don't expand the same state twice.

:::callout{kind="tip"}
Keep the **state space** (the towns and roads themselves — fixed, and only six states) distinct from the **search tree** (the record of *how the search visited them* — nodes, not states, and a state can in principle appear in more than one node if we're not careful). Tracking an explored set of visited states is what stops the tree from growing forever around a loop such as $S \to A \to S \to A \to \dots$
:::

:::reveal{title="Worked example: building the search tree for the town network"}
Using the formulation above (initial state $S$, goal test "is this $G$?"), build the tree by expanding nodes and always listing each node's neighbours alphabetically, skipping any state that has already been explored.

**Expand $S$** (depth 0 → 1). Neighbours of $S$, alphabetically: $A$, $B$. Neither is $G$. Frontier now holds nodes for $A$ and $B$.

**Expand $A$** (depth 1 → 2). Neighbours of $A$: $C$, $D$, $S$. The state $S$ is already explored (it is the root), so it is *not* re-added — this is exactly the explored-set check. New nodes: $C$, $D$. Neither is $G$.

**Expand $B$** (depth 1 → 2). Neighbours of $B$: $D$, $G$, $S$. $S$ is already explored, skip it. $D$'s state was already placed on the frontier by expanding $A$, so it is not duplicated. $G$ is new — and its goal test succeeds!

Because $G$ was generated while expanding $B$, and $B$ was generated while expanding $S$, the path found is $S \to B \to G$: a two-road route. The full order in which nodes were **expanded** (removed from the frontier and processed) before the goal was found is $S, A, B$, with $G$ recognised immediately after being generated from $B$. Lesson 2 makes this exact procedure precise and names it: this is **breadth-first search**.
:::

## Why formulation matters

Notice that nothing above depended on the town network specifically — the same five ingredients describe a sliding-tile puzzle (states = tile arrangements, actions = slide a tile into the blank), a Rubik's cube (states = cube configurations, actions = quarter turns), or web-page navigation (states = pages, actions = following a link). Once a problem is written this way, the *same* search algorithms — the subject of the rest of this module — can solve any of them.
