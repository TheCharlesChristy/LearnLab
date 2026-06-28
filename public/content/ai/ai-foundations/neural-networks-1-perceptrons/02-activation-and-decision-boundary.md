# Activation and the decision boundary

In the last lesson a perceptron produced a single number, the weighted sum $z = \sum_i w_i x_i + b$. On its own $z$ is just a real number. To make a *decision* we pass it through an **activation function**.

## The step activation

Rosenblatt's original perceptron used the **step function** (also called the Heaviside function). It outputs $1$ if the weighted sum is at least zero, and $0$ otherwise:

$$
\text{step}(z) = \begin{cases} 1 & \text{if } z \ge 0, \\ 0 & \text{if } z < 0. \end{cases}
$$

So the neuron "fires" (outputs $1$) exactly when $z \ge 0$, i.e. when

$$
\sum_i w_i x_i + b \ge 0.
$$

The step function turns the continuous pre-activation into a crisp yes/no answer.

## The sigmoid activation

The step function is harsh: a tiny change in $z$ near zero flips the output completely, and the function has no useful gradient. Most modern neurons instead use a smooth, S-shaped activation. The classic choice is the **logistic sigmoid**:

$$
\sigma(z) = \frac{1}{1 + e^{-z}}.
$$

It squashes any real number into the open interval $(0, 1)$, which we can read as a *probability* or a *confidence*. Key values:

| $z$ | $\sigma(z)$ |
| --- | --- |
| very negative | $\to 0$ |
| $-1$ | $0.269$ |
| $0$ | $0.5$ |
| $1$ | $0.731$ |
| very positive | $\to 1$ |

Notice $\sigma(0) = \frac{1}{1 + e^{0}} = \frac{1}{2} = 0.5$: at the decision boundary the neuron is maximally undecided.

:::callout{kind="tip"}
The step and sigmoid agree on the *decision*: both treat $z = 0$ as the threshold. The sigmoid simply replaces the cliff with a smooth ramp, which is what lets networks be trained by calculus (Lesson 3 of the wider course).
:::

## Explore it yourself

Below is a single-input neuron whose output is $\sigma(w x + b)$. Drag **w** to make the curve steeper (large $|w|$) or flip it (negative $w$), and drag **b** to slide the curve left and right. Watch how the crossing point — where the output is $0.5$ — moves.

::py{src="items/perceptron-explorer.py" height=380}

A large weight makes the sigmoid approach the sharp step function; a small weight makes it gentle. The bias controls *where* the transition happens.

## The decision boundary

With two inputs the perceptron fires when $w_1 x_1 + w_2 x_2 + b \ge 0$. The frontier between firing and not firing is the line

$$
w_1 x_1 + w_2 x_2 + b = 0,
$$

called the **decision boundary**. It is a straight line in the $(x_1, x_2)$ plane: everything on one side is classified as $1$, everything on the other side as $0$. The weights set the *orientation* of the line and the bias sets its *position*.

The scatter plot below shows the four inputs of an **AND gate**. The single point that should output $1$ is $(1, 1)$; the other three should output $0$. A perceptron with $w_1 = w_2 = 1$ and $b = -1.5$ separates them perfectly — its boundary $x_1 + x_2 = 1.5$ is drawn as the third series.

::widget{type="data-plot" src="and-gate.json"}

:::reveal{title="Worked example: does the AND perceptron classify (1,1) correctly?"}
Take $w_1 = 1$, $w_2 = 1$, $b = -1.5$ and the input $(x_1, x_2) = (1, 1)$. The weighted sum is

$$
z = (1)(1) + (1)(1) - 1.5 = 2 - 1.5 = 0.5.
$$

Since $z = 0.5 \ge 0$, the step activation outputs $1$ — correct, because $1 \text{ AND } 1 = 1$.

Now try $(0, 1)$:

$$
z = (1)(0) + (1)(1) - 1.5 = 1 - 1.5 = -0.5.
$$

Here $z = -0.5 < 0$, so the output is $0$ — correct, because $0 \text{ AND } 1 = 0$. The single line $x_1 + x_2 = 1.5$ does the whole job.
:::

In the final lesson we ask the crucial question: how does a perceptron *learn* its weights and bias?
