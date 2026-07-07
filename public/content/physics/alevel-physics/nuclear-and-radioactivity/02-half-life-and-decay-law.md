# Activity, half-life and the decay law

We saw that any individual nucleus decays at a random, unpredictable moment. But every nucleus of a given isotope shares the same constant *probability per unit time* of decaying. That single number drives everything in this lesson.

## The decay constant and activity

The **decay constant** $\lambda$ is the probability that any one nucleus decays in a given unit of time (units: $\text{s}^{-1}$, or another time unit). A large $\lambda$ means a highly unstable isotope that decays quickly; a small $\lambda$ means a long-lived isotope.

If a sample contains $N$ undecayed nuclei at some instant, the number of decays happening per unit time — the **activity** $A$, measured in becquerels (Bq, decays per second) — is

$$
A = \lambda N.
$$

:::callout{kind="key"}
Activity is proportional to the number of undecayed nuclei present: as $N$ falls, so does $A$, in direct proportion. Doubling $N$ doubles the activity; halving $N$ halves it.
:::

:::reveal{title="Worked example: activity from N and λ"}
**Question.** A sample contains $N = 6.0 \times 10^{10}$ undecayed nuclei of an isotope with decay constant $\lambda = 3.2 \times 10^{-5}\,\text{s}^{-1}$. Find the activity of the sample.

$$
A = \lambda N = (3.2\times10^{-5}) \times (6.0\times10^{10}) = 1.92\times10^{6}\ \text{Bq}.
$$
:::

## The exponential decay law

Because the activity (rate of decay) is proportional to $N$, the rate at which $N$ itself falls is also proportional to $N$:

$$
\frac{\mathrm{d}N}{\mathrm{d}t} = -\lambda N.
$$

The minus sign shows $N$ is decreasing. Solving this differential equation (it says "the rate of decrease of $N$ is proportional to $N$", exactly like continuous exponential decay) gives

$$
N = N_0 e^{-\lambda t},
$$

where $N_0$ is the number of undecayed nuclei at $t=0$. Since activity and mass of undecayed material are both directly proportional to $N$, the *same* exponential shape applies to them too:

$$
A = A_0 e^{-\lambda t}, \qquad m = m_0 e^{-\lambda t}.
$$

::widget{type="data-plot" src="data/exponential-decay-curve.json"}

The curve above plots $N = 1000\,e^{-\lambda t}$ for a sample with half-life $4\,\text{s}$ (so $\lambda = \ln 2 / 4 \approx 0.173\,\text{s}^{-1}$). Notice that $N$ falls by the same *factor* — one half — every $4$ seconds, regardless of how large $N$ was at the start of that interval. That constant-factor-per-fixed-time behaviour is the defining signature of exponential decay.

## Half-life

The **half-life** $T_{\frac12}$ is the time taken for the number of undecayed nuclei (or the activity, or the undecayed mass) to fall to half its initial value. Setting $N = \tfrac12 N_0$ in the decay law:

$$
\tfrac12 N_0 = N_0 e^{-\lambda T_{1/2}} \quad\Longrightarrow\quad \tfrac12 = e^{-\lambda T_{1/2}} \quad\Longrightarrow\quad \ln 2 = \lambda T_{1/2},
$$

so

$$
T_{\frac12} = \frac{\ln 2}{\lambda}.
$$

Half-life and decay constant carry the same information — a short half-life means a large decay constant, and vice versa. Half-life is often more convenient because after $n$ half-lives, exactly $\left(\tfrac12\right)^n$ of the original sample remains, with no exponential needed at all.

:::reveal{title="Worked example: half-life and remaining nuclei"}
**Question.** Iodine-131 has a half-life of $8.0$ days.

**(a)** Find its decay constant, in $\text{s}^{-1}$.

$$
\lambda = \frac{\ln 2}{T_{1/2}} = \frac{\ln 2}{8.0 \times 86400\ \text{s}} = \frac{0.6931}{691200} = 1.00\times10^{-6}\ \text{s}^{-1}.
$$

**(b)** A sample starts with $N_0 = 8.0\times10^{10}$ nuclei. How many remain after $24$ days?

$24$ days is exactly $24/8.0 = 3$ half-lives, so

$$
N = N_0 \left(\tfrac12\right)^{3} = \frac{8.0\times10^{10}}{8} = 1.0\times10^{10}\ \text{nuclei}.
$$

(Using the exponential form directly gives the same answer: $N = N_0 e^{-\lambda t}$ with $t = 24 \times 86400\,\text{s}$ and the $\lambda$ from part (a).)
:::

Use the code cell below to check a similar calculation numerically — it works through a sample with a $6.0$-hour half-life over $18.0$ hours (exactly 3 half-lives):

::widget{type="code-runner" language="python" starter="import math\n\nN0 = 2.0e11       # initial number of nuclei\nhalf_life = 6.0    # hours\nt = 18.0           # hours elapsed\n\nlam = math.log(2) / half_life      # decay constant, per hour\nN_t = N0 * math.exp(-lam * t)       # nuclei remaining after time t\n\nprint(f'decay constant = {lam:.5f} per hour')\nprint(f'nuclei remaining after {t} h = {N_t:.4e}')" solutionTest="assert abs(N_t - 2.5e10) < 1e8" rows=12}

:::callout{kind="warning"}
Keep your units consistent. If $\lambda$ is worked out in $\text{s}^{-1}$, time $t$ must be in seconds; if $\lambda$ is in $\text{day}^{-1}$, $t$ must be in days. Converting a half-life given in days into seconds (multiply by $86400$) is a common source of careless errors — check the code cell above if you are unsure.
:::

Half-life is central to applications from carbon dating (carbon-14, $T_{1/2} = 5730$ years) to medical tracers (chosen with a half-life long enough to be useful but short enough to minimise a patient's radiation dose) to nuclear waste management. Next, we look at *why* nuclei are unstable in the first place, and where the energy released in decay, fission and fusion actually comes from.
