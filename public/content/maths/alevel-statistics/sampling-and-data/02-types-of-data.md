# Types of data

Before we can summarise or analyse a data set, we need to know what *kind*
of data we are dealing with, since this determines which summary statistics
and diagrams are appropriate.

## Qualitative vs quantitative

**Qualitative data** describes a quality or characteristic — it is
non-numerical (e.g. eye colour, favourite subject, brand of phone).
Qualitative data that falls into named groups is also called **categorical**
data (e.g. "bus", "car", "train" as modes of transport).

**Quantitative data** is numerical — it represents a count or a measurement
(e.g. number of siblings, height in cm, time in seconds).

## Discrete vs continuous

Quantitative data splits further into:

- **Discrete data** can only take specific, separate values — usually whole
  numbers arising from counting. Examples: number of siblings, number of
  goals scored, shoe size (in the UK, shoe sizes go up in halves, but they
  are still a fixed, countable list of possible values).
- **Continuous data** can take *any* value within a range — it arises from
  measuring rather than counting. Examples: height, mass, time, temperature.
  Continuous data is always recorded to a given degree of accuracy (e.g.
  "17.3 cm" really means "somewhere in $[17.25, 17.35)$").

:::callout{kind="info"}
A good test: can you always find a value *between* any two data values? If
yes, the data is continuous. Between a height of 1.70 m and 1.71 m there are
infinitely many possible heights (1.702 m, 1.7053 m, ...), so height is
continuous. Between "2 siblings" and "3 siblings" there is nothing — so
number of siblings is discrete.
:::

## Why the distinction matters

- Categorical/qualitative data is usually summarised with frequencies,
  proportions, bar charts and pie charts, and the **mode** is often the only
  sensible average.
- Discrete numerical data can be summarised with a frequency table listing
  each distinct value, and *all three* averages (mean, median, mode) make
  sense.
- Continuous data is usually grouped into class intervals before a frequency
  table or histogram is drawn, because recording an exact frequency for
  every possible value isn't meaningful.

:::reveal{title="Worked example: classify these variables"}
For each variable, decide whether it is qualitative, discrete quantitative,
or continuous quantitative:

1. The number of cars passing a checkpoint in an hour — **discrete**
   quantitative (a count of whole cars).
2. The time taken (in seconds) for a runner to finish 100 m — **continuous**
   quantitative (measured, can take any value in a range).
3. The colour of each car passing the checkpoint — **qualitative**
   (categorical, non-numerical).
4. The number of bedrooms in a house — **discrete** quantitative (a count;
   you can't have 2.5 bedrooms in the way you can have 2.5 metres).
:::

Here is a small bar chart of a discrete data set — the number of siblings
reported by 20 students in a class survey — which we'll return to in the
next lesson when we compute averages from a frequency table:

::widget{type="data-plot" src="data/siblings-frequency.json"}

:::callout{kind="tip"}
Notice the bar chart has gaps between bars, which is standard for discrete
data displayed by value (as opposed to a histogram for grouped continuous
data, where bars touch).
:::

Check your understanding:

::widget{type="quiz" src="assessment.json"}
