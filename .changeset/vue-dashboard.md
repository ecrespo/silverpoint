---
'@silverpoint/vue': minor
'@silverpoint/core': minor
---

**Vue `SpDashboard`.** `@silverpoint/vue/dashboard` exports `SpDashboard` and `SpDashboardCell`, with
the same markup, layout and inheritance as the React `Dashboard`: each chart inside a cell takes its
id, size and the dashboard's configuration from the cell, below its own props. Server-rendered with
`@vue/server-renderer`, it hydrates at the nominal size and then follows its container.
