# The normal distribution

Many real quantities — heights, measurement errors, exam scores, the sum of many small random effects — cluster symmetrically around a typical value, tailing off more or less equally on both sides. The **normal distribution** is the continuous probability model for exactly this shape.

We write

$$
X \sim N(\mu, \sigma^2)
$$

to mean "$X$ is normally distributed with mean $\mu$ and variance $\sigma^2$" (so standard deviation $\sigma$). Its probability density function is the familiar bell curve:

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} \, e^{-\frac{(x-\mu)^2}{2\sigma^2}}
$$

You are never expected to integrate this by hand — the whole point of this module is a set of tools that let you find probabilities and values without ever touching the formula directly. What matters is the **shape** it describes:

- symmetric about $x = \mu$ (mean = median = mode);
- a single peak at $x = \mu$;
- tails that extend to $-\infty$ and $+\infty$ but get vanishingly thin very quickly;
- total area under the curve equals $1$, since it is a probability density.

::widget{type="function-grapher" expr="2.5*exp(-(x-0)^2/2)" xmin=-6 xmax=6 grid=true}

The curve above plots $y = 2.5e^{-x^2/2}$ — the *shape* of a normal density centred on $0$ (scaled up for visibility; a true density has area exactly $1$ under it). Notice it is perfectly symmetric, and essentially flat and zero once $|x|$ is much bigger than about $3$.

## The empirical (68–95–99.7) rule

For any normal distribution, regardless of $\mu$ and $\sigma$:

- about $68\%$ of the distribution lies within $1$ standard deviation of the mean: $(\mu - \sigma, \mu + \sigma)$;
- about $95\%$ lies within $2$ standard deviations: $(\mu - 2\sigma, \mu + 2\sigma)$;
- about $99.7\%$ lies within $3$ standard deviations: $(\mu - 3\sigma, \mu + 3\sigma)$.

:::callout{kind="key"}
$\mu$ (mean) controls **where** the bell is centred. $\sigma$ (standard deviation) controls **how spread out** it is — a bigger $\sigma$ gives a shorter, wider bell (same total area of $1$, spread more thinly).
:::

## Standardising: the Z-transformation

Every different choice of $\mu$ and $\sigma$ gives a differently-scaled bell curve, so tables of areas would need to be printed for every possible $(\mu, \sigma)$ pair — impossible. Instead we convert **any** normal variable into the one and only **standard normal distribution**,

$$
Z \sim N(0, 1),
$$

which has mean $0$ and standard deviation $1$. The conversion is called **standardising**:

$$
Z = \frac{X - \mu}{\sigma}
$$

$Z$ tells you *how many standard deviations above or below the mean* a value of $X$ is. A $Z$ of $1.5$ means "$1.5$ standard deviations above the mean"; a $Z$ of $-2$ means "$2$ standard deviations below the mean".

:::reveal{title="Worked example: standardising"}
A machine fills bottles with volume $X \sim N(500, 4^2)$ ml (mean $500$ ml, standard deviation $4$ ml).

A bottle contains $506$ ml. What is its $Z$-value?

$$
Z = \frac{X - \mu}{\sigma} = \frac{506 - 500}{4} = \frac{6}{4} = 1.5
$$

So $506$ ml is $1.5$ standard deviations above the mean. A bottle containing $492$ ml has

$$
Z = \frac{492 - 500}{4} = \frac{-8}{4} = -2
$$

i.e. $2$ standard deviations *below* the mean.
:::

Standardising is the single idea that unlocks everything else in this module: once a problem is converted to $Z$, we can use one universal table (or calculator function) for **every** normal distribution that will ever come up.

## Why this matters

Once you can standardise, the next lesson shows you how to turn a $Z$-value into an actual probability using the standard normal cumulative distribution function $\Phi(z)$, so that you can answer questions like "what proportion of bottles contain more than 506 ml?"
