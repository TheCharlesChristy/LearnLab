# SOHCAHTOA: finding a missing side

Pythagoras' theorem only helps when you know two sides. If instead you know **one angle and one side**, and need another side, you need a trig ratio — and that's exactly what SOHCAHTOA gives you.

## The three ratios

For a chosen angle $\theta$ in a right-angled triangle, with sides labelled hypotenuse, opposite and adjacent (as in the last lesson):

$$
\sin\theta = \frac{\text{opposite}}{\text{hypotenuse}}, \qquad
\cos\theta = \frac{\text{adjacent}}{\text{hypotenuse}}, \qquad
\tan\theta = \frac{\text{opposite}}{\text{adjacent}}.
$$

**SOHCAHTOA** is the memory aid for all three at once:

- **S**in = **O**pposite over **H**ypotenuse
- **C**os = **A**djacent over **H**ypotenuse
- **T**an = **O**pposite over **A**djacent

:::callout{kind="key"}
All angles in this course are measured in **degrees**. Make sure your calculator is in degree mode before evaluating $\sin$, $\cos$ or $\tan$ of an angle.
:::

## Finding a missing side

To find a missing side, follow three steps:

1. Label the triangle: mark the right angle, the angle $\theta$ you're given, and identify which of the two remaining sides is the hypotenuse, which is opposite, and which is adjacent.
2. Decide which ratio connects the side you **know** with the side you **want** — whichever ratio has both of those sides in it.
3. Rearrange to make the unknown side the subject, then substitute and evaluate.

:::reveal{title="Worked example: finding the opposite side (using sin)"}
A right-angled triangle has hypotenuse $7\,\text{cm}$ and an angle of $35^\circ$. Find the side opposite the $35^\circ$ angle.

The known side (hypotenuse) and the wanted side (opposite) appear together in **sin** (SOH):

$$
\sin 35^\circ = \frac{\text{opposite}}{7}
$$

Rearranging and substituting:

$$
\text{opposite} = 7 \times \sin 35^\circ \approx 7 \times 0.5736 \approx 4.0\,\text{cm} \text{ (to 1 d.p.)}
$$
:::

:::reveal{title="Worked example: finding the adjacent side (using cos)"}
A right-angled triangle has hypotenuse $12\,\text{cm}$ and an angle of $52^\circ$. Find the side adjacent to the $52^\circ$ angle.

The hypotenuse and the adjacent side appear together in **cos** (CAH):

$$
\cos 52^\circ = \frac{\text{adjacent}}{12}
$$

$$
\text{adjacent} = 12 \times \cos 52^\circ \approx 12 \times 0.6157 \approx 7.4\,\text{cm} \text{ (to 1 d.p.)}
$$
:::

:::callout{kind="tip"}
If the unknown side is in the **denominator** after you pick the ratio (for example, you know the adjacent side and the angle, but want the hypotenuse), rearrange by cross-multiplying and dividing rather than trying to "plug in" directly. E.g. $\cos\theta = \dfrac{\text{adjacent}}{\text{hypotenuse}} \implies \text{hypotenuse} = \dfrac{\text{adjacent}}{\cos\theta}$.
:::

## Checking your working with code

The calculation is just "known side $\times$ (or $\div$) a trig ratio of the given angle". Try the code below — it checks the second worked example above, and you can edit the angle or hypotenuse to explore other cases (including using `tan` when the two known/unknown sides are opposite and adjacent, with no hypotenuse involved at all).

::widget{type="code-runner" language="python" starter="import math\n\n# Worked example 2: hypotenuse 12 cm, angle 52 degrees, find the adjacent side\nhypotenuse = 12\nangle_deg = 52\n\nadjacent = hypotenuse * math.cos(math.radians(angle_deg))\nprint(f'adjacent = {adjacent:.4f} cm')\nprint(f'rounded to 1 d.p. = {round(adjacent, 1)} cm')\n\n# Try tan instead: adjacent 15 cm, angle 28 degrees, find the opposite side\nadjacent2 = 15\nangle2_deg = 28\nopposite2 = adjacent2 * math.tan(math.radians(angle2_deg))\nprint(f'opposite = {opposite2:.4f} cm (rounded: {round(opposite2, 1)} cm)')" rows=14}

With practice, choosing the right ratio becomes automatic: ask "which two sides am I working with — hypotenuse and opposite, hypotenuse and adjacent, or opposite and adjacent?", and that tells you whether to use sin, cos or tan.
