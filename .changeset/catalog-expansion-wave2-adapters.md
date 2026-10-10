---
'@silverpoint/core': minor
'@silverpoint/react': minor
'@silverpoint/vue': minor
'@silverpoint/angular': minor
---

**Second catalog, wave 2 in every adapter (feature-003, T-187..T-189).** The 8 charts of wave 2 —
`WaffleChart`, `MarimekkoChart`, `SquarifiedTreemap`, `SunburstChart`, `TreeChart`,
`ParallelCoordinatesChart`, `PolarLineChart` and `PolarScatterChart` — each at its own subpath of
every adapter (`@silverpoint/react/sunburst-chart`, `@silverpoint/react/server/sunburst-chart`,
`@silverpoint/vue/sunburst-chart` with `SpSunburstChart`, `@silverpoint/angular/sunburst-chart` with
`<sp-sunburst-chart>`) and in each barrel; their recipes join `@silverpoint/core/catalog`.

`SquarifiedTreemap` and `SunburstChart` drill down under the consumer's control: `rootId` in, and
`onRootChange` (React), `@root-change` (Vue) or `(rootChange)` (Angular) out, emitted with the
activated node's id — its parent's for the drawn root, `null` for the top. The components keep no
root of their own, so a server render with `rootId` is the client's. `rootChangeOf`, on
`@silverpoint/core/catalog`, is what the three adapters share.

`ParallelCoordinatesChart` requires `dimensions` in every adapter (`input.required` in Angular); the
demo ignores it. `dimensions` and `period` describe how the data's columns are read, so like the
`…Key` props they are ignored without `data`.

Each package README lists the 55 charts; the documentation site states how each wave-2 chart
computes what it derives.
