# Abstraction and finite state machines

Real systems — a vending machine, a traffic light, a compiler, an operating system scheduler — are too complicated to reason about all at once. Computer science tackles this with two problem-solving techniques you have probably already been using without naming them: **abstraction** and **decomposition**.

## Abstraction and decomposition

**Abstraction** means deliberately ignoring detail that does not matter for the problem at hand, so you can focus on what does. A satnav abstracts a road network down to a graph of junctions and distances — it does not model lane markings or traffic lights, because those details are irrelevant to finding a shortest route. Choosing the *right* abstraction is itself a skill: abstract away too much and you lose information you needed; abstract away too little and the problem stays overwhelming.

**Decomposition** means splitting a large problem into smaller, more manageable sub-problems that can be tackled (and tested) independently, then combined. A media player decomposes into "read the file", "decode the audio", "output the sound", and "draw the UI" — each of which is itself a tractable problem, built in turn from smaller ones.

:::callout{kind="key"}
Abstraction and decomposition are complementary: decomposition breaks a problem into parts, and abstraction lets you treat each part (and its sub-parts) as a simple black box — "give it this input, it produces that output" — without tracking every internal detail while you work on the rest of the system.
:::

Both ideas are the reason the next model in this module is useful at all. A vending machine, a traffic light and a text search all involve *state* — the system behaves differently depending on what has happened so far — but we can abstract away everything except "which state am I in, and what makes me move to another one?"

## Finite state machines

A **finite state machine (FSM)** is an abstract model of a system that can be in exactly one of a *finite* number of **states** at any time, and moves between states by reading input one symbol at a time.

An FSM consists of:

- A finite set of **states**, drawn as circles.
- A **start state** (marked with an incoming arrow from nowhere), where the machine begins before reading any input.
- One or more **accepting states** (drawn with a double circle), which mark input as "recognised" if the machine ends there.
- A set of **transitions** — arrows labelled with an input symbol, showing which state the machine moves to when it reads that symbol in a given state.

To **trace** an FSM on an input string, start at the start state, then read the string one symbol at a time, following exactly one transition per symbol. Once every symbol has been consumed, the string is **accepted** if the machine has landed on an accepting state, and **rejected** otherwise.

### Example: strings ending in "01"

Consider an FSM over the alphabet $\{0, 1\}$ with three states — $S_0$ (start), $S_1$, and $S_2$ (accepting) — and these transitions:

| From | Read 0 | Read 1 |
| --- | --- | --- |
| $S_0$ | $S_1$ | $S_0$ |
| $S_1$ | $S_1$ | $S_2$ |
| $S_2$ | $S_1$ | $S_0$ |

$S_2$ is the only accepting state. This machine is designed to accept exactly the binary strings that **end in "01"** — $S_1$ means "I've just seen a 0 that could start 01", and $S_2$ means "the last two symbols were 01".

:::callout{kind="tip"}
Reading a transition table: the row is the *current* state, the column is the *symbol just read*, and the cell is the state you move to. A blank cell would mean "no valid move", but a well-formed FSM defines a transition for every state/symbol pair.
:::

:::reveal{title="Worked example: trace \"1101\" through the FSM above"}
Start at $S_0$ and read the string $1101$ one symbol at a time.

| Step | Current state | Symbol read | Next state |
| --- | --- | --- | --- |
| 1 | $S_0$ | 1 | $S_0$ |
| 2 | $S_0$ | 1 | $S_0$ |
| 3 | $S_0$ | 0 | $S_1$ |
| 4 | $S_1$ | 1 | $S_2$ |

The full path is $S_0 \to S_0 \to S_0 \to S_1 \to S_2$. All four symbols have been read and the machine has landed on $S_2$, which **is** the accepting state, so the FSM **accepts** "1101" — correctly, since the string ends in "01".

Contrast this with the string "1010": tracing gives $S_0 \to S_0 \to S_1 \to S_2 \to S_1$. The machine finishes on $S_1$, which is not accepting, so "1010" is **rejected** — correctly, since the string ends in "10", not "01".
:::

## Simulate an FSM yourself

The code below encodes the same transition table as a Python dictionary keyed by `(state, symbol)`, then traces the string `'1101'` using `itertools.accumulate` (each step feeds the previous state and the next symbol into the transition function). Run it, then edit the string `s` or the `transitions` dictionary to trace your own inputs.

::widget{type="code-runner" language="python" starter="from itertools import accumulate; transitions = {('S0','0'):'S1',('S0','1'):'S0',('S1','0'):'S1',('S1','1'):'S2',('S2','0'):'S1',('S2','1'):'S0'}; s = '1101'; path = list(accumulate(s, lambda state, sym: transitions[(state, sym)], initial='S0')); print(' -> '.join(path)); print('ACCEPT' if path[-1] == 'S2' else 'reject')" rows=10}

FSMs like this show up constantly in computing: they describe traffic-light sequencing, the lexer stage of a compiler (deciding whether a chunk of text is a valid identifier or number), text search, and — as you'll see in the assessment — a simple way to test divisibility by reading a number's binary digits one at a time.

## Practice

::py{src="items/theory-quiz.py" params='{"topic": "fsm"}'}
