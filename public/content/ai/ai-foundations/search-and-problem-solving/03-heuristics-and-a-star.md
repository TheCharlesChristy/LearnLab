# Heuristics and A* search

BFS and DFS both ignore any notion of "which unexplored town looks closer to the goal" — they only use the order nodes were generated in. **Informed** (or *heuristic*) search strategies add exactly that missing ingredient: an estimate of how far a state is from the goal.

## Heuristic functions

A **heuristic function** $h(n)$ estimates the cost of the cheapest path from the state at node $n$ to a goal state. It is calculated cheaply (it does not itself search), and different heuristics can be plugged into the same search algorithm. For route-finding, a natural heuristic is straight-line distance to the destination — it is easy to compute and never *overstates* the true road distance, since roads cannot be shorter than a straight line.

This time our town network has different-length roads. Road costs (all roads are two-way, with the same cost in each direction):

| Road | Cost |
| --- | --- |
| $S \leftrightarrow A$ | $2$ |
| $S \leftrightarrow B$ | $5$ |
| $A \leftrightarrow C$ | $4$ |
| $A \leftrightarrow D$ | $7$ |
| $B \leftrightarrow D$ | $2$ |
| $B \leftrightarrow G$ | $6$ |
| $D \leftrightarrow G$ | $3$ |

And here is a heuristic estimate $h(n)$ of the remaining road distance to $G$, for every town:

| Town $n$ | $S$ | $A$ | $B$ | $C$ | $D$ | $G$ |
| --- | --- | --- | --- | --- | --- | --- |
| $h(n)$ | $7$ | $6$ | $4$ | $9$ | $3$ | $0$ |

Every $h(n)$ above happens to be **admissible**: it never overestimates the true cheapest cost from $n$ to $G$ — for instance the true cheapest cost from $S$ is $10$ (via $S \to B \to D \to G$, cost $5+2+3$), and $h(S) = 7 \le 10$. We will see why admissibility matters below.

## Greedy best-first search

The simplest informed strategy always expands whichever frontier node has the **smallest $h(n)$** — it greedily heads toward whatever looks closest to the goal, completely ignoring the cost already spent getting there.

:::reveal{title="Worked example: tracing greedy best-first search from S to G"}
Frontier is a priority queue ordered by $h(n)$ alone.

1. Expand $S$ ($h=7$). Not goal. Generate $A$ ($h=6$) and $B$ ($h=4$).
2. Frontier by $h$: $B(4), A(6)$. Expand $B$ ($h=4$). Not goal. Generate $D$ ($h=3$) and $G$ ($h=0$).
3. Frontier by $h$: $G(0), D(3), A(6)$. Expand $G$ ($h=0$) — **goal!**

Greedy best-first expands **S, B, G** and stops immediately upon generating $G$, since nothing in the frontier can beat $h(G)=0$. The path is $S \to B \to G$, with actual cost $5 + 6 = 11$.
:::

That path cost of $11$ is **not** the cheapest possible (we already noted $S \to B \to D \to G$ costs only $10$). Greedy best-first found $G$ quickly (only 3 expansions) precisely because it heads straight for the smallest $h(n)$ — but by ignoring the cost paid so far, it can walk straight past a cheaper route. It is fast, but not optimal.

## A* search

**A\*** search fixes greedy best-first's blind spot by combining *both* pieces of information into one evaluation function:

$$
f(n) = g(n) + h(n)
$$

where $g(n)$ is the exact cost of the path so far to reach $n$, and $h(n)$ is the heuristic estimate of the remaining cost. A* always expands the frontier node with the smallest $f(n)$ — the node that looks best *overall*, accounting for both what has already been spent and what is estimated to remain.

:::callout{kind="key"}
A* expands the node minimising $f(n) = g(n) + h(n)$: cost-so-far plus estimated cost-to-go. Greedy best-first is the special (short-sighted) case that only looks at $h(n)$; **uniform-cost search** is the opposite special case that only looks at $g(n)$ (equivalent to BFS when all costs are equal).
:::

:::reveal{title="Worked example: tracing A* search from S to G"}
Track each frontier entry as $(f = g+h,\ \text{node})$.

**Expand $S$**: $g=0$, $h=7$, $f=7$. Not goal. Generate: $A$ with $g=2,h=6,f=8$; $B$ with $g=5,h=4,f=9$.
Frontier: $A(f{=}8),\ B(f{=}9)$.

**Expand $A$** (smallest $f=8$): not goal. Generate: $C$ with $g=2+4=6,h=9,f=15$; $D$ with $g=2+7=9,h=3,f=12$.
Frontier: $B(9),\ D(12),\ C(15)$.

**Expand $B$** (smallest $f=9$): not goal. Generate: $D$ via $B$ with $g=5+2=7,h=3,f=10$ — cheaper than the $D$ already in the frontier ($f=12$ via $A$), so this better entry is what gets expanded next; $G$ with $g=5+6=11,h=0,f=11$.
Frontier now effectively: $D(10,\text{via }B),\ G(11),\ D(12,\text{via }A,\text{now stale}),\ C(15)$.

**Expand $D$** (smallest $f=10$, reached via $B$ with $g=7$): not goal. Generate: $G$ via $D$ with $g=7+3=10,h=0,f=10$ — cheaper than the $G$ already sitting in the frontier ($f=11$ via $B$ direct).
Frontier now effectively: $G(10,\text{via }D),\ G(11,\text{via }B,\text{now stale}),\ldots$

**Expand $G$** (smallest $f=10$): **goal!**

A* expands, in order, **S, A, B, D, G**, and returns the path $S \to B \to D \to G$ with cost $g(G) = 10$ — the true cheapest cost, matching what we can confirm by checking every route from $S$ to $G$ by hand. The stale, more expensive frontier entries for $D$ and $G$ are simply discarded once their state has already been expanded via a cheaper route.
:::

## Why an admissible heuristic keeps A* optimal

The property that made this work is that every $h(n)$ was **admissible**: it never overestimated the true remaining cost. Informally: because $h(n)$ never exaggerates how much is left to pay, $f(n) = g(n) + h(n)$ never exaggerates the true cost of the cheapest path through $n$ either. So when A* is about to expand the node with the smallest $f$-value and that node turns out to be the goal, no other path still waiting in the frontier can possibly beat it — every one of them has an $f$-value that is a lower bound on its own true cost, and that lower bound is already no better than the cost just found. This is why A* with an admissible heuristic is **optimal**: it is guaranteed to find a cheapest path, not merely *a* path.

:::callout{kind="warning"}
If a heuristic *overestimates* the true remaining cost for even one state, A* can be misled into confirming a goal before checking a cheaper alternative — exactly the mistake greedy best-first makes on every problem, because it effectively uses an $h(n)$ that dominates $g(n)$ completely. Admissibility is the guardrail that keeps A* both fast (it usually expands far fewer nodes than uniform-cost search) and optimal.
:::

You have now met the two big families of classical search: uninformed (BFS, DFS) and informed (greedy best-first, A*). The end-of-module assessment checks both the concepts and your ability to trace these algorithms by hand.
