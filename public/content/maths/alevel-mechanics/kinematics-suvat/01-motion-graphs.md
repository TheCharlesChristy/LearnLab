# Motion graphs: displacement, velocity and acceleration

Mechanics begins by describing **how** an object moves before asking **why** it moves. To do that we need three linked quantities.

## The three quantities

- **Displacement** $s$ is the position of the object measured from a chosen origin, in metres ($\text{m}$). It is a *vector*: a displacement of $-3\,\text{m}$ means $3\,\text{m}$ in the negative direction.
- **Velocity** $v$ is the rate of change of displacement, in metres per second ($\text{m s}^{-1}$). Its sign tells you the direction of travel.
- **Acceleration** $a$ is the rate of change of velocity, in metres per second squared ($\text{m s}^{-2}$). A negative acceleration while moving forwards means slowing down.

In symbols, velocity is the gradient of displacement and acceleration is the gradient of velocity:

$$
v = \frac{\mathrm{d}s}{\mathrm{d}t}, \qquad a = \frac{\mathrm{d}v}{\mathrm{d}t}.
$$

:::callout{kind="key"}
On a **displacement-time** graph the *gradient* is the velocity. On a **velocity-time** graph the *gradient* is the acceleration and the *area under the graph* is the displacement.
:::

## Reading a displacement-time graph

The curve below shows the displacement of a particle whose position is modelled by $s = t^2$ for the first few seconds. The gradient steepens as time passes, which tells us the particle is speeding up. Drag the tangent point to read the velocity (the gradient) at any instant.

::widget{type="function-grapher" expr="x^2" tangent=true xmin=0 xmax=5}

Because the gradient at time $t$ is $2t$, the velocity here grows steadily with time — a hallmark of **constant acceleration**, which is the subject of this module.

## Reading a velocity-time graph

The velocity-time graph below shows a tram that accelerates uniformly from rest, cruises at a steady speed, then brakes to a stop.

::widget{type="data-plot" src="velocity-time.json"}

We can extract everything we need from the graph:

- From $t = 0$ to $t = 5\,\text{s}$ the velocity rises from $0$ to $10\,\text{m s}^{-1}$, so the acceleration is $\frac{10 - 0}{5 - 0} = 2\,\text{m s}^{-2}$.
- From $t = 5$ to $t = 10\,\text{s}$ the line is flat, so the acceleration is zero (constant velocity).
- From $t = 10$ to $t = 15\,\text{s}$ the velocity falls from $10$ to $0$, so the acceleration is $\frac{0 - 10}{15 - 10} = -2\,\text{m s}^{-2}$ (braking).

:::reveal{title="Worked example: total distance from the area"}
The displacement is the area under the velocity-time graph. The shape is a trapezium with parallel sides (the two horizontal levels of the journey) and height $10\,\text{m s}^{-1}$.

Split it into three pieces:

$$
\underbrace{\tfrac{1}{2}\times 5 \times 10}_{\text{accelerating}} + \underbrace{5 \times 10}_{\text{cruising}} + \underbrace{\tfrac{1}{2}\times 5 \times 10}_{\text{braking}} = 25 + 50 + 25 = 100\,\text{m}.
$$

So the tram travels $100\,\text{m}$ in the $15\,\text{s}$ journey. Equivalently, the trapezium-area rule $s = \tfrac{1}{2}(a+b)h$ with parallel sides $a = 5\,\text{s}$ (top) and $b = 15\,\text{s}$ (bottom) gives $\tfrac{1}{2}(5 + 15)\times 10 = 100\,\text{m}$.
:::

When the acceleration is constant, this area-and-gradient reasoning packages neatly into five algebraic formulae. We meet them next.
