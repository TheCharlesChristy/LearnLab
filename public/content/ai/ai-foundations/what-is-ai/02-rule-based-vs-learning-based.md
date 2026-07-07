# Rule-based AI vs learning-based AI

There are two broad ways to make a computer behave "intelligently" at some task. You can sit down and write out, explicitly, exactly what it should do in every situation you can think of — this is **rule-based** (or **symbolic**) AI. Or you can show the computer many examples of the task being done correctly and have it work out its own rules statistically — this is **learning-based** AI. Almost everything in this course, and almost every real AI system, sits somewhere on this spectrum.

## Rule-based (symbolic) AI

In **rule-based AI**, a human expert writes down explicit rules, facts, or logical conditions, and the program simply follows them — usually as `if / then` statements, decision trees, or a base of logical facts an inference engine can search through. Nothing is "learned"; the program's behaviour is exactly what its author encoded, no more and no less.

This was the dominant approach to AI from the 1950s through the 1980s, sometimes retrospectively nicknamed "Good Old-Fashioned AI" (GOFAI). Its flagship products were **expert systems**: programs like MYCIN (1970s, diagnosing bacterial infections) that encoded a human specialist's knowledge as hundreds of hand-written if-then rules, and could explain *exactly* which rule fired to produce a given recommendation. Early chess programs combined this style — a hand-crafted function scoring how good a board position looks, tuned by programmers and chess experts — with brute-force search through possible move sequences.

**Strengths:** transparent and predictable — you can point at the exact rule responsible for any decision, which makes rule-based systems easy to debug and to trust in high-stakes settings. **Weaknesses:** brittle — a rule-based system only handles situations its author explicitly anticipated, and extending it to new cases means a human going back and writing more rules by hand, which does not scale to messy, highly variable real-world inputs like natural language or photographs.

## Learning-based AI

In **learning-based AI**, nobody writes the rules directly. Instead, the system is given many example inputs (**training data**) together with the correct outputs, and a learning algorithm automatically adjusts the system's internal parameters to reduce its errors on those examples. The "rules" that emerge are implicit in those adjusted parameters, not written down anywhere a human can simply read off.

Statistical machine learning grew steadily from the 1990s onward as data and computing power became more available, and a further shift — **deep learning**, using large layered neural networks — took off from around 2012, when it began dramatically outperforming older approaches on tasks like image recognition once enough labelled data and computing power were available.

**Strengths:** learning-based systems can generalise to inputs their designer never explicitly considered, and they cope well with messy, noisy, high-variety data (photographs, speech, free-form text) that would need an impossibly long list of hand-written rules. **Weaknesses:** the resulting system can be a "black box" — it is often hard to state in plain language *why* it made a particular decision; it needs a large and genuinely representative set of training examples to work well; and it will faithfully reproduce any biases present in that training data.

:::callout{kind="key"}
**Rule-based AI:** a human writes the rules; the system is transparent but brittle. **Learning-based AI:** the system infers its own rules from data; it generalises well but can be an opaque "black box." Neither is simply "better" — the right choice depends on whether you need transparency, whether you have training data, and how varied the inputs are.
:::

## Try it: a tiny rule-based "AI"

The move-picker below is a genuine, if toy, example of rule-based AI: it plays rock–paper–scissors by always countering whatever the opponent played last, using nothing but hand-written `if`/`elif` logic. Run it, then read the commentary underneath.

::widget{type="code-runner" language="python" rows=14 starter="def choose_move(opponent_last_move):\n    \"\"\"A RULE-BASED move-picker: it follows hand-written rules only.\n    There is no data, no training, and no learning here — the\n    programmer decided every case in advance.\"\"\"\n    if opponent_last_move == \"rock\":\n        return \"paper\"       # paper beats rock\n    elif opponent_last_move == \"paper\":\n        return \"scissors\"    # scissors beats paper\n    elif opponent_last_move == \"scissors\":\n        return \"rock\"        # rock beats scissors\n    else:\n        return \"rock\"         # no history yet: default opening move\n\n\nfor last_move in [None, \"rock\", \"rock\", \"paper\", \"scissors\"]:\n    print(f\"opponent last played {last_move!r:>10} -> AI plays {choose_move(last_move)!r}\")" solutionTest="assert choose_move(None) == \"rock\"\nassert choose_move(\"rock\") == \"paper\"\nassert choose_move(\"paper\") == \"scissors\"\nassert choose_move(\"scissors\") == \"rock\"\nprint(\"All rules behave as specified.\")"}

Every branch of `choose_move` was decided by a human before the program ever ran, and the function will behave identically forever unless someone edits the code — the hallmark of rule-based AI. A **learning-based** version of the same idea would instead look at a *log* of the opponent's past rounds, notice statistical patterns (does this opponent play "rock" more often after losing, say?), and pick its move based on a model trained on that history — with nobody writing down "if rock then paper" anywhere.

:::reveal{title="Worked example: classifying four systems as rule-based or learning-based"}
1. **A basic spam filter that blocks any email containing a fixed list of banned words** (e.g. "lottery winner", "wire transfer"). **Rule-based.** A human decided the exact list of trigger words in advance; the filter has no capacity to notice new spam wording it wasn't told about.
2. **A modern spam filter trained on millions of emails that were labelled "spam" or "not spam" by users.** **Learning-based.** Nobody wrote a list of trigger words; the filter's internal parameters were adjusted automatically to fit the labelled examples, and it can flag spam phrased in ways no human anticipated.
3. **Deep Blue's chess position-evaluation function**, hand-tuned by IBM engineers and chess grandmasters, combined with a search through possible move sequences. **Rule-based (symbolic).** The scoring of "how good is this position" was written and adjusted by humans, even though the search itself explores many possibilities mechanically.
4. **AlphaZero's chess evaluation**, which is given only the rules of chess and then learns which positions are strong purely by playing millions of games against itself. **Learning-based.** No human wrote down what a good position looks like; that knowledge emerged entirely from self-play training.
:::

In practice, many deployed systems are hybrids — a learning-based component (say, a trained image classifier) wrapped in rule-based logic that decides what to do with its output (say, "if classifier confidence < 90%, ask a human to check"). Knowing the two pure paradigms makes it much easier to see which parts of a hybrid system are which. Next, we look at a famous — and famously imperfect — way of judging whether a system's behaviour counts as "intelligent" at all: the Turing test.
