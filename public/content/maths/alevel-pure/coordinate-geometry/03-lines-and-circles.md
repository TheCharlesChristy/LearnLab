# Lines and circles: tangents, chords and intersections

This lesson brings straight lines and circles together: tangents, the perpendicular relationship between a radius and a tangent, and finding where a line crosses a circle.

## Tangents to a circle

A **tangent** to a circle is a straight line that touches the circle at exactly one point (the *point of contact*) without crossing into the circle's interior.

:::callout{kind="key"}
A tangent to a circle is always **perpendicular to the radius drawn to the point of contact**.
:::

This single fact is enough to find the equation of a tangent at a known point: find the gradient of the radius to that point, take the negative reciprocal, then use $y - y_1 = m(x-x_1)$.

:::reveal{title="Worked example: tangent at a given point"}
Find the equation of the tangent to the circle $x^2 + y^2 = 25$ at the point $(3, 4)$.

The centre is $(0,0)$ (since the circle is $x^2+y^2=5^2$), so the radius to $(3,4)$ has gradient

$$
m_{\text{radius}} = \frac{4-0}{3-0} = \frac{4}{3}.
$$

The tangent is perpendicular to this radius, so its gradient is the negative reciprocal:

$$
m_{\text{tangent}} = -\frac{3}{4}.
$$

Using $y - y_1 = m(x - x_1)$ at $(3,4)$:

$$
y - 4 = -\tfrac{3}{4}(x - 3) \implies 4y - 16 = -3x + 9 \implies 3x + 4y = 25.
$$

Check: substituting $(3,4)$ gives $3(3) + 4(4) = 9 + 16 = 25$. ✓
:::

See the circle (as its two semicircles, since `function-grapher` only plots $y=f(x)$) together with the tangent line at $(3,4)$:

::widget{type="function-grapher" expr="sqrt(25-x^2)" xmin=-6 xmax=6 ymin=-7 ymax=7 grid=true}

::widget{type="function-grapher" expr="(25 - 3*x)/4" xmin=-6 xmax=6 ymin=-7 ymax=7 grid=true}

:::callout{kind="tip"}
The second grapher plots the tangent line $3x+4y=25$ rearranged as $y = (25-3x)/4$. Notice it just grazes the upper semicircle at $x=3$ and does not cross into the circle's interior anywhere else.
:::

## Finding where a line meets a circle

To find the point(s) where a line meets a circle, substitute the line's equation into the circle's equation. This always reduces to a **quadratic equation** in one variable — exactly the kind of equation studied in *Quadratics and inequalities*, which is why that module is a prerequisite here. The number of solutions of the quadratic tells you how the line and circle relate:

- **Two distinct real roots** → the line is a **secant**, crossing the circle at two points (a chord).
- **One repeated root** (discriminant $= 0$) → the line is a **tangent**, touching at exactly one point.
- **No real roots** (discriminant $< 0$) → the line **misses** the circle entirely.

:::reveal{title="Worked example: intersection of a line and a circle"}
Find the points where the line $y = x + 1$ meets the circle $x^2 + y^2 = 25$.

Substitute $y = x+1$ into the circle's equation:

$$
x^2 + (x+1)^2 = 25.
$$

Expand and simplify:

$$
x^2 + x^2 + 2x + 1 = 25 \implies 2x^2 + 2x - 24 = 0 \implies x^2 + x - 12 = 0.
$$

Factorise: $(x+4)(x-3) = 0$, so $x = -4$ or $x = 3$.

Using $y = x+1$: when $x=-4$, $y=-3$; when $x=3$, $y=4$.

The line meets the circle at $(-4, -3)$ and $(3, 4)$.
:::

:::reveal{title="Worked example: using the discriminant to test for tangency"}
Show that the line $y = x + 10$ does not meet the circle $x^2+y^2=25$.

Substitute: $x^2 + (x+10)^2 = 25 \implies 2x^2 + 20x + 100 - 25 = 0 \implies 2x^2 + 20x + 75 = 0$.

Discriminant: $b^2 - 4ac = 20^2 - 4(2)(75) = 400 - 600 = -200 < 0$.

Since the discriminant is negative, the quadratic has no real roots, so the line does not intersect the circle anywhere.
:::

:::callout{kind="info"}
The same substitution method works even when the circle's equation is given in general form — just complete the square first (as in the previous lesson) to double check the centre and radius, or substitute directly into the general form; the algebra still reduces to a quadratic.
:::

## Putting it together

Coordinate geometry problems in exams typically chain these ideas: find a gradient, use perpendicularity to get a tangent or a perpendicular bisector, apply the midpoint or distance formula, and substitute a line into a circle to find intersections. Work through the assessment below to practise identifying which tool a question is asking for.

::widget{type="quiz" src="assessment.json" pick=4}
