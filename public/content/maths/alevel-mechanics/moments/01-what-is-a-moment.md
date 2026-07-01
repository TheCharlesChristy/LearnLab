# What is a moment?

A force can do more than push or pull an object in a straight line — applied off-centre, it can also **turn** it. Pushing a door near its hinge barely moves it; pushing the same distance from the hinge, near the handle, swings it wide open. The *turning effect* of a force is called its **moment**.

## Defining the moment of a force

The moment of a force about a point (a **pivot**, or *fulcrum*) is defined as

$$
\text{moment} = F \times d,
$$

where $F$ is the magnitude of the force (in newtons, $\text{N}$) and $d$ is the **perpendicular distance** from the pivot to the line of action of the force (in metres, $\text{m}$). The unit of moment is therefore the **newton metre**, $\text{N}\,\text{m}$.

:::callout{kind="key"}
$d$ is always the **perpendicular** distance from the pivot to the force's line of action — not the distance to the point where the force happens to be applied, unless the force already acts perpendicular to the object.
:::

A moment also has a **sense of rotation**: clockwise or anticlockwise, viewed from a fixed side. By convention we pick one sense as positive and keep it consistent throughout a problem — usually anticlockwise is taken as positive, matching the usual mathematical convention for angles, but for equilibrium problems (next lesson) all that matters is treating the two senses consistently.

## Moment against distance

For a fixed force magnitude, the moment grows in direct proportion to the perpendicular distance: $\text{moment} = F \times d$ is a straight line through the origin when plotted against $d$, with gradient $F$. The grapher below shows the moment (in $\text{N}\,\text{m}$) produced by a constant $20\,\text{N}$ force as the perpendicular distance $x$ (in metres) varies — drag the tangent point and check that the gradient reads exactly $20$, confirming $\dfrac{\mathrm{d}(\text{moment})}{\mathrm{d}x} = F$.

::widget{type="function-grapher" expr="20*x" xmin=0 xmax=2 tangent=true grid=true}

:::reveal{title="Worked example: moment of a spanner force"}
A mechanic applies a force of $F = 20\,\text{N}$ perpendicular to a spanner, at a perpendicular distance $d = 0.4\,\text{m}$ from the centre of a nut. Find the moment of the force about the nut.

$$
\text{moment} = F \times d = 20 \times 0.4 = 8\,\text{N}\,\text{m}.
$$

If instead the mechanic pushes at the same point but at an angle, only the component of the force **perpendicular** to the spanner contributes to the turning effect — a force pulling straight along the spanner's length has zero moment about the nut, since its perpendicular distance from the pivot is $0$.
:::

## When perpendicular distance needs a little geometry

Often the force is not already perpendicular to a convenient line, and you must resolve it or use trigonometry to find $d$. A common case: a force $F$ acts at the end of a rod of length $L$, at angle $\theta$ to the rod, with the other end of the rod pivoted.

- Perpendicular distance from pivot to the line of action: $d = L\sin\theta$.
- So the moment about the pivot is $\text{moment} = FL\sin\theta$.

This matches the two extreme cases you'd expect: if $\theta = 90^\circ$ (force perpendicular to the rod) the moment is simply $FL$; if $\theta = 0^\circ$ (force along the rod) the moment is zero, since a force through the pivot itself has no turning effect (its perpendicular distance from the pivot is zero).

:::callout{kind="tip"}
Whenever a force passes **through** the pivot you are taking moments about, its moment there is automatically zero — this is a fast way to eliminate unwanted forces from an equation.
:::

Moments are central to understanding how rigid bodies — seesaws, beams, rods, ladders — stay in balance. That balance is the subject of the next lesson.
