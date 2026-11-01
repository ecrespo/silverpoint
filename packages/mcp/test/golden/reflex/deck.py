import reflex as rx
from reflex_silverpoint_react import sp_deck

MARKDOWN = """# Quarterly review

```silverpoint
{"chart":"bar-chart","props":{"title":"Visits"}}
```

---

## Next steps

* Ship it"""


class State(rx.State):
    page: int = 1

    @rx.event
    def set_page(self, page: int, total: int):
        self.page = page


def deck_view() -> rx.Component:
    return sp_deck(
        MARKDOWN,
        page=State.page,
        on_page_change=State.set_page,
        ground="cyanotype",
        hash=True,
    )
