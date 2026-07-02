# Regular languages and the Turing machine

## Regular languages: what an FSM (and a simple regex) can recognise

The set of all strings that some FSM accepts is called a **regular language**. Every regular expression you have used to validate a phone number or search a file describes a regular language under the hood — a text engine effectively builds an FSM from the pattern and runs your string through it.

This gives regular expressions real but **limited** power. A simple regex can match things like:

- "one or more digits" (fixed, local structure — an FSM just needs to remember "have I seen a digit yet?"),
- "a letter followed by any number of letters or digits" (a plausible identifier),
- "starts with http:// or https://".

All of these only ever need to remember a small, fixed amount of information about what has been read *so far* — exactly what a finite number of states can encode.

A simple regex (and therefore an FSM) **cannot** match patterns that require counting an *unbounded* amount of something, because that would need infinitely many states. Classic examples:

- **Balanced brackets of any depth**, e.g. matching `(`, `()`, `(())`, `((()))`, … as a single family — an FSM cannot count "how many brackets are still open" once that count is unbounded, because it only ever remembers which of its finitely many states it's in.
- **Equal numbers of 0s and 1s** in a binary string, for strings of any length — the FSM would need to track the *running difference* between the counts, which is unbounded.
- **$a^n b^n$** — $n$ copies of `a` followed by exactly $n$ copies of `b`, for arbitrary $n$.

:::callout{kind="key"}
The test is not "is the pattern complicated?" but "does recognising it require remembering an unbounded amount of information about the input seen so far?" If yes, no FSM (and no plain regex) can do it — you need a more powerful model, such as the ones used to describe programming-language grammars (context-free grammars), or ultimately a full Turing machine.
:::

## The Turing machine

A finite state machine only reads its input once, left to right, and has no memory beyond its current state. That is why it cannot handle unbounded counting. To model what is computable *in general* — anything a modern computer, given unlimited time and memory, could in principle work out — computer science uses a much more powerful (but still simple to describe) abstract model: the **Turing machine**, introduced by Alan Turing in 1936.

A Turing machine has:

- An infinitely long **tape**, divided into cells, each holding one symbol from a finite alphabet (or a special *blank* symbol).
- A **head** positioned over one cell at a time, which can read the symbol there, write a new symbol over it, and then move one cell **left** or **right**.
- A finite set of **states**, including a start state and (usually) one or more halting states.
- A finite table of **transition rules**, each of the form: *"if in state $X$ reading symbol $s$, write symbol $s'$, move left or right, and go to state $Y$."*

The machine runs by repeatedly looking up the rule for its current state and the symbol under the head, applying it, and continuing — until it reaches a state with no further rule (it **halts**), or runs forever.

:::callout{kind="info"}
Despite this extreme simplicity — one tape, one head, a lookup table — the Turing machine can compute anything any modern programming language can compute. This claim is known as the **Church–Turing thesis**: no one has ever found a realistic model of computation that is more powerful. That is precisely why the Turing machine is used as *the* formal definition of "computable": a problem is computable if, and only if, some Turing machine can solve it (given unlimited time and tape).
:::

### Example: a Turing machine that adds 1 to a binary number

Here is a small Turing machine that increments a binary number written on the tape by one. The alphabet is $\{0, 1, \_\}$ (`_` is blank), and it uses three states:

| State | Read | Write | Move | Next state | Meaning |
| --- | --- | --- | --- | --- | --- |
| $q_0$ | 0 or 1 | (unchanged) | Right | $q_0$ | Scan right to find the end of the number |
| $q_0$ | blank | (unchanged) | Left | $q_1$ | Found the end; step back onto the last digit |
| $q_1$ | 1 | 0 | Left | $q_1$ | A 1 becomes 0 and the carry continues left |
| $q_1$ | 0 | 1 | Left | $q_2$ | A 0 becomes 1; no more carry — halt |
| $q_1$ | blank | 1 | — | $q_2$ (halt) | Carried past the front (all digits were 1) |

$q_2$ is a halting state (no outgoing rules needed).

:::reveal{title="Worked example: trace the machine on input \"011\" (the number 3)"}
The tape starts as `0 1 1`, head at the leftmost cell, state $q_0$.

| Step | State | Head reads | Action | Tape after |
| --- | --- | --- | --- | --- |
| 1 | $q_0$ | 0 (cell 0) | unchanged, move right | `011` |
| 2 | $q_0$ | 1 (cell 1) | unchanged, move right | `011` |
| 3 | $q_0$ | 1 (cell 2) | unchanged, move right | `011` |
| 4 | $q_0$ | blank (cell 3) | move left, → $q_1$ | `011_` |
| 5 | $q_1$ | 1 (cell 2) | write 0, move left | `010_` |
| 6 | $q_1$ | 1 (cell 1) | write 0, move left | `000_` |
| 7 | $q_1$ | 0 (cell 0) | write 1, move left, → $q_2$ (halt) | `100_` |

The machine halts with the tape reading `100` — the binary number 4. Since $3 + 1 = 4$, the machine is correct. Notice the head first sweeps all the way **right** to find the end of the number, then sweeps back **left**, writing as it goes to propagate the "carry" — exactly what you'd do by hand adding 1 to $011_2$.
:::

This one machine only adds 1 to a binary number, but the same tape-head-states-rules recipe, scaled up with more states and rules, can express any algorithm — sorting, searching, running a whole operating system. That scaling-up (never a change in the *kind* of machine) is what makes the Turing machine the theoretical ceiling of computation, and why "what can a Turing machine compute?" and "what can any computer, given unlimited resources, compute?" are treated as the same question.

## Practice

::py{src="items/theory-quiz.py" params='{"topic": "computability"}'}
