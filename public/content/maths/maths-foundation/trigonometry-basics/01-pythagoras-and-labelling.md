# Pythagoras' theorem and labelling triangle sides

Trigonometry starts with **right-angled triangles**: triangles with one $90^\circ$ angle. Before you can use any trig ratio, you need to be able to name the three sides correctly — and Pythagoras' theorem gives you a tool for finding a missing side whenever no angle is involved at all.

## Naming the sides

Every right-angled triangle has a side called the **hypotenuse**: it is always the longest side, and it is always the one opposite the right angle. The hypotenuse never changes, no matter which other angle you look at.

The other two sides, however, are named **relative to a chosen angle** $\theta$ (theta) — usually one of the two non-right angles, marked on the diagram:

- The **opposite** side is the side across from $\theta$ (it does not touch $\theta$).
- The **adjacent** side is the side next to $\theta$ that is *not* the hypotenuse (it touches $\theta$, but isn't the longest side).

:::callout{kind="key"}
Hypotenuse = always the longest side, opposite the right angle — fixed for the whole triangle.
Opposite and adjacent = defined **relative to the angle you're working with** — if you look from the *other* non-right angle instead, "opposite" and "adjacent" swap over!
:::

:::callout{kind="tip"}
A quick way to check: the hypotenuse is opposite the $90^\circ$ symbol. Of the two remaining sides, the one touching your chosen angle $\theta$ (other than the hypotenuse) is adjacent; the one that doesn't touch $\theta$ at all is opposite.
:::

## Pythagoras' theorem

If a right-angled triangle has legs (the two shorter sides) of length $a$ and $b$, and hypotenuse of length $c$, then

$$
a^2 + b^2 = c^2.
$$

Notice this theorem uses **no angle at all** — it only relates the three side lengths. That makes it the right tool whenever a right-angled triangle problem gives you two sides and asks for the third, with no angle involved.

- To find the **hypotenuse** (the longest side) from the two shorter sides: $c = \sqrt{a^2 + b^2}$.
- To find a **shorter side** from the hypotenuse and the other shorter side: $a = \sqrt{c^2 - b^2}$ (rearranging, and subtracting the *known* leg's square from the hypotenuse's square, never the other way round).

:::reveal{title="Worked example: finding the hypotenuse"}
A right-angled triangle has two shorter sides of length $6\,\text{cm}$ and $8\,\text{cm}$. Find the hypotenuse.

$$
c^2 = a^2 + b^2 = 6^2 + 8^2 = 36 + 64 = 100
$$

$$
c = \sqrt{100} = 10\,\text{cm}
$$

The hypotenuse is exactly $10\,\text{cm}$.
:::

:::reveal{title="Worked example: finding a shorter side"}
A right-angled triangle has hypotenuse $13\,\text{cm}$ and one shorter side $5\,\text{cm}$. Find the other shorter side.

Rearrange Pythagoras' theorem to make the unknown leg the subject:

$$
a^2 = c^2 - b^2 = 13^2 - 5^2 = 169 - 25 = 144
$$

$$
a = \sqrt{144} = 12\,\text{cm}
$$

The missing side is $12\,\text{cm}$. (Notice $5, 12, 13$ is a whole-number "Pythagorean triple" — these turn up often and are worth recognising.)
:::

## Practise naming the sides

The flashcards below drill the three definitions until they're automatic — you'll need them fluently for the next two lessons, where SOHCAHTOA puts these names to work.

::widget{type="flashcards" src="cards/side-names.json"}

Once you can label a triangle's hypotenuse, opposite and adjacent sides without hesitating, and you know when Pythagoras' theorem applies (two sides known, no angle involved), you're ready for SOHCAHTOA — the set of ratios that bring angles into the picture.
