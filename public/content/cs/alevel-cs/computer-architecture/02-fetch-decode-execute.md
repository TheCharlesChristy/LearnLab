# The fetch-decode-execute cycle and performance

Every instruction a CPU runs goes through the same three-stage cycle, over and over, for as long as the machine is switched on: **fetch**, **decode**, **execute**. This is the mechanism that actually drives the von Neumann architecture from lesson 1 — it is how the CPU turns a static list of stored instructions into a running program.

## The three stages

- **Fetch** — retrieve the next instruction from memory (using the PC, MAR, MDR and CIR, as traced at the end of lesson 1), and advance the PC.
- **Decode** — the Control Unit works out what the instruction (now in the CIR) actually means: which operation, and which register(s)/address(es) it needs.
- **Execute** — the operation actually happens: the ALU computes a result, a value moves to or from memory, or the PC is changed directly (a jump).

Use the walk-through below to step through each stage in order.

::widget{type="step-reveal" src="steps/fetch-decode-execute.json"}

:::callout{kind="info"}
This repeating fetch → decode → execute → fetch → … sequence is sometimes called the CPU's **instruction cycle**. It never stops on its own; it only pauses for interrupts (outside the scope of this module) or when the machine is halted.
:::

:::reveal{title="Worked example: tracing one full cycle for ADD 205"}
Continuing the example from lesson 1: the fetch has just finished, so `PC = 101`, `CIR = LDA 205` (load the value at address 205 into the accumulator). Now suppose the *next* instruction, at address 101, is `ADD 300` (add the value at address 300 to the accumulator). Trace it stage by stage.

**Fetch**

1. `PC` (101) → `MAR`.
2. Memory content at address 101 (`ADD 300`) → `MDR`, then → `CIR`.
3. `PC` incremented: 101 → 102.

**Decode**

4. The CU reads `CIR = ADD 300` and recognises the opcode `ADD`, with operand address `300`. It signals the ALU to prepare for an addition and schedules a memory read of address `300`.

**Execute**

5. `300` → `MAR`.
6. Memory content at address 300 (say, the value `12`) → `MDR`.
7. The ALU adds the value now in `MDR` (`12`) to the value currently in the `ACC` (say, the `LDA 205` result was `50`), and the new result (`62`) is written back into the `ACC`.

At the end: `PC = 102`, `MAR = 300`, `MDR = 12`, `CIR = ADD 300`, `ACC = 62`. The cycle then restarts at fetch, using the new `PC` value of 102.
:::

## What affects CPU performance?

Not all CPUs execute this cycle at the same rate. Three factors, examinable at A-level, dominate:

- **Clock speed** (measured in GHz — billions of cycles per second) — sets the pace at which fetch-decode-execute stages happen. A higher clock speed means more cycles complete every second, so (all else being equal) more instructions run per second.
- **Number of cores** — a core is an independent processing unit capable of running its own fetch-decode-execute cycle. Multiple cores let genuinely separate tasks (or a program deliberately split into parallel parts) run at the same time — but a single sequential task run on one core does not automatically get faster just because more cores exist elsewhere in the chip.
- **Cache size** — a larger cache (lesson 3) means more of the data and instructions a program is actively using can be kept close to the CPU, so fewer slow fetches have to go all the way out to main memory. A CPU that spends less time waiting for memory completes its instruction cycles faster on average.

:::callout{kind="warning"}
Clock speed alone does not determine performance: a chip with a higher GHz figure but a small cache and few cores can be outperformed by a chip with a lower clock speed but a large cache and several cores, especially on real, memory-heavy, parallelisable workloads.
:::

The snippet below makes the clock-speed relationship concrete: for a *fixed* number of instructions, a higher clock speed directly means less time taken (this is a simplification — real CPUs don't execute exactly one instruction per cycle — but the proportional relationship holds).

::widget{type="code-runner" language="python" starter="instructions = 1_000_000\nfor ghz in [1, 2, 4]:\n    seconds = instructions / (ghz * 1e9)\n    print(f'{ghz} GHz -> {seconds * 1e6:.1f} microseconds for {instructions} instructions')" rows=10}
