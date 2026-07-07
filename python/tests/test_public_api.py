"""The §6.5 public API contract: ``__all__`` equals the documented set."""

import learnsdk

# The full §6.5 contract: LearningItem, QuizItem, SimulationItem,
# PlotExplorerItem, MultiStepItem; all §6.7 component classes; draw; checking;
# the quiz question types; the helper dataclasses Ctl and Step; and Result.
EXPECTED = {
    # base item classes
    "LearningItem",
    "QuizItem",
    "SimulationItem",
    "PlotExplorerItem",
    "MultiStepItem",
    # serialisation + utility modules/values
    "SerializationError",
    "draw",
    "checking",
    "Result",
    # quiz question types
    "MCQ",
    "Multi",
    "Numeric",
    "TextAnswer",
    "Expression",
    # helper dataclasses
    "Ctl",
    "Step",
    # §6.7 components
    "Component",
    "Column",
    "Row",
    "Card",
    "Divider",
    "Spacer",
    "Text",
    "Markdown",
    "Math",
    "Image",
    "Alert",
    "Table",
    "CodeBlock",
    "Badge",
    "ProgressBar",
    "Button",
    "Slider",
    "NumberInput",
    "TextInput",
    "Select",
    "RadioGroup",
    "Checkbox",
    "CheckboxGroup",
    "Plot",
    "FunctionPlot",
    "Canvas",
}


def test_all_matches_contract() -> None:
    assert set(learnsdk.__all__) == EXPECTED


def test_no_duplicate_names_in_all() -> None:
    assert len(learnsdk.__all__) == len(set(learnsdk.__all__))


def test_every_exported_name_is_importable() -> None:
    for name in learnsdk.__all__:
        assert hasattr(learnsdk, name), name
