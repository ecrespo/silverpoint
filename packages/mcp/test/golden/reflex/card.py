import reflex as rx
from reflex_silverpoint_react import sp_card


def card_view() -> rx.Component:
    return sp_card(
        "Hits per hour rose through the afternoon and eased at night.",
    )
