# SI units, prefixes and significant figures

Every physical quantity in this course is measured. Before we can measure anything sensibly we need a common language for the units we quote numbers in, and a way of being honest about how precisely we know them. This lesson sets up that language; the next two lessons build on it to say exactly how uncertain a measurement or a calculated result is.

## The seven SI base units

The International System of Units (SI) defines seven **base units**, chosen so that every other unit in physics can be built from them.

| Quantity            | Base unit | Symbol |
| ------------------- | --------- | ------ |
| Mass                | kilogram  | kg     |
| Length              | metre     | m      |
| Time                | second    | s      |
| Electric current    | ampere    | A      |
| Temperature         | kelvin    | K      |
| Amount of substance | mole      | mol    |
| Luminous intensity  | candela   | cd     |

At A-level you will mostly work with kg, m, s, A and K. Every other unit you meet — newtons, joules, volts, ohms — is a **derived unit**: a combination of base units that follows directly from the defining equation of the quantity.

:::callout{kind="key"}
To find the base units of a derived quantity, take the defining equation and substitute base units for every quantity on the right-hand side.
:::

## Building derived units

Take force. Newton's second law defines it as $F = ma$, so

$$
[F] = \mathrm{kg} \times \mathrm{m\,s^{-2}} = \mathrm{kg\,m\,s^{-2}}.
$$

We give this combination its own name, the **newton** (N), purely for convenience: $1\ \mathrm{N} = 1\ \mathrm{kg\,m\,s^{-2}}$. The same trick applies throughout physics:

| Derived unit | Symbol | Defining relation | In base units                  |
| ------------ | ------ | ------------------ | ------------------------------- |
| Newton       | N      | $F = ma$            | $\mathrm{kg\,m\,s^{-2}}$         |
| Joule        | J      | $E = Fs$            | $\mathrm{kg\,m^2\,s^{-2}}$       |
| Watt         | W      | $P = E/t$           | $\mathrm{kg\,m^2\,s^{-3}}$       |
| Pascal       | Pa     | $p = F/A$           | $\mathrm{kg\,m^{-1}\,s^{-2}}$    |
| Coulomb      | C      | $Q = It$            | $\mathrm{A\,s}$                  |
| Volt         | V      | $V = E/Q$           | $\mathrm{kg\,m^2\,s^{-3}\,A^{-1}}$|
| Ohm          | Ω      | $R = V/I$           | $\mathrm{kg\,m^2\,s^{-3}\,A^{-2}}$|
| Hertz        | Hz     | $f = 1/T$           | $\mathrm{s^{-1}}$                |

:::reveal{title="Worked example: deriving the base units of the pascal"}
Pressure is defined as $p = F/A$, force divided by area. Substitute the base units of force ($\mathrm{kg\,m\,s^{-2}}$, from the table above) and of area ($\mathrm{m^2}$):

$$
[p] = \frac{\mathrm{kg\,m\,s^{-2}}}{\mathrm{m^2}} = \mathrm{kg\,m^{-1}\,s^{-2}}.
$$

So $1\ \mathrm{Pa} = 1\ \mathrm{kg\,m^{-1}\,s^{-2}}$. Checking that both sides of an equation have the same base units — **homogeneity of units** — is a fast way to catch an algebra mistake before you have even put numbers in.
:::

## Prefixes

Rather than writing very large or very small numbers in full, SI uses standard prefixes that multiply the base or derived unit by a power of ten.

| Prefix | Symbol | Factor      |
| ------ | ------ | ----------- |
| femto  | f      | $10^{-15}$  |
| pico   | p      | $10^{-12}$  |
| nano   | n      | $10^{-9}$   |
| micro  | µ      | $10^{-6}$   |
| milli  | m      | $10^{-3}$   |
| centi  | c      | $10^{-2}$   |
| kilo   | k      | $10^{3}$    |
| mega   | M      | $10^{6}$    |
| giga   | G      | $10^{9}$    |
| tera   | T      | $10^{12}$   |

So $3.2\ \mathrm{mA} = 3.2 \times 10^{-3}\,\mathrm{A}$, and $250\ \mathrm{GHz} = 250 \times 10^{9}\,\mathrm{Hz}$. Always convert a prefixed quantity to base units before substituting it into an equation — mixing mm and m in the same calculation is one of the most common sources of a "factor of a thousand" error.

## Significant figures and orders of magnitude

A measurement's **significant figures** communicate how precisely it is known. The rules:

- All non-zero digits are significant.
- Zeros between non-zero digits are significant ($1005$ has 4 s.f.).
- Leading zeros are never significant ($0.0042$ has 2 s.f.).
- Trailing zeros are only significant if there is a decimal point ($4.20$ has 3 s.f.; $420$ is ambiguous — write $4.2 \times 10^2$ to make it unambiguous).

:::callout{kind="tip"}
A calculated answer should normally be quoted to the same number of significant figures as the **least precise** measurement that went into it — quoting more implies a precision you did not actually achieve.
:::

An **order of magnitude** is the power of ten nearest to a quantity, useful for sanity-checking a result. The mass of an electron is about $9 \times 10^{-31}\,\mathrm{kg}$ — order of magnitude $10^{-30}\,\mathrm{kg}$; the radius of the Earth is about $6.4\times10^6\,\mathrm{m}$ — order of magnitude $10^{6}\,\mathrm{m}$ (technically $10^7$ by the strict "round to nearest power of ten" rule, since $6.4 > \sqrt{10} \approx 3.16$; in practice either the leading digit or the strict rounded power is accepted, so long as you are consistent).

Try editing the numbers below and re-running to see the rounding rule in action:

::widget{type="code-runner" language="python" starter='import math; value = 0.0034567; sig_figs = 3; power = sig_figs - 1 - math.floor(math.log10(abs(value))); rounded = round(value * 10**power) / 10**power; print(f"{value} rounded to {sig_figs} s.f. = {rounded}")' rows=8}

:::reveal{title="Worked example: rounding to significant figures"}
Round $0.070482$ to 2 significant figures.

The first significant figure is the $7$ (leading zeros do not count). The second significant figure is the $0$ immediately after it. Looking at the next digit ($4$) to decide whether to round up: since $4 < 5$, we round down, keeping the digits as they are.

$$
0.070482 \approx 0.070 \ \text{(2 s.f.)}
$$

Note the trailing zero **is** kept here, because it is a significant figure we are reporting, not a leading placeholder zero.
:::

The next lesson looks at *why* no measurement is ever perfectly exact, and how physicists quantify that imperfection as an uncertainty.
