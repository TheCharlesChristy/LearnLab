# Binary, denary and hexadecimal

Inside a computer, every value — a number, a letter, a pixel, a sound sample, even the instructions of a program — is stored as a sequence of **bits**, each either $0$ or $1$. Grouping bits together lets us represent bigger numbers, and choosing how to *write down* those bit patterns for humans is where number bases come in.

## Three bases, one idea

A number base (or *radix*) tells you how many distinct digits are available and what each digit position is worth.

| Base | Name | Digits available | Place values (right to left) |
| --- | --- | --- | --- |
| 2 | Binary | 0, 1 | 1, 2, 4, 8, 16, 32, 64, 128, … |
| 10 | Denary (decimal) | 0–9 | 1, 10, 100, 1000, … |
| 16 | Hexadecimal | 0–9, A–F | 1, 16, 256, 4096, … |

In every base, a digit's contribution is *digit value* $\times$ *base*$^{\text{position}}$, counting positions from $0$ on the right.

## Binary to denary

To convert binary to denary, add up the place values where the bit is $1$. Take the 8-bit binary number $01011010$:

| Bit | 0 | 1 | 0 | 1 | 1 | 0 | 1 | 0 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Place value | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

Only the bits that are $1$ count: $64 + 16 + 8 + 2 = 90$.

:::callout{kind="key"}
An $n$-bit unsigned binary number can represent $2^n$ distinct values, from $0$ to $2^n - 1$. An 8-bit byte therefore represents $2^8 = 256$ values, $0$ to $255$.
:::

## Denary to binary

To go the other way, repeatedly find the largest place value that still fits, subtract it, and repeat — or equivalently, use repeated division by 2 and read the remainders bottom-to-top. Converting $200$ to 8-bit binary:

$200 - 128 = 72 \to 72 - 64 = 8 \to 8 - 8 = 0$. The bits $128, 64$ and $8$ are set, giving $11001000$.

## Hexadecimal: binary in disguise

Hexadecimal exists purely for human convenience: because $16 = 2^4$, **each hex digit represents exactly 4 bits** (a *nibble*), so any binary string can be converted to hex just by grouping bits in fours from the right and converting each group independently — no arithmetic on the whole number required.

$$
01011010 = \underbrace{0101}_{5} \; \underbrace{1010}_{A} = \texttt{5A}_{16}
$$

:::callout{kind="tip"}
This grouping trick is exactly why hex is used everywhere in computing (memory addresses, colour codes, MAC addresses): a long, error-prone binary string becomes a short, easy-to-read hex string, and the conversion between them is mechanical rather than mathematical.
:::

To convert hex to denary, multiply each digit by its place value ($16^0, 16^1, \dots$) and add. For $\texttt{2F}_{16}$: $2 \times 16 + 15 \times 1 = 32 + 15 = 47$ (recall $\texttt{F} = 15$).

## Converting in code

The built-in Python functions `bin()`, `hex()` and `int(x, base)` do exactly this conversion work. Run the playground below, then change `n` to any denary number and watch its binary and hex forms update.

::widget{type="code-runner" language="python" starter="n = 90\nprint('denary :', n)\nprint('binary :', format(n, '08b'))\nprint('hex    :', format(n, 'X'))\nprint()\nprint('hex 2F to denary:', int('2F', 16))" rows=10}

:::reveal{title="Worked example: convert 90 to hexadecimal, showing every step"}
Convert the denary number $90$ to hexadecimal.

1. Divide by 16: $90 \div 16 = 5$ remainder $10$.
2. The remainder $10$ is the least-significant hex digit: $10 = \texttt{A}$.
3. The quotient $5$ is less than 16, so it is the next digit as-is: $\texttt{5}$.
4. Reading the digits from most to least significant: $\texttt{5A}$.

Check by converting back: $5 \times 16 + 10 \times 1 = 80 + 10 = 90$. ✓ Also cross-check via binary: $90 = 01011010$, and splitting into nibbles $0101\,1010$ gives $\texttt{5}\,\texttt{A}$ — the same answer both ways.
:::

## Practice

Try converting a few values yourself in the playground above before moving on: what is $200$ in hexadecimal? (Check: it should come out as $\texttt{C8}$, since $12 \times 16 + 8 = 200$.)
