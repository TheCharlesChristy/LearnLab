# What an operating system does

Every general-purpose computer — a laptop, a phone, a games console — runs an **operating system (OS)**: a program that starts before any other software and stays running the whole time the machine is on. Without it, every application would have to talk directly to the hard disk, the network card and the screen itself. The OS exists so that applications never have to do that.

## The three core jobs of an OS

1. **Managing hardware resources.** The OS is the only program allowed to talk to hardware directly. It shares the CPU between running programs, allocates and protects areas of memory, schedules access to disks and other devices, and mediates every read/write so that one faulty program cannot corrupt another's data.
2. **Providing a user interface.** Whether it is a graphical desktop, a touch interface, or a command line, the OS is what a person actually interacts with to launch programs, manage files and configure the machine.
3. **Running and managing processes.** The OS decides which program runs next, for how long, and cleans up after it finishes. This is the focus of the rest of this lesson.

:::callout{kind="key"}
A useful one-line definition: the operating system is the software that manages a computer's hardware and resources, and provides the platform on which all other software runs.
:::

## What is a process?

A **process** is a program that is currently loaded into memory and executing — as opposed to a **program**, which is just an inert file sitting on disk. The OS keeps a **process control block (PCB)** for every process, recording things like its process ID, the saved values of the CPU registers, its current state, and what memory it owns. When the OS switches from running one process to running another, it saves the outgoing process's registers into its PCB and loads the incoming process's saved registers — this is a **context switch**.

Because a typical computer has far more processes than CPU cores, the OS must constantly decide who runs next. That decision is called **scheduling** (covered in the next lesson).

## Process states

At any moment, a process is in exactly one of these states:

| State | Meaning |
| --- | --- |
| **New** | The process is being created; the OS is setting up its PCB and memory. |
| **Ready** | The process is loaded and able to run, but is waiting for the CPU to become free. |
| **Running** | The process currently owns the CPU and its instructions are being executed. |
| **Waiting / blocked** | The process cannot continue until something external happens — e.g. it is waiting for disk data or user input. |
| **Terminated** | The process has finished (or been ended) and the OS is reclaiming its resources. |

A process moves between these states constantly. A running process is interrupted and returned to **ready** when its time slice runs out (see the next lesson); it moves to **waiting** if it requests something slow, like reading a file, and only returns to **ready** once that request completes; it can only move into **running** from **ready**, never directly from **waiting**.

:::callout{kind="tip"}
A common exam mistake is to think a blocked process goes straight back to *running*. It cannot — every process must pass through *ready* and be chosen by the scheduler first, even if it becomes ready again immediately.
:::

## Why not just run one process at a time?

Modern CPUs support **multitasking**: switching between processes so fast (many times per second) that a single CPU core appears to run several programs at once. This is why you can play music, browse the web and run a virus scan simultaneously on a one-core-per-task budget you don't actually have. The next lesson looks at exactly how the OS decides which ready process to run next, and for how long.

:::reveal{title="Worked example: tracing a process through its states"}
A word processor is launched, waits for a large file to load from disk, then is actively used, before the user closes it. Trace its states.

1. **New** — the OS creates a PCB, allocates memory, and loads the program's code.
2. **Ready** — the process is fully set up and joins the queue of processes waiting for the CPU.
3. **Running** — the scheduler picks it; it starts executing, including issuing a request to read the file from disk.
4. **Waiting** — the disk read is slow, so the OS moves the process out of the CPU's way rather than wasting CPU time on a process that cannot proceed; another ready process runs instead.
5. **Ready** — the disk finishes delivering the file; the process can run again, but must wait its turn.
6. **Running** — the scheduler eventually picks it again; the user edits the document.
7. **Terminated** — the user closes the application; the OS reclaims its memory and removes its PCB.

Notice the process never jumps directly from *waiting* to *running* — it always re-joins the *ready* queue first.
:::
