---
'@silverpoint/grounds': minor
---

The built-in grounds declare the feature-004 `ui` tokens (T-209): `backdrop: 2`, the tonal level
behind a modal overlay where it is not hatched, and `rowTone: 1`, the level of a table's striped
and hovered rows.

`ui.css` lays out the 21 feature-004 components (T-210): Surface, Glyph, Table (toned rows by the
ground's `rowTone` level, never opacity), Pagination, Breadcrumb, Avatar, Statistic, Descriptions,
TimelineList, Collapse, Empty, Result, Textarea, InputNumber, and the overlays on `<dialog>` and the
Popover API —Modal, Drawer, Popover, Tooltip, Select, DropdownMenu, Toast— with a hatched backdrop at
the ground's `backdrop` level.
