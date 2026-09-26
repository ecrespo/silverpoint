---
'@silverpoint/core': minor
'@silverpoint/react': minor
'@silverpoint/vue': minor
'@silverpoint/angular': minor
---

**Linked dashboards.** A dashboard with `link={{ key: 'hour' }}` marks, in every other chart, the items
whose datum carries the same `hour` as the active item of the chart being explored, and clears them
when it clears. The marks are hidden from assistive technology, and linked state never reaches the
server render. The dashboard reports the linked value through `onLinkChange` (React),
`@link-change` (Vue) or `(linkChange)` (Angular). A chart whose data has no such field warns `SP016`.
In React the link is its own client boundary, `@silverpoint/react/dashboard-link`, rendered only when
`link` is set.
