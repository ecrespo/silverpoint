import reflex as rx
from reflex_silverpoint_react import sp_select


class State(rx.State):
    value: str = ""

    @rx.event
    def set_value(self, value: str):
        self.value = value


def select_view() -> rx.Component:
    return sp_select(
        label="Status",
        name="status",
        items=[{"key": "placed", "label": "Placed"}, {"key": "paid", "label": "Paid"}, {"key": "packed", "label": "Packed"}, {"key": "shipped", "label": "Shipped"}, {"key": "returned", "label": "Returned", "disabled": True}],
        value=State.value,
        on_change=State.set_value,
    )
