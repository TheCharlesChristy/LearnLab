"""learnsdk — the LearnLab Python item SDK (SRS §6.5).

Stable, semver'd public API for authoring Tier-2 interactive learning items.
``from learnsdk import *`` exposes exactly the names in ``__all__`` — this is the
contract (tested). Everything not re-exported here is private.

The full public surface (wired as the §6.5–6.9 modules land):
    LearningItem, QuizItem, SimulationItem, PlotExplorerItem, MultiStepItem;
    all §6.7 component classes; draw; checking; the quiz question types
    MCQ, Multi, Numeric, TextAnswer, Expression; the helper dataclasses
    Ctl and Step; and Result.

learnsdk depends only on the Python standard library (§6.11).
"""

__version__ = "1.0.0"

# Core public surface (T1.3): the item base class, the §6.7 component classes,
# the draw module, and the serialisation error. T1.4 extends this with
# QuizItem/SimulationItem/PlotExplorerItem/MultiStepItem, checking, the quiz
# question types, Ctl/Step and Result.
from . import checking, draw
from ._bridge import SerializationError
from .checking import Result
from .components import (
    Alert,
    Badge,
    Button,
    Canvas,
    Card,
    Checkbox,
    CheckboxGroup,
    CodeBlock,
    Column,
    Component,
    Divider,
    FunctionPlot,
    Image,
    Markdown,
    Math,
    NumberInput,
    Plot,
    ProgressBar,
    RadioGroup,
    Row,
    Select,
    Slider,
    Spacer,
    Table,
    Text,
    TextInput,
)
from .item import LearningItem
from .plot import Ctl, PlotExplorerItem
from .quiz import (
    MCQ,
    Expression,
    Multi,
    MultiStepItem,
    Numeric,
    QuizItem,
    Step,
    TextAnswer,
)
from .simulation import SimulationItem

__all__: list[str] = [
    "LearningItem",
    "QuizItem",
    "SimulationItem",
    "PlotExplorerItem",
    "MultiStepItem",
    "SerializationError",
    "draw",
    "checking",
    "Result",
    # §6.8 quiz question types
    "MCQ",
    "Multi",
    "Numeric",
    "TextAnswer",
    "Expression",
    # §6.8 helper dataclasses
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
]
