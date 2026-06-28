"""Generated/randomised quizzes in pure Python (SRS §6.8).

:class:`QuizItem` reproduces the native quiz engine flow (§5.4) — one question
at a time, immediate per-question feedback, then a summary with per-question
review and "Try again" — over an author-supplied :meth:`QuizItem.questions`
list built once per attempt from ``self.rng``. The five question types mirror
the §4.6 marking semantics; any question may override :meth:`Question.check`.

:class:`MultiStepItem` (priority S) lives here as the guided-derivation cousin
of a quiz: authors supply :meth:`MultiStepItem.steps`, each a :class:`Step` with
its own checker, and the base renders progress, input, hints and completion.
"""

from __future__ import annotations

from collections.abc import Callable

from .checking import Result, approx, sympy_equiv
from .components import (
    Alert,
    Button,
    Card,
    CheckboxGroup,
    Column,
    Markdown,
    NumberInput,
    ProgressBar,
    RadioGroup,
    Row,
    Text,
    TextInput,
)
from .item import LearningItem

__all__ = [
    "MCQ",
    "Expression",
    "Multi",
    "MultiStepItem",
    "Numeric",
    "Question",
    "QuizItem",
    "Step",
    "TextAnswer",
]

# ---------------------------------------------------------------------------
# Question types (§4.6 / §6.8 semantics)
# ---------------------------------------------------------------------------


class Question:
    """Base class for quiz questions (§6.8).

    A question holds its prompt and explanation and knows how to mark a learner
    value via :meth:`check`. The five concrete types mirror §4.6; authors may
    subclass any of them (or this base) and override :meth:`check` for custom
    marking.

    Attributes:
        text: The question prompt (Markdown + maths).
        explanation: Feedback shown after answering.
    """

    def __init__(self, text: str, explanation: str = "") -> None:
        """Initialise the shared prompt and explanation.

        Args:
            text: The question prompt (Markdown + maths).
            explanation: Feedback shown after answering.
        """
        self.text = text
        self.explanation = explanation

    def check(self, value: object) -> Result:
        """Mark ``value`` and return a :class:`Result` (override for custom).

        Args:
            value: The learner's answer in this question's input shape.

        Returns:
            The marking :class:`Result`.

        Raises:
            NotImplementedError: If a subclass does not implement marking.
        """
        raise NotImplementedError("Question subclasses must implement check()")

    @property
    def requires(self) -> list[str]:
        """Pyodide packages this question needs (empty by default)."""
        return []


class MCQ(Question):
    """Single-answer multiple choice (§4.6 ``mcq``)."""

    def __init__(
        self,
        text: str,
        choices: list[str],
        answer: int,
        explanation: str = "",
    ) -> None:
        """Create a single-answer multiple-choice question.

        Args:
            text: The prompt.
            choices: The selectable options (2-6).
            answer: Index of the correct choice.
            explanation: Feedback shown after answering.
        """
        super().__init__(text, explanation)
        self.choices = choices
        self.answer = answer

    def check(self, value: object) -> Result:
        """Correct iff the selected index equals ``answer`` (§4.6).

        Args:
            value: The selected choice index, or ``None``.

        Returns:
            The marking :class:`Result`.
        """
        return Result(value == self.answer)


class Multi(Question):
    """Multiple-answer multiple choice (§4.6 ``multi``)."""

    def __init__(
        self,
        text: str,
        choices: list[str],
        answers: list[int],
        explanation: str = "",
    ) -> None:
        """Create a multiple-answer question.

        Args:
            text: The prompt.
            choices: The selectable options.
            answers: Indices of the correct choices (>=1).
            explanation: Feedback shown after answering.
        """
        super().__init__(text, explanation)
        self.choices = choices
        self.answers = answers

    def check(self, value: object) -> Result:
        """Correct iff the selected set equals ``answers`` exactly (§4.6).

        Args:
            value: The selected indices (any iterable), or ``None``.

        Returns:
            The marking :class:`Result`.
        """
        selected = set(value) if value else set()
        return Result(selected == set(self.answers))


class Numeric(Question):
    """Numeric answer with absolute tolerance (§4.6 ``numeric``)."""

    def __init__(
        self,
        text: str,
        answer: float,
        tolerance: float = 0.0,
        unit: str | None = None,
        explanation: str = "",
    ) -> None:
        """Create a numeric question.

        Args:
            text: The prompt.
            answer: The correct value.
            tolerance: Absolute tolerance (>=0).
            unit: Optional display unit.
            explanation: Feedback shown after answering.
        """
        super().__init__(text, explanation)
        self.answer = answer
        self.tolerance = tolerance
        self.unit = unit

    def check(self, value: object) -> Result:
        """Correct iff ``abs(value - answer) <= tolerance`` (§4.6).

        A zero tolerance falls back to a tiny relative/absolute closeness check
        so floating-point answers still mark correctly.

        Args:
            value: The parsed numeric value, or ``None`` when empty/invalid.

        Returns:
            The marking :class:`Result`.
        """
        if value is None:
            return Result(False, "no answer given")
        try:
            v = float(value)
        except (TypeError, ValueError):
            return Result(False, "not a number")
        if self.tolerance > 0:
            return Result(abs(v - self.answer) <= self.tolerance)
        return Result(approx(v, self.answer))


class TextAnswer(Question):
    """Free-text answer matched against accepted values (§4.6 ``text``)."""

    def __init__(
        self,
        text: str,
        accept: list[str],
        case_sensitive: bool = False,
        explanation: str = "",
    ) -> None:
        """Create a text question.

        Args:
            text: The prompt.
            accept: Accepted answers; the trimmed input must full-match one.
            case_sensitive: Whether matching respects case.
            explanation: Feedback shown after answering.
        """
        super().__init__(text, explanation)
        self.accept = accept
        self.case_sensitive = case_sensitive

    def check(self, value: object) -> Result:
        """Correct iff the trimmed input full-matches an accepted value (§4.6).

        Args:
            value: The learner's text, or ``None``.

        Returns:
            The marking :class:`Result`.
        """
        if value is None:
            return Result(False, "no answer given")
        given = str(value).strip()
        candidates = self.accept
        if not self.case_sensitive:
            given = given.casefold()
            candidates = [a.casefold() for a in self.accept]
        return Result(given in candidates)


class Expression(Question):
    """Symbolic-equivalence answer via sympy (§6.8)."""

    def __init__(
        self,
        text: str,
        target: str,
        symbols: str = "x",
        explanation: str = "",
    ) -> None:
        """Create an expression question marked by symbolic equivalence.

        Args:
            text: The prompt.
            target: The reference expression source.
            symbols: Space-separated symbol names for parsing.
            explanation: Feedback shown after answering.
        """
        super().__init__(text, explanation)
        self.target = target
        self.symbols = symbols

    @property
    def requires(self) -> list[str]:
        """Symbolic marking needs sympy (§6.8 auto-extends ``requires``)."""
        return ["sympy"]

    def check(self, value: object) -> Result:
        """Correct iff ``value`` is symbolically equivalent to ``target``.

        Parse errors mark the answer incorrect with a "couldn't parse" message
        rather than raising (§6.8).

        Args:
            value: The learner's expression source, or ``None``.

        Returns:
            The marking :class:`Result`.
        """
        if value is None or str(value).strip() == "":
            return Result(False, "no answer given")
        return sympy_equiv(str(value), self.target, self.symbols)


# ---------------------------------------------------------------------------
# QuizItem (§6.8)
# ---------------------------------------------------------------------------

_INPUT_NONE = object()


class QuizItem(LearningItem):
    """A pure-Python generated quiz (§6.8).

    The framework builds the question list once per attempt in :meth:`setup`
    (using ``self.rng``), then renders the native one-at-a-time flow (§5.4):
    each question with immediate correct/incorrect feedback and its explanation,
    a per-question review, and a summary that reports the score and offers "Try
    again". Finishing calls :meth:`~learnsdk.LearningItem.complete`; "Try again"
    reseeds (``attempt += 1``, persisted) so regenerated numbers differ.

    Authors override :meth:`questions` (required). Set :attr:`shuffle` and
    :attr:`pass_mark` as class attributes.

    Attributes:
        shuffle: Whether to shuffle questions each attempt.
        pass_mark: Pass threshold as a 0-1 fraction, or ``None`` to just report.
    """

    shuffle: bool = True
    pass_mark: float | None = None

    def questions(self) -> list[Question]:
        """Return this attempt's questions (REQUIRED override; may use rng).

        Returns:
            The list of :class:`Question` for the current attempt.

        Raises:
            NotImplementedError: If the author does not override it.
        """
        raise NotImplementedError("QuizItem subclasses must override questions()")

    # ---- framework lifecycle ----

    def setup(self) -> None:
        """Restore the attempt counter and build this attempt's questions."""
        saved = self.saved_state or {}
        self.attempt: int = saved.get("attempt", 0)
        self._build_attempt()

    def get_state(self) -> dict:
        """Persist the attempt counter so "Try again" reseeds across reloads.

        Returns:
            The JSON-safe quiz state.
        """
        return {"_v": 1, "attempt": self.attempt}

    def _build_attempt(self) -> None:
        """(Re)generate questions for the current attempt and reset progress."""
        # Reseed deterministically per attempt so regenerated numbers differ on
        # "Try again" yet remain reproducible for a given (item, attempt).
        seed = (hash((self.item_id, self.attempt)) & 0xFFFFFFFF) if self.attempt else None
        if seed is not None:
            import random  # noqa: PLC0415 - stdlib, attempt-scoped reseed

            self.rng = random.Random(seed)
        self._questions: list[Question] = list(self.questions())
        if self.shuffle:
            self.rng.shuffle(self._questions)
        self._index: int = 0
        self._answers: list[object] = [_INPUT_NONE] * len(self._questions)
        self._results: list[Result | None] = [None] * len(self._questions)
        self._answered: bool = False
        self._draft: object = _INPUT_NONE
        self._done: bool = False

    # ---- input handlers ----

    def _set_draft(self, value: object) -> None:
        self._draft = value

    def _submit(self, _value: object = None) -> None:
        q = self._questions[self._index]
        value = None if self._draft is _INPUT_NONE else self._draft
        self._answers[self._index] = value
        self._results[self._index] = q.check(value)
        self._answered = True

    def _next(self, _value: object = None) -> None:
        if self._index + 1 < len(self._questions):
            self._index += 1
            self._answered = False
            self._draft = _INPUT_NONE
        else:
            self._finish()

    def _finish(self) -> None:
        self._done = True
        self.complete(self.score, self.max_score)

    def _try_again(self, _value: object = None) -> None:
        self.attempt += 1
        self._build_attempt()
        self.persist()

    # ---- scoring ----

    @property
    def score(self) -> int:
        """Number of questions answered correctly so far."""
        return sum(1 for r in self._results if r is not None and r.correct)

    @property
    def max_score(self) -> int:
        """Total number of questions in this attempt."""
        return len(self._questions)

    @property
    def passed(self) -> bool | None:
        """Whether the score meets :attr:`pass_mark`, or ``None`` if unset."""
        if self.pass_mark is None or self.max_score == 0:
            return None
        return (self.score / self.max_score) >= self.pass_mark

    # ---- rendering ----

    def render(self) -> Column:
        """Render the quiz: a question, its feedback, or the summary (§5.4).

        Returns:
            The component tree for the current quiz state.
        """
        if not self._questions:
            return Column(Alert("This quiz has no questions.", kind="warning"), key="root")
        if self._done:
            return self._render_summary()
        return self._render_question()

    def _render_question(self) -> Column:
        q = self._questions[self._index]
        n = len(self._questions)
        children: list = [
            Text(f"Question {self._index + 1} of {n}", size="sm", weight="bold"),
            ProgressBar(self._index + (1 if self._answered else 0), max=n),
            Markdown(q.text),
            self._render_input(q),
        ]
        if not self._answered:
            children.append(Button("Submit", on_click=self._submit, key="submit"))
        else:
            result = self._results[self._index]
            children.append(
                Alert(
                    "Correct" if result and result.correct else "Incorrect",
                    kind="success" if result and result.correct else "error",
                )
            )
            if result and result.feedback:
                children.append(Text(result.feedback, size="sm"))
            if q.explanation:
                children.append(Markdown(q.explanation))
            last = self._index + 1 == n
            children.append(Button("Finish" if last else "Next", on_click=self._next, key="next"))
        return Column(*children, gap=3, key="root")

    def _render_input(self, q: Question):
        disabled = self._answered
        if isinstance(q, MCQ):
            value = self._draft if isinstance(self._draft, int) else -1
            return RadioGroup(
                "Choose one",
                q.choices,
                value,
                on_change=None if disabled else self._set_draft,
                key="input",
            )
        if isinstance(q, Multi):
            values = list(self._draft) if isinstance(self._draft, list) else []
            return CheckboxGroup(
                "Select all that apply",
                q.choices,
                values,
                on_change=None if disabled else self._set_draft,
                key="input",
            )
        if isinstance(q, Numeric):
            value = self._draft if isinstance(self._draft, (int, float)) else None
            return NumberInput(
                "Your answer",
                value=value,
                on_change=None if disabled else self._set_draft,
                unit=q.unit,
                key="input",
            )
        # TextAnswer, Expression and any custom Question default to text input.
        value = self._draft if isinstance(self._draft, str) else ""
        return TextInput(
            "Your answer",
            value=value,
            on_change=None if disabled else self._set_draft,
            on_submit=None if disabled else self._submit,
            key="input",
        )

    def _render_summary(self) -> Column:
        n = self.max_score
        children: list = [
            Text("Summary", size="lg", weight="bold"),
            Text(f"Score: {self.score} / {n}", size="md"),
        ]
        passed = self.passed
        if passed is not None:
            children.append(
                Alert(
                    "Passed" if passed else "Not passed yet",
                    kind="success" if passed else "warning",
                )
            )
        for i, q in enumerate(self._questions):
            result = self._results[i]
            ok = result is not None and result.correct
            children.append(
                Card(
                    Text(f"Q{i + 1}: {'correct' if ok else 'incorrect'}", weight="bold"),
                    Markdown(q.text),
                    Markdown(q.explanation) if q.explanation else Text(""),
                    key=f"review-{i}",
                )
            )
        children.append(
            Row(Button("Try again", on_click=self._try_again, key="again"), key="actions")
        )
        return Column(*children, gap=3, key="root")


# ---------------------------------------------------------------------------
# MultiStepItem + Step (§6.8, priority S) — placed here as the guided-
# derivation cousin of a quiz (resolution noted in the task brief).
# ---------------------------------------------------------------------------


class Step:
    """One step of a guided derivation (§6.8).

    Attributes:
        prompt_md: The step prompt (Markdown + maths).
        check: A callable mapping the learner's text to a :class:`Result`.
        hint_md: Optional hint shown on request (Markdown).
    """

    def __init__(
        self,
        prompt_md: str,
        check: Callable[[object], Result],
        hint_md: str = "",
    ) -> None:
        """Create a derivation step.

        Args:
            prompt_md: The step prompt (Markdown + maths).
            check: Callable mapping the learner value to a :class:`Result`.
            hint_md: Optional hint shown on request.
        """
        self.prompt_md = prompt_md
        self.check = check
        self.hint_md = hint_md


class MultiStepItem(LearningItem):
    """A guided, step-by-step derivation (§6.8, priority S).

    Authors override :meth:`steps`; the base renders progress, the current
    prompt, a text input, an optional hint, and a completion summary. Each step
    is marked by its own :class:`Step.check`; the learner advances only once the
    current step is correct, and finishing calls
    :meth:`~learnsdk.LearningItem.complete`.
    """

    def steps(self) -> list[Step]:
        """Return the ordered derivation steps (REQUIRED override).

        Returns:
            The list of :class:`Step`.

        Raises:
            NotImplementedError: If the author does not override it.
        """
        raise NotImplementedError("MultiStepItem subclasses must override steps()")

    def setup(self) -> None:
        """Build the steps and reset progress (restoring the step index)."""
        self._steps: list[Step] = list(self.steps())
        saved = self.saved_state or {}
        self._index: int = saved.get("index", 0)
        self._show_hint: bool = False
        self._draft: str = ""
        self._result: Result | None = None
        self._done: bool = self._index >= len(self._steps)

    def get_state(self) -> dict:
        """Persist the current step index.

        Returns:
            The JSON-safe state.
        """
        return {"_v": 1, "index": self._index}

    def _set_draft(self, value: object) -> None:
        self._draft = str(value) if value is not None else ""

    def _submit(self, _value: object = None) -> None:
        step = self._steps[self._index]
        self._result = step.check(self._draft)
        if self._result.correct:
            self._index += 1
            self._draft = ""
            self._show_hint = False
            if self._index >= len(self._steps):
                self._done = True
                self.complete()
            else:
                self._result = None
            self.persist()

    def _hint(self, _value: object = None) -> None:
        self._show_hint = True

    def render(self) -> Column:
        """Render progress, the current step, hints, or completion (§6.8).

        Returns:
            The component tree for the current state.
        """
        n = len(self._steps)
        if n == 0:
            return Column(Alert("This item has no steps.", kind="warning"), key="root")
        if self._done:
            return Column(
                Text("Derivation complete", size="lg", weight="bold"),
                ProgressBar(n, max=n),
                Alert("All steps complete.", kind="success"),
                key="root",
            )
        step = self._steps[self._index]
        children: list = [
            Text(f"Step {self._index + 1} of {n}", size="sm", weight="bold"),
            ProgressBar(self._index, max=n),
            Markdown(step.prompt_md),
            TextInput(
                "Your answer",
                value=self._draft,
                on_change=self._set_draft,
                on_submit=self._submit,
                key="input",
            ),
            Row(
                Button("Submit", on_click=self._submit, key="submit"),
                Button("Hint", on_click=self._hint, kind="ghost", key="hintbtn"),
                key="actions",
            ),
        ]
        if self._result is not None and not self._result.correct:
            children.append(Alert(self._result.feedback or "Not quite — try again.", kind="error"))
        if self._show_hint and step.hint_md:
            children.append(Markdown(step.hint_md))
        return Column(*children, gap=3, key="root")
