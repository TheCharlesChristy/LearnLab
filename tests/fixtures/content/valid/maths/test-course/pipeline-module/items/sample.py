"""Syntax-valid fixture item (py_compile gate only; never executed here)."""


class Item:
    def setup(self):
        self.count = 0

    def render(self):
        return {"type": "Text", "props": {"text": str(self.count)}}
