# Querying and updating data with SQL

**SQL** (Structured Query Language) is the standard language for reading and changing data in a relational database. This lesson uses two small, related tables throughout — reuse them for every example below.

**Tutor**

| TutorID | TutorName | Room |
| --- | --- | --- |
| T1 | Dr Patel | R12 |
| T2 | Mr Owusu | R7 |
| T3 | Ms Grant | R15 |

**Student**

| StudentID | StudentName | Age | TutorID |
| --- | --- | --- | --- |
| S1 | Alice Chen | 17 | T1 |
| S2 | Ben Okafor | 16 | T1 |
| S3 | Chloe Ahmed | 17 | T2 |
| S4 | Dan Wills | 16 | T3 |
| S5 | Eva Novak | 17 | T2 |

`Student.TutorID` is a foreign key referencing `Tutor.TutorID` (§1).

:::callout{kind="info"}
**LearnLab's `code-runner` only executes Python, not SQL** (this module has no SQL sandbox). Every query below is instead shown with its **exact resulting rows**, worked out by hand from the tables above — read them the way you would check a worked maths example.
:::

## SELECT … FROM … WHERE — retrieving and filtering rows

The most common SQL statement reads columns from a table, optionally filtering which rows appear:

```sql
SELECT StudentName, Age
FROM Student
WHERE Age = 17;
```

- `SELECT` lists which **columns** to return (`*` means "all columns").
- `FROM` names the table.
- `WHERE` keeps only rows matching a condition — here, `Age = 17`.

Checking every row of `Student` against `Age = 17`: S1 (17 ✓), S2 (16 ✗), S3 (17 ✓), S4 (16 ✗), S5 (17 ✓). The query returns:

| StudentName | Age |
| --- | --- |
| Alice Chen | 17 |
| Chloe Ahmed | 17 |
| Eva Novak | 17 |

:::callout{kind="tip"}
`WHERE` also supports `<`, `>`, `<=`, `>=`, `<>` (not equal), `AND`, `OR`, and `LIKE` for text pattern-matching — but `=` on a numeric or exact text column, as above, is the one you will use most.
:::

## ORDER BY — sorting results

Tables have no inherent row order (§1), so to control the order results appear in, add `ORDER BY`:

```sql
SELECT StudentName, Age
FROM Student
ORDER BY Age ASC, StudentName ASC;
```

This sorts primarily by `Age` ascending; where ages tie, it sorts those rows by `StudentName` (also ascending — `ASC` is the default and could be omitted). Grouping the five students by age first (16: Ben Okafor, Dan Wills — 17: Alice Chen, Chloe Ahmed, Eva Novak) and alphabetising within each group gives:

| StudentName | Age |
| --- | --- |
| Ben Okafor | 16 |
| Dan Wills | 16 |
| Alice Chen | 17 |
| Chloe Ahmed | 17 |
| Eva Novak | 17 |

Use `DESC` instead of `ASC` to sort descending.

## INSERT INTO — adding a row

```sql
INSERT INTO Student (StudentID, StudentName, Age, TutorID)
VALUES ('S6', 'Farah Iqbal', 16, 'T3');
```

Name each column, then supply one value per column in the same order. After this runs, `Student` gains a sixth row:

| StudentID | StudentName | Age | TutorID |
| --- | --- | --- | --- |
| … | *(original five rows, unchanged)* | | |
| S6 | Farah Iqbal | 16 | T3 |

## UPDATE — changing existing rows

```sql
UPDATE Student
SET TutorID = 'T2'
WHERE StudentID = 'S4';
```

`SET` gives the new value(s); `WHERE` picks which row(s) — here, exactly one, `S4`. Dan Wills's tutor changes from `T3` to `T2`; every other row (including the `S6` row just inserted) is untouched:

| StudentID | StudentName | Age | TutorID |
| --- | --- | --- | --- |
| S4 | Dan Wills | 16 | **T2** (was T3) |

:::callout{kind="warning"}
`UPDATE` and `DELETE` without a `WHERE` clause apply to **every** row in the table — a frequent, hard-to-undo mistake. Always double-check the `WHERE` clause (or run the equivalent `SELECT … WHERE …` first to see which rows would be affected) before running either statement.
:::

## DELETE — removing rows

```sql
DELETE FROM Student
WHERE StudentID = 'S6';
```

This removes the one row matching the condition — the `Farah Iqbal` row inserted earlier — leaving `Student` back at five rows, with Dan Wills's `TutorID` still updated to `T2` from the previous step.

:::reveal{title="Worked example: tracing INSERT, UPDATE, DELETE in sequence"}
Starting from the original five-row `Student` table, run in order:

1. `INSERT INTO Student (StudentID, StudentName, Age, TutorID) VALUES ('S6', 'Farah Iqbal', 16, 'T3');` — table now has 6 rows.
2. `UPDATE Student SET TutorID = 'T2' WHERE StudentID = 'S4';` — still 6 rows; Dan Wills's `TutorID` is now `T2`.
3. `DELETE FROM Student WHERE StudentID = 'S6';` — back to 5 rows.

**Question:** after all three statements, what is Dan Wills's `TutorID`?

Insert and delete both concern `S6` only, so they never touch Dan Wills's (`S4`) row — only the `UPDATE` in step 2 does. His `TutorID` is **T2**.
:::

For the rest of this lesson (and in the module assessment), queries use the **original** `Student` table at the top of this lesson — before the insert/update/delete practice above.

## INNER JOIN — combining two tables

`SELECT` alone only ever looks at one table. To answer a question that needs columns from **two** related tables — e.g. "which room is each student's tutor in?" — use `JOIN` to combine rows via a foreign key:

```sql
SELECT Student.StudentName, Tutor.TutorName, Tutor.Room
FROM Student
INNER JOIN Tutor ON Student.TutorID = Tutor.TutorID
ORDER BY Student.StudentName;
```

`INNER JOIN … ON …` pairs up rows from the two tables wherever the join condition holds — here, wherever a student's `TutorID` equals a tutor's `TutorID` — and `SELECT` then picks columns from either side using `TableName.ColumnName`. Matching every student to their tutor:

| StudentName | TutorName | Room |
| --- | --- | --- |
| Alice Chen | Dr Patel | R12 |
| Ben Okafor | Dr Patel | R12 |
| Chloe Ahmed | Mr Owusu | R7 |
| Dan Wills | Ms Grant | R15 |
| Eva Novak | Mr Owusu | R7 |

Notice `Dr Patel` and `R12` appear twice — once for each of their two students — because the join produces one output row **per matching pair**, not one row per tutor.

:::callout{kind="key"}
`INNER JOIN` only keeps rows where a match exists on **both** sides. If a student's `TutorID` did not exist in `Tutor` at all (it shouldn't, if foreign keys are enforced — §1), that student would simply be dropped from the result. This is different from listing every student regardless of match, which needs a `LEFT JOIN` — outside this course's scope, but good to know the name of.
:::

`WHERE` combines with `JOIN` exactly as before:

```sql
SELECT StudentName
FROM Student
INNER JOIN Tutor ON Student.TutorID = Tutor.TutorID
WHERE Tutor.TutorName = 'Mr Owusu';
```

From the joined table above, the rows with `TutorName = 'Mr Owusu'` are Chloe Ahmed and Eva Novak, so:

| StudentName |
| --- |
| Chloe Ahmed |
| Eva Novak |

:::reveal{title="Worked example: writing a JOIN query from a question"}
**Question:** "List the names of every student taught by a tutor in room R12, sorted alphabetically."

1. R12 belongs to `Dr Patel`, `TutorID = T1` (look this up in `Tutor`).
2. Students with `TutorID = T1` are Alice Chen (S1) and Ben Okafor (S2) (look this up in `Student`).
3. Write the query joining the two tables and filtering on the room:

   ```sql
   SELECT Student.StudentName
   FROM Student
   INNER JOIN Tutor ON Student.TutorID = Tutor.TutorID
   WHERE Tutor.Room = 'R12'
   ORDER BY Student.StudentName;
   ```

4. Result, alphabetised: Alice Chen, then Ben Okafor.

| StudentName |
| --- |
| Alice Chen |
| Ben Okafor |
:::

## Practice: review the key terms

::widget{type="flashcards" src="cards/key-terms.json"}
