# Word embeddings: representing meaning as vectors

Everything a neural network does boils down to arithmetic on numbers: weighted sums, activations, gradients (as you saw in the previous two modules). But words are not numbers — so before any of that machinery can be applied to language, every word first has to be turned into a list of numbers. How that turning-into-numbers is done turns out to matter enormously, and it is the starting point for every modern language model.

## The naive approach: one-hot vectors

The simplest way to give each word a numeric identity is a **one-hot vector**: pick a fixed vocabulary of, say, 50,000 words, number them $1$ to $50{,}000$, and represent word number $i$ as a vector of 50,000 zeros with a single $1$ in position $i$.

This works in the sense that every word gets a distinct vector, but it throws away everything interesting about the words. The vectors for "cat" and "kitten" are exactly as different from each other as the vectors for "cat" and "spreadsheet" — a one-hot vector has no notion of *similarity*. Every pair of distinct words is equally, maximally far apart.

## Embeddings: dense vectors that capture meaning

A **word embedding** fixes this by representing each word as a much shorter vector of ordinary numbers — commonly somewhere between 50 and a few hundred dimensions — where the numbers are **learned** from huge amounts of text rather than assigned by hand. The learning process (during pretraining, which we cover in Lesson 3) nudges the vectors so that:

:::callout{kind="key"}
Words that tend to appear in similar contexts end up with vectors that are **close together** in the embedding space, and words that are used in very different contexts end up **far apart**.
:::

So "cat" and "kitten" end up near each other, "cat" and "dog" end up reasonably close (both are pets, both appear near words like "feed", "vet", "walk"), while "cat" and "spreadsheet" end up far apart. Famously, "king" and "queen" sit close together too — both are used in sentences about monarchy, titles, and royal families — even though the two words share no letters at all. The embedding captures *meaning*, not spelling.

## A 2D toy example

Real embeddings have far too many dimensions to draw, but the idea is easiest to see by pretending each word only has **two** numbers — two "made-up" dimensions that happen to separate our example words nicely. (These coordinates are illustrative only, not real trained values.)

| word    | dimension 1 | dimension 2 |
|---------|:-----------:|:-----------:|
| king    | 4.0         | 3.0         |
| queen   | 4.2         | 3.5         |
| man     | 3.0         | 1.0         |
| woman   | 3.2         | 1.5         |
| cat     | -2.0        | 0.0         |
| dog     | -2.3        | 0.4         |

::widget{type="data-plot" src="data/word-embedding-toy.json"}

Even in just two dimensions, a pattern jumps out: king/queen and man/woman form a tight cluster on the right of the plot (all "human" words), while cat/dog form their own tight cluster on the left (both animals) — and the two clusters sit far apart from each other. A real embedding does the same thing with far more nuance across hundreds of dimensions, grouping together tenses, plurals, topics, and countless other shades of meaning at once.

## Measuring "closeness"

To say precisely how close two word vectors are, we can use ordinary Euclidean distance: for two 2D points $(x_1, y_1)$ and $(x_2, y_2)$,

$$
d = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}.
$$

(Real embedding systems often use a related measure called *cosine similarity*, which cares about the *direction* of the vectors rather than their exact distance — but the intuition is the same: smaller distance/higher similarity means "used in more similar ways".)

:::reveal{title="Worked example: king–queen vs. king–cat"}
Using the toy coordinates from the table above, compare how close "king" is to "queen" versus how close "king" is to "cat".

**king to queen:** king $= (4.0, 3.0)$, queen $= (4.2, 3.5)$.

$$
d_{\text{king,queen}} = \sqrt{(4.0-4.2)^2 + (3.0-3.5)^2} = \sqrt{(-0.2)^2 + (-0.5)^2} = \sqrt{0.04 + 0.25} = \sqrt{0.29} \approx 0.54.
$$

**king to cat:** king $= (4.0, 3.0)$, cat $= (-2.0, 0.0)$.

$$
d_{\text{king,cat}} = \sqrt{(4.0-(-2.0))^2 + (3.0-0.0)^2} = \sqrt{6.0^2 + 3.0^2} = \sqrt{36+9} = \sqrt{45} \approx 6.71.
$$

The distance from king to queen ($\approx 0.54$) is more than twelve times smaller than the distance from king to cat ($\approx 6.71$). That gap is exactly what we mean by "close together in vector space": king and queen are used in similar kinds of sentences, so the training process pulled their vectors close to each other, while cat belongs to a completely different part of the vocabulary.
:::

## Why this matters

Once words are vectors, "similarity" becomes something a computer can actually compute — just arithmetic on lists of numbers. This is the foundation everything else in this module builds on: the attention mechanism (next lesson) works by comparing word vectors to decide how relevant they are to one another, and a language model's entire vocabulary of tens of thousands of tokens lives as one giant cloud of these learned vectors.

:::callout{kind="tip"}
You do not need to know *how* the vector positions are learned to use this idea — only that training on huge amounts of text tends to arrange the vectors so that "used similarly" becomes "positioned nearby". The mechanics of that learning are a large-scale version of the gradient-based training you met in the previous module.
:::
