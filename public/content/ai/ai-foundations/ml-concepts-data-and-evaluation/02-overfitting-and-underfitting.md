# Overfitting, underfitting and the bias-variance tradeoff

Having a proper training/validation/test split (Lesson 1) lets us *see* a problem that would otherwise be invisible: a model can do brilliantly on the data it was trained on, yet fail badly on new data. This lesson names that problem and its opposite, and gives a conceptual framework — the bias-variance tradeoff — for thinking about both.

## Overfitting

A model **overfits** when it fits the training data too closely — including the noise and quirks specific to that particular sample — rather than learning the true underlying pattern. An overfit model typically shows:

- very low **training error** (it fits the training examples almost perfectly, sometimes memorising them), but
- much higher **test error** (it fails to generalise to new examples it hasn't seen).

The tell-tale sign of overfitting is a large *gap* between training performance and test performance. Complex models with many parameters relative to the amount of training data are especially prone to it, because they have enough flexibility to bend around every training point, including its noise.

## Underfitting

A model **underfits** when it is too simple to capture the pattern in the data at all — for example, fitting a straight line to data that is clearly curved. An underfit model shows:

- high training error, **and**
- similarly high test error.

Here there is no gap between training and test performance, because the model is failing in the same way on both — it simply hasn't learned enough structure to do well anywhere.

:::callout{kind="key"}
**Overfitting**: low training error, high test error — the model memorised noise instead of learning the pattern. **Underfitting**: high training error *and* high test error — the model is too simple to capture the pattern at all. A well-fitted model has training and test error that are both low **and** close to each other.
:::

## The bias-variance tradeoff (conceptual view)

These two failure modes come from two different sources of error, and a useful mental model splits a model's error into three conceptual parts: **bias**, **variance**, and irreducible noise.

- **Bias** is error from a model's assumptions being too simple to represent the true pattern — a straight line trying to fit a curve has high bias, whatever data you give it. High bias shows up as **underfitting**.
- **Variance** is error from a model being too sensitive to the particular training sample — retrain it on a slightly different data set and its predictions swing wildly. High variance shows up as **overfitting**.

There is a **tradeoff**: making a model more flexible (more parameters, less regularisation) tends to *reduce* bias but *increase* variance, and vice versa. The practical goal is not to eliminate bias or variance entirely but to find the sweet spot of model complexity where their *combined* effect on test error is smallest — simple enough to avoid chasing noise, flexible enough to capture the real pattern.

:::callout{kind="tip"}
A rough rule of thumb when diagnosing a model from its errors: a **big gap** between training and test error points to high variance (overfitting) — consider a simpler model, more training data, or regularisation. **Both errors high and close together** points to high bias (underfitting) — consider a more flexible model or better features.
:::

:::reveal{title="Worked example: diagnosing three models from their errors"}
Three candidate models are trained on the same data set and evaluated on both the training set and a held-out test set:

| Model | Training error | Test error |
| --- | --- | --- |
| A | $24\%$ | $26\%$ |
| B | $4\%$ | $7\%$ |
| C | $1\%$ | $22\%$ |

**Model A**: training error $24\%$ and test error $26\%$ — both high, and close together (a gap of only $2$ percentage points). This is the signature of **underfitting** (high bias): the model isn't capturing the pattern even on data it was trained on.

**Model B**: training error $4\%$ and test error $7\%$ — both low, with only a small gap ($3$ percentage points). This is a **well-fitted** model: it has learned the real pattern and generalises reasonably well.

**Model C**: training error $1\%$ and test error $22\%$ — training error is excellent, but there's a huge gap of $21$ percentage points to the test error. This is the signature of **overfitting** (high variance): the model has essentially memorised the training set instead of learning a pattern that transfers.
:::

Diagnosing under- and over-fitting tells us a model has a problem, but to compare classifiers precisely — and to decide *which kind* of mistake matters most for a given task — we need proper numeric evaluation metrics. That's the subject of the final lesson.
