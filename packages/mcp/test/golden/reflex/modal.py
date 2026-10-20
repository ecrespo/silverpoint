import reflex as rx
from reflex_silverpoint_react import sp_modal


def modal_view() -> rx.Component:
    return sp_modal(
        "Changes reach the workshop before the order is packed.",
        title="Edit order",
        description="Order 1042, placed on 14 October.",
        trigger="Edit order",
    )
