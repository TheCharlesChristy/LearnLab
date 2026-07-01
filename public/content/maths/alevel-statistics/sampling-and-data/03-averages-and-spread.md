# Measures of location and spread

A single "typical value" (a measure of **location** or **central
tendency**) and a single "how spread out" value (a measure of **spread** or
**dispersion**) let us summarise a whole data set with just two numbers.

## Measures of location

- **Mean** $\bar{x}$ — the sum of all values divided by how many there are:

  $$
  \bar{x} = \frac{\sum x}{n}
  $$

  Uses every value, so it is sensitive to extreme values (outliers).

- **Median** — the middle value when the data is sorted into order. With $n$
  values, the median is the $\frac{n+1}{2}$-th value (if $n$ is odd), or the
  mean of the two middle values (if $n$ is even). Not affected by extreme
  values.

- **Mode** — the most frequently occurring value. The only average that
  makes sense for qualitative data, and a data set can have more than one
  mode (or none, if all values are equally frequent).

## Measures of spread

- **Range** = largest value $-$ smallest value. Simple, but entirely
  determined by the two extreme values.

- **Interquartile range (IQR)** = $Q_3 - Q_1$, the range of the *middle 50%*
  of the data, where $Q_1$ (lower quartile) and $Q_3$ (upper quartile) are
  found by splitting the sorted data at the median and taking the median of
  each half (excluding the overall median itself when $n$ is odd). Less
  sensitive to extreme values than the range.

- **Variance** and **standard deviation** measure spread using every value's
  distance from the mean. For a full data set (treated as the population):

  $$
  \sigma^2 = \frac{\sum (x - \bar{x})^2}{n} = \frac{\sum x^2}{n} - \bar{x}^2, \qquad \sigma = \sqrt{\sigma^2}
  $$

  The second form (using $\sum x^2$) is usually faster to calculate by hand.
  Standard deviation is in the same units as the data, which makes it easier
  to interpret than variance.

:::callout{kind="key"}
For a **frequency table** with values $x$ and frequencies $f$, replace sums
over the raw list with frequency-weighted sums:

$$
\bar{x} = \frac{\sum fx}{\sum f}, \qquad \sigma^2 = \frac{\sum fx^2}{\sum f} - \bar{x}^2
$$
:::

:::reveal{title="Worked example: mean, median, mode, range, IQR from raw data"}
Eleven patients at a clinic have the following ages (years):

$$
12,\ 15,\ 15,\ 18,\ 21,\ 22,\ 22,\ 22,\ 25,\ 29,\ 34
$$

The data is already sorted, and $n = 11$.

**Mean:** $\sum x = 12+15+15+18+21+22+22+22+25+29+34 = 235$, so
$\bar{x} = \frac{235}{11} \approx 21.4$ (3 s.f.).

**Median:** the $\frac{11+1}{2} = 6$th value is $22$.

**Mode:** $22$ appears three times, more than any other value, so the mode
is $22$.

**Range:** $34 - 12 = 22$.

**IQR:** split the 11 values either side of the median (position 6),
excluding it. Since $n=11$ is odd, each half has $\frac{11-1}{2}=5$ values:
lower half $12,15,15,18,21$, upper half $22,22,25,29,34$.
$Q_1$ = median of lower half = $15$. $Q_3$ = median of upper half = $25$.
So $\mathrm{IQR} = 25 - 15 = 10$.

**Variance/SD:** $\sum x^2 = 12^2+15^2+\dots+34^2 = 5433$, so

$$
\sigma^2 = \frac{5433}{11} - 21.3636^2 \approx 493.91 - 456.40 \approx 37.5, \qquad \sigma \approx 6.12
$$
:::

Work through the frequency-table version of this calculation one step at a
time, using the sibling-count survey from the previous lesson:

::widget{type="step-reveal" src="data/mean-from-table-steps.json"}

:::callout{kind="tip"}
Exam tip: always state whether you are using the **population** formula
($\div n$) or the **sample** formula ($\div (n-1)$ for variance) — A-level
Statistics almost always treats a given data set as the whole population of
interest, so divide by $n$ unless the question says otherwise.
:::

Try the interactive check below:

::widget{type="quiz" src="assessment.json"}
