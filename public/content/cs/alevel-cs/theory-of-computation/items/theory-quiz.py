from learnsdk import QuizItem, MCQ, Multi, Numeric

# --- FSM 1: accepts binary strings ending in "01" -----------------------
# States: S0 (start), S1 ("just saw a 0"), S2 (accepting, "last two were 01").
TRANSITIONS_ENDS_01 = {
    ('S0', '0'): 'S1', ('S0', '1'): 'S0',
    ('S1', '0'): 'S1', ('S1', '1'): 'S2',
    ('S2', '0'): 'S1', ('S2', '1'): 'S0',
}
ACCEPTING_ENDS_01 = {'S2'}

# --- FSM 2: accepts binary strings (MSB first) divisible by 3 -----------
# States R0 (start, accepting), R1, R2 track the remainder mod 3.


def step_mod3(state, bit):
    i = int(state[1])
    b = int(bit)
    return f"R{(2 * i + b) % 3}"


def run_fsm(transitions_fn, start, accepting, s):
    """Trace a transition function over string s from start; return (path, accepted)."""
    state = start
    path = [state]
    for ch in s:
        state = transitions_fn(state, ch)
        path.append(state)
    return path, state in accepting


CLASSIFY_DECIDABILITY = [
    ("whether a given FSM accepts a given input string", True,
     "Tracing an FSM's finite transitions always finishes with a correct "
     "answer — decidable."),
    ("whether an arbitrary program halts on an arbitrary input", False,
     "This is the halting problem, proved undecidable by the self-reference "
     "argument — no algorithm can answer it for every program/input pair."),
    ("whether a given number is prime", True,
     "Trial division (or a faster primality test) always terminates with a "
     "correct answer — decidable."),
    ("whether two arbitrary programs always produce identical output on "
     "every input", False,
     "This reduces to the halting problem in general and is undecidable."),
]

CLASSIFY_TRACTABILITY = [
    ("an algorithm that runs in time proportional to $n^2$ for input size $n$",
     True, "Polynomial time ($n^2$) is tractable — it stays manageable as "
     "$n$ grows."),
    ("an algorithm that runs in time proportional to $2^n$ for input size $n$",
     False, "Exponential time ($2^n$) is intractable — it becomes infeasible "
     "even for modest $n$."),
    ("binary search, which runs in time proportional to $\\log n$",
     True, "Logarithmic time is comfortably tractable — it barely grows as "
     "$n$ increases."),
    ("an algorithm that must try all $n!$ orderings of $n$ items",
     False, "Factorial time is intractable — it explodes even faster than "
     "exponential time."),
]

REGULAR_LANGUAGE_ITEMS = [
    ("strings that start with the prefix \"10\"", True,
     "Checking a fixed two-symbol prefix only needs a handful of states — "
     "regular."),
    ("balanced parentheses nested to an arbitrary depth", False,
     "Recognising this needs to count nesting depth, which is unbounded — "
     "not regular."),
    ("binary strings containing an equal number of 0s and 1s", False,
     "This needs a running difference between the counts, which is "
     "unbounded — not regular."),
    ("$a^n b^n$ for an arbitrary number $n$", False,
     "This needs to remember exactly how many $a$s were seen, which is "
     "unbounded — not regular."),
]


class Item(QuizItem):
    title = "Check: theory of computation"
    pass_mark = 0.7

    def questions(self):
        topic = self.params.get("topic", "fsm")
        if topic == "fsm":
            return self._fsm_questions()
        if topic == "computability":
            return self._computability_questions()
        return self._decidability_questions()

    # --- lesson 1: FSM tracing practice ---------------------------------
    def _fsm_questions(self):
        qs = []

        length = self.rng.randint(3, 6)
        s = ''.join(self.rng.choice('01') for _ in range(length))
        path, accepted = run_fsm(
            lambda st, ch: TRANSITIONS_ENDS_01[(st, ch)], 'S0', ACCEPTING_ENDS_01, s
        )
        qs.append(MCQ(
            text=(
                "This FSM accepts binary strings **ending in \"01\"**. States: "
                "$S_0$ (start), $S_1$, $S_2$ (accepting). Transitions: "
                "$S_0\\xrightarrow{0}S_1$, $S_0\\xrightarrow{1}S_0$, "
                "$S_1\\xrightarrow{0}S_1$, $S_1\\xrightarrow{1}S_2$, "
                "$S_2\\xrightarrow{0}S_1$, $S_2\\xrightarrow{1}S_0$. "
                f"Tracing from $S_0$, does it accept \"{s}\"?"
            ),
            choices=["Accept", "Reject"],
            answer=0 if accepted else 1,
            explanation=(
                f"Path: {' → '.join(path)}. It ends on {path[-1]}, which "
                + ("is the accepting state, so the FSM **accepts**."
                   if accepted else "is not accepting, so the FSM **rejects**.")
            ),
        ))

        length2 = self.rng.randint(4, 7)
        s2 = ''.join(self.rng.choice('01') for _ in range(length2))
        path2, _ = run_fsm(
            lambda st, ch: TRANSITIONS_ENDS_01[(st, ch)], 'S0', ACCEPTING_ENDS_01, s2
        )
        qs.append(Numeric(
            text=(
                "Using the same \"ends in 01\" FSM, trace the input "
                f"\"{s2}\" from $S_0$. Counting the start state, how many "
                "states does the path pass through in total?"
            ),
            answer=len(path2),
            tolerance=0,
            explanation=(
                f"Path: {' → '.join(path2)} — that is {len(path2)} states "
                "(the start state plus one per input symbol)."
            ),
        ))

        length3 = self.rng.randint(3, 6)
        s3 = ''.join(self.rng.choice('01') for _ in range(length3))
        path3, accepted3 = run_fsm(step_mod3, 'R0', {'R0'}, s3)
        value = int(s3, 2)
        qs.append(MCQ(
            text=(
                "An FSM reads a binary string most-significant-bit first "
                "and accepts iff the number it represents is divisible by "
                "3 (states $R_0,R_1,R_2$ track the remainder mod 3; $R_0$ "
                f"is start and accepting). Does it accept \"{s3}\" (the "
                f"binary number {value})?"
            ),
            choices=["Accept", "Reject"],
            answer=0 if accepted3 else 1,
            explanation=(
                f"{value} divided by 3 leaves remainder {value % 3}; the "
                f"remainder-tracking path is {' → '.join(path3)}, ending on "
                f"{path3[-1]}, "
                + ("which is $R_0$ — accept." if accepted3 else "which is not $R_0$ — reject.")
            ),
        ))

        return qs

    # --- lesson 2: regular languages and the Turing machine -------------
    def _computability_questions(self):
        qs = []

        text, is_regular, expl = self.rng.choice(REGULAR_LANGUAGE_ITEMS)
        qs.append(MCQ(
            text=f"Is the language of {text} regular (recognisable by some FSM)?",
            choices=["Regular", "Not regular"],
            answer=0 if is_regular else 1,
            explanation=expl,
        ))

        chosen = self.rng.sample(REGULAR_LANGUAGE_ITEMS, k=len(REGULAR_LANGUAGE_ITEMS))
        choices = [c[0][0].upper() + c[0][1:] for c in chosen]
        not_regular_idx = [i for i, c in enumerate(chosen) if not c[1]]
        qs.append(Multi(
            text="Select every item below that is **not** a regular language.",
            choices=choices,
            answers=not_regular_idx,
            explanation=(
                "Not regular: "
                + "; ".join(chosen[i][0] for i in not_regular_idx)
                + " — each needs to count an unbounded quantity, which no "
                "finite number of states can track."
            ),
        ))

        qs.append(MCQ(
            text="Which of these is NOT part of the standard Turing machine model?",
            choices=[
                "An infinite tape divided into cells",
                "A head that reads, writes and moves one cell at a time",
                "A finite table of transition rules",
                "Random-access memory addressable by an index",
            ],
            answer=3,
            explanation=(
                "A Turing machine only ever accesses the tape one cell at a "
                "time via the head's current position — there is no "
                "random-access memory that jumps straight to an arbitrary "
                "index."
            ),
        ))

        return qs

    # --- lesson 3: halting problem, decidability, tractability ----------
    def _decidability_questions(self):
        qs = []

        text, is_decidable, expl = self.rng.choice(CLASSIFY_DECIDABILITY)
        qs.append(MCQ(
            text=f"Classify the following problem: deciding {text}.",
            choices=["Decidable", "Undecidable"],
            answer=0 if is_decidable else 1,
            explanation=expl,
        ))

        text2, is_tractable, expl2 = self.rng.choice(CLASSIFY_TRACTABILITY)
        qs.append(MCQ(
            text=f"Classify: {text2}.",
            choices=["Tractable", "Intractable"],
            answer=0 if is_tractable else 1,
            explanation=expl2,
        ))

        chosen = self.rng.sample(CLASSIFY_DECIDABILITY, k=len(CLASSIFY_DECIDABILITY))
        choices = [c[0][0].upper() + c[0][1:] for c in chosen]
        decidable_idx = [i for i, c in enumerate(chosen) if c[1]]
        qs.append(Multi(
            text="Select every problem below that IS decidable.",
            choices=choices,
            answers=decidable_idx,
            explanation=(
                "Decidable: "
                + "; ".join(chosen[i][0] for i in decidable_idx)
                + " — an algorithm exists that always terminates with a "
                "correct answer for these. The rest are undecidable."
            ),
        ))

        return qs
