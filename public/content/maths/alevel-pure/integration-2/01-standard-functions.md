# Integrating standard functions

So far you have integrated powers of $x$. Because integration reverses differentiation, every derivative you already know from **Differentiation II** gives you a matching integral for free. Four results do most of the work in A-level Pure Mathematics.

## The four standard integrals

$$
\int e^x \, \mathrm{d}x = e^x + C
$$

$$
\int \frac{1}{x} \, \mathrm{d}x = \ln|x| + C \qquad (x \ne 0)
$$

$$
\int \sin(x) \, \mathrm{d}x = -\cos(x) + C
$$

$$
\int \cos(x) \, \mathrm{d}x = \sin(x) + C
$$

:::callout{kind="key"}
Each result is just "undo the derivative": $\frac{\mathrm{d}}{\mathrm{d}x}\big(e^x\big) = e^x$, $\frac{\mathrm{d}}{\mathrm{d}x}\big(\ln|x|\big) = \frac{1}{x}$, $\frac{\mathrm{d}}{\mathrm{d}x}\big(-\cos x\big) = \sin x$, and $\frac{\mathrm{d}}{\mathrm{d}x}\big(\sin x\big) = \cos x$. Always check a new integral by differentiating your answer back — if you don't recover the original integrand, something went wrong.
:::

## Why the modulus sign on $\ln|x|$?

$\ln x$ is only defined for $x > 0$, but $\frac{1}{x}$ makes sense for any $x \ne 0$. Using $\ln|x|$ extends the antiderivative to negative $x$ too: for $x < 0$, $\frac{\mathrm{d}}{\mathrm{d}x}\ln(-x) = \frac{-1}{-x} = \frac{1}{x}$, so the result still holds. Always write $\ln|x|$, not $\ln x$, unless you know $x > 0$ throughout.

## Scaling and linearity

Integration is linear, so constants factor out and sums integrate term by term:

$$
\int \big(a f(x) + b g(x)\big) \, \mathrm{d}x = a\int f(x)\, \mathrm{d}x + b \int g(x)\, \mathrm{d}x.
$$

For example,

$$
\int (3e^x + \frac{4}{x}) \, \mathrm{d}x = 3e^x + 4\ln|x| + C.
$$

The graph below shows $y = e^x$ — notice that the function is its own gradient function, which is exactly why $\int e^x\,\mathrm{d}x = e^x + C$.

::widget{type="function-grapher" expr="e^x" tangent=true xmin=-3 xmax=3}

:::reveal{title="Worked example: a mixed standard integral"}
Find $\displaystyle\int \left(2\sin(x) - \frac{3}{x} + 5e^x\right) \mathrm{d}x$.

Integrate term by term using the four standard results, scaling each by its coefficient:

$$
\int 2\sin(x)\,\mathrm{d}x = -2\cos(x), \qquad \int \frac{3}{x}\,\mathrm{d}x = 3\ln|x|, \qquad \int 5e^x\,\mathrm{d}x = 5e^x.
$$

So

$$
\int \left(2\sin(x) - \frac{3}{x} + 5e^x\right) \mathrm{d}x = -2\cos(x) - 3\ln|x| + 5e^x + C.
$$

**Check by differentiating back:** $\frac{\mathrm{d}}{\mathrm{d}x}\big(-2\cos x - 3\ln|x| + 5e^x\big) = 2\sin(x) - \frac{3}{x} + 5e^x$, which matches the original integrand. ✓
:::

## Practice

Work through the steps below for a definite-integral version of this idea, then move on to substitution — the technique for functions that are not quite in one of these four standard forms.

::widget{type="step-reveal" src="steps/standard-functions-example.json"}
