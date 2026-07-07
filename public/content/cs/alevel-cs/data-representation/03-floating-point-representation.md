# Fixed-point and floating-point representation

Binary and two's complement handle whole numbers, but most real quantities — temperatures, prices, physics constants — need a fractional part. Computers store these **real numbers** in one of two ways: fixed-point or floating-point.

## Fixed-point

A fixed-point representation simply extends place-value binary past the "binary point": bits to the left are whole-number place values ($1, 2, 4, \dots$), bits to the right are fractional place values ($\tfrac12, \tfrac14, \tfrac18, \dots$), and the point's position is agreed in advance and never moves.

For an 8-bit fixed-point format with 4 integer bits and 4 fractional bits, $0110.1010$ means:

$$
\underbrace{0110}_{=\,6}._{\ }\underbrace{1010}_{0.5 + 0.125 = 0.625} = 6.625
$$

:::callout{kind="key"}
Fixed-point is simple and fast (ordinary integer hardware can add and subtract it directly), but its **range** and **precision** are both fixed by where the point sits: more fractional bits means finer precision but a smaller maximum whole-number value, and vice versa. It cannot efficiently represent both a very large and a very small number in the same format.
:::

## Floating-point

Floating-point instead stores a number as **sign × mantissa × 2$^{\text{exponent}}$**, similar to scientific notation ($6.02 \times 10^{23}$) but in base 2. Letting the exponent vary lets the same number of bits cover an enormous range of magnitudes, at the cost of some precision in the mantissa.

A simplified normalised floating-point format (in the spirit of real formats like IEEE 754, but small enough to work by hand) splits its bits into three fields:

| Field | Purpose |
| --- | --- |
| Sign (1 bit) | $0$ = positive, $1$ = negative |
| Mantissa (fixed number of bits) | The normalised binary fraction $0.xxxx\ldots$ |
| Exponent (fixed number of bits, two's complement) | The power of 2 to multiply by |

**Normalised** means the mantissa is scaled so its first bit after the point is always $1$ — this wastes no bits on leading zeros and guarantees every value has one unambiguous representation.

## Worked conversion

Use a format with 1 sign bit, a 4-bit mantissa (representing $0.bbbb$), and a 3-bit two's complement exponent. Represent $5.5$:

1. Write $5.5$ in binary: $101.1$.
2. Normalise by shifting the point left until the form is $0.1\ldots \times 2^{\text{exp}}$: $101.1 = 0.1011 \times 2^3$ (the point moved 3 places left).
3. Mantissa bits: $1011$. Exponent: $3$, which in 3-bit two's complement is $011$. Sign: $0$ (positive).
4. Full pattern: $0\ 1011\ 011$.

Check by decoding: mantissa $0.1011 = 0.5+0.125+0.0625 = 0.6875$; exponent $011 = 3$; value $= 0.6875 \times 2^3 = 5.5$. ✓

:::callout{kind="tip"}
To decode a floating-point pattern, always work in the same order: read the sign, convert the mantissa bits to a fraction $0.bbbb$, convert the exponent bits (remembering two's complement can make it negative), then multiply.
:::

## A negative exponent

A negative exponent shifts the point the other way, letting the format represent numbers smaller than 1. Represent $0.375$:

1. $0.375$ in binary is $0.011$.
2. Normalise: shift the point right one place to get a leading $1$: $0.011 = 0.110 \times 2^{-1}$.
3. Mantissa: $1100$ (padding with a trailing $0$ to fill 4 bits). Exponent: $-1$, which in 3-bit two's complement is $111$. Sign: $0$.
4. Full pattern: $0\ 1100\ 111$.

Check: mantissa $0.1100 = 0.75$; exponent $111$ decodes (two's complement, 3 bits) to $-4 + 3 = -1$; value $= 0.75 \times 2^{-1} = 0.375$. ✓

::widget{type="code-runner" language="python" starter="def decode_float(sign_bit, mantissa_bits, exponent_bits):\n    mantissa = int(mantissa_bits, 2) / (2 ** len(mantissa_bits))\n    exp = int(exponent_bits, 2)\n    if exponent_bits[0] == '1':\n        exp -= 2 ** len(exponent_bits)\n    value = mantissa * (2 ** exp)\n    return -value if sign_bit == '1' else value\n\nprint(decode_float('0', '1011', '011'))  # expect 5.5\nprint(decode_float('0', '1100', '111'))  # expect 0.375" rows=10}

:::reveal{title="Worked example: why floating-point trades precision for range"}
Two numbers, $5.5$ and $0.375$, use the *same* 4-bit mantissa length above but represent very different magnitudes — because the exponent does the heavy lifting of scaling, while the mantissa only ever supplies about 4 bits of precision (roughly 1 part in 16) no matter how big or small the exponent makes the final value. This is why floating-point numbers lose relative precision as they grow very large or very small — a limitation A-level specifications describe simply as **floating-point has a trade-off between range and precision**, unlike fixed-point where both are fixed together.
:::
