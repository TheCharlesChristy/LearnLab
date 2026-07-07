# Paradigms overview and OOP basics

A **programming paradigm** is a style, or "way of thinking", for structuring a program. The same problem can be solved in several paradigms, and A-level Computer Science expects you to recognise three of them:

- **Procedural** — a program is a sequence of instructions grouped into functions/procedures that operate on data passed between them. Data and the code that acts on it are kept separate. Good for small, linear tasks (a script that reads a file, processes it, and prints a report).
- **Object-oriented (OOP)** — data and the functions that act on it are bundled together into **objects**. Good for modelling real-world "things" with their own state and behaviour (a `BankAccount`, a `Player`, a `Sprite`) and for large systems where you want to control how data is accessed.
- **Functional** — a program is built from **pure functions** that transform data without changing anything outside themselves. Good for data-transformation pipelines, parallel/concurrent code, and anywhere you want to reason confidently about correctness (no hidden state to track).

None of these is "the best" — professional codebases often mix paradigms (e.g. an OOP program with functional-style data processing inside a method). What matters is picking the paradigm whose strengths fit the problem: OOP when you have many independent entities with their own data and behaviour; functional when you have a clear pipeline of data transformations with no need for shared mutable state; procedural when the task is short and linear enough that the overhead of classes or pure-function discipline isn't worth it.

The rest of this lesson focuses on object-oriented programming.

## Classes and objects

A **class** is a blueprint — it defines what data (**attributes**) and behaviour (**methods**) every object built from it will have. An **object** (also called an **instance**) is one concrete thing built from that blueprint, with its own copy of the attributes.

```python
class Dog:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def bark(self):
        return f"{self.name} says Woof!"

rex = Dog("Rex", 3)     # rex is an object (instance) of the Dog class
fido = Dog("Fido", 5)   # fido is a separate object with its own attributes

print(rex.bark())        # Rex says Woof!
print(fido.name, fido.age)   # Fido 5
```

`Dog` is the class — one blueprint. `rex` and `fido` are two *different* objects: each has its own `name` and `age` stored in its own memory, even though they share the same `bark` method defined once on the class.

## The constructor: `__init__`

`__init__` is a special method Python calls automatically whenever a new object is created. Its job is to set up the object's initial **attributes**. The first parameter, conventionally named `self`, refers to the particular object being built — every method needs `self` as its first parameter so it can read and write that object's own attributes rather than some other object's.

```python
class Dog:
    def __init__(self, name, age):
        self.name = name   # self.name is an attribute of THIS object
        self.age = age
```

When you write `Dog("Rex", 3)`, Python creates a new empty object, then calls `__init__(self=<the new object>, name="Rex", age=3)`. Nothing is printed or returned by `__init__` itself — its whole purpose is to attach attributes to `self`.

## Encapsulation

**Encapsulation** means bundling an object's data (attributes) together with the methods that operate on that data, and controlling access to the data so it can only be changed in valid ways — usually through methods rather than direct, uncontrolled edits.

Python does not have true "private" attributes enforced by the language, but the convention is a leading underscore: `_balance` (or a double underscore `__balance` for stronger name-mangled privacy) signals "treat this as internal — do not access it directly from outside the class".

```python
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self._balance = balance      # "private by convention"

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("Deposit must be positive")
        self._balance += amount

    def withdraw(self, amount):
        if amount > self._balance:
            raise ValueError("Insufficient funds")
        self._balance -= amount

    def get_balance(self):
        return self._balance
```

Because `_balance` is only ever changed inside `deposit`/`withdraw`, those methods can enforce rules (never go negative, never deposit a negative amount) that would be easy to break if outside code could just write `account._balance = -500` directly. This is the value of encapsulation: it keeps an object's data valid by controlling how it is read and changed.

::widget{type="code-runner" language="python" starter="class BankAccount:\n    def __init__(self, owner, balance=0):\n        self.owner = owner\n        self._balance = balance\n\n    def deposit(self, amount):\n        if amount <= 0:\n            raise ValueError('Deposit must be positive')\n        self._balance += amount\n\n    def withdraw(self, amount):\n        if amount > self._balance:\n            raise ValueError('Insufficient funds')\n        self._balance -= amount\n\n    def get_balance(self):\n        return self._balance\n\nacc = BankAccount('Alex', 100)\nacc.deposit(50)\nacc.withdraw(30)\nprint(acc.owner, acc.get_balance())" rows=16}

Try changing the starter code above: create a second account, try to withdraw more than the balance, and see the `ValueError` that encapsulation's validation raises.

:::callout{kind="key"}
Encapsulation is not about secrecy for its own sake — it is about giving an object a controlled interface (its methods) so the rest of the program cannot put it into an invalid state.
:::

:::reveal{title="Worked example: tracing object creation and attribute access"}
Trace what happens when this code runs:

```python
class Dog:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def bark(self):
        return f"{self.name} says Woof!"

rex = Dog("Rex", 3)
print(rex.bark())
```

1. `Dog("Rex", 3)` is evaluated. Python allocates a new, empty `Dog` object.
2. Python calls `__init__(self=<new object>, name="Rex", age=3)`.
3. Inside `__init__`, `self.name = name` stores `"Rex"` as the `name` attribute **on that specific object**. `self.age = age` stores `3` as its `age` attribute.
4. `__init__` returns nothing; the fully-initialised object is bound to the variable `rex`.
5. `rex.bark()` looks up the `bark` method on the `Dog` class (methods live on the class, not copied into each object) and calls it with `self` automatically set to `rex`.
6. Inside `bark`, `self.name` reads the `name` attribute of `rex`, which is `"Rex"`, so the method returns the string `"Rex says Woof!"`.
7. `print(...)` outputs: `Rex says Woof!`

Every object built from `Dog` gets its **own** `name`/`age`, but all objects share the **one** `bark` method defined on the class — this is why creating a second dog, `fido = Dog("Fido", 5)`, does not affect `rex.name` at all.
:::
