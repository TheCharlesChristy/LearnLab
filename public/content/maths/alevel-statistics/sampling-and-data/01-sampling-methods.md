# Sampling methods

In statistics we rarely study an entire **population** (every member of the
group we care about). Instead we study a **sample** — a subset of the
population — and use it to draw conclusions about the whole population. How
that sample is chosen matters enormously: a badly chosen sample can give a
completely misleading picture, no matter how carefully we crunch the numbers
afterwards.

This lesson covers five sampling methods you need for A-level: **simple
random sampling**, **stratified sampling**, **systematic sampling**,
**opportunity (convenience) sampling**, and **quota sampling**.

## Simple random sampling (SRS)

Every member of the population has an equal chance of being chosen, and every
possible sample of a given size is equally likely. In practice this means
numbering every member of the population and using a random number generator
or random number table to pick which ones are included.

:::callout{kind="key"}
Simple random sampling requires a **sampling frame** — a complete list of the
population — which is not always available.
:::

**Strengths:** free from bias; easy to understand; each member has a known,
equal chance of selection, which makes the maths of later inference valid.

**Weaknesses:** needs a complete sampling frame; can be impractical or
expensive for large populations; a particular random sample might, by chance,
not represent the population well (e.g. it could miss a whole subgroup).

## Stratified sampling

The population is split into non-overlapping **strata** (groups sharing a
characteristic, e.g. year group, gender, department), and a simple random
sample is taken from *each* stratum, proportional to the stratum's size in
the population.

If a stratum contains $N_i$ members out of a population of size $N$, and the
total sample size is $n$, the number sampled from that stratum is

$$
n_i = \frac{N_i}{N} \times n
$$

:::reveal{title="Worked example: stratified sample sizes"}
A school has 320 Year 12 students and 280 Year 13 students (population size
$N = 600$). A researcher wants a stratified sample of $n = 60$ students.

$$
n_{12} = \frac{320}{600} \times 60 = 32, \qquad n_{13} = \frac{280}{600} \times 60 = 28
$$

So 32 Year 12 students and 28 Year 13 students should be sampled (each group
sampled using simple random sampling within itself), giving $32 + 28 = 60$ in
total.
:::

**Strengths:** guarantees representation of every subgroup in proportion to
its size; usually more precise than an SRS of the same size when the strata
differ from each other.

**Weaknesses:** needs a sampling frame *and* accurate knowledge of the strata
sizes; more complex to organise than SRS.

## Systematic sampling

List the population (there are $N$ members) and choose every $k$-th member,
starting from a randomly chosen point in the first $k$, where $k = N / n$ is
the **sampling interval** for a sample of size $n$.

**Strengths:** simple to carry out once a sampling interval is fixed; spreads
the sample evenly across the list.

**Weaknesses:** if the list has a hidden pattern that repeats with the same
period as $k$, the sample can be badly biased (e.g. sampling every 7th day of
data will always land on the same day of the week).

## Opportunity (convenience) sampling

Sample whoever is easiest to reach — for example, interviewing the first 20
people who walk past you in the street.

**Strengths:** quick, cheap, and requires no sampling frame at all.

**Weaknesses:** highly likely to be biased, since who is "convenient" to
sample is rarely representative of the whole population (e.g. surveying
shoppers on a weekday morning misses everyone who works standard office
hours).

## Quota sampling

The population is divided into groups (as in stratified sampling), but
instead of randomly sampling within each group, the interviewer simply
samples non-randomly (often by convenience) until a **quota** for each group
is filled.

**Strengths:** does not need a sampling frame; quick and relatively cheap;
ensures subgroups are represented in specified numbers.

**Weaknesses:** non-random selection within each quota introduces bias (the
interviewer might unconsciously choose more approachable-looking people);
different interviewers might produce different results.

:::callout{kind="tip"}
When asked to *evaluate* a sampling method in an exam, always relate your
answer to the specific context in the question — "it might introduce bias"
is worth less credit than "workers on the night shift will never be selected
by this systematic sample, so the sample will be biased towards day-shift
opinions."
:::

## Quick comparison

| Method | Needs sampling frame? | Random? | Guarantees subgroup representation? |
| --- | --- | --- | --- |
| Simple random | Yes | Yes | No |
| Stratified | Yes | Yes (within strata) | Yes, proportionally |
| Systematic | Yes | Partially (random start) | No |
| Opportunity | No | No | No |
| Quota | No | No | Yes, by quota |

Test yourself on today's ideas:

::widget{type="quiz" src="assessment.json"}
