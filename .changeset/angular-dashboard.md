---
'@silverpoint/angular': minor
---

**Angular `sp-dashboard`.** `@silverpoint/angular/dashboard` exports the standalone, OnPush
`SpDashboard` (`<sp-dashboard>`) and `SpDashboardCell` (`<sp-dashboard-cell>`), with the same markup,
layout and inheritance as the React and Vue dashboards. Every chart component now reads the cell it
sits in, if any, for its id, size and the dashboard's configuration, below its own inputs.
