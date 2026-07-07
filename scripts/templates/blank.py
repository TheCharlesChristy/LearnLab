"""A blank LearnLab learning item (scaffolded by `npm run new:item`).

Replace setup()/render() with your own content. Full API: docs/PYTHON_ITEMS.md
(SRS §6.6). Do NOT define __init__ — the framework owns construction.
"""

import learnsdk as sdk


class Item(sdk.LearningItem):
    title = "Untitled item"

    def setup(self):
        # Build initial state, restoring from saved_state when present (§6.6).
        self.count = 0
        if self.saved_state is not None and self.saved_state.get("_v") == 1:
            self.count = self.saved_state.get("count", 0)

    def render(self):
        return sdk.Column(
            sdk.Text(f"Button pressed {self.count} time(s)."),
            sdk.Button("Press me", on_click=self.on_press),
        )

    def on_press(self, value=None):
        self.count += 1
        self.persist()

    def get_state(self):
        return {"_v": 1, "count": self.count}
