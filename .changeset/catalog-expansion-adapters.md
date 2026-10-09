---
'@silverpoint/core': minor
'@silverpoint/react': minor
'@silverpoint/vue': minor
'@silverpoint/angular': minor
---

**Second catalog, wave 1 in every adapter (feature-003, T-177, T-178).** The 14 charts of wave 1 —
`HistogramChart`, `EcdfChart`, `BoxPlotChart`, `ViolinChart`, `RidgelineChart`, `BeeswarmChart`,
`LollipopChart`, `DumbbellChart`, `SlopeChart`, `BumpChart`, `ErrorBarChart`, `IntervalChart`,
`DivergingBarChart` and `ConnectedScatterChart` — each at its own subpath of every adapter
(`@silverpoint/react/histogram-chart`, `@silverpoint/react/server/histogram-chart`,
`@silverpoint/vue/histogram-chart` with `SpHistogramChart`, `@silverpoint/angular/histogram-chart`
with `<sp-histogram-chart>`) and in each barrel. Their recipes are on a new core subpath,
`@silverpoint/core/catalog`, so the core's main entry keeps its budget; every one-chart build of the
first 33 stays within 0.1 KB of its `0.3.0` size.

`RidgelineChart` requires `groupKey` and `DivergingBarChart` requires `levels` in every adapter
(`input.required` in Angular); the demo ignores both. `levels` and `axis` describe how the data's
columns are read, so like the `…Key` props they are ignored without `data`.

The keyboard model of a hierarchy now reaches `stepActive` as each hit area's `moves`, computed with
the layout, so no chart without one carries its code. No existing output changes.

Each package README lists the 47 charts, and the core's names `@silverpoint/core/catalog`; the
documentation site states, for every chart of the second catalog, how each derived value is
computed.
