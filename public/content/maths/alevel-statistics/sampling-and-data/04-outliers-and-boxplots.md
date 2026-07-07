# Outliers and box plots

An **outlier** is a value that lies unusually far from the rest of the data.
Outliers can be genuine (an unusually tall person) or the result of an error
(a mistyped measurement), but either way we need a consistent rule to spot
them rather than relying on a "does it look weird" judgement.

## The 1.5 x IQR rule

Once you know $Q_1$, $Q_3$ and the IQR $= Q_3 - Q_1$, a value $x$ is
classified as an outlier if

$$
x < Q_1 - 1.5 \times \mathrm{IQR} \qquad \text{or} \qquad x > Q_3 + 1.5 \times \mathrm{IQR}
$$

The two boundary values are called the **lower fence** and **upper fence**.

:::reveal{title="Worked example: finding an outlier"}
Ten students record the number of text messages they sent yesterday:

$$
12,\ 14,\ 15,\ 15,\ 16,\ 18,\ 19,\ 20,\ 21,\ 47
$$

The data is already sorted, $n = 10$ (even).

**Median:** mean of the 5th and 6th values $= \frac{16+18}{2} = 17$.

**Quartiles:** split into two halves of 5 values each. Lower half:
$12,14,15,15,16$, so $Q_1 = 15$ (its median). Upper half:
$18,19,20,21,47$, so $Q_3 = 20$ (its median).

**IQR:** $Q_3 - Q_1 = 20 - 15 = 5$.

**Fences:** lower fence $= 15 - 1.5 \times 5 = 7.5$; upper fence
$= 20 + 1.5 \times 5 = 27.5$.

Every value is checked against the fences: only $47 > 27.5$, so **47 is the
only outlier**. (Range for reference: $47 - 12 = 35$ — notice how much the
single outlier inflates the range compared with the IQR of $5$.)
:::

:::callout{kind="warning"}
An outlier is not automatically wrong or automatically removed from the data
set. In an exam you are typically asked to identify it, and separately asked
to comment on whether it should be investigated, corrected, or excluded —
these are different questions.
:::

## Box plots

A **box plot** (box-and-whisker diagram) displays five key values on a
single scaled axis:

- the minimum (or lower fence, if outliers are shown separately),
- $Q_1$,
- the median,
- $Q_3$,
- the maximum (or upper fence).

A box is drawn from $Q_1$ to $Q_3$ (with a line at the median), and
"whiskers" extend out to the smallest and largest values that are *not*
outliers. Any outliers are then marked individually, usually with a cross or
dot, beyond the whisker.

:::callout{kind="key"}
Box plots make it very easy to compare the spread and skew of two or more
data sets side by side on the same axis — look for which box/median sits
further along the scale, which box is wider (more spread in the middle 50%),
and how long the whiskers are.
:::

:::reveal{title="Worked example: describing skew from a box plot"}
If the whisker from the minimum to $Q_1$ is much longer than the whisker
from $Q_3$ to the maximum, and the median line sits closer to $Q_3$ than to
$Q_1$ inside the box, the distribution is **negatively skewed** (a longer
"tail" of lower values). The reverse pattern (long upper whisker, median
closer to $Q_1$) indicates **positive skew**.
:::

For the text-message data above: minimum (excluding the outlier) $=12$,
$Q_1=15$, median $=17$, $Q_3=20$, maximum (excluding the outlier) $=21$, with
$47$ plotted separately as an outlier beyond the upper whisker.

Revisit the sibling-count bar chart from lesson 2 and think about how you
would find its five-number summary — then check your skills on the
assessment below.

::widget{type="quiz" src="assessment.json"}
