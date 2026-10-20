import reflex as rx
from reflex_silverpoint_react import sp_toast


class State(rx.State):
    open: bool = True

    @rx.event
    def set_open(self, open: bool):
        self.open = open


def toast_view() -> rx.Component:
    return sp_toast(
        kind="info",
        title="Order saved",
        description="Order 1042 was updated.",
        open=State.open,
        on_open_change=State.set_open,
    )
