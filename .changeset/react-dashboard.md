---
'@silverpoint/react': minor
'@silverpoint/core': minor
---

**React `Dashboard`.** `@silverpoint/react/dashboard` and `@silverpoint/react/server/dashboard` export
`Dashboard` and `DashboardCell`: a `section` labelled by its heading, a CSS-grid of `article` cells in
reading order, laid out by the core from a data-only `layout`. Each chart inside a cell gets a derived
id, a size that fills its cell with its own card chrome, and the dashboard's `ground`, `substrate`,
`mode` and `locale` below its own props. Neither entry adds a client boundary.

Server charts (`@silverpoint/react/server/*`) no longer require `id`, `width` and `height` by type:
inside a `Dashboard` the cell supplies them; standing alone, a missing one warns (`SP002`, `SP003`).

The reference dashboards moved to their own subpath, `@silverpoint/core/dashboard-demos`, off the
core's main entry. No change to any chart's rendered output.
