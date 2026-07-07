# Integration by substitution

Some integrals are not one of the four standard forms, but are secretly the result of a **chain rule** differentiation run backwards. Integration by substitution is the systematic way to spot and reverse this.

## The idea

If an integrand is built from an "outer" function applied to an "inner" function, and the derivative of the inner function is also present (up to a constant multiple), substituting $u = $ (inner function) often turns the integral into something standard.

$$
\int f'(g(x))\, g'(x) \, \mathrm{d}x = \int f'(u)\, \mathrm{d}u = f(u) + C, \qquad u = g(x).
$$

## Worked pattern: $\displaystyle\int 2x(x^2+1)^5 \, \mathrm{d}x$

Let $u = x^2 + 1$. Then $\dfrac{\mathrm{d}u}{\mathrm{d}x} = 2x$, so (treating $\mathrm{d}u$ and $\mathrm{d}x$ as if they can be separated) $\mathrm{d}u = 2x\,\mathrm{d}x$ — which is exactly the factor sitting next to $(x^2+1)^5$ in the integral. Substituting:

$$
\int 2x(x^2+1)^5\,\mathrm{d}x = \int u^5 \, \mathrm{d}u = \frac{u^6}{6} + C = \frac{(x^2+1)^6}{6} + C.
$$

:::callout{kind="tip"}
A substitution is worth trying when the integrand contains a function $g(x)$ **and** something proportional to $g'(x)$ multiplying it. Spotting $g'(x)$ is the key skill — practise recognising derivatives of common inner functions like $x^2+1$, $\sin x$, $3x-1$.
:::

## Substitution with trigonometric and exponential integrands

The same idea applies to the standard integrals from the previous lesson once an inner function is involved:

$$
\int \cos(x)\, e^{\sin(x)} \, \mathrm{d}x, \qquad u = \sin(x), \quad \mathrm{d}u = \cos(x)\,\mathrm{d}x \implies \int e^u \, \mathrm{d}u = e^u + C = e^{\sin(x)} + C.
$$

$$
\int \frac{\cos(x)}{\sin(x)}\, \mathrm{d}x, \qquad u = \sin(x), \quad \mathrm{d}u = \cos(x)\,\mathrm{d}x \implies \int \frac{1}{u}\, \mathrm{d}u = \ln|u| + C = \ln|\sin(x)| + C.
$$

## Definite integrals: change the limits too

For a definite integral, once you substitute $u = g(x)$ you must also convert the $x$-limits into $u$-limits — there is no need to substitute back to $x$ afterwards.

$$
\int_0^1 2x(x^2+1)^5 \, \mathrm{d}x, \qquad u = x^2+1.
$$

When $x=0$, $u=1$; when $x=1$, $u=2$. So

$$
\int_0^1 2x(x^2+1)^5\,\mathrm{d}x = \int_1^2 u^5\,\mathrm{d}u = \left[\frac{u^6}{6}\right]_1^2 = \frac{64}{6} - \frac{1}{6} = \frac{63}{6} = \frac{21}{2}.
$$

Work through the full substitution below one step at a time.

::widget{type="step-reveal" src="steps/substitution-example.json"}

:::reveal{title="Worked example: choosing the substitution"}
Find $\displaystyle\int 3x^2 \cos(x^3) \, \mathrm{d}x$.

The inner function is $x^3$ (inside the cosine), and its derivative is $3x^2$ — exactly the factor multiplying $\cos(x^3)$. So let $u = x^3$, giving $\mathrm{d}u = 3x^2\,\mathrm{d}x$:

$$
\int 3x^2\cos(x^3)\,\mathrm{d}x = \int \cos(u)\,\mathrm{d}u = \sin(u) + C = \sin(x^3) + C.
$$

**Check by differentiating back:** using the chain rule, $\dfrac{\mathrm{d}}{\mathrm{d}x}\big(\sin(x^3)\big) = \cos(x^3) \cdot 3x^2 = 3x^2\cos(x^3)$, which matches the original integrand. ✓
:::

## Practice

::widget{type="quiz" src="assessment.json" pick=5}
