# Authoring Guide (Tier 1: screens + JSON)

This guide is everything you need to add learning content to LearnLab **without writing any application code**. Content is data: courses are folders of JSON, screen-sequence JSON, Markdown, and (from P1) Python files under `public/content/`. Adding or editing content never requires changes under `src/` — that is the central architectural invariant (C-5).

Experience Runtime v2 has a declared pack/graph contract, documented in
[`EXPERIENCE_RUNTIME_V2_SCHEMA.md`](EXPERIENCE_RUNTIME_V2_SCHEMA.md). Its packs are discovered
and semantically validated alongside v1 content, and the supported scaffolders below create a
strict-valid starter. Runtime traversal is still an engine roadmap item: author the pack now, but
do not present it as a learner-facing replacement for a v1 course yet.

**New lessons are authored as screen sequences** (`docs/BRILLIANT_REWRITE_PLAN.md`) — an ordered list of gated interactive screens, not a Markdown page you scroll. §3 below is the primary format; the full per-screen-type reference is [`SCREENS.md`](SCREENS.md). §3a covers the older Markdown + directives format, kept for lessons already written in it (planned deprecation — new authoring should not use it without a specific reason).

For Python items (Tier 2), see [`PYTHON_ITEMS.md`](PYTHON_ITEMS.md). For the native widget catalogue, see [`WIDGETS.md`](WIDGETS.md) (still relevant: several screen types, like `manipulable-target`, wrap a native widget).

## 1. Folder anatomy

```
public/content/                      # ALL course content, shipped verbatim
├── maths/                           # subject folder: maths | physics | cs | ai
│   └── alevel-pure/                 # one COURSE
│       ├── course.json              # course metadata + ordered module list
│       └── differentiation-1/       # one MODULE (the unit of progress)
│           ├── module.json          # metadata, objectives, ordered lessons
│           ├── 01-gradients.screens.json  # a LESSON, screen-sequence format (primary)
│           ├── 02-tangents.md             # a LESSON, legacy Markdown format
│           ├── assessment.json      # end-of-module quiz (MVC-required)
│           ├── images/              # figures referenced by legacy lessons (optional)
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
- A lesson's `kind` is `"screens"` (primary, §3), `"markdown"` (legacy, §3a, the default when `kind` is omitted), or `"python"` (a full-page Python item, P1). A single module can freely mix lesson kinds — nothing requires converting a whole module at once.

## 2. Add a module in 15 minutes

1. **Branch.** `git checkout -b content/my-module` (`main` is protected; everything lands via PR).
2. **Scaffold.** Run:

   ```sh
   npm run new:module
   ```

   It prompts for subject, course (existing or new), module id, title, description, time estimate, and prerequisites, then generates (FR-AUTH-001):

   - the module folder with a valid `module.json`;
   - a starter lesson `01-introduction.screens.json` containing one placeholder `predict` screen and one placeholder `tap-choice` screen — real, schema-valid screens, not comments, since JSON has no comment syntax to hang a "here's how" example off (unlike the old Markdown template);
   - an `assessment.json` with two placeholder questions;
   - the `ModuleRef` appended to the course's `course.json` (creating a valid `course.json` first if the course is new).

   The output passes validation immediately — you start from green.
3. **Run the dev loop.**

   ```sh
   npm run dev
   ```

   Edits to `.screens.json`/`.md`/`.json` refresh the affected view within ~2 s; the validator runs in watch mode and surfaces errors as an in-app toast plus console output (FR-AUTH-004).
4. **Write your lessons.** Replace the starter screens, or add more `NN-slug.screens.json` files and register each in `module.json` under `lessons` (with `id`, `title`, `file`, `"kind": "screens"`, `estMinutes`). See §3 for the screen-type reference; see `learnlab-lesson-pedagogy` for how to sequence them (hook → beats → centerpiece → worked-example pair → close, now expressed as screens).
5. **Write the assessment.** Replace the placeholder questions in `assessment.json` — the MVC floor is ≥ 8 questions spanning ≥ 2 question types (see §6 below). Set `assessment.passMark` in `module.json` (e.g. `0.7`).
6. **Validate strictly.**

   ```sh
   npm run validate -- --strict
   ```

   Fix anything it reports (it prints file paths and JSON pointers).
7. **Open a PR.** Use the PR checklist in §7. Content-only PRs run a fast CI lane (validation + Python compile + smoke tests).

## 2a. Start a v2 course pack or add an experience

V2 packs live independently of v1 courses at `public/content/v2/<pack-id>/`. They are
auto-discovered: never edit a central subject enum, registry, or generated index. Start a pack
with a first valid, gated episode, a starter skill graph, an `assets/` directory, a fixture copy,
and an independently renderable review-item starter:

```sh
npm run new:course -- \
  --id bridge-missions \
  --title "Bridge missions" \
  --description "Use force balance to diagnose and repair a bridge." \
  --subject physics \
  --level gcse \
  --minutes 20
```

The command also works interactively as `npm run new:course`. It writes:

```
public/content/v2/bridge-missions/
├── course-pack.json                    # pack, state declarations, skills, campaign, review starter
├── assets/.gitkeep                     # add only local assets and record them in course-pack.json
├── experiences/first-experience.json   # one genuinely gated choice activity and a terminating node
└── fixtures/first-experience.fixture.json # copy for Studio/runtime tests; not a second manifest
```

Every scaffold contains deliberate `TODO`s rather than hidden defaults. Replace them before
shipping. In particular, write a standalone review context, a retrieval prompt, misconception-aware
feedback, and a meaningful consequence after the learner action. The current v2 scaffold uses the
installed `choice@1.0.0` activity capability; adding another activity type is platform work and
must be registered before it can appear in a pack.

To add another episode without manually synchronising the manifest and campaign, run:

```sh
npm run new:experience -- \
  --pack bridge-missions \
  --id inspect-support \
  --title "Inspect the support" \
  --minutes 5
```

It adds the graph and fixture, appends the experience to `course-pack.json`, adds it to the chosen
campaign, and increments the pack estimate. Use `--campaign <campaign-id>` to choose a campaign
other than the first one. Both commands accept `--root <content-root>` for isolated tooling/tests;
they default to `public/content`. Finish with `npm run validate -- --strict`. The generated
`experience-index.json` and `experience-search-index.json` are build artifacts—never edit them.

### Skill prerequisites and evidence

For a v2 pack, give every `skills` entry a stable id, a learner-readable title/description, and
only the skill ids it directly requires in `prerequisiteIds`. Prerequisites form a DAG: no missing
ids, self-links, or cycles. The v2 build validates all of these and reports the exact
`course-pack.json` pointer; use the platform's `validateSkillGraph` API for generated or
editor-authored data before it reaches the build.

Do not describe a completed experience, a quiz percentage, or a review grade as mastery. The
platform's evidence model records an opportunity, outcome, support/hints, confidence, latency,
transfer context and content version separately. It intentionally reports `unknown` when an
activity did not collect a field. Existing quiz and review records remain legacy until an explicit
per-item skill/evidence mapping has been authored; never retrofit a skill claim from an aggregate
score.

## 3. Screen-sequence lessons (the primary format)

A screen-sequence lesson (`NN-slug.screens.json`, `"kind": "screens"` in `module.json`) is an ordered array of gated interactive screens — the learner sees one at a time, and the engine will not enable "Continue" until the screen reports genuine completion. There is no screen type that is prose plus a bare Next button. Full per-type field reference, examples, and gating rules: [`SCREENS.md`](SCREENS.md). Minimal shape:

```json
{
  "schemaVersion": 1,
  "id": "gradients",
  "title": "Gradients of curves",
  "screens": [
    {
      "type": "predict",
      "id": "predict-steepness",
      "prompt": "Does a curve like $y = x^2$ have the same steepness everywhere?",
      "choices": ["Yes, always", "No, it changes from point to point"],
      "correctChoiceIndex": 1,
      "reveal": "We define the gradient at a point as the gradient of the tangent there…"
    }
  ]
}
```

Eight screen types are registered (`predict`, `tap-choice`, `entry`, `manipulable-target`, `faded-step`, `sort-match`, `flash-recall`, `reveal-mechanism`) — this is a closed set exactly like the four legacy directives and the four question types; a ninth is a `src/`-level change (`learnlab-extend-platform`), not something to invent syntax for. Prose fields (`prompt`, `body`, `reveal`, …) are Markdown, rendered through the same KaTeX/GFM pipeline as everything else — write maths and formatting exactly as in a Markdown lesson.

**How `learnlab-lesson-pedagogy`'s lesson skeleton maps onto screens:** the opening hook is a `predict` screen; each beat's checkpoint is a `tap-choice` or `entry` screen; the centerpiece widget is a `manipulable-target` screen; the worked-example pair is a `reveal-mechanism` screen (mandatory self-explanation) followed by a `faded-step` screen; the close folds into the last screen's `successFeedback`. Read `learnlab-lesson-pedagogy` for the full sequencing rules, fading guidance, and the format-mix requirement (generation-format screens — `entry`/`faded-step`/`manipulable-target` — for at least half of a lesson's checkpoints).

**A real shipped example** worth reading end to end before writing your first screen sequence: `public/content/maths/alevel-pure/differentiation-1/01-gradients.screens.json` (and its two sibling lessons in the same module) — a complete 3-lesson module using six of the eight screen types.

## 3a. Legacy format: Markdown + directives

This is the format every module authored before the screens rewrite (`docs/BRILLIANT_REWRITE_PLAN.md`) uses, and it remains fully supported — old lessons are unaffected and do not need converting. **New lessons should use §3 instead**; only reach for this format to edit an existing Markdown lesson, or in the rare case a screen sequence genuinely doesn't fit (flag it rather than forcing one).

Lessons are CommonMark + GFM, plus maths (§5) and **exactly four** directive forms (SRS §4.5). Anything else fails content validation.

### 3a.1 Native widget (leaf)

```markdown
::widget{type="function-grapher" expr="x^2" tangent=true xmin=-4 xmax=4}
```

Mounts a native widget by registry key. Props are strings/numbers/booleans; each widget validates its own props and shows an inline error card on bad props (details in dev, brief notice in prod). See [`WIDGETS.md`](WIDGETS.md) for every key and prop.

### 3a.2 Python item (leaf)

```markdown
::py{src="items/power-rule-quiz.py" params='{"questions": 4}' height=320}
```

- `src` (required): path relative to the module folder.
- `params` (optional): a JSON **object** string handed to the item (single-quote the attribute so the JSON's double quotes survive).
- `height` (optional, default `auto`, min 240): reserves layout space to prevent content shift.

> **P0 note:** the Python runtime ships in P1. Today this directive renders a placeholder card that reserves the layout space; the syntax above is final.

### 3a.3 Callout (container)

```markdown
:::callout{kind="key"}
The derivative at a point is the gradient of the tangent at that point.
:::
```

`kind` must be one of `info`, `tip`, `warning`, `key`. A styled aside with an icon.

### 3a.4 Reveal (container)

```markdown
:::reveal{title="Worked solution"}
Start from first principles: $f'(x) = \lim_{h \to 0} \frac{f(x+h)-f(x)}{h}$ …
:::
```

Collapsed-by-default disclosure; opening and closing is keyboard accessible. Every concept lesson SHOULD include one `:::reveal` worked example.

### 3a.5 The no-nesting rule

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
- [ ] ◆ At least 1 interactive item (a native widget other than `figure`, or a Python item). A `"kind": "screens"` lesson satisfies this automatically — every screen gates on a real interaction by construction, so any module with at least one screens-format lesson clears this bar without a separate widget.
- [ ] ◆ `assessment.json` with ≥ 8 questions spanning ≥ 2 question types.
- [ ] ◆ `prerequisites` and `objectives` declared in `module.json` (prerequisites are advisory — they warn, never lock).
- [ ] ◆ `estMinutes` set on the module and on every lesson.
- [ ] Every concept lesson has a full worked example with a faded companion (SHOULD) — a `:::reveal` in the legacy format, or a `reveal-mechanism` + `faded-step` screen pair in the primary format.

## 7. PR checklist

- [ ] `npm run validate -- --strict` passes locally (schemas, IDs, file existence, widget/screen-type validity, directive syntax, MVC ◆ rules).
- [ ] All lessons render correctly in `npm run dev` — check every widget, callout, reveal, and maths block visually (legacy), or drive every screen in a screens-format lesson and confirm each one actually gates (Continue stays disabled until you interact, wrong answers show hints not the answer).
- [ ] Every quiz question has an `explanation`.
- [ ] Every `figure` has meaningful `alt` text.
- [ ] Images live in the module folder and are referenced relatively; no external origins (the CSP forbids them).
- [ ] `module.json` `version` bumped on meaningful edits to an existing module; your name/handle added to `authors`.
- [ ] The MVC checklist (§6 above) is satisfied.
- [ ] The PR touches only `public/content/**` (and docs, if relevant) — content changes never touch `src/`.
