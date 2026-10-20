import reflex as rx
from reflex_silverpoint_react import sp_dropdown_menu


def dropdown_menu_view() -> rx.Component:
    return sp_dropdown_menu(
        label="Actions",
        items=[{"type": "label", "key": "order", "label": "Order 1042"}, {"key": "edit", "label": "Edit", "shortcut": "E"}, {"key": "duplicate", "label": "Duplicate", "shortcut": "D"}, {"key": "archive", "label": "Archive", "disabled": True}, {"type": "separator", "key": "end"}, {"key": "delete", "label": "Delete", "danger": True}],
        trigger="Actions",
    )
