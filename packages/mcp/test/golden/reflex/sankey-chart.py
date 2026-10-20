import reflex as rx
from reflex_silverpoint_react import sankey_chart


class State(rx.State):
    rows: list[dict] = []


def sankey_chart_view() -> rx.Component:
    return sankey_chart(
        data=State.rows,
        source_key="from",
        target_key="to",
        value_key="count",
        title="Signup flow",
        height=240,
        ground="cyanotype",
    )
