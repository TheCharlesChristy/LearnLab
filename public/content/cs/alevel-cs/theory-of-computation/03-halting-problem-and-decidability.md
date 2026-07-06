# The halting problem, decidability and tractability

The Turing machine gives us a precise notion of "computable". A natural next question: is there an algorithm that can look at *any* program and *any* input, and always correctly say whether that program will eventually stop running (**halt**), or run forever? This is the famous **halting problem**, and the answer — proved by Alan Turing in 1936 — is **no**. No such general algorithm can exist.

## Why no general algorithm can solve the halting problem

The proof is a **self-reference argument**: assume such an algorithm exists, then use it to build a situation that contradicts itself.

1. Suppose a program `halts(P, input)` exists that always terminates and correctly returns `True` if program `P` would halt on `input`, and `False` if `P` would run forever on `input`.
2. Build a new program, `trouble(P)`, that calls `halts(P, P)` (feeding a program its own source as input) and then does the **opposite** of what `halts` predicts: if `halts(P, P)` says "halts", `trouble` deliberately loops forever; if `halts(P, P)` says "loops forever", `trouble` immediately halts.
3. Now ask: what does `trouble(trouble)` do?
   - If `halts(trouble, trouble)` says `trouble` halts on itself, then by its own definition `trouble` loops forever — contradiction.
   - If `halts(trouble, trouble)` says `trouble` loops forever, then by its own definition `trouble` halts immediately — contradiction.

Either answer `halts` could give is immediately wrong. Since `halts` was assumed to always give a correct answer, no such `halts` can exist — the halting problem is **undecidable**.

:::callout{kind="key"}
This is the same trick as the classic "liar's paradox" ("this sentence is false") and the diagonalisation arguments used elsewhere in mathematics: build an object that is specifically designed to disagree with whatever answer a hypothetical solver gives, so no consistent answer is possible.
:::

:::reveal{title="Worked example: walking through trouble(trouble) case by case"}
Trace both branches explicitly to see the contradiction land.

**Case A — suppose `halts(trouble, trouble)` returns `True`** (claiming `trouble(trouble)` halts):
- By its definition, `trouble` checks `halts(P, P)`; getting `True` makes it **loop forever**.
- So `trouble(trouble)` actually loops forever — but `halts` just said it halts. `halts` was wrong.

**Case B — suppose `halts(trouble, trouble)` returns `False`** (claiming `trouble(trouble)` loops forever):
- By its definition, getting `False` makes `trouble` **halt immediately**.
- So `trouble(trouble)` actually halts — but `halts` just said it loops forever. `halts` was wrong again.

Both possible outputs of `halts` are contradicted by what `trouble` actually does. There is no third option for a program that always terminates with a yes/no answer, so the assumption in step 1 — that `halts` exists — must be false.
:::

## Decidable vs undecidable

A problem is **decidable** if some algorithm can answer it correctly for *every* possible input, and is guaranteed to always terminate. A problem is **undecidable** if no such algorithm can exist — some problems are simply beyond the reach of computation, no matter how much time or memory you allow.

| Problem | Decidable? | Why |
| --- | --- | --- |
| Does this FSM accept this input string? | Decidable | Trace the finite number of transitions — always finishes. |
| Is this number prime? | Decidable | Trial division always terminates with a correct answer. |
| Will this arbitrary program halt on this input? | **Undecidable** | The halting problem, proved above. |
| Do these two arbitrary programs always produce identical output? | **Undecidable** | Reduces to the halting problem (checking either program's behaviour on every input is required). |

Note carefully: undecidable does **not** mean "we haven't found the algorithm yet" or "too hard for today's computers" — it means a proof, like the one above, shows no algorithm could ever exist, on any computer, however fast.

## Tractable vs intractable

A separate question applies once we *know* a problem is decidable: **how much time does the best algorithm need, as the input grows?** This connects directly to the complexity classes you met when comparing algorithms — see the prerequisite module on algorithms and complexity.

- A problem is **tractable** if it can be solved in a "reasonable" amount of time as the input size $n$ grows — conventionally, **polynomial time**: the running time is bounded by $n$ raised to some fixed power (like $n$, $n \log n$, $n^2$, or $n^3$). Doubling the input roughly multiplies the time by a fixed factor, so tractable problems stay usable at real-world sizes.
- A problem is **intractable** if every known algorithm needs time that grows **exponentially** (or worse, e.g. factorially) with $n$ — like $2^n$ or $n!$. Each extra unit of input size can *multiply* the running time, so even modest inputs quickly become impossible to compute in any practical amount of time.

| Growth | $n = 10$ | $n = 30$ | $n = 50$ | Class |
| --- | --- | --- | --- | --- |
| $n^2$ | 100 | 900 | 2\,500 | tractable |
| $2^n$ | 1\,024 | ≈1.07 billion | ≈1.13 × 10$^{15}$ | intractable |

:::callout{kind="warning"}
"Decidable" and "tractable" answer different questions. A problem can be decidable but intractable (an algorithm exists and always finishes, but takes longer than the age of the universe for large inputs) — decidability only asks *whether* an algorithm exists, not *how fast* it is.
:::

## Key terms

Flip through these before the assessment.

::widget{type="flashcards" src="terms.json"}

## Practice

::py{src="items/theory-quiz.py" params='{"topic": "decidability"}'}
