import reflex as rx
from reflex_silverpoint_react import stream_chart


class State(rx.State):
    rows: list[dict] = []


def stream_chart_view() -> rx.Component:
    return stream_chart(
        data=State.rows,
        x_key="day",
        keys=["hits", "misses"],
        title="Stream chart",
        mode="precision",
        palette="sanguine",
    )
