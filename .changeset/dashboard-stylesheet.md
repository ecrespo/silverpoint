---
'@silverpoint/grounds': minor
---

**Dashboard stylesheet.** `@silverpoint/grounds/styles.css` now carries the `.sp-dashboard` rules:
a CSS Grid inside a named inline-size container, switching columns and spans at 640 px and
1024 px of the dashboard's own width, from the `--sp-dashboard-*` and `--sp-cell-*` variables
the adapters write. No `order`, no dense packing, no line placement: the DOM order is the reading
order. Colours and type come from the ground's tokens only. No change to any chart's output.
