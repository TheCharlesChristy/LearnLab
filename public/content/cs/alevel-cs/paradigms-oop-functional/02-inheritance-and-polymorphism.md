# Inheritance and polymorphism

## Inheritance

**Inheritance** lets a new class (the **subclass**, or "child class") reuse the attributes and methods of an existing class (the **superclass**, or "parent class") without copying its code. The subclass can add new attributes/methods, and it can **override** an inherited method by defining a method with the same name — its version replaces the superclass's for objects of that subclass.

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return f"{self.name} makes a sound."

class Cat(Animal):          # Cat inherits from Animal
    def speak(self):        # overrides Animal's speak
        return f"{self.name} says Meow!"

class Fish(Animal):
    pass                    # no override — uses Animal's speak unchanged
```

`Cat(Animal)` means "`Cat` is a subclass of `Animal`". `Cat` automatically gets `Animal`'s `__init__`, so `Cat("Tom")` works even though `Cat` never wrote its own `__init__` — this is **code reuse**, the main benefit of inheritance. `Cat` then **overrides** `speak` with its own version. `Fish` inherits `speak` unchanged, since it defines no override.

A subclass can also extend (rather than fully replace) a superclass method using `super()`, which calls the superclass's version of the method from inside the override:

```python
class Cat(Animal):
    def __init__(self, name, indoor=True):
        super().__init__(name)      # calls Animal.__init__, sets self.name
        self.indoor = indoor

    def speak(self):
        return f"{self.name} says Meow!"
```

Here `Cat` adds a new attribute, `indoor`, that plain `Animal` objects don't have, while still reusing `Animal.__init__` to set `name` instead of repeating that line.

## Polymorphism

**Polymorphism** ("many forms") means that objects of different classes can respond to the *same* method call in their own way. If several classes all implement a method with the same name (typically by inheriting from a common superclass and overriding it), you can call that method on any of them through a single, uniform interface — the correct version runs automatically for each object's actual class.

```python
animals = [Animal("Generic"), Cat("Tom"), Fish("Nemo")]

for a in animals:
    print(a.speak())
```

The loop calls `a.speak()` identically for every element, but the *output* differs because Python looks up `speak` on each object's **actual** class at the moment of the call, not on whatever type the variable `a` "looks like" it holds. This is polymorphism: one call site, many behaviours, chosen by the run-time type of the object.

::widget{type="code-runner" language="python" starter="class Animal:\n    def __init__(self, name):\n        self.name = name\n\n    def speak(self):\n        return f'{self.name} makes a sound.'\n\nclass Cat(Animal):\n    def speak(self):\n        return f'{self.name} says Meow!'\n\nclass Dog(Animal):\n    def speak(self):\n        return f'{self.name} says Woof!'\n\nclass Fish(Animal):\n    pass\n\nanimals = [Animal('Generic'), Cat('Tom'), Dog('Rex'), Fish('Nemo')]\nfor a in animals:\n    print(a.speak())" rows=18}

Try adding a new subclass, e.g. `class Parrot(Animal)` overriding `speak` to return `"{self.name} says Hello!"`, add a `Parrot` object to the list, and re-run — no other code needs to change for the loop to handle it correctly. That is the practical payoff of polymorphism: code written against the superclass's interface keeps working when new subclasses are added.

:::callout{kind="tip"}
A useful way to tell inheritance and polymorphism apart: **inheritance** is the *relationship* ("`Cat` is a kind of `Animal`" and reuses its code); **polymorphism** is the *behaviour* that relationship enables (the same method call produces different results depending on the object's actual class).
:::

:::reveal{title="Worked example: tracing which speak() runs"}
Trace the output of:

```python
class Animal:
    def __init__(self, name):
        self.name = name
    def speak(self):
        return f"{self.name} makes a sound."

class Cat(Animal):
    def speak(self):
        return f"{self.name} says Meow!"

class Fish(Animal):
    pass

animals = [Animal("Generic"), Cat("Tom"), Fish("Nemo")]
for a in animals:
    print(a.speak())
```

1. `animals` is a list of three objects: an `Animal`, a `Cat`, and a `Fish`. Each stores its own `name` from `__init__` (`Cat` and `Fish` inherit `Animal.__init__` since neither defines its own).
2. Iteration 1: `a` is the `Animal` object named `"Generic"`. Python looks for `speak` on `Animal` (its own class) — finds `Animal.speak` — calls it. `self.name` is `"Generic"`, so it returns `"Generic makes a sound."`. Printed: `Generic makes a sound.`
3. Iteration 2: `a` is the `Cat` object named `"Tom"`. Python looks for `speak` starting on `Cat` (the object's actual class) — finds `Cat.speak` defined there, so it **does not** fall back to `Animal.speak`. Returns `"Tom says Meow!"`. Printed: `Tom says Meow!`
4. Iteration 3: `a` is the `Fish` object named `"Nemo"`. Python looks for `speak` on `Fish` — `Fish` defines no `speak`, so Python follows the inheritance chain up to `Animal` and uses `Animal.speak`. Returns `"Nemo makes a sound."`. Printed: `Nemo makes a sound.`

Full output:

```
Generic makes a sound.
Tom says Meow!
Nemo makes a sound.
```

The `for` loop's call `a.speak()` is written once, identically, for every object — the different outputs come entirely from each object's own class deciding which `speak` method actually runs. That is polymorphism in action.
:::
