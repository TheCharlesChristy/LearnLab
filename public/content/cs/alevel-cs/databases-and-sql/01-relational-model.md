# The relational model: tables, keys and relationships

You have already met **lists**, **arrays** and **records** as ways of structuring data in memory. A **relational database** takes that idea further: it stores data in a set of two-dimensional **tables** (formally called **relations**), and lets you describe how those tables link together. Almost every substantial application — school records systems, banking systems, online shops — stores its data this way.

## Tables, rows and columns

A table has three matching sets of names, one from everyday language, one more formal:

| Everyday term | Formal (relational) term | Meaning |
| --- | --- | --- |
| Table | Relation | A named grid of data about one kind of thing |
| Row | Record / Tuple | One item in the table (e.g. one tutor) |
| Column | Attribute / Field | One property every row has (e.g. a name) |

Here is a small table of school tutors:

| TutorID | TutorName | Room |
| --- | --- | --- |
| T1 | Dr Patel | R12 |
| T2 | Mr Owusu | R7 |
| T3 | Ms Grant | R15 |

This table is called `Tutor`. It has three columns (`TutorID`, `TutorName`, `Room`) and three rows, one per tutor.

:::callout{kind="info"}
A relation, in the formal sense, is unordered: the *rows* can be listed in any order and the table means the same thing. SQL's `ORDER BY` (§3 of this module) exists precisely because tables themselves make no promise about row order.
:::

## The primary key

Every table needs a way to uniquely identify each row. A **primary key (PK)** is a column (or small set of columns) whose value is:

- **unique** — no two rows share the same value, and
- **not null** — every row must have one.

In the `Tutor` table, `TutorID` is the primary key: `T1`, `T2` and `T3` are all different, and every tutor has one. `TutorName` would make a *poor* primary key — two different tutors could coincidentally share a name, and typos become impossible to detect once a name is used to identify a row.

:::callout{kind="key"}
A primary key is chosen by the database designer, not discovered. When no natural unique column exists (e.g. two students really could have identical names and dates of birth), designers invent an artificial one, such as a `StudentID` that simply counts upwards — often called a **surrogate key**.
:::

## The foreign key: linking two tables

Real data rarely lives in one table. Consider a `Student` table, where every student belongs to one tutor group:

| StudentID | StudentName | Age | TutorID |
| --- | --- | --- | --- |
| S1 | Alice Chen | 17 | T1 |
| S2 | Ben Okafor | 16 | T1 |
| S3 | Chloe Ahmed | 17 | T2 |
| S4 | Dan Wills | 16 | T3 |
| S5 | Eva Novak | 17 | T2 |

`StudentID` is `Student`'s own primary key. But look at the last column: `TutorID` holds values like `T1` and `T2` — values that are primary keys **in the other table**, `Tutor`. A column that stores another table's primary key like this is called a **foreign key (FK)**. It is how relational databases represent a relationship without duplicating all of the tutor's details into every student row.

:::callout{kind="tip"}
Read a foreign key as "points to": `Student.TutorID` points to `Tutor.TutorID`. Because several students can point to the same tutor, but each student has only one tutor, this is called a **one-to-many relationship** (one tutor, many students) — the most common relationship in relational design.
:::

To find a fact that lives in a *different* table from where you start, you **follow the foreign key**: look up its value as a primary key in the other table. For example, to find Alice Chen's tutor's room: her row has `TutorID = T1`; looking up `T1` in `Tutor` gives `TutorName = Dr Patel`, `Room = R12`. SQL's `JOIN` (§3) automates exactly this lookup, across every row at once.

## Tables as structured data

A table is really just a list of records, which is exactly the kind of structure you have already used in code. The `Student` table above could be represented in Python as a list of dictionaries — one dictionary per row, one key per column:

```python
tutors = [
    {"TutorID": "T1", "TutorName": "Dr Patel", "Room": "R12"},
    {"TutorID": "T2", "TutorName": "Mr Owusu", "Room": "R7"},
    {"TutorID": "T3", "TutorName": "Ms Grant", "Room": "R15"},
]
students = [
    {"StudentID": "S1", "StudentName": "Alice Chen", "Age": 17, "TutorID": "T1"},
    {"StudentID": "S2", "StudentName": "Ben Okafor", "Age": 16, "TutorID": "T1"},
]

# "Follow the foreign key": find Alice's tutor's room.
alice = next(s for s in students if s["StudentName"] == "Alice Chen")
tutor = next(t for t in tutors if t["TutorID"] == alice["TutorID"])
print(tutor["Room"])
```

Run it, then try changing `alice`'s lookup to Ben Okafor, or add a third student and tutor of your own.

::widget{type="code-runner" language="python" starter="tutors = [{'TutorID': 'T1', 'Room': 'R12'}, {'TutorID': 'T2', 'Room': 'R7'}]; alice = {'StudentID': 'S1', 'TutorID': 'T1'}; tutor = next(t for t in tutors if t['TutorID'] == alice['TutorID']); print(tutor['Room'])" rows=10}

A relational database engine stores tables this way internally, but adds two things a plain list of dictionaries does not give you for free: **guarantees** (a primary key column can never hold a duplicate or a missing value) and a **query language** (SQL, §3) for asking questions across many tables at once without writing a loop yourself.

:::reveal{title="Worked example: following two foreign keys"}
Suppose a `Course` table adds a third table to the picture:

| CourseID | CourseName | TutorID |
| --- | --- | --- |
| C1 | Computer Science | T1 |
| C2 | Mathematics | T2 |

**Question:** which room is course `C2` taught in?

1. Look up `C2` in `Course`: its `TutorID` is `T2`.
2. Follow that foreign key into `Tutor`: the row with `TutorID = T2` has `Room = R7`.

So `C2` (Mathematics) is taught in room **R7** — even though `Course` itself has no `Room` column. This is the whole point of foreign keys: a fact is stored **once**, in the table it truly belongs to, and every other table reaches it by reference.
:::

The next lesson looks at what goes wrong when tables are **not** split up this way, and how to fix it systematically.
