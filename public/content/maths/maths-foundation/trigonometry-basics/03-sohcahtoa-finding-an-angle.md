# SOHCAHTOA: finding a missing angle

So far you've used SOHCAHTOA to go from an angle to a side. Now turn it around: if you know **two sides** of a right-angled triangle, you can find one of the acute angles using the **inverse trig functions** $\sin^{-1}$, $\cos^{-1}$ and $\tan^{-1}$ (sometimes written $\arcsin$, $\arccos$, $\arctan$).

## Undoing sin, cos and tan

If $\sin\theta = k$, then $\theta = \sin^{-1}(k)$ — the inverse sine function "undoes" the sine and gives back the angle. The same idea applies to cos and tan:

$$
\sin\theta = k \implies \theta = \sin^{-1}(k), \qquad
\cos\theta = k \implies \theta = \cos^{-1}(k), \qquad
\tan\theta = k \implies \theta = \tan^{-1}(k).
$$

:::callout{kind="warning"}
$\sin^{-1}$ does **not** mean $\dfrac{1}{\sin}$ — it's the inverse function (undoing sin), not a reciprocal. On a calculator it's usually the shifted/second function of the sin key, often labelled $\sin^{-1}$ or `asin`.
:::

## Method

1. Label the triangle and identify which two sides you're given — that tells you which ratio (sin, cos or tan) to set up, exactly as before.
2. Write the ratio as a decimal: $\dfrac{\text{known side}}{\text{known side}}$.
3. Apply the matching inverse function to both sides to get the angle.

:::reveal{title="Worked example: using sin⁻¹ (opposite and hypotenuse known)"}
A right-angled triangle has opposite side $5\,\text{cm}$ and hypotenuse $9\,\text{cm}$. Find the angle $\theta$ opposite the $5\,\text{cm}$ side.

Opposite and hypotenuse are known, so use **sin** (SOH):

$$
\sin\theta = \frac{5}{9} \approx 0.5556
$$

$$
\theta = \sin^{-1}(0.5556) \approx 33.7^\circ \text{ (to 1 d.p.)}
$$
:::

:::reveal{title="Worked example: using cos⁻¹ (adjacent and hypotenuse known)"}
A right-angled triangle has adjacent side $8\,\text{cm}$ and hypotenuse $11\,\text{cm}$. Find the angle $\theta$ between them.

Adjacent and hypotenuse are known, so use **cos** (CAH):

$$
\cos\theta = \frac{8}{11} \approx 0.7273
$$

$$
\theta = \cos^{-1}(0.7273) \approx 43.3^\circ \text{ (to 1 d.p.)}
$$
:::

:::reveal{title="Worked example: using tan⁻¹ (opposite and adjacent known, no hypotenuse)"}
A right-angled triangle has opposite side $6\,\text{cm}$ and adjacent side $10\,\text{cm}$ (no hypotenuse given). Find angle $\theta$.

With no hypotenuse involved, use **tan** (TOA):

$$
\tan\theta = \frac{6}{10} = 0.6
$$

$$
\theta = \tan^{-1}(0.6) \approx 31.0^\circ \text{ (to 1 d.p.)}
$$
:::

## Pulling it all together

You now have everything you need for right-angled-triangle problems:

- **Two sides, no angle** → Pythagoras' theorem.
- **One angle and one side, want another side** → SOHCAHTOA, rearranged for the missing side.
- **Two sides, want an angle** → SOHCAHTOA with an inverse trig function.

Use the code below to check the three worked examples above and to try your own numbers — change `opp`, `adj` and `hyp` and see which ratio (and which inverse function) applies.

::widget{type="code-runner" language="python" starter="import math\n\ndef angle_from_opp_hyp(opp, hyp):\n    return math.degrees(math.asin(opp / hyp))\n\ndef angle_from_adj_hyp(adj, hyp):\n    return math.degrees(math.acos(adj / hyp))\n\ndef angle_from_opp_adj(opp, adj):\n    return math.degrees(math.atan(opp / adj))\n\nprint('sin case  (opp=5, hyp=9): ', round(angle_from_opp_hyp(5, 9), 1), 'deg')\nprint('cos case  (adj=8, hyp=11):', round(angle_from_adj_hyp(8, 11), 1), 'deg')\nprint('tan case  (opp=6, adj=10):', round(angle_from_opp_adj(6, 10), 1), 'deg')" rows=14}

:::callout{kind="tip"}
Sanity-check your answer: in a right-angled triangle the two non-right angles must add to $90^\circ$, and every angle must be strictly between $0^\circ$ and $90^\circ$. If your inverse trig calculation gives something outside that range, re-check which sides you labelled as opposite/adjacent/hypotenuse.
:::

The end-of-module assessment mixes all three techniques from this module — labelling sides, Pythagoras' theorem, and SOHCAHTOA in both directions — so make sure you're comfortable deciding which tool a question needs before you reach for a formula.
