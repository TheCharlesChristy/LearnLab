# Attention and the transformer architecture

Word embeddings (previous lesson) give every word a fixed vector — but the *same* word can mean subtly different things depending on what surrounds it. Consider "bank" in "I sat on the river **bank**" versus "I deposited cash at the **bank**". A single fixed vector for "bank" cannot capture both. Modern models solve this with a mechanism called **attention**, which lets a word's representation be updated based on the *other* words around it.

## The idea: each word looks at every other word

Imagine reading the sentence "The trophy didn't fit in the suitcase because it was too big." To understand what "it" refers to, you unconsciously scan back over the whole sentence, weighing up the candidates: could "it" mean the trophy? The suitcase? "Because"? You settle on "trophy" (a trophy being "too big" to fit makes sense; a suitcase being "too big" to fit itself does not).

**Attention** is a mechanism that makes a neural network do something similar, numerically. For every word in the sentence, attention:

1. Compares that word against **every other word** in the sentence (including itself), producing a **relevance score** for each pair.
2. Turns those scores into weights (larger score → larger weight; the weights across all the words add up to 1).
3. Builds a new, *context-aware* representation of the word by blending together the other words' vectors, weighted by relevance.

:::callout{kind="key"}
Attention lets each word "look at" every other word in the sequence and decide, numerically, how relevant each one is to understanding it. The word's new representation is a weighted blend of the whole sentence, not just its own fixed embedding.
:::

So when the model processes "it" in the trophy sentence, attention gives a high weight to "trophy" and a low weight to "suitcase" — the resulting representation of "it" ends up carrying information pulled from "trophy", effectively resolving the reference. Nobody hand-writes a rule for this; the relevance scores are computed from the (learned) word vectors themselves and refined during training.

:::reveal{title="Worked example: resolving a pronoun with attention"}
Take the sentence: **"The city council refused the demonstrators a permit because they feared violence."**

A trained attention layer processing the word "they" might produce relevance weights roughly like this (illustrative numbers, not from a real trained model):

| word compared against "they" | relevance weight |
|-------------------------------|:-----------------:|
| council                        | 0.52               |
| demonstrators                  | 0.09               |
| permit                         | 0.04               |
| feared                         | 0.21               |
| violence                       | 0.08               |
| (all other words)              | 0.06               |

The weight on "council" (0.52) dominates the others, so "they" ends up pointing to "the city council" — matching how a human reader resolves the sentence (it is the council who fears violence and therefore refuses the permit). Notice the sentence has *another* plausible antecedent, "demonstrators" — but it receives a much lower weight, because the surrounding words ("refused", "feared violence") make "council" the more relevant match. Small changes to the sentence (e.g. replacing "feared violence" with "wanted a peaceful march") can flip which word gets the highest weight — attention weights depend on the whole sentence, not on fixed grammar rules.
:::

## From attention to transformers

A single attention step is useful, but real models stack many of them together, interleaved with simple feed-forward layers (small networks applied identically to every word position — the same kind of weighted-sum-plus-activation building block from earlier modules, just applied many times in parallel). This stack — repeated attention layers plus feed-forward layers, repeated a few dozen times for a large model — is called a **transformer**.

:::callout{kind="key"}
A transformer is a stack of attention layers and feed-forward layers. Each layer lets every word refine its representation by looking at every other word, and the stacking lets the model build up increasingly abstract understanding — from "what does this word mean here" in early layers to "what is this whole sentence about" in later ones.
:::

## Why this beat the older, word-by-word approach

Before transformers, the standard approach to language was the **recurrent neural network (RNN)**: process the sentence strictly left to right, one word at a time, carrying a summary ("hidden state") forward from each word to the next. This has two serious drawbacks that transformers avoid:

- **It's slow to train.** Because word $n$ can't be processed until word $n-1$ is done, an RNN cannot process a long sentence in parallel — computation is forced to happen one step at a time. A transformer's attention step looks at the *whole* sequence simultaneously, so a modern accelerator (a GPU) can process every word position in parallel, which is what made training on truly enormous amounts of text feasible.
- **Long-range information fades.** By the time an RNN has read fifty words, information from word 1 has been diluted through fifty rounds of summarising and is easily lost. Attention gives every word a *direct* connection to every other word, no matter how far apart they are in the sentence, so long-range relationships (like the pronoun example above, or a fact stated at the start of a long paragraph and referenced at the end) are much easier for the model to capture.

:::callout{kind="tip"}
"Attention" and "transformer" are sometimes used loosely as if they were the same thing. To be precise: attention is the *mechanism* (each word weighing the relevance of every other word); a transformer is the *architecture* built by stacking many attention layers together with feed-forward layers. Every modern large language model — the subject of the next lesson — is a transformer.
:::
