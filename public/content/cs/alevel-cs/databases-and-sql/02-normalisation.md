# Data redundancy and normalisation

Splitting data across separate, correctly-linked tables (§1) is not just tidiness — it prevents real bugs. **Normalisation** is the systematic process of taking an unnormalised, "flat-file" table and splitting it into well-structured tables that avoid those bugs. This lesson works through one example in full, from a single flat table to a set of three normalised tables.

## The problem: one flat table

Imagine a school stores enrolments in a single table, one row per student-and-course combination:

| StudentID | StudentName | StudentEmail | CourseID | CourseName | TutorID | TutorName | TutorRoom |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | Alice Chen | alice@example.com | C1 | Computer Science | T1 | Dr Patel | R12 |
| S1 | Alice Chen | alice@example.com | C2 | Mathematics | T2 | Mr Owusu | R7 |
| S2 | Ben Okafor | ben@example.com | C1 | Computer Science | T1 | Dr Patel | R12 |
| S3 | Chloe Ahmed | chloe@example.com | C1 | Computer Science | T1 | Dr Patel | R12 |
| S3 | Chloe Ahmed | chloe@example.com | C2 | Mathematics | T2 | Mr Owusu | R7 |
| S2 | Ben Okafor | ben@example.com | C2 | Mathematics | T2 | Mr Owusu | R7 |

No single column is unique here (StudentID repeats, CourseID repeats), so the primary key must be the **composite** (StudentID, CourseID) pair — each combination appears exactly once.

:::callout{kind="warning"}
This single table has three serious problems, all caused by **redundancy** (the same fact stored in more than one row):

- **Update anomaly:** if Alice changes her email address, every row containing `alice@example.com` must be updated. Miss one, and the table now contradicts itself.
- **Insertion anomaly:** you cannot record a new course (e.g. a new Physics course with its tutor) until at least one student has enrolled on it, because a row needs a StudentID.
- **Deletion anomaly:** if Ben Okafor un-enrols from Mathematics and that was his only row for that course, deleting it also deletes the *only* record that room R7 belongs to Mr Owusu — information that had nothing to do with Ben.
:::

Normalisation removes these problems by applying a sequence of rules — **normal forms** — each stricter than the last.

## First normal form (1NF)

A table is in **1NF** if:

1. every cell holds a single, atomic value (no lists or repeated groups packed into one cell), and
2. there is a primary key that identifies each row.

The table above is already in 1NF: every cell holds one value, and (StudentID, CourseID) is a valid primary key. (Had the school instead stored one row *per student* with a single "Courses" cell like `"C1, C2"`, that would violate 1NF — the fix is exactly the one-row-per-combination layout already shown above.)

## Second normal form (2NF)

A table in 1NF is in **2NF** if every non-key column depends on the **whole** primary key, not just part of it. This rule only bites when the primary key is composite (more than one column) — with a single-column key, 1NF automatically implies 2NF.

Our table's key is (StudentID, CourseID). Check each non-key column:

| Column | Depends on | Whole key, or partial? |
| --- | --- | --- |
| StudentName, StudentEmail | StudentID only | **Partial** — CourseID plays no part |
| CourseName, TutorID, TutorName, TutorRoom | CourseID only | **Partial** — StudentID plays no part |

Every non-key column depends on only *part* of the key — a **partial dependency**, which violates 2NF. The fix is to split off the columns that depend on each part of the key into their own tables, keyed on that part:

**Student**

| StudentID (PK) | StudentName | StudentEmail |
| --- | --- | --- |
| S1 | Alice Chen | alice@example.com |
| S2 | Ben Okafor | ben@example.com |
| S3 | Chloe Ahmed | chloe@example.com |

**Course** (still holds tutor columns for now — see 3NF below)

| CourseID (PK) | CourseName | TutorID | TutorName | TutorRoom |
| --- | --- | --- | --- | --- |
| C1 | Computer Science | T1 | Dr Patel | R12 |
| C2 | Mathematics | T2 | Mr Owusu | R7 |

**Enrolment** (links the two; composite PK, both columns are also foreign keys)

| StudentID (PK, FK) | CourseID (PK, FK) |
| --- | --- |
| S1 | C1 |
| S1 | C2 |
| S2 | C1 |
| S2 | C2 |
| S3 | C1 |
| S3 | C2 |

Now every non-key column depends on the *whole* key of its own table: `Student` is keyed only by StudentID and every column there depends on StudentID; `Course` is keyed only by CourseID and every column there depends on CourseID; `Enrolment` has no non-key columns at all. 2NF is satisfied.

## Third normal form (3NF)

A table in 2NF is in **3NF** if every non-key column depends **directly** on the primary key, and not on another non-key column (a **transitive dependency**).

Look again at `Course`: its key is CourseID, and CourseID does determine TutorID. But does CourseID determine TutorName and TutorRoom *directly*? No — a tutor's name and room depend on **which tutor**, i.e. on TutorID, which itself depends on CourseID:

$$
\text{CourseID} \rightarrow \text{TutorID} \rightarrow \{\text{TutorName}, \text{TutorRoom}\}
$$

That chain is a transitive dependency, and it violates 3NF — it reintroduces the exact redundancy problem from before (if Dr Patel moves office, every course they teach needs updating). The fix, once again, is to split off the transitively-dependent columns into their own table:

**Tutor**

| TutorID (PK) | TutorName | TutorRoom |
| --- | --- | --- |
| T1 | Dr Patel | R12 |
| T2 | Mr Owusu | R7 |

**Course** (now 3NF: only a foreign key to `Tutor` remains)

| CourseID (PK) | CourseName | TutorID (FK) |
| --- | --- | --- |
| C1 | Computer Science | T1 |
| C2 | Mathematics | T2 |

`Student` and `Enrolment` from the 2NF step have no transitive dependencies, so they are unchanged. The final, fully-normalised (3NF) schema is four tables: `Student`, `Tutor`, `Course`, `Enrolment` — exactly the tables introduced in the previous lesson, plus `Enrolment` to record the many-to-many link between students and courses.

:::callout{kind="key"}
Each step of normalisation removes one *kind* of dependency problem: 1NF removes repeating groups, 2NF removes partial dependencies (needs a composite key to even arise), 3NF removes transitive dependencies. The reward is that every fact is now stored in exactly one place — Dr Patel's room appears in one row of one table, however many courses they teach.
:::

:::reveal{title="Worked example: which anomaly does normalisation fix?"}
**Question:** In the original flat table, Ben Okafor's only Mathematics row is deleted (he un-enrols). Using the *normalised* schema instead, does deleting his enrolment lose the fact that Mr Owusu teaches in room R7?

1. Deleting Ben's enrolment only removes the matching row from `Enrolment` — the row `(S2, C2)`.
2. `Tutor` is a completely separate table; Mr Owusu's row `(T2, Mr Owusu, R7)` is untouched by any change to `Enrolment`.
3. So no — the fact survives, because it was never duplicated into the enrolment record in the first place.

This is exactly the **deletion anomaly** from the flat table, fixed by normalisation.
:::

The final `Student`/`Tutor`/`Course`/`Enrolment` schema above is exactly what a query language needs to work with efficiently — the next lesson uses it (in simplified two-table form) to write SQL.
