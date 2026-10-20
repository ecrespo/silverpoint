import reflex as rx
from reflex_silverpoint_react import treemap_chart


class State(rx.State):
    rows: list[dict] = []


def treemap_chart_view() -> rx.Component:
    return treemap_chart(
        data=State.rows,
        label_key="folder",
        share_key="bytes",
        title="Treemap chart",
    )
