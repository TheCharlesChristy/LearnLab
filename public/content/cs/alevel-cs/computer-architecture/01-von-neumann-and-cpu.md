# Von Neumann architecture and CPU components

Almost every general-purpose computer built since the 1940s — from a phone to a supercomputer — follows the same basic plan: the **von Neumann architecture**. Its defining idea is the **stored-program concept**: both the *instructions* that make up a program and the *data* that program works on are held in the **same memory**, as binary patterns that look identical to the hardware. The processor tells them apart only by context — whether it is currently fetching something to *execute* or something to *use as a value*.

:::callout{kind="key"}
Stored-program concept: instructions and data share one memory space, are transferred over the same buses, and are represented in the same binary form. A byte in memory is just a byte — it is only an "instruction" or a "piece of data" because of how the CPU is currently using it.
:::

This has a powerful consequence: a program can be loaded, moved, and even modified using the same operations used to manipulate data, because to the memory system there is no difference. It also means a single set of wires (the buses, covered in lesson 3) can carry both instructions and data, one item at a time, in sequence.

## Inside the CPU

The Central Processing Unit is built from two main functional units and a small set of very fast storage locations called **registers**.

- **ALU (Arithmetic and Logic Unit)** — performs arithmetic (addition, subtraction, etc.) and logical operations (AND, OR, NOT, comparisons) on binary values. Later in this module you will see how simple logic gates inside the ALU combine to perform binary addition.
- **CU (Control Unit)** — the CPU's conductor. It decodes each fetched instruction, works out what it means, and generates the timing and control signals that make the rest of the CPU (and the buses) do the right thing at the right moment, in the right order.

## The core registers

Registers are tiny, extremely fast storage locations built directly into the CPU — far faster than main memory, but able to hold only a handful of values at a time. A-level specifications focus on five:

| Register | Full name | Role |
| --- | --- | --- |
| **PC** | Program Counter | Holds the memory **address** of the *next* instruction to be fetched. Normally incremented after each fetch so the CPU works through a program in order. |
| **ACC** | Accumulator | Holds the results (or partial results) of calculations carried out by the ALU. |
| **MAR** | Memory Address Register | Holds the memory **address** that is currently about to be read from or written to. |
| **MDR** | Memory Data Register | Holds the actual **data or instruction** value being transferred to or from memory (also called the Memory Buffer Register, MBR, in some specifications). |
| **CIR** | Current Instruction Register | Holds the instruction currently being decoded and executed by the CU. |

:::callout{kind="tip"}
Notice the pattern: PC and MAR hold **addresses** (they say *where*); MDR and ACC hold **values** (they say *what*); CIR holds the instruction itself once it has arrived. Sorting each register into "address" or "value" is a quick way to remember what it stores.
:::

These registers work together with the address bus, data bus and control bus (lesson 3) to move information between the CPU and main memory. The next lesson puts them all in motion as part of the fetch-decode-execute cycle.

:::reveal{title="Worked example: what happens to the registers during one fetch?"}
Suppose the **PC currently holds address 100**, and memory address 100 stores the instruction `LDA 205` (an instruction meaning "load the value at address 205 into the accumulator"). Here is what happens to the registers *just for the fetch part* of processing this instruction:

1. The address in the **PC** (100) is copied into the **MAR** — the CPU is announcing which address it wants to read.
2. The value stored at that address in memory (the instruction `LDA 205`) is copied into the **MDR**, travelling in along the data bus.
3. The value in the **MDR** is copied into the **CIR**, ready to be decoded.
4. The **PC** is incremented (100 → 101) so it now points at the *next* instruction, ready for the following cycle.

At the end of this fetch: `PC = 101`, `MAR = 100`, `MDR = LDA 205`, `CIR = LDA 205`. Decoding and executing this instruction (which will itself use the MAR/MDR again, this time to fetch the value at address 205 into the ACC) is traced in full in the next lesson.
:::
