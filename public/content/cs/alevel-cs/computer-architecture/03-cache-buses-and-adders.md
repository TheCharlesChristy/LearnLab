# Cache, buses and building an adder from logic gates

The last lesson showed *when* memory is accessed during the instruction cycle. This lesson looks at *how* the CPU physically talks to memory (buses), *why* that talking can be made much faster (cache), and finally opens up the ALU to show that "arithmetic" inside a CPU is really just logic gates from the previous module wired together.

## Buses: the CPU's wiring

A **bus** is a set of parallel wires that carries a group of signals between the CPU, main memory and input/output devices. There are three, each with a distinct job:

| Bus | Carries | Direction |
| --- | --- | --- |
| **Address bus** | The memory address being accessed (e.g. the value currently in the MAR) | One-way: CPU → memory |
| **Data bus** | The actual data or instruction value being transferred (e.g. into/out of the MDR) | Two-way: CPU ↔ memory (or I/O) |
| **Control bus** | Control signals that coordinate the transfer — e.g. "read", "write", clock timing, interrupt lines | Two-way |

:::callout{kind="key"}
Putting it together: to read from memory, the CPU places an address on the **address bus**, sets a "read" signal on the **control bus**, and the requested value arrives back on the **data bus**. A write works the same way, but with a "write" signal and the value already placed on the data bus by the CPU.
:::

The **width** of the address bus limits how much memory can ever be addressed (an $n$-bit address bus can address $2^n$ distinct locations), and the width of the data bus limits how much data can move in one transfer.

## Cache memory

Main memory (RAM) is large but, relative to the speed of the CPU, slow to access. **Cache** is a small amount of very fast memory sitting between the CPU and RAM that keeps a copy of recently- or frequently-used instructions and data, so the CPU often does not have to wait for a full round trip to RAM at all.

Modern CPUs use several **levels** of cache, trading size against speed:

| Level | Typical size | Speed |
| --- | --- | --- |
| **L1** | Smallest (tens of KB), one per core | Fastest — built directly into the core |
| **L2** | Larger (hundreds of KB–a few MB), often per core | Slower than L1, still much faster than RAM |
| **L3** | Largest (several MB–tens of MB), usually shared across all cores | Slower than L2, but still far faster than RAM |

The chart below shows why this matters: each step further from the CPU costs roughly an order of magnitude more time.

::widget{type="data-plot" src="data/cache-access-times.json"}

### Why cache works: locality of reference

Cache is only useful because real programs exhibit **locality of reference** — they tend to reuse the same, or nearby, memory locations repeatedly over short periods of time:

- **Temporal locality**: if a location was accessed recently, it is likely to be accessed again soon (e.g. a loop counter, or an instruction inside a loop that runs many times).
- **Spatial locality**: if a location was accessed, nearby locations are likely to be accessed soon too (e.g. the next instruction in sequence, or the next element of an array).

Because of this, copying a *block* of nearby memory into cache the first time it is touched means many of the CPU's *next* several requests are likely to already be sitting in the fast cache — a **cache hit** — rather than needing a slow trip to RAM — a **cache miss**.

:::reveal{title="Worked example: hits and misses in a loop"}
Consider a loop that adds up the 10 elements of an array, `total = total + array[i]` for `i` from 0 to 9, with the array small enough to fit entirely in L1 cache.

1. **First access** (`array[0]`): not yet in cache — this is a **cache miss**. The CPU fetches it from RAM, and because of spatial locality the cache controller pulls in a whole nearby block, which also contains `array[1]`, `array[2]`, … since arrays are stored contiguously.
2. **Second access** (`array[1]`): already sitting in cache from the block fetched in step 1 — a **cache hit**, satisfied almost instantly.
3. **Accesses 3–10** (`array[2]`…`array[9]`): also hits, for the same reason, as long as they fall inside the block(s) already fetched.
4. The loop **instructions themselves** are also reused every iteration (temporal locality), so after the first pass through the loop body, the instructions are cache hits too.

Out of roughly 10 data accesses, only the first is a slow miss — the rest are fast hits. This is exactly why a larger, well-used cache measurably speeds up real programs, even though every individual access still, in principle, "goes through" the memory system.
:::

## Logic gates inside the ALU: building an adder

The ALU's "arithmetic" is not magic — it is built entirely from the logic gates you met in the Boolean Algebra and Logic module. The simplest example is a **half-adder**: a circuit that adds two single binary digits, $A$ and $B$, producing a **sum** bit and a **carry** bit.

Think it through digit by digit, exactly like adding two decimal digits by hand: $0+0=0$, $0+1=1$, $1+0=1$, but $1+1=10$ in binary — that is a sum digit of $0$ **with a carry of $1$** into the next column. A half-adder computes exactly this:

- **Sum** = $A \oplus B$ (XOR) — the sum bit is 1 exactly when the inputs differ, which matches ordinary binary addition without a carry-in.
- **Carry** = $A \cdot B$ (AND) — a carry is only generated when *both* inputs are 1, i.e. $1+1$.

Try it interactively below: toggle $A$ and $B$ and watch the sum and carry outputs (and the truth table) update live.

::widget{type="logic-gate-sim" src="circuits/half-adder.json"}

:::reveal{title="Worked example: deriving the half-adder truth table by hand"}
Work through all four input combinations, computing $A \oplus B$ (sum) and $A \cdot B$ (carry) separately.

| $A$ | $B$ | $A \oplus B$ (sum) | $A \cdot B$ (carry) | Meaning |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | $0 + 0 = 0$, no carry |
| 0 | 1 | 1 | 0 | $0 + 1 = 1$, no carry |
| 1 | 0 | 1 | 0 | $1 + 0 = 1$, no carry |
| 1 | 1 | 0 | 1 | $1 + 1 = 10_2$: sum digit 0, carry 1 |

Reading the last row as binary confirms the circuit is correct: sum $=0$ and carry $=1$ together represent the two-bit binary number $10$, which is $2$ in decimal — exactly $1+1$.
:::

:::callout{kind="info"}
A half-adder only handles two input bits, so it cannot accept a carry **in** from a previous column. Chaining single-bit additions together (e.g. adding two 8-bit numbers) needs a **full adder** for every column except the first: two half-adders plus an extra OR gate to combine their two carry outputs into one, so a carry generated in one column can be carried into the next.
:::
