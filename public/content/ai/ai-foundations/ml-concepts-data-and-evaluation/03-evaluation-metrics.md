# Evaluating classifiers: confusion matrix, accuracy, precision, recall and F1

We now have a proper data split (Lesson 1) and a way to diagnose over/under-fitting from training vs test error (Lesson 2). To go further we need precise numeric ways to score a classifier's predictions on the test set. This lesson builds up the standard toolkit for **binary classification** — problems with two possible outcomes, such as "spam vs not spam" or "faulty vs OK".

## The confusion matrix

For a binary classifier, every test example falls into exactly one of four buckets, depending on what the model predicted and what the true label actually was. Taking "positive" to mean the class we're interested in detecting (e.g. "spam"):

| | Predicted positive | Predicted negative |
| --- | --- | --- |
| **Actually positive** | True Positive (TP) | False Negative (FN) |
| **Actually negative** | False Positive (FP) | True Negative (TN) |

- **True Positive (TP)** — predicted positive, and it really was positive. A correct "spam" call.
- **False Positive (FP)** — predicted positive, but it was actually negative. A real email wrongly flagged as spam.
- **False Negative (FN)** — predicted negative, but it was actually positive. A spam email that slipped through.
- **True Negative (TN)** — predicted negative, and it really was negative. A real email correctly left alone.

This $2\times2$ table of counts is the **confusion matrix**. Every classification metric in this lesson is computed directly from these four numbers.

:::callout{kind="key"}
Read a confusion matrix as: **rows** = the truth, **columns** = the prediction (or vice versa — always check the labelling of a matrix you're given). The diagonal (TP, TN) is where the model got it right; the off-diagonal (FP, FN) is where it got it wrong, and the *two kinds* of wrong are not interchangeable — they often carry very different real-world costs.
:::

## Accuracy

**Accuracy** is the simplest metric: the fraction of *all* predictions that were correct.

$$
\text{accuracy} = \frac{TP + TN}{TP + FP + TN + FN}.
$$

Accuracy is intuitive, but it can be badly misleading when the classes are **imbalanced**. Suppose only $1\%$ of emails are spam: a classifier that predicts "not spam" for *everything* scores $99\%$ accuracy while catching precisely zero spam. Accuracy alone hides this failure — we need metrics that look specifically at how the positive class is handled.

## Precision

**Precision** answers: *of everything the model flagged as positive, how much actually was positive?*

$$
\text{precision} = \frac{TP}{TP + FP}.
$$

Low precision means many **false alarms**. Precision matters most when a false positive is costly — e.g. a spam filter with low precision buries real, important emails in the junk folder.

## Recall

**Recall** (also called sensitivity or the true positive rate) answers: *of everything that actually was positive, how much did the model find?*

$$
\text{recall} = \frac{TP}{TP + FN}.
$$

Low recall means many **misses**. Recall matters most when a false negative is costly — e.g. a medical test with low recall fails to flag patients who really do have the condition.

:::callout{kind="tip"}
Precision and recall trade off against each other: a classifier can boost recall by flagging almost everything as positive (catching every true positive, but flooding itself with false positives — precision collapses), or boost precision by only flagging the examples it is most sure about (fewer false positives, but it misses more true positives — recall drops). Neither number alone tells the whole story, which motivates the F1 score below.
:::

## F1 score

The **F1 score** combines precision and recall into a single number using their **harmonic mean**, which only stays high when *both* precision and recall are reasonably high:

$$
F_1 = \frac{2 \times \text{precision} \times \text{recall}}{\text{precision} + \text{recall}}.
$$

F1 is especially useful for imbalanced classes, where accuracy is unreliable (as above) but a single summary number is still wanted alongside precision and recall.

## A full worked example

A binary classifier is tested on $100$ examples, giving the confusion matrix $TP = 40$, $FP = 10$, $FN = 5$, $TN = 45$.

:::reveal{title="Worked example: computing all four metrics from a confusion matrix"}
Confusion matrix: $TP = 40$, $FP = 10$, $FN = 5$, $TN = 45$. Total examples $= 40 + 10 + 5 + 45 = 100$.

**Accuracy:**
$$
\text{accuracy} = \frac{TP + TN}{\text{total}} = \frac{40 + 45}{100} = \frac{85}{100} = 0.85.
$$

**Precision:**
$$
\text{precision} = \frac{TP}{TP + FP} = \frac{40}{40 + 10} = \frac{40}{50} = 0.8.
$$

**Recall:**
$$
\text{recall} = \frac{TP}{TP + FN} = \frac{40}{40 + 5} = \frac{40}{45} \approx 0.889.
$$

**F1 score:**
$$
F_1 = \frac{2 \times 0.8 \times 0.889}{0.8 + 0.889} = \frac{1.4222}{1.6889} \approx 0.842.
$$

So this classifier is $85\%$ accurate, is right $80\%$ of the time when it predicts positive (precision), catches about $88.9\%$ of the true positives (recall), and has an F1 score of about $0.842$ balancing the two.
:::

## Try it yourself

The code below computes all four metrics from the same confusion matrix as the worked example above. Run it, then edit `TP`, `FP`, `TN`, `FN` and re-run — try making the classes very imbalanced (e.g. a huge `TN` and tiny `TP`, `FP`, `FN`) and watch accuracy stay high while precision, recall or F1 reveal the real story.

::widget{type="code-runner" language="python" rows=12 starter="TP, FP, TN, FN = 40, 10, 45, 5; accuracy = (TP + TN) / (TP + FP + TN + FN); precision = TP / (TP + FP); recall = TP / (TP + FN); f1 = 2 * precision * recall / (precision + recall); print('accuracy: ', round(accuracy, 3)); print('precision:', round(precision, 3)); print('recall:   ', round(recall, 3)); print('f1:       ', round(f1, 3))"}

:::callout{kind="warning"}
Accuracy, precision, recall and F1 are all computed from the **test set**, never the training set (Lesson 1) — otherwise the numbers overstate how the model will really perform. And remember they only measure *this* classifier on *this* test set: a different, differently-imbalanced test set can change every number even for the exact same model.
:::

That completes the toolkit for this module: you can now name the paradigm behind a learning system, explain why held-out data is essential, diagnose overfitting and underfitting from training/test error, and compute every standard classification metric from a confusion matrix. The end-of-module assessment brings all of this together.
