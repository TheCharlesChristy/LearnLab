# Scheduling and memory management

## Round-robin scheduling

**Round-robin** is one of the simplest CPU scheduling algorithms, and a favourite in exams because you can trace it by hand. Every **ready** process sits in a queue. The scheduler gives the process at the front of the queue the CPU for a fixed **time slice** (also called a **quantum**):

- If the process finishes (or blocks on I/O) before the slice ends, the next process starts immediately.
- If the time slice runs out and the process still has work left, the OS **pre-empts** it — pauses it, moves it to the *ready* state, and sends it to the **back** of the queue — before starting the next process at the front.

This continues until every process has finished. Because every process gets a turn no matter how long it needs in total, round-robin guarantees no process waits forever (unlike, say, always running the shortest job first).

:::callout{kind="key"}
The **time slice (quantum)** is the maximum amount of CPU time a process may use before being pre-empted. A short quantum feels more responsive (everyone gets a turn quickly) but wastes more time on context switches; a long quantum wastes less time switching but makes the system feel less responsive.
:::

## Tracing a round-robin schedule

Three processes arrive at the same time, all in the *ready* queue in this order: $P_1, P_2, P_3$. Their **burst times** (the total CPU time each still needs) are:

| Process | Burst time |
| --- | --- |
| $P_1$ | 10 |
| $P_2$ | 4 |
| $P_3$ | 6 |

The time slice is **4**. Work through the queue from the front, each time running the process for `min(time slice, remaining burst)`, and re-queuing it at the back if it still has work left:

| Turn | Runs | From $t=$ | To $t=$ | Remaining after | Queue after |
| --- | --- | --- | --- | --- | --- |
| 1 | $P_1$ | 0 | 4 | 6 | $P_2, P_3, P_1$ |
| 2 | $P_2$ | 4 | 8 | 0 (done) | $P_3, P_1$ |
| 3 | $P_3$ | 8 | 12 | 2 | $P_1, P_3$ |
| 4 | $P_1$ | 12 | 16 | 2 | $P_3, P_1$ |
| 5 | $P_3$ | 16 | 18 | 0 (done) | $P_1$ |
| 6 | $P_1$ | 18 | 20 | 0 (done) | (empty) |

So $P_2$ finishes first, at $t=8$; $P_3$ finishes at $t=18$; $P_1$ finishes last, at $t=20$, having needed three separate turns because its burst time is more than two time slices.

## Simulate it yourself

The playground below runs exactly this algorithm in Python (packed into one `exec(...)` line so it fits in this editor). Run it as-is to reproduce the trace above, then edit the numbers inside the string — `"P1": 10` etc., or `quantum = 4` — and re-run to see a different schedule.

::widget{type="code-runner" language="python" starter='exec("processes = {\"P1\": 10, \"P2\": 4, \"P3\": 6}\nquantum = 4\nremaining = dict(processes)\nqueue = list(processes.keys())\ntime_now = 0\nprint(\"start end  pid   remaining\")\nwhile queue:\n    pid = queue.pop(0)\n    start = time_now\n    run = min(quantum, remaining[pid])\n    time_now += run\n    remaining[pid] -= run\n    print(f\"{start:>5} {time_now:>4}  {pid:<4}  {remaining[pid]}\")\n    if remaining[pid] > 0:\n        queue.append(pid)\n    else:\n        waiting = time_now - processes[pid]\n        print(f\"   -> {pid} finishes at t={time_now}, waiting time={waiting}\")\n")' rows=16}

:::reveal{title="Worked example: waiting time from the trace"}
**Waiting time** for a process is how long it spent in the *ready* queue rather than running: `waiting time = finish time − burst time` (since all three processes arrived at $t=0$).

- $P_2$: finish time $8$, burst time $4$, so waiting time $= 8 - 4 = 4$.
- $P_3$: finish time $18$, burst time $6$, so waiting time $= 18 - 6 = 12$.
- $P_1$: finish time $20$, burst time $10$, so waiting time $= 20 - 10 = 10$.

$P_1$ has the longest burst time, but not the longest wait relative to its size — $P_3$ waits three times as long as it runs, because it kept getting sent to the back of the queue behind $P_1$.
:::

## Memory management: paging and segmentation

The OS must also share **memory** between every running process, keeping each one's data separate from the others'. Two classic approaches:

- **Paging** splits a process's logical memory into fixed-size **pages**, and physical RAM into equal-size **frames**. Any page can go in any free frame — they don't need to be next to each other — and the OS keeps a **page table** mapping each page to the frame currently holding it. Because every block is the same size, allocation is simple and there is no **external fragmentation** (no unusable gaps between blocks). The cost is **internal fragmentation**: a page that is only half-used still occupies a whole frame.
- **Segmentation** splits a program into variable-size **segments** that reflect its actual logical structure — e.g. one segment for code, one for the stack, one for a data array. This matches how programmers think about a program and lets each segment grow independently, but because segments vary in size, memory can end up with unusable gaps between them (external fragmentation) as segments are loaded and removed.

:::callout{kind="info"}
Many real operating systems combine the two: memory is divided into logical segments, and each segment is then divided into fixed-size pages — gaining paging's simple allocation without losing segmentation's logical structure.
:::

## Virtual memory

**Virtual memory** is the technique that lets a computer run programs whose total memory demand is larger than the physical RAM installed. The OS gives each process its own private address space (its **virtual addresses**); the page table (or segment table) translates these to real physical addresses — or to a location on disk if that page isn't currently in RAM. When a process references a page that has been moved out to disk, this triggers a **page fault**: the OS pauses the process, loads the required page back into a free frame (possibly writing another page out to disk first), then lets the process continue as if nothing happened.

:::callout{kind="warning"}
Virtual memory makes more memory *appear* available, but disk is far slower than RAM. A system doing this constantly — called **thrashing** — spends more time swapping pages in and out than doing useful work, and performance collapses.
:::

:::reveal{title="Worked example: why virtual memory needs a page table"}
A computer has 4 GB of physical RAM but is running processes that together need 6 GB of memory. Explain how virtual memory makes this possible.

1. Each process is given its own virtual address space, as if it had the memory to itself.
2. Physical RAM is divided into frames; only the pages currently in active use are kept in RAM.
3. The page table for each process records, for every one of its pages, which physical frame holds it — or a flag meaning "currently on disk".
4. Pages not needed right now (e.g. from an idle background process) are written to a reserved area of disk, freeing their frames for pages that are needed.
5. If a process accesses a page that's on disk, a page fault occurs: the OS loads it back into a free frame (evicting another page to disk if none is free) and updates the page table, then resumes the process.

The total *virtual* memory in use (6 GB) can therefore exceed the *physical* RAM (4 GB), at the cost of occasional page-fault delays.
:::
