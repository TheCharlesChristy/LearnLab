# Binary arithmetic and two's complement

Computers add binary numbers the same way you add denary numbers by hand — column by column, from the right, carrying into the next column when a column overflows. The only difference is that a binary column overflows as soon as it reaches $2$, not $10$.

## Binary addition

The rules for adding a single column of two bits, plus any carry-in, are:

| $A$ | $B$ | Carry in | Sum | Carry out |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 1 | 0 |
| 1 | 0 | 0 | 1 | 0 |
| 1 | 1 | 0 | 0 | 1 |
| 1 | 1 | 1 | 1 | 1 |

Add $01011010$ ($90$) and $00100101$ ($37$), column by column from the right (no carries are generated in this particular sum):

```text
  01011010   (90)
+ 00100101   (37)
-----------
  01111111   (127)
```

Check against denary: $90 + 37 = 127$. ✓ And $01111111$ does indeed equal $127$ ($64+32+16+8+4+2+1$).

## Overflow

A register only has a fixed number of bits, so if a true sum needs *more* bits than the register holds, the extra carry is lost — this is **overflow**. An 8-bit register can only hold values $0$–$255$; adding $200 + 100 = 300$ overflows it:

```text
  11001000   (200)
+ 01100100   (100)
-----------
1 00101100   (300, but the leading 1 doesn't fit in 8 bits)
```

The 8-bit register keeps only the lower 8 bits, $00101100$, which is $44$ — **not** $300$. The discarded carry bit is exactly $256$, and indeed $300 - 256 = 44$. Real processors flag this with a carry/overflow flag so software can detect that the true result didn't fit.

:::callout{kind="warning"}
Overflow is a genuine hazard, not just a textbook curiosity: if a fixed-width counter overflows unexpectedly, a program can silently produce a wildly wrong (and much smaller) number instead of crashing.
:::

## Representing negative numbers: two's complement

So far every number has been unsigned (zero or positive). To represent **negative** numbers in a fixed number of bits, computers use **two's complement**. For an $n$-bit two's complement number, the *most significant bit* is given a **negative** place value $-2^{n-1}$, while every other bit keeps its usual positive place value.

For 8 bits, the place values become:

$$
-128,\ 64,\ 32,\ 16,\ 8,\ 4,\ 2,\ 1
$$

:::callout{kind="key"}
An $n$-bit two's complement register represents the range $-2^{n-1}$ to $2^{n-1}-1$. For 8 bits, that's $-128$ to $127$ — the same $256$ patterns as unsigned, just shared differently between negative and positive values.
:::

## Finding the two's complement of a number

To negate an $n$-bit binary number (flip its sign), use the standard **invert-and-add-one** method:

1. Write the number in $n$-bit binary.
2. Invert every bit (change $0\to1$ and $1\to0$).
3. Add $1$ to the result.

To find the 8-bit two's complement representation of $-37$:

1. $37$ in 8-bit binary is $00100101$.
2. Invert every bit: $11011010$.
3. Add $1$: $11011010 + 1 = 11011011$.

So $-37$ is stored as $11011011$. Check it: the most-significant bit contributes $-128$; the remaining bits $1011011$ are worth $64+16+8+2+1=91$; total $-128+91=-37$. ✓

## Adding a negative number (subtraction for free)

The huge benefit of two's complement is that **addition hardware needs no separate subtraction circuit**: $A - B$ is computed as $A + (\text{two's complement of } B)$, and any carry out of the top bit is simply discarded.

Compute $50 - 37$ as $50 + (-37)$, in 8-bit two's complement:

```text
  00110010   (50)
+ 11011011   (-37, from above)
-----------
1 00001101   (discard the carry out of bit 7)
```

Keeping only 8 bits gives $00001101 = 8+4+1 = 13$ — exactly $50 - 37$. ✓ The carry discarded here is normal and expected (it is *not* the same thing as overflow, which only occurs when adding two numbers of the **same** sign produces a result of the wrong sign).

## Try it in code

::widget{type="code-runner" language="python" starter="def twos_complement(n, bits=8):\n    if n < 0:\n        n = (1 << bits) + n\n    return format(n, f'0{bits}b')\n\nprint('-37 as 8-bit twos complement:', twos_complement(-37))\nprint('50 + (-37) mod 256:', (50 + (256 - 37)) % 256, '->', format((50 + (256 - 37)) % 256, '08b'))" rows=10}

:::reveal{title="Worked example: decode a two's complement byte"}
What denary value does the 8-bit two's complement pattern $11110011$ represent?

1. The most significant bit is $1$, so this is a negative number, contributing $-128$.
2. The remaining 7 bits are $1110011$, worth $64+32+16+0+0+2+1 = 115$.
3. Total: $-128 + 115 = -13$.

Check by finding the two's complement of $13$ instead: $13 = 00001101$, invert $\to 11110010$, add 1 $\to 11110011$ — the same pattern. ✓
:::

## Practice

Use the playground above to check your own two's complement conversions before the end-of-module assessment.
