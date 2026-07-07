# Decision boundaries and evaluating a classifier

## The decision boundary, precisely

In the last lesson we saw that logistic regression predicts class $1$ exactly when $z \ge 0$, i.e. when

$$
wx + b \ge 0.
$$

The **decision boundary** is the frontier between the two predictions — the set of points where the model is exactly on the fence, $z = 0$:

$$
wx + b = 0 \quad\Longleftrightarrow\quad x = -\frac{b}{w}.
$$

For the pass/fail model from the previous lesson ($w = 1$, $b = -3$), the boundary is at

$$
x = -\frac{-3}{1} = 3 \text{ hours.}
$$

Every student who studied $3$ or more hours is predicted to pass; everyone below is predicted to fail. With two features $x_1, x_2$ the same idea gives a boundary *line* $w_1 x_1 + w_2 x_2 + b = 0$ in the plane, exactly as it did for the perceptron's step activation — logistic regression and the perceptron agree on *where* the boundary sits (both fire when the weighted sum is non-negative); logistic regression additionally reports *how confident* it is via $\sigma(z)$, since its output is smooth rather than a hard step.

:::callout{kind="tip"}
The decision boundary only depends on $w$ and $b$, not on the threshold value $0.5$ being special: any fixed threshold on $\sigma(z)$ corresponds to some fixed threshold on $z$, which is still a straight line (or point, in one dimension) because $\sigma$ is a strictly increasing function.
:::

## Is the classifier any good? The confusion matrix

Knowing the decision boundary tells us *what* the model predicts, not whether those predictions are *correct*. To check that, we compare predictions against a labelled test set — data the model was not trained on — using a **confusion matrix**, which you met in *ML concepts, data and evaluation*:

| | Predicted pass (1) | Predicted fail (0) |
| --- | --- | --- |
| **Actual pass (1)** | True Positive (TP) | False Negative (FN) |
| **Actual fail (0)** | False Positive (FP) | True Negative (TN) |

From the four counts we compute:

$$
\text{accuracy} = \frac{TP + TN}{TP + TN + FP + FN}, \qquad
\text{precision} = \frac{TP}{TP + FP}, \qquad
\text{recall} = \frac{TP}{TP + FN}.
$$

**Precision** answers "of the students we predicted would pass, what fraction actually did?" **Recall** answers "of the students who actually passed, what fraction did we correctly catch?"

## A worked evaluation

Take the pass/fail model ($w = 1$, $b = -3$, boundary at $x = 3$) and a small labelled test set of $8$ students the model was never trained on. Predictions follow the boundary: predict pass ($1$) exactly when $x \ge 3$.

::widget{type="data-plot" src="student-test-set.json"}

:::reveal{title="Worked example: building the confusion matrix"}
| Student | Hours $x$ | Actual | Predicted ($x \ge 3$?) | Outcome |
| --- | --- | --- | --- | --- |
| 1 | 1 | fail (0) | fail (0) | TN |
| 2 | 2 | fail (0) | fail (0) | TN |
| 3 | 2.5 | pass (1) | fail (0) | FN |
| 4 | 3 | pass (1) | pass (1) | TP |
| 5 | 4 | fail (0) | pass (1) | FP |
| 6 | 5 | pass (1) | pass (1) | TP |
| 7 | 6 | pass (1) | pass (1) | TP |
| 8 | 7 | pass (1) | pass (1) | TP |

Counting outcomes: $TP = 4$ (students 4, 6, 7, 8), $TN = 2$ (students 1, 2), $FP = 1$ (student 5), $FN = 1$ (student 3). Check the total: $4 + 2 + 1 + 1 = 8$, matching all $8$ students.

**Accuracy:**

$$
\text{accuracy} = \frac{TP + TN}{8} = \frac{4 + 2}{8} = \frac{6}{8} = 0.75.
$$

**Precision** (of the $5$ students predicted to pass, how many actually did?):

$$
\text{precision} = \frac{TP}{TP + FP} = \frac{4}{4 + 1} = \frac{4}{5} = 0.8.
$$

**Recall** (of the $5$ students who actually passed, how many did the model catch?):

$$
\text{recall} = \frac{TP}{TP + FN} = \frac{4}{4 + 1} = \frac{4}{5} = 0.8.
$$

Student 3 (a false negative — studied only $2.5$ hours but passed anyway) and student 5 (a false positive — studied $4$ hours but failed) are exactly the two points that fall on the "wrong" side of the boundary in the plot above. No straight-line boundary can separate this data perfectly; the confusion matrix quantifies how good the *best available* boundary still is.
:::

## Putting it together

A logistic regression classifier is built from three ideas, in order: a **weighted sum** $z = wx + b$ (identical to linear regression), a **sigmoid** squashing $z$ into a probability $\sigma(z) \in (0,1)$, and a **threshold** turning that probability into a class prediction. The **decision boundary** is where $z = 0$, and a **confusion matrix** — with its precision and recall — tells us how well that boundary actually separates real, messy data. These same building blocks reappear, scaled up, in every neural network you meet from here on: the next module reintroduces the sigmoid as a *neuron's* activation function.
