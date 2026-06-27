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

# Public names are appended here by their owning modules as they land
# (orchestrator-wired, mirroring the §6.5 contract). Until then the package is
# importable and exposes its version.
__all__: list[str] = []
