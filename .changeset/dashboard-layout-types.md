---
'@silverpoint/core': minor
---

**Dashboard layout types (Phase 5, first step).** The core's internal surface gains the types of
the upcoming Dashboard composition (`DashboardProps`, `DashboardLayout`, `DashboardCellLayout`,
`DashboardModel`, …) and their defaults: `DASHBOARD_DEFAULTS` (1 / 2 / 4 columns at `sm` / `md` /
`lg`, row unit 240 px, gap 16 px), `perBreakpoint` and `resolveLayout`. A dashboard's `id` and its
`title` or `label` are required by the type. No component uses them yet; no change to the rendered
output.
