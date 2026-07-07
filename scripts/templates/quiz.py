from learnsdk import QuizItem, Numeric, MCQ

class Item(QuizItem):
    title = "Check: the power rule"
    pass_mark = 0.75

    def questions(self):
        qs = []
        for _ in range(self.params.get("questions", 4)):
            a = self.rng.randint(2, 9)
            n = self.rng.randint(2, 5)
            x0 = self.rng.randint(1, 3)
            qs.append(Numeric(
                text=f"If $f(x) = {a}x^{{{n}}}$, find $f'({x0})$.",
                answer=a * n * x0 ** (n - 1),
                tolerance=0.01,
                explanation=(f"$f'(x) = {a*n}x^{{{n-1}}}$, so "
                             f"$f'({x0}) = {a*n*x0**(n-1)}$."),
            ))
        qs.append(MCQ(
            text="The derivative of a constant is…",
            choices=["undefined", "the constant itself", "0", "1"],
            answer=2,
            explanation="A constant doesn't change, so its rate of change is 0.",
        ))
        return qs
