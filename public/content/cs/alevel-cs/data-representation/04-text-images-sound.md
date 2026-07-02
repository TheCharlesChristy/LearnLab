# Representing text, images and sound

Numbers are easy to see as binary, but computers store *everything* as bits — including letters, pictures and audio. Each of these media is represented by agreeing, in advance, on a mapping between bit patterns and the real-world thing they stand for.

## Character encoding

A **character set** (or character encoding) assigns every character a unique binary code, so text is really just a sequence of numbers in disguise.

**ASCII** (American Standard Code for Information Interchange) is the classic 7-bit code: $2^7 = 128$ possible codes, enough for the English alphabet (upper and lower case), digits, punctuation and basic control codes. For example:

| Character | Denary code | Binary (7-bit) |
| --- | --- | --- |
| `A` | 65 | 1000001 |
| `a` | 97 | 1100001 |
| `0` | 48 | 0110000 |

**Extended ASCII** uses the full 8 bits of a byte ($2^8 = 256$ codes) instead of just 7, using the extra 128 codes for accented letters, box-drawing characters, and other symbols beyond plain English.

:::callout{kind="key"}
The number of bits per character directly limits how many distinct characters can be represented: $n$ bits gives $2^n$ possible codes. This is exactly the same $2^n$ counting rule as for pure numbers (§ previous lessons) — a character code is a number, just interpreted as a symbol rather than a quantity.
:::

**Unicode** solves the problem that 256 codes cannot cover every writing system on Earth (Chinese, Arabic, emoji, and more — well over 100,000 characters need codes). Unicode assigns every character a unique **code point**, and **UTF-8** is the most common way to store those code points as bytes: it uses **1 byte for the original ASCII characters** (so ASCII text is unchanged in UTF-8) and **up to 4 bytes** for less common characters. This variable-length design is precisely why more characters need more bits: a fixed 1-byte scheme physically cannot address more than 256 distinct symbols, so covering the world's scripts requires letting some characters spend more bytes than others.

## Representing images

A digital image is a grid of **pixels** (picture elements), each pixel storing a colour as a binary number.

- **Resolution** is the grid size, e.g. $1920 \times 1080$ pixels — more pixels means a sharper image but more data to store.
- **Colour depth** is the number of bits used per pixel to store its colour. More bits allow more distinct colours: $n$ bits per pixel gives $2^n$ possible colours. A common "true colour" depth is 24 bits (8 bits each for red, green and blue), giving $2^{24} = 16{,}777{,}216$ colours.

The **uncompressed file size** of a bitmap image is simply:

$$
\text{size (bits)} = \text{width} \times \text{height} \times \text{colour depth}
$$

For a $200 \times 100$ pixel image at 8 bits per pixel (256 colours, no compression):

$$
200 \times 100 \times 8 = 160{,}000 \text{ bits} = 20{,}000 \text{ bytes} \approx 19.53\text{ KB}
$$

:::callout{kind="tip"}
Higher resolution and higher colour depth both increase file size — and they multiply together, so doubling both roughly quadruples the storage needed. This is exactly why real image formats use compression, but the uncompressed calculation above is what A-level questions expect you to be able to do by hand.
:::

## Representing sound

Sound is a continuous (analogue) wave, but a computer can only store discrete numbers, so it **samples** the wave's amplitude at regular intervals — this is the basis of digital audio.

- **Sample rate** is how many samples are taken per second, measured in Hz. CD-quality audio samples at $44{,}100$ Hz.
- **Bit depth** is how many bits are used to store each sample's amplitude — more bits give finer gradations of loudness, just as more colour bits give finer gradations of colour.

The uncompressed file size (for one channel, i.e. mono) is:

$$
\text{size (bits)} = \text{sample rate} \times \text{bit depth} \times \text{duration (seconds)}
$$

For a 10-second mono clip at 44,100 Hz and 16-bit depth:

$$
44{,}100 \times 16 \times 10 = 7{,}056{,}000 \text{ bits} = 882{,}000 \text{ bytes} \approx 861.33\text{ KB}
$$

A stereo (2-channel) recording simply doubles this, since each channel is sampled and stored independently.

## Putting it together in code

::widget{type="code-runner" language="python" starter="# Character codes\nprint('A ->', ord('A'), format(ord('A'), '08b'))\nprint('a ->', ord('a'), format(ord('a'), '08b'))\n\n# Uncompressed image size (bits, bytes, KB)\nwidth, height, depth = 200, 100, 8\nsize_bits = width * height * depth\nprint('image bytes:', size_bits // 8)\n\n# Uncompressed mono sound size\nsample_rate, bit_depth, seconds = 44100, 16, 10\nsound_bits = sample_rate * bit_depth * seconds\nprint('sound bytes:', sound_bits // 8)" rows=10}

:::reveal{title="Worked example: how many bits does a low-resolution icon need?"}
An icon is $8 \times 8$ pixels, stored in monochrome (1 bit per pixel: black or white). How many bytes does it need, uncompressed?

1. Total bits: $8 \times 8 \times 1 = 64$ bits.
2. Convert to bytes: $64 \div 8 = 8$ bytes.

Just 8 bytes for the whole icon — tiny, because both the resolution and the colour depth (1 bit = 2 colours) are minimal. Compare this to the $20{,}000$-byte example above: a larger canvas and 8 bits per pixel (256 colours) costs $2{,}500\times$ more storage.
:::

## Practice

The end-of-module assessment brings together everything from all four lessons — base conversion, binary arithmetic, two's complement, floating-point, and encoding of text, images and sound.
