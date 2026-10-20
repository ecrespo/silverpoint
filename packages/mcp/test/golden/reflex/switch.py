import reflex as rx
from reflex_silverpoint_react import sp_switch


class State(rx.State):
    value: bool = False

    @rx.event
    def set_value(self, value: bool):
        self.value = value


def switch_view() -> rx.Component:
    return sp_switch(
        label="Linked hover",
        name="linked",
        checked=State.value,
        on_change=State.set_value,
    )
