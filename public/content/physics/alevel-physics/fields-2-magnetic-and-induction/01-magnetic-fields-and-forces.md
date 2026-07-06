# Magnetic fields and forces

A magnetic field is a region of space in which a moving charge, a current-carrying conductor, or a magnetic material experiences a force. We describe its strength and direction with the **magnetic flux density**, $B$, measured in tesla ($\text{T}$). Field lines run from a magnet's north pole to its south pole outside the magnet, and the density of the lines shows the field strength: closely spaced lines mean a strong field.

## Field patterns you must recognise

- **Bar magnet:** field lines emerge from the north pole, curve round, and enter the south pole. They are dense (strong field) close to the poles and spread out (weaker field) further away.
- **Straight current-carrying wire:** the field forms concentric circles around the wire, in a plane perpendicular to it. Its direction is given by the **right-hand grip rule**: point your right thumb in the direction of conventional current, and your curled fingers show the field's direction. Field strength decreases with distance from the wire.
- **Solenoid (current-carrying coil):** the field inside is strong and uniform, running parallel to the coil's axis; outside, the pattern looks like that of a bar magnet. The same right-hand grip rule applies, curling your fingers in the direction of the current around the coil to find which end acts as the north pole (your thumb points out of it).

:::callout{kind="info"}
Field lines never cross. Where lines are closer together the field is stronger; where they are further apart it is weaker.
:::

## Force on a current-carrying conductor

A current-carrying wire placed in an external magnetic field experiences a force, because the moving charges that make up the current are themselves deflected by the field. For a straight conductor of length $L$ carrying current $I$ at an angle $\theta$ to a uniform field of flux density $B$:

$$
F = BIL\sin\theta.
$$

The force is greatest ($F = BIL$) when the wire is perpendicular to the field ($\theta = 90^\circ$), and zero when the wire runs parallel to the field ($\theta = 0^\circ$).

The **direction** of the force is given by **Fleming's left-hand rule**: holding the thumb and first two fingers of the left hand mutually perpendicular, the **F**irst finger points along the **F**ield, the se**C**ond finger points along the **C**urrent, and the th**u**Mb gives the direction of the **M**otion (force).

:::callout{kind="key"}
Fleming's left-hand rule (motor effect): First finger = Field, seCond finger = Current, thuMb = Motion (force). It applies to any current-carrying conductor in a magnetic field — this is the principle behind electric motors and loudspeakers.
:::

:::reveal{title="Worked example: force on a current-carrying wire"}
A straight wire of length $0.50\,\text{m}$ carries a current of $3.0\,\text{A}$, held perpendicular to a uniform magnetic field of flux density $0.20\,\text{T}$. Find the force on the wire.

Since the wire is perpendicular to the field, $\theta = 90^\circ$ and $\sin\theta = 1$:

$$
F = BIL\sin\theta = 0.20 \times 3.0 \times 0.50 \times 1 = 0.30\,\text{N}.
$$

The force on the wire is $0.30\,\text{N}$, directed according to Fleming's left-hand rule.
:::

Try changing the numbers yourself in the code below — edit `B`, `I`, `L` and `theta_deg` and press Run to compute the force.

::widget{type="code-runner" language="python" starter="import math\n\nB = 0.20        # tesla\nI = 3.0         # amps\nL = 0.50        # metres\ntheta_deg = 90  # degrees between wire and field\n\nF = B * I * L * math.sin(math.radians(theta_deg))\nprint(f'F = {F:.3f} N')" rows=10}

## Force on a moving charge

The same underlying effect deflects individual moving charges, not just whole currents. A charge $Q$ moving at speed $v$ at angle $\theta$ to a uniform field of flux density $B$ experiences a force

$$
F = BQv\sin\theta.
$$

The direction again follows Fleming's left-hand rule, with the se**C**ond finger now pointing along the direction of (conventional, i.e. positive-charge) motion instead of a wire's current.

Because this magnetic force is always perpendicular to the velocity, it does **no work** on the charge — it changes the charge's direction but never its speed. When a charged particle enters a uniform field at $90^\circ$ to its velocity, the force acts as a **centripetal force**, and the particle moves in a circle. Setting the magnetic force equal to the centripetal force requirement:

$$
BQv = \frac{mv^2}{r} \quad\Longrightarrow\quad r = \frac{mv}{BQ}.
$$

A larger mass or speed gives a larger radius; a stronger field or greater charge gives a tighter circle.

:::reveal{title="Worked example: radius of a charged particle's circular path"}
An electron ($m = 9.11 \times 10^{-31}\,\text{kg}$, $Q = 1.6 \times 10^{-19}\,\text{C}$) travels at $v = 2.0 \times 10^{6}\,\text{m s}^{-1}$ perpendicular to a uniform magnetic field of flux density $B = 5.0 \times 10^{-4}\,\text{T}$. Find the radius of its circular path.

$$
r = \frac{mv}{BQ} = \frac{9.11 \times 10^{-31} \times 2.0 \times 10^{6}}{5.0 \times 10^{-4} \times 1.6 \times 10^{-19}} = \frac{1.822 \times 10^{-24}}{8.0 \times 10^{-23}} \approx 0.0228\,\text{m}.
$$

The electron moves in a circle of radius about $2.3\,\text{cm}$.
:::

:::callout{kind="tip"}
Since $F = BQv\sin\theta$ acts perpendicular to $v$ at every instant, it can never speed up or slow down the particle — only bend its path. This is why circular motion in a magnetic field is a constant-speed (uniform circular) motion.
:::

The next lesson turns this around: instead of a field pushing on moving charges, we look at how a **changing** field pushes charges to create a current of its own — electromagnetic induction.
