from learnsdk import QuizItem, MCQ, Multi, TextAnswer
from courselib.cs import truth_table


class Item(QuizItem):
    title = "Check: Boolean logic"
    pass_mark = 0.7

    def questions(self):
        qs = []

        # --- 1. Evaluate "A AND (NOT B)" for random A, B (MCQ: True/False). ---
        a = self.rng.choice([0, 1])
        b = self.rng.choice([0, 1])
        result = a and (not b)
        qs.append(MCQ(
            text=(
                f"Evaluate the expression $A \\cdot \\overline{{B}}$ "
                f"(A AND NOT B) when $A = {a}$ and $B = {b}$."
            ),
            choices=["0 (False)", "1 (True)"],
            answer=1 if result else 0,
            explanation=(
                f"$\\overline{{B}} = {0 if b else 1}$, so "
                f"$A \\cdot \\overline{{B}} = {a} \\cdot {0 if b else 1} = "
                f"{1 if result else 0}$."
            ),
        ))

        # --- 2. Evaluate a 3-term expression as a number (TextAnswer 0/1). ---
        x = self.rng.choice([0, 1])
        y = self.rng.choice([0, 1])
        z = self.rng.choice([0, 1])
        # X OR (Y AND NOT Z)
        val = x or (y and (not z))
        qs.append(TextAnswer(
            text=(
                f"What is the value (write 0 or 1) of "
                f"$X + (Y \\cdot \\overline{{Z}})$ when "
                f"$X = {x}$, $Y = {y}$, $Z = {z}$?"
            ),
            accept=["1" if val else "0"],
            explanation=(
                f"$\\overline{{Z}} = {0 if z else 1}$; "
                f"$Y \\cdot \\overline{{Z}} = {1 if (y and not z) else 0}$; "
                f"$X + (Y \\cdot \\overline{{Z}}) = {1 if val else 0}$."
            ),
        ))

        # --- 3. Which rows of a 2-input truth table make the output true? ---
        gates = {
            "AND ($A \\cdot B$)": lambda p, q: p and q,
            "OR ($A + B$)": lambda p, q: p or q,
            "XOR ($A \\oplus B$)": lambda p, q: p != q,
            "NAND ($\\overline{A \\cdot B}$)": lambda p, q: not (p and q),
            "NOR ($\\overline{A + B}$)": lambda p, q: not (p or q),
        }
        gate_name = self.rng.choice(list(gates.keys()))
        fn = gates[gate_name]
        rows = truth_table(fn, 2)  # ascending: (F,F),(F,T),(T,F),(T,T)
        labels = [
            f"$A={int(inp[0])}, B={int(inp[1])}$" for inp, _ in rows
        ]
        true_idx = [i for i, (_, out) in enumerate(rows) if out]
        qs.append(Multi(
            text=(
                f"For the **{gate_name}** gate, select every row of the "
                f"truth table whose output is 1 (true)."
            ),
            choices=labels,
            answers=true_idx,
            explanation=(
                "The true rows are: "
                + ", ".join(labels[i] for i in true_idx)
                + "."
            ) if true_idx else "No input combination makes this output true.",
        ))

        # --- 4. De Morgan equivalence (MCQ). ---
        if self.rng.choice([True, False]):
            # NOT(A AND B) == (NOT A) OR (NOT B)
            qs.append(MCQ(
                text="By De Morgan's laws, $\\overline{A \\cdot B}$ is equivalent to:",
                choices=[
                    "$\\overline{A} \\cdot \\overline{B}$",
                    "$\\overline{A} + \\overline{B}$",
                    "$A + B$",
                    "$A \\cdot B$",
                ],
                answer=1,
                explanation=(
                    "De Morgan: the negation of an AND becomes an OR of the "
                    "negations, so $\\overline{A \\cdot B} = "
                    "\\overline{A} + \\overline{B}$."
                ),
            ))
        else:
            # NOT(A OR B) == (NOT A) AND (NOT B)
            qs.append(MCQ(
                text="By De Morgan's laws, $\\overline{A + B}$ is equivalent to:",
                choices=[
                    "$\\overline{A} + \\overline{B}$",
                    "$\\overline{A} \\cdot \\overline{B}$",
                    "$A \\cdot B$",
                    "$A + B$",
                ],
                answer=1,
                explanation=(
                    "De Morgan: the negation of an OR becomes an AND of the "
                    "negations, so $\\overline{A + B} = "
                    "\\overline{A} \\cdot \\overline{B}$."
                ),
            ))

        # --- 5. Identify a gate from its behaviour (MCQ). ---
        descriptions = [
            ("outputs 1 only when both inputs are 1", "AND"),
            ("outputs 1 when at least one input is 1", "OR"),
            ("outputs 1 only when the two inputs differ", "XOR"),
            ("outputs 0 only when both inputs are 1", "NAND"),
        ]
        desc, gate = self.rng.choice(descriptions)
        choice_names = ["AND", "OR", "XOR", "NAND"]
        qs.append(MCQ(
            text=f"Which gate {desc}?",
            choices=choice_names,
            answer=choice_names.index(gate),
            explanation=f"A gate that {desc} is the **{gate}** gate.",
        ))

        return qs
