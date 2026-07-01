# Solving exponential/log equations and growth-decay models

## Solving exponential equations

When the unknown is in the exponent and the two sides cannot easily be written with the same base, take logarithms of **both sides**, then use the power law to bring the exponent down.

:::reveal{title="Worked example: solving $3^x = 20$"}
**Question.** Solve $3^x = 20$, giving your answer to 3 decimal places.

Take $\ln$ of both sides (any base works — $\ln$ is a natural choice):

$$
\ln(3^x) = \ln(20) \quad\Longrightarrow\quad x\ln 3 = \ln 20 \quad\Longrightarrow\quad x = \frac{\ln 20}{\ln 3}.
$$

Numerically, $\ln 20 = 2.995732\ldots$ and $\ln 3 = 1.098612\ldots$, so

$$
x = \frac{2.995732}{1.098612} = 2.72680\ldots \approx 2.727 \ (3\text{ d.p.}).
$$
:::

Sometimes both sides **can** be written with the same base, which is faster and exact:

:::reveal{title="Worked example: same-base equations"}
**Question.** Solve $4^{x+1} = 8^{x-1}$.

Write both sides as powers of $2$: $4 = 2^2$ and $8=2^3$, so

$$
2^{2(x+1)} = 2^{3(x-1)} \quad\Longrightarrow\quad 2(x+1) = 3(x-1).
$$

Expand: $2x + 2 = 3x - 3$, so $x = 5$.
:::

## Solving logarithmic equations

To solve an equation involving logs, combine any separate log terms into a single logarithm using the laws of logs, then convert to index form.

:::reveal{title="Worked example: solving a log equation"}
**Question.** Solve $\log_2(x) + \log_2(x-2) = 3$ for $x>2$.

Combine using the product law:

$$
\log_2\big(x(x-2)\big) = 3.
$$

Convert to index form ($2^3=8$):

$$
x(x-2) = 8 \quad\Longrightarrow\quad x^2 - 2x - 8 = 0 \quad\Longrightarrow\quad (x-4)(x+2)=0.
$$

So $x=4$ or $x=-2$. Since logs require positive arguments and we need $x-2>0$, reject $x=-2$ (it would make both $\log_2 x$ and $\log_2(x-2)$ undefined). The only valid solution is $x=4$.
:::

:::callout{kind="warning"}
Always check candidate solutions to a log equation against the original domain restrictions ($x > 0$ inside every logarithm). Solving the resulting polynomial can introduce extra roots that must be rejected.
:::

## Exponential growth and decay models

Many real-world processes change at a rate proportional to their current size. These are modelled using the natural exponential:

$$
A = A_0 e^{kt},
$$

where $A_0$ is the initial value (at $t=0$, since $e^0=1$), $t$ is time, and $k$ is a constant rate:

- $k > 0$ gives **growth** (e.g. population growth, compound interest accruing continuously).
- $k < 0$ gives **decay** (e.g. radioactive decay, cooling, depreciation).

The plot below shows growth ($k=0.1$) versus decay ($k=-0.1$) starting from $A_0=100$:

::widget{type="function-grapher" expr="100*e^(0.1*x)" xmin=0 xmax=20 ymin=0 ymax=800}

::widget{type="function-grapher" expr="100*e^(-0.1*x)" xmin=0 xmax=20 ymin=0 ymax=120}

:::reveal{title="Worked example: radioactive decay"}
**Question.** A radioactive sample has mass $A = 80e^{-0.05t}$ grams, where $t$ is measured in years. Find (a) the initial mass, and (b) the time taken for the mass to fall to $20$ g, to 1 decimal place.

**(a)** At $t=0$: $A = 80e^{0} = 80$ g.

**(b)** Set $A=20$:

$$
20 = 80e^{-0.05t} \quad\Longrightarrow\quad \frac{20}{80} = e^{-0.05t} \quad\Longrightarrow\quad 0.25 = e^{-0.05t}.
$$

Take $\ln$ of both sides:

$$
\ln(0.25) = -0.05t \quad\Longrightarrow\quad t = \frac{\ln(0.25)}{-0.05}.
$$

Since $\ln(0.25) = -1.386294\ldots$,

$$
t = \frac{-1.386294}{-0.05} = 27.72588\ldots \approx 27.7 \text{ years (1 d.p.)}.
$$
:::

:::callout{kind="info"}
This is exactly the idea of **half-life**: the sample above halves in mass every $\dfrac{\ln 2}{0.05} \approx 13.86$ years, since halving corresponds to $e^{-0.05t}=\tfrac12$.
:::

## Compound interest and continuous growth

Interest compounded continuously on a principal $P$ at annual rate $r$ (as a decimal) for $t$ years gives

$$
A = Pe^{rt}.
$$

Use the code cell to explore how the balance grows, and to check a growth/decay calculation numerically before you tackle the assessment:

::widget{type="code-runner" language="python" starter="import math\n\n# Continuous compounding: A = P * e^(r*t)\nP = 500\nr = 0.04\nt = 10\nA = P * math.exp(r * t)\nprint('Balance after 10 years:', round(A, 2))\n\n# Solve A = A0 * e^(k*t) for t, given A, A0, k\nA0 = 80\nk = -0.05\nA_target = 20\nt_solve = math.log(A_target / A0) / k\nprint('Time to reach target mass:', round(t_solve, 2))" rows=12}

:::callout{kind="key"}
Whenever you meet $A = A_0 e^{kt}$: substitute what you know, isolate the exponential term, take $\ln$ of both sides, then solve the resulting linear equation for $t$ (or for $k$, if $t$ is known instead).
:::

## Practice

You have now covered exponential functions and $e$, logarithms and their laws, and solving equations with growth/decay models. Attempt the end-of-module assessment below.

::widget{type="quiz" src="assessment.json"}
