# The perceptron: a single neuron

Modern AI is built from networks of simple units called **neurons**. The simplest such unit is the **perceptron**, invented by Frank Rosenblatt in 1958. Understanding one perceptron is the foundation for understanding every neural network that follows.

## The idea: a weighted sum

A perceptron takes several **inputs** $x_1, x_2, \dots, x_n$ and combines them into a single number. Each input has a **weight** $w_i$ that says how important it is, and there is one extra number called the **bias** $b$. The perceptron first computes the **weighted sum**, also called the *pre-activation* and written $z$:

$$
z = \sum_{i=1}^{n} w_i x_i + b = w_1 x_1 + w_2 x_2 + \dots + w_n x_n + b.
$$

- A large positive weight $w_i$ means input $x_i$ pushes the result *up*.
- A negative weight means it pushes the result *down*.
- The bias $b$ shifts the whole sum up or down regardless of the inputs.

:::callout{kind="key"}
A perceptron is just a **weighted sum of its inputs plus a bias**: $z = \sum_i w_i x_i + b$. Everything else is detail layered on top of this one expression.
:::

## A worked weighted sum

Suppose a perceptron has two inputs with weights $w_1 = 2$ and $w_2 = -3$, and bias $b = 0.5$. If the inputs are $x_1 = 1$ and $x_2 = 1$, then

$$
z = (2)(1) + (-3)(1) + 0.5 = 2 - 3 + 0.5 = -0.5.
$$

So the pre-activation is $z = -0.5$. The sign of $z$ will turn out to matter a great deal in the next lesson.

:::reveal{title="Worked example: a three-input perceptron"}
A perceptron has weights $\mathbf{w} = (0.5,\ -0.5,\ 2.0)$ and bias $b = 1$. The input is $\mathbf{x} = (2,\ 3,\ 1)$. Compute the weighted sum.

$$
z = (0.5)(2) + (-0.5)(3) + (2.0)(1) + 1
$$

$$
z = 1.0 - 1.5 + 2.0 + 1 = 2.5.
$$

So $z = 2.5$. Notice how the third input dominates: its weight $2.0$ is the largest, so it contributes the most ($2.0 \times 1 = 2.0$) even though its value is small.
:::

## Why a bias?

Without the bias the weighted sum is forced through the origin: when every input is zero, $z$ would always be zero. The bias $b$ lets the neuron have a non-zero "resting" output, exactly like the intercept $c$ in the line $y = mx + c$. We will see the geometric meaning of the bias in the next lesson.

## The shape of a neuron

Picture the structure as a flow: inputs $x_1, \dots, x_n$ enter on the left, each is scaled by its weight $w_i$, the scaled values are added together with the bias $b$, and a single number $z$ comes out on the right. That single output is then handed to an **activation function**, the final ingredient we meet in the next lesson, which turns the raw number $z$ into a decision.
