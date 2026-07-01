# The sine rule, cosine rule and area of a triangle

So far you have only solved **right-angled** triangles with SOHCAHTOA. Many real
triangles are not right-angled — for these we need two new tools: the **sine
rule** and the **cosine rule**. Throughout, label a triangle $ABC$ so that side
$a$ is opposite angle $A$, side $b$ is opposite angle $B$, and side $c$ is
opposite angle $C$.

## The sine rule

$$
\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C}
$$

or, flipped, $\dfrac{\sin A}{a} = \dfrac{\sin B}{b} = \dfrac{\sin C}{c}$ — use
whichever arrangement puts the unknown in the numerator. The sine rule needs
**one side and its opposite angle** as a starting pair, plus one more piece of
information (another side, or another angle).

- Use the rule to find a **side**: two angles and a side (AAS/ASA).
- Use the rule to find an **angle**: two sides and a non-included angle (SSA)
  — but see the ambiguous case below.

:::callout{kind="key"}
The sine rule links each side to the sine of its *opposite* angle. If you know
any opposite pair (side, angle) plus one more side or angle, you can find
everything else, since angles in a triangle sum to $180^\circ$.
:::

:::reveal{title="Worked example: finding a side"}
In triangle $ABC$, $A = 40^\circ$, $B = 65^\circ$, and $a = 8\,\text{cm}$.
Find $b$.

First, $C = 180^\circ - 40^\circ - 65^\circ = 75^\circ$ (not needed for $b$,
but useful to check the triangle closes).

$$
\frac{b}{\sin B} = \frac{a}{\sin A} \implies b = \frac{a \sin B}{\sin A} = \frac{8 \sin 65^\circ}{\sin 40^\circ} \approx \frac{8 \times 0.9063}{0.6428} \approx 11.28\,\text{cm}
$$
:::

## The ambiguous case (SSA)

If you are given two sides and a non-included angle (side–side–angle), there
can be **two** possible triangles, **one**, or **none** — this is the
*ambiguous case*. It arises because $\sin\theta = \sin(180^\circ - \theta)$,
so solving $\sin B = k$ can give two valid angles $B_1$ and $180^\circ - B_1$
in $(0^\circ, 180^\circ)$.

**Check both**: after finding $B_1 = \sin^{-1}(k)$, also test
$B_2 = 180^\circ - B_1$. $B_2$ is a valid second solution only if
$A + B_2 < 180^\circ$ (the angles must still fit in a triangle).

:::reveal{title="Worked example: the ambiguous case"}
In triangle $ABC$, $a = 7$, $b = 10$, $A = 40^\circ$. Find the possible values
of $B$.

$$
\frac{\sin B}{b} = \frac{\sin A}{a} \implies \sin B = \frac{b \sin A}{a} = \frac{10 \sin 40^\circ}{7} \approx \frac{10 \times 0.6428}{7} \approx 0.9183
$$

So $B_1 = \sin^{-1}(0.9183) \approx 66.7^\circ$, and the second candidate is
$B_2 = 180^\circ - 66.7^\circ = 113.3^\circ$.

Check: $A + B_2 = 40^\circ + 113.3^\circ = 153.3^\circ < 180^\circ$ ✓, so
**both** are valid — this triangle is genuinely ambiguous, giving
$B \approx 66.7^\circ$ or $B \approx 113.3^\circ$.

(Had $b$ been shorter than the "height" $a\sin A$, there would be no
solution; had $A + B_2 \ge 180^\circ$, only $B_1$ would be valid.)
:::

## The cosine rule

Use the cosine rule when the sine rule cannot get started — i.e. when you know
**three sides** (SSS) or **two sides and the included angle** (SAS).

$$
a^2 = b^2 + c^2 - 2bc\cos A
$$

with the equivalent forms for $b^2$ and $c^2$ by cycling the letters. Rearranged
to find an angle from three known sides:

$$
\cos A = \frac{b^2 + c^2 - a^2}{2bc}
$$

:::callout{kind="tip"}
To find a **side**, use the cosine rule when you know the two sides
*enclosing* the unknown side's opposite angle (SAS). To find an **angle**,
rearrange the cosine rule when you know all three sides (SSS). Always find
the **largest angle first** when using SSS, since it is the one most likely
to be obtuse — the inverse cosine correctly returns obtuse angles, unlike
inverse sine.
:::

:::reveal{title="Worked example: finding a side (SAS)"}
In triangle $ABC$, $a = 7$, $b = 9$, $C = 55^\circ$. Find $c$.

$$
c^2 = a^2 + b^2 - 2ab\cos C = 7^2 + 9^2 - 2(7)(9)\cos 55^\circ \approx 49 + 81 - 126(0.5736) \approx 57.73
$$

$$
c \approx \sqrt{57.73} \approx 7.60
$$
:::

:::reveal{title="Worked example: finding an angle (SSS)"}
A triangle has sides $a = 8$, $b = 6$, $c = 5$. Find the angle $A$ (opposite
the longest side, so the largest angle).

$$
\cos A = \frac{b^2 + c^2 - a^2}{2bc} = \frac{36 + 25 - 64}{2(6)(5)} = \frac{-3}{60} = -0.05
$$

$$
A = \cos^{-1}(-0.05) \approx 92.9^\circ
$$

The negative cosine correctly signals that $A$ is obtuse.
:::

## Area of a triangle

When you know two sides and the angle **between** them (the included angle),
you don't need the height to find the area:

$$
\text{Area} = \frac{1}{2}ab\sin C
$$

(again, cycle the letters for the equivalent forms using other angle pairs).

:::reveal{title="Worked example: area"}
Triangle with $a = 8$, $b = 6$, included angle $C = 70^\circ$.

$$
\text{Area} = \frac{1}{2}(8)(6)\sin 70^\circ \approx 24 \times 0.9397 \approx 22.55 \text{ (square units)}
$$
:::

You now have all three tools for general triangles: the sine rule, the
cosine rule, and the $\frac{1}{2}ab\sin C$ area formula. The end-of-module
assessment will test all three, including the ambiguous case.
