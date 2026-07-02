# The kinetic theory of gases

The ideal gas laws describe how pressure, volume and temperature relate to one another, but they don't say *why*. The **kinetic theory of gases** explains gas pressure and temperature in terms of the motion of individual molecules, using nothing more than Newtonian mechanics and statistics.

## Modelling assumptions

To derive the kinetic theory equation, we model a gas as a very large number of identical molecules that:

- move with random speeds in random directions, obeying Newton's laws of motion between collisions;
- have a volume that is negligible compared with the volume of the container;
- experience negligible forces on one another except during collisions;
- undergo collisions (with each other and with the container walls) that are perfectly **elastic** — kinetic energy is conserved overall;
- spend a collision time that is negligible compared with the time between collisions.

Work through the flashcards below until every one is graded "Good" to check you can recall each assumption.

::widget{type="flashcards" src="cards/kinetic-theory-assumptions.json"}

## The kinetic theory equation

Applying Newton's laws to molecules bouncing elastically off the walls of a container of volume $V$, containing $N$ molecules each of mass $m$, gives the **kinetic theory equation**:

$$
pV = \frac{1}{3}Nm\langle c^2 \rangle
$$

Here $\langle c^2 \rangle$ (read "c-squared bar" or "mean square speed") is the average of the squares of the individual molecular speeds — not the square of the average speed, because averaging the signed velocity components would give zero for a random gas. Pressure arises here as the cumulative effect of an enormous number of individual molecular impacts on the container walls each second: more molecules, faster molecules, or greater mass all increase the rate of momentum transfer, and hence the pressure.

:::callout{kind="info"}
$\langle c^2\rangle$ is a mean of *squares* of speed, so $\sqrt{\langle c^2\rangle}$ — the **root-mean-square (rms) speed** — is not the same as the mean speed. For a spread of molecular speeds, the rms speed is always slightly larger than the mean speed.
:::

## Kinetic energy and temperature

Combining the kinetic theory equation $pV = \tfrac13 Nm\langle c^2\rangle$ with the ideal gas equation $pV = NkT$ gives:

$$
\frac13 m\langle c^2\rangle = kT \quad\Longrightarrow\quad \frac12 m\langle c^2\rangle = \frac32 kT
$$

The left-hand side, $\tfrac12 m\langle c^2\rangle$, is the **mean translational kinetic energy of one molecule**. This result is remarkable: the average kinetic energy of a gas molecule depends *only* on the absolute temperature $T$ — not on the pressure, the volume, or even what gas it is. A helium molecule and a nitrogen molecule at the same temperature have the same mean kinetic energy (though very different speeds, since helium is much less massive).

:::reveal{title="Worked example: rms speed of oxygen molecules"}
Estimate the root-mean-square speed of oxygen molecules ($\text{O}_2$, molar mass $M = 0.032\,\text{kg}\,\text{mol}^{-1}$) at $300\,\text{K}$.

First find the mass of one molecule using the Avogadro constant $N_A = 6.02\times10^{23}\,\text{mol}^{-1}$:

$$
m = \frac{M}{N_A} = \frac{0.032}{6.02\times10^{23}} = 5.32\times10^{-26}\,\text{kg}.
$$

Then use $\tfrac12 m\langle c^2\rangle = \tfrac32 kT$ to find $\langle c^2 \rangle$:

$$
\langle c^2\rangle = \frac{3kT}{m} = \frac{3 \times 1.38\times10^{-23} \times 300}{5.32\times10^{-26}} = \frac{1.242\times10^{-20}}{5.32\times10^{-26}} \approx 2.34\times10^{5}\,\text{m}^2\,\text{s}^{-2}.
$$

Taking the square root gives the rms speed:

$$
c_{\text{rms}} = \sqrt{\langle c^2\rangle} \approx \sqrt{2.34\times10^{5}} \approx 483\,\text{m}\,\text{s}^{-1}.
$$

That's over $1700\,\text{km/h}$ — a reminder of just how fast gas molecules move at room temperature, even though the gas as a whole is not moving anywhere.
:::

This microscopic picture ties the whole module together: temperature is a direct measure of the average random kinetic energy of particles, heat capacity and latent heat describe how that energy exchanges with a substance's surroundings, and the gas laws describe the large-scale, statistical consequence of trillions of individual molecular collisions.
