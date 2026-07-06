# Software categories and interrupts

## Systems, utility and application software

Every piece of software on a computer falls into one of three categories.

- **Systems software** manages the computer itself and provides the platform other software runs on. The operating system is the prime example; **device drivers** (which let the OS talk to a specific printer, graphics card, etc.) are also systems software, because without them the OS cannot use the hardware at all.
- **Utility software** is a specific kind of systems software: small programs that perform one maintenance or housekeeping task rather than a user-facing job. Examples include disk defragmenters, antivirus scanners, file compression tools and backup software.
- **Application software** is written to let a user accomplish a specific task that has nothing to do with managing the computer itself: word processors, web browsers, spreadsheets, photo editors and games are all applications.

| Category | Purpose | Examples |
| --- | --- | --- |
| Systems software | Manage hardware and provide a platform for other software | Operating system, device drivers, compilers |
| Utility software | Perform a specific maintenance task | Disk defragmenter, antivirus, backup tool, file compressor |
| Application software | Let the user perform a real-world task | Word processor, web browser, spreadsheet, game |

:::callout{kind="tip"}
A quick test: if removing the program would stop the *rest of the computer* working properly, it's systems software. If it just does one useful maintenance job for you, it's a utility. If it does a job for you that has nothing to do with the computer's own upkeep, it's an application.
:::

:::callout{kind="warning"}
A compiler or interpreter counts as **systems software**, not an application — it exists to translate other programs so the computer can run them, which is a platform-level job, not an end-user task.
:::

## Terminology check

::widget{type="flashcards" src="cards/os-terminology.json"}

## Interrupts

An **interrupt** is a signal sent to the processor telling it to stop what it is doing and deal with something more urgent. Interrupts can come from hardware (a key is pressed, a disk finishes transferring data, a network packet arrives) or from software (a program requests OS services, or an error such as division by zero occurs). Without interrupts, the CPU would have to constantly ask each device "are you ready yet?" — wasting huge amounts of processing time on **polling**. Interrupts let a device stay silent until it actually needs attention.

Recall the **fetch-decode-execute cycle** from computer architecture: fetch the next instruction, decode it, then execute it, over and over. Interrupt handling is bolted onto the end of that cycle.

::widget{type="step-reveal" src="steps/interrupt-handling.json"}

:::callout{kind="key"}
The processor checks for a waiting interrupt at the **end of every fetch-decode-execute cycle**, after the current instruction has finished executing — never mid-instruction. This keeps the effect of an interrupt predictable: it can only ever happen between two complete instructions.
:::

:::reveal{title="Worked example: printer interrupt while typing"}
You are typing in a word processor when a background print job finishes. Explain, step by step, how the OS responds.

1. The printer's controller raises a hardware interrupt line once the print job is complete.
2. The CPU keeps running the word processor's instructions until it reaches the end of its current fetch-decode-execute cycle.
3. At that checkpoint, the CPU detects the interrupt is set and (assuming interrupts aren't disabled) pauses the word processor: it pushes the program counter and register values onto the stack so it can resume later.
4. Control transfers to the operating system's interrupt handler, which reads an **interrupt vector** to work out the printer caused this interrupt, then runs the printer's interrupt service routine (ISR) — e.g. marking the print job as finished and waking any process waiting on it.
5. Once the ISR completes, the CPU restores the word processor's saved registers and program counter and resumes exactly where it left off.

From your point of view as the typist, nothing visibly happened — the interruption is short enough, and the state is fully restored, so the word processor appears to have run continuously.
:::

## Why this matters together

The three ideas in this module connect directly: the OS uses **interrupts** (e.g. a timer interrupt) to reliably end a process's time slice for **round-robin scheduling**, even if that process never asks to give up the CPU voluntarily. Managing hardware resources, running processes fairly, and responding to the outside world via interrupts are really the same job seen from three angles — which is why they are all core responsibilities of the operating system.
