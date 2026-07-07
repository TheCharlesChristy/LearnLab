# Learning from data: paradigms and the train/validation/test split

Machine learning is the branch of AI in which a system improves its performance on a task by learning patterns from **data**, rather than following rules an engineer wrote by hand. Before we can train or evaluate any model, we need to answer two questions: *what kind of feedback does the model learn from?* and *how do we know it has actually learned something useful, rather than just memorised the examples it saw?* This lesson answers both.

## The three paradigms

### Supervised learning

In **supervised learning** the training data consists of labelled examples: pairs of **features** (the inputs describing an example) and a **label** (the correct output). The model's job is to learn a mapping from features to labels that generalises to new, unseen examples.

- *Classification*: the label is a category, e.g. "spam" / "not spam", or "cat" / "dog" / "horse".
- *Regression*: the label is a continuous number, e.g. a house price or a temperature.

Almost every example in this course so far — a perceptron classifying an AND gate's inputs, a line fitted to data points — is supervised: we always had the correct answer available during training.

### Unsupervised learning

In **unsupervised learning** the data has no labels at all — just the features. The model's job is to find *structure* in the data on its own. The most common example is **clustering**: grouping data points so that points in the same group are more similar to each other than to points in other groups (e.g. grouping customers by purchasing behaviour without being told in advance what the groups should be). Other unsupervised tasks include dimensionality reduction (compressing many features into a few that preserve the important structure) and anomaly detection.

### Reinforcement learning

In **reinforcement learning** an *agent* learns by interacting with an *environment*: it takes actions, and receives **reward** or **penalty** feedback rather than a labelled "correct answer" for every situation. Over many attempts the agent learns a *policy* — a strategy for choosing actions — that maximises its total reward. This is the paradigm behind agents that learn to play games: nobody labels every board position with the "correct" move, but the agent is told whether it eventually won or lost.

:::callout{kind="key"}
The three paradigms differ in **what feedback the learner gets**: supervised learning gets a correct label for every example; unsupervised learning gets no labels at all and must find structure unaided; reinforcement learning gets a reward signal for actions taken over time, not a per-example correct answer.
:::

## Features and labels

Whatever the paradigm, data is normally described as a table of **features** — the measurable input variables (e.g. an email's word counts, an image's pixel values, a house's floor area) — and, for supervised learning, a **label** — the target output the model should predict. A single row of features (with or without its label) is called an *example* or *instance*.

## Why you must never evaluate on training data

Suppose you train a model on a data set and then check how well it performs *on that same data set*. This tells you almost nothing about how the model will behave on new data, because the model has already seen every example and could, in the extreme, simply memorise the answers. Performance measured this way is optimistically biased — it overstates how good the model really is.

To get a trustworthy estimate of how a model will perform on new, unseen data, we split the available data into separate parts *before* training begins:

- **Training set** — the data actually used to fit the model's parameters (e.g. the weights of a perceptron).
- **Validation set** — held-out data used *during development* to tune choices the training procedure itself doesn't set, such as hyperparameters or which of several candidate models to keep. Because we look at validation performance repeatedly while making these choices, the validation set is not a perfectly unbiased estimate either — some information about it leaks into our decisions.
- **Test set** — data that is touched only *once*, at the very end, to report a final, unbiased estimate of how the finished model generalises. If you tune anything based on test-set performance, it stops being a fair test.

:::callout{kind="warning"}
Never evaluate — and never tune — using the test set until the model is completely finished. Doing so lets information from the test set "leak" into your modelling decisions, which inflates your reported performance and means it no longer predicts real-world behaviour.
:::

:::reveal{title="Worked example: splitting a data set"}
A researcher has collected $2400$ labelled emails to train a spam classifier. They decide to split the data $70\%$ training, $15\%$ validation, $15\%$ test.

**Training set size:** $0.70 \times 2400 = 1680$ emails.

**Validation set size:** $0.15 \times 2400 = 360$ emails.

**Test set size:** $0.15 \times 2400 = 360$ emails.

Check: $1680 + 360 + 360 = 2400$. ✓

The model is fitted only on the $1680$ training emails. While experimenting with different settings, the researcher checks performance on the $360$ validation emails and picks the best-performing configuration. Only once every decision is finalised do they run the model on the $360$ test emails, exactly once, to report the number that will appear in their final write-up.
:::

The next lesson looks at what can go wrong during training itself — even with a proper data split, a model can still learn the wrong thing from its training data.
