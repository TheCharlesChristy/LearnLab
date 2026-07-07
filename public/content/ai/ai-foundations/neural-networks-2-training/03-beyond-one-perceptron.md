# Beyond one perceptron: why depth helps

A single perceptron computes one weighted sum and draws one straight decision boundary. We have now seen, twice over, exactly what that buys us and exactly where it runs out: it can learn AND, OR and our worked data set (all linearly separable) with a guaranteed-convergent training rule, but it can **never** learn XOR, because no single line separates XOR's two classes. Minsky and Papert's 1969 book *Perceptrons* made this limitation famous and, for a while, it dampened enthusiasm for neural networks. The fix turned out to be simple to state: use more than one perceptron.

## Stacking perceptrons into layers

Instead of one neuron deciding directly, arrange several neurons in a **hidden layer**, each computing its own weighted sum and its own straight-line boundary, and feed *their* outputs as inputs to a further output neuron:

- Each hidden neuron can be thought of as asking its own yes/no question about the input — its own line through the input space.
- The output neuron then combines those yes/no answers with another weighted sum and activation.

Because the output neuron's decision boundary is drawn in the *space of hidden-neuron outputs*, not the original input space, the overall network can represent regions that are not just one straight line — including XOR's diagonal pattern. A network built this way, with an input layer, one or more hidden layers, and an output layer, is called a **multi-layer perceptron (MLP)**.

:::callout{kind="key"}
One perceptron = one line. Multiple perceptrons in a hidden layer, feeding a further perceptron, can combine several lines — enough to carve out shapes, like XOR's diagonals, that no single line can separate. Depth (stacking layers) is what buys the extra expressive power.
:::

## A concrete two-layer solution to XOR

Here is one specific multi-layer perceptron, using the step activation throughout, that computes XOR exactly. It uses two hidden neurons, $h_1$ and $h_2$, and one output neuron:

| Neuron | Role | $w_1$ | $w_2$ | $b$ |
| --- | --- | --- | --- | --- |
| $h_1$ | computes OR($x_1, x_2$) | $1$ | $1$ | $-0.5$ |
| $h_2$ | computes NAND($x_1, x_2$) | $-1$ | $-1$ | $1.5$ |
| output | computes AND($h_1, h_2$) | $1$ | $1$ | $-1.5$ |

The output neuron takes $h_1$ and $h_2$ (not $x_1, x_2$) as its two inputs. The claim is that AND(OR($x_1,x_2$), NAND($x_1,x_2$)) equals XOR($x_1,x_2$) — and indeed that is a standard Boolean identity, which the worked example below verifies numerically, input by input.

:::reveal{title="Worked example: verifying all four XOR inputs through both layers"}
**Input $(0,0)$**, target XOR $= 0$.
$$
h_1: z = (1)(0)+(1)(0)-0.5 = -0.5 \Rightarrow h_1 = 0. \qquad
h_2: z = (-1)(0)+(-1)(0)+1.5 = 1.5 \Rightarrow h_2 = 1.
$$
$$
\text{output: } z = (1)(0) + (1)(1) - 1.5 = -0.5 \Rightarrow \text{output} = 0. \quad\checkmark
$$

**Input $(0,1)$**, target XOR $= 1$.
$$
h_1: z = (1)(0)+(1)(1)-0.5 = 0.5 \Rightarrow h_1 = 1. \qquad
h_2: z = (-1)(0)+(-1)(1)+1.5 = 0.5 \Rightarrow h_2 = 1.
$$
$$
\text{output: } z = (1)(1) + (1)(1) - 1.5 = 0.5 \Rightarrow \text{output} = 1. \quad\checkmark
$$

**Input $(1,0)$**, target XOR $= 1$.
$$
h_1: z = (1)(1)+(1)(0)-0.5 = 0.5 \Rightarrow h_1 = 1. \qquad
h_2: z = (-1)(1)+(-1)(0)+1.5 = 0.5 \Rightarrow h_2 = 1.
$$
$$
\text{output: } z = (1)(1) + (1)(1) - 1.5 = 0.5 \Rightarrow \text{output} = 1. \quad\checkmark
$$

**Input $(1,1)$**, target XOR $= 0$.
$$
h_1: z = (1)(1)+(1)(1)-0.5 = 1.5 \Rightarrow h_1 = 1. \qquad
h_2: z = (-1)(1)+(-1)(1)+1.5 = -0.5 \Rightarrow h_2 = 0.
$$
$$
\text{output: } z = (1)(1) + (1)(0) - 1.5 = -0.5 \Rightarrow \text{output} = 0. \quad\checkmark
$$

All four inputs match XOR exactly. Geometrically: $h_1$'s line and $h_2$'s line between them slice the input square into three regions, and the output neuron's own line — drawn in $(h_1, h_2)$-space — separates the "both fire" region ($h_1{=}1, h_2{=}0$, which only happens at $(1,1)$... together with the symmetric analysis for $(0,0)$) from the rest, recovering the diagonal pattern that one line alone could never draw.
:::

## Training deeper networks

This lesson picked the hidden-layer weights by hand, the same way *Neural Networks I* hand-picked weights for AND before we ever discussed learning them. A natural question is whether the perceptron learning rule itself can train a multi-layer network. It cannot, directly: the rule needs to know the target output of *each* neuron, but a hidden neuron has no target of its own — only the network's final output is labelled. Training multi-layer networks requires propagating the output error backward through the layers (an algorithm called **backpropagation**) combined with gradient descent — the same downhill-following idea from *Regression*, generalised from one linear neuron to a whole stack of them, using smooth activations like the sigmoid so that gradients exist to follow at every layer.

:::callout{kind="tip"}
This is exactly why the sigmoid (and other smooth activations) matter beyond the single-neuron case: gradient-based training of deep networks needs a gradient to exist at every neuron, which the step function's flat, cliff-edged shape cannot provide.
:::

Real modern networks push this idea much further: not two layers but dozens, not two or three neurons per layer but thousands, and not hand-designed weights but weights learned from vast amounts of data. The next module, *Modern AI: Transformers and LLMs*, picks up exactly this thread — how stacking many more, much larger layers, trained end-to-end, produces the large language models behind today's AI systems.
