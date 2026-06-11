# Authoring Guide (Tier 1: Markdown + JSON)

This guide is everything you need to add learning content to LearnLab **without writing any application code**. Content is data: courses are folders of JSON, Markdown and (from P1) Python files under `public/content/`. Adding or editing content never requires changes under `src/` — that is the central architectural invariant (C-5).

For Python items (Tier 2), see [`PYTHON_ITEMS.md`](PYTHON_ITEMS.md). For the native widget catalogue, see [`WIDGETS.md`](WIDGETS.md).

> **P0 note:** the repository currently ships the engine only — no public course content yet. The folder layout below is the normative target (SRS §3.3/§4.1) and is what the scaffolder generates.

## 1. Folder anatomy

```
public/content/                      # ALL course content, shipped verbatim
├── maths/                           # subject folder: maths | physics | cs | ai
│   └── alevel-pure/                 # one COURSE
│       ├── course.json              # course metadata + ordered module list
│       └── differentiation-1/       # one MODULE (the unit of progress)
│           ├── module.json          # metadata, objectives, ordered lessons
│           ├── 01-power-rule.md     # a LESSON (NN-slug.md, ordered pages)
│           ├── 02-tangents.md
│           ├── assessment.json      # end-of-module quiz (MVC-required)
│           ├── images/              # figures referenced by lessons (optional)
│           └── items/
│               └── power-rule-quiz.py   # Python items (Tier 2, P1)
├── physics/ …
├── cs/ …
└── ai/ …
```

Key facts:

- `content/index.json` is **generated** by `scripts/build-content.mjs` — never hand-edit it.
- **ID rules (normative):** all `id` fields are lowercase kebab-case (`^[a-z0-9]+(-[a-z0-9]+)*$`, ≤ 64 chars). Module IDs are globally unique across the whole content tree; lesson IDs are unique within their module; course IDs are unique within their subject.
- `course.json` defines module display order; `module.json` defines lesson order.
- Lessons are Markdown by default; a lesson may instead be a full-page Python item (`"kind": "python"` in `module.json` — P1).

## 2. Add a module in 15 minutes

1. **Branch.** `git checkout -b content/my-module` (`main` is protected; everything lands via PR).
2. **Scaffold.** Run:

   ```sh
   npm run new:module
   ```

   It prompts for subject, course (existing or new), module id, title, description, time estimate, and prerequisites, then generates (FR-AUTH-001):

   - the module folder with a valid `module.json`;
   - a starter lesson `01-introduction.md` containing one commented example of **every** directive;
   - an `assessment.json` with two placeholder questions;
   - the `ModuleRef` appended to the course's `course.json` (creating a valid `course.json` first if the course is new).

   The output passes validation immediately — you start from green.
3. **Run the dev loop.**

   ```sh
   npm run dev
   ```

   Edits to `.md`/`.json` refresh the affected view within ~2 s; the validator runs in watch mode and surfaces errors as an in-app toast plus console output (FR-AUTH-004).
4. **Write your lessons.** Rename/duplicate the starter lesson (`NN-slug.md`), register each one in `module.json` under `lessons` (with `id`, `title`, `file`, `estMinutes`), and write. Use directives (§3 below) for interactivity.
5. **Write the assessment.** Replace the placeholder questions in `assessment.json` — the MVC floor is ≥ 8 questions spanning ≥ 2 question types (see §6 below). Set `assessment.passMark` in `module.json` (e.g. `0.7`).
6. **Validate strictly.**

   ```sh
   npm run validate -- --strict
   ```

   Fix anything it reports (it prints file paths and JSON pointers).
7. **Open a PR.** Use the PR checklist in §7. Content-only PRs run a fast CI lane (validation + Python compile + smoke tests).

## 3. Directive syntax (the full set)

Lessons are CommonMark + GFM, plus maths (§5) and **exactly four** directive forms (SRS §4.5). Anything else fails content validation.

### 3.1 Native widget (leaf)

```markdown
::widget{type="function-grapher" expr="x^2" tangent=true xmin=-4 xmax=4}
```

Mounts a native widget by registry key. Props are strings/numbers/booleans; each widget validates its own props and shows an inline error card on bad props (details in dev, brief notice in prod). See [`WIDGETS.md`](WIDGETS.md) for every key and prop.

### 3.2 Python item (leaf)

```markdown
::py{src="items/power-rule-quiz.py" params='{"questions": 4}' height=320}
```

- `src` (required): path relative to the module folder.
- `params` (optional): a JSON **object** string handed to the item (single-quote the attribute so the JSON's double quotes survive).
- `height` (optional, default `auto`, min 240): reserves layout space to prevent content shift.

> **P0 note:** the Python runtime ships in P1. Today this directive renders a placeholder card that reserves the layout space; the syntax above is final.

### 3.3 Callout (container)

```markdown
:::callout{kind="key"}
The derivative at a point is the gradient of the tangent at that point.
:::
```

`kind` must be one of `info`, `tip`, `warning`, `key`. A styled aside with an icon.

### 3.4 Reveal (container)

```markdown
:::reveal{title="Worked solution"}
Start from first principles: $f'(x) = \lim_{h \to 0} \frac{f(x+h)-f(x)}{h}$ …
:::
```

Collapsed-by-default disclosure; opening and closing is keyboard accessible. Every concept lesson SHOULD include one `:::reveal` worked example.

### 3.5 The no-nesting rule

Containers (`:::callout`, `:::reveal`) MAY contain Markdown, maths, and **leaf** directives (`::widget`, `::py`). Containers SHALL NOT contain other containers. This is validated — a nested container fails CI and renders an error card:

```markdown
:::callout{kind="tip"}
:::reveal{title="No"}        <!-- INVALID: container inside container -->
:::
:::
```

Other things that fail validation: an unknown directive name, a directive used with the wrong form (e.g. `::callout` as a leaf), an unknown `::widget type`, and a `::py src` that does not exist on disk.

## 4. Quiz JSON cookbook

Quiz files (module `assessment.json` and inline `::widget{type="quiz" src="…"}` embeds) follow `schemas/quiz.schema.json` (SRS §4.6).

Top-level fields:

| Field              | Type     | Req | Notes                                              |
| ------------------ | -------- | --- | -------------------------------------------------- |
| `schemaVersion`    | integer  | ✔   | `1`.                                               |
| `id`               | string   | ✔   | Unique within the module.                          |
| `title`            | string   | ✔   |                                                    |
| `shuffleQuestions` | boolean  | ✖   | Default `true`.                                    |
| `shuffleChoices`   | boolean  | ✖   | Default `true` (applies to mcq/multi).             |
| `pick`             | integer  | ✖   | If set, randomly select `pick` questions per attempt. |
| `questions`        | array    | ✔   | ≥ 1 question objects.                              |

**Every question must include `explanation`** (Markdown + maths), shown after answering. One complete example per question type:

```json
{
  "schemaVersion": 1,
  "id": "differentiation-1-practice",
  "title": "Practice: Differentiation I",
  "pick": 4,
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "text": "The derivative of a constant is…",
      "choices": ["undefined", "the constant itself", "0", "1"],
      "answer": 2,
      "explanation": "A constant has zero rate of change, so its derivative is $0$."
    },
    {
      "id": "q2",
      "type": "multi",
      "text": "Which of the following are differentiable everywhere?",
      "choices": ["$x^2$", "$|x|$", "$\\sin x$", "$\\frac{1}{x}$"],
      "answers": [0, 2],
      "explanation": "$|x|$ has a corner at $x=0$ and $\\frac{1}{x}$ is undefined at $x=0$; polynomials and $\\sin x$ are smooth everywhere."
    },
    {
      "id": "q3",
      "type": "numeric",
      "text": "If $f(x) = 3x^4$, find $f'(2)$.",
      "answer": 96,
      "tolerance": 0.001,
      "unit": "",
      "explanation": "$f'(x) = 12x^3$, so $f'(2) = 12 \\times 8 = 96$."
    },
    {
      "id": "q4",
      "type": "text",
      "text": "Name the rule used to differentiate $x^n$.",
      "accept": ["(the )?power rule"],
      "caseSensitive": false,
      "explanation": "Differentiating $ax^n$ to get $anx^{n-1}$ is the **power rule**."
    }
  ]
}
```

Marking rules (v1):

- **mcq** — correct iff the selected index equals `answer`. 2–6 `choices`.
- **multi** — correct iff the selected set equals `answers` exactly; **no partial credit**.
- **numeric** — correct iff `abs(value − answer) ≤ tolerance` (`tolerance` is absolute, ≥ 0). The input accepts `-`, decimals, and scientific notation (`1.2e3`). `unit` is display-only.
- **text** — correct iff the **trimmed** input **full-matches** any of the `accept` ECMAScript regexes (`caseSensitive` defaults to `false`). Remember regexes full-match: `"power rule"` will not match an answer of "the power rule" — write the pattern to cover the variants you accept.

Shuffling and `pick` use a seeded PRNG, so a given attempt is reproducible (FR-QUIZ-002).

## 5. Maths and KaTeX tips

- Inline maths: `$f'(x) = 2x$`. Display maths on its own line:

  ```markdown
  $$
  f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
  $$
  ```

- **Escaping in Markdown:** a literal dollar sign is `\$`. Raw HTML is disabled in lessons (FR-CONT-005), so `<` and `>` inside maths are safe.
- **Escaping in JSON** (quiz `text`/`explanation` fields): backslashes must be doubled — write `"$12 \\times 8$"` for $12 \times 8$, `"\\frac{1}{2}"` for a fraction.
- KaTeX renders both HTML and MathML (accessibility); stick to standard LaTeX maths commands KaTeX supports — check <https://katex.org/docs/supported.html> if a command renders as red text.
- Prefer `\times` over `*`, `\le`/`\ge` over `<=`/`>=`, and `\,` for thin spaces in units, e.g. `$9.81\,\text{m s}^{-2}$`.

## 6. Minimum Viable Content (MVC) checklist

Per SRS §8.6 — the ◆ rules are CI-checkable and enforced by `build-content.mjs --strict` on content PRs:

> Every shipped module SHALL contain: ◆ ≥ 3 lessons; ◆ ≥ 1 interactive item (native widget beyond `figure`, or a Python item); ◆ an `assessment.json` with ≥ 8 questions spanning ≥ 2 question types; ◆ declared `prerequisites` and `objectives`; ◆ `estMinutes` on module and lessons; every concept lesson SHOULD include one `:::reveal` worked example.

As a tick-list before you open a PR:

- [ ] ◆ At least 3 lessons.
- [ ] ◆ At least 1 interactive item (a native widget other than `figure`, or a Python item).
- [ ] ◆ `assessment.json` with ≥ 8 questions spanning ≥ 2 question types.
- [ ] ◆ `prerequisites` and `objectives` declared in `module.json` (prerequisites are advisory — they warn, never lock).
- [ ] ◆ `estMinutes` set on the module and on every lesson.
- [ ] Every concept lesson has a `:::reveal` worked example (SHOULD).

## 7. PR checklist

- [ ] `npm run validate -- --strict` passes locally (schemas, IDs, file existence, widget keys, directive syntax, MVC ◆ rules).
- [ ] All lessons render correctly in `npm run dev` — check every widget, callout, reveal, and maths block visually.
- [ ] Every quiz question has an `explanation`.
- [ ] Every `figure` has meaningful `alt` text.
- [ ] Images live in the module folder and are referenced relatively; no external origins (the CSP forbids them).
- [ ] `module.json` `version` bumped on meaningful edits to an existing module; your name/handle added to `authors`.
- [ ] The MVC checklist (§6 above) is satisfied.
- [ ] The PR touches only `public/content/**` (and docs, if relevant) — content changes never touch `src/`.
