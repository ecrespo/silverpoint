import reflex as rx
from reflex_silverpoint_react import sp_tabs


class State(rx.State):
    value: str = "overview"

    @rx.event
    def set_value(self, value: str):
        self.value = value


def tabs_view() -> rx.Component:
    return sp_tabs(
        label="Views",
        items=[{"key": "overview", "label": "Overview"}, {"key": "traffic", "label": "Traffic"}, {"key": "errors", "label": "Errors"}, {"key": "settings", "label": "Settings"}],
        value=State.value,
        on_change=State.set_value,
        palette="verdigris",
    )
