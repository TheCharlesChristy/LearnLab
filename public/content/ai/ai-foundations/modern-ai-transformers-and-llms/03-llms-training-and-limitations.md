# Large language models: training, capabilities and limitations

A **large language model (LLM)** — the kind of system behind modern AI chat assistants — is, structurally, "just" a transformer (previous lesson): a very large stack of attention and feed-forward layers, with an embedding layer (Lesson 1) at the front turning tokens into vectors and a final layer at the back turning vectors back into a prediction over the vocabulary. What makes it an *LLM* rather than a small classroom example is scale — billions of internal numbers ("parameters"), trained on a very large fraction of all the text on the internet — and how it is trained.

## Tokens: the units an LLM reads and writes

Before any text reaches the model, it is chopped into **tokens** — small chunks, often whole common words but sometimes word-pieces (so "unhappiness" might become "un" + "happi" + "ness"). The model always works one token at a time: it reads a sequence of tokens and, at each step, predicts a probability for what the *next* token should be.

## Pretraining: learning to predict the next token

The first and by far the most expensive stage of building an LLM is **pretraining**. The model is shown enormous quantities of ordinary text (books, articles, web pages, code) and given one repeated task: given the tokens so far, predict the next one. There is no human labelling involved — the "correct answer" for training is always just whatever token actually came next in the real text, so the training signal is free and effectively unlimited.

:::callout{kind="key"}
**Pretraining** = predict the next token, over and over, across huge amounts of text. It is how a transformer's billions of weights first learn grammar, facts, reasoning patterns, and writing style — all as a side effect of getting good at next-token prediction.
:::

This single, simple-sounding task turns out to force the model to implicitly learn a huge amount: to predict the next word well, it helps to "know" grammar, to "know" that Paris is the capital of France, and to "know" how an argument is typically structured — none of which was ever explicitly taught, only absorbed as a means to the end of predicting well.

## Fine-tuning: shaping the pretrained model's behaviour

A freshly pretrained model is good at *continuing* text plausibly, but it has no particular tendency to be helpful, to answer questions directly, or to refuse harmful requests — it just continues whatever pattern it sees. **Fine-tuning** is a second, much smaller round of training on a curated set of examples — for instance, pairs of (instruction, good response) written or selected by humans — that reshapes the model's behaviour toward being a useful assistant: answering questions instead of just continuing them, following instructions, adopting a consistent tone.

:::callout{kind="tip"}
Pretraining is what gives the model its raw knowledge and language ability (expensive, done once on general text); fine-tuning is what turns that raw ability into a specific, useful behaviour (cheaper, done on a much smaller curated dataset, and can be repeated for different purposes).
:::

## A toy taste of "predicting the next token"

Real LLMs predict the next token using billions of learned weights across dozens of attention layers — far beyond what we can build by hand. But the *core idea* — using statistics of what tends to follow what — can be shown with something much simpler: a **bigram model**, which just counts, across a body of text, how often each word is followed by each other word, and always predicts whichever follow-up word it saw most often.

Run the code below to build a tiny bigram model from a handful of toy sentences, and see what it predicts:

::widget{type="code-runner" language="python" starter="sentences = [\n    'the cat sat on the mat',\n    'the dog sat on the log',\n    'the cat ran under the mat',\n    'the cat drank the milk',\n]\n\nfrom collections import Counter\n\ncounts = Counter()\nfor s in sentences:\n    words = s.split()\n    for a, b in zip(words, words[1:]):\n        counts[(a, b)] += 1\n\ndef next_word(word):\n    candidates = {b: c for (a, b), c in counts.items() if a == word}\n    return max(candidates, key=candidates.get)\n\nprint('Bigram counts starting with the:')\nfor (a, b), c in counts.items():\n    if a == 'the':\n        print(' the ->', b, ':', c)\n\nprint('Predicted next word after the:', next_word('the'))\nprint('Predicted next word after sat:', next_word('sat'))\n\n# Try adding your own sentence to the list above and re-running!" rows=20}

:::reveal{title="Worked example: counting bigrams by hand"}
Using just the first two toy sentences, **"the cat sat on the mat"** and **"the dog sat on the log"**, list the consecutive word-pairs (bigrams) in each:

- Sentence 1: (the, cat), (cat, sat), (sat, on), (on, the), (the, mat)
- Sentence 2: (the, dog), (dog, sat), (sat, on), (on, the), (the, log)

Counting how often each pair occurs across both sentences: (sat, on) occurs **twice** (once per sentence) — more than any other pair here. So a bigram model trained on just these two sentences would predict "on" as the word most likely to follow "sat", since that is the only follow-up it has ever seen. This is exactly what the code above computes, just automatically and over more sentences (where "cat", not "dog" or "mat" alone, becomes the top prediction after "the", because "the cat" appears three times in the full list).

A real LLM does something conceptually similar at every step — assign a likelihood to every possible next token — but it conditions that likelihood on the *meaning* of the entire preceding context (via attention across embeddings), not just the single previous word, which is why it can produce far more coherent, context-appropriate text than a bigram model ever could.
:::

## Capabilities

Trained this way, modern LLMs can hold conversations, answer general-knowledge questions, summarise and translate text, explain and write code, and adapt their style to instructions — all from the same underlying next-token-prediction machinery, shaped by fine-tuning.

## Well-known limitations

It is just as important to understand what LLMs are *not* good at, and why:

- **Hallucination.** An LLM can state something completely false with exactly the same fluent, confident tone as something true — for example, confidently citing a plausible-sounding but nonexistent research paper, or inventing a specific (wrong) date for a real event. This happens because the model is generating the *statistically likely-sounding* continuation of the text, not consulting a database of verified facts.
- **No true "understanding."** An LLM does not have beliefs, goals, or a model of the world in the way a human does. It produces output by recognising and continuing statistical patterns learned from its training text. It can therefore produce text that reads as if it understands a topic deeply while having no way to check that text against reality.
- **Sensitivity to prompt phrasing.** Because the model's prediction is conditioned on the exact sequence of tokens it is given, small changes in how a question is worded — different phrasing, extra context, a different order of instructions — can noticeably change the quality or correctness of the answer, in a way that would not affect a human expert nearly as much.
- **Reproducing training-data bias.** Because the model's "knowledge" is entirely a reflection of patterns in its training text, any imbalances, stereotypes, or skewed viewpoints present in that text can be reproduced — and even confidently amplified — in the model's output, without any explicit intent on the model's part.

:::callout{kind="warning"}
None of these limitations mean LLMs are not useful — they mean their output should be treated as a fluent, often-correct *draft* or *starting point* rather than a verified source of truth, especially for facts, calculations, or anything safety-critical. Checking important claims against a reliable source remains the user's responsibility.
:::

## Key terms

Use the flashcards below to test yourself on the vocabulary introduced across this module.

::widget{type="flashcards" src="cards/key-terms.json"}
