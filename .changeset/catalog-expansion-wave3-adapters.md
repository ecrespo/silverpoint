---
'@silverpoint/core': minor
'@silverpoint/react': minor
'@silverpoint/vue': minor
'@silverpoint/angular': minor
---

**Second catalog, wave 3 in every adapter (feature-003, T-196..T-198).** The 5 charts of wave 3 —
`DensityBinChart`, `ContourChart`, `DelaunayChart`, `VectorFieldChart` and `NetworkChart` — each at
its own subpath of every adapter (`@silverpoint/react/network-chart`,
`@silverpoint/react/server/network-chart`, `@silverpoint/vue/network-chart` with `SpNetworkChart`,
`@silverpoint/angular/network-chart` with `<sp-network-chart>`) and in each barrel, with the
`NetworkNode` type; their recipes join `@silverpoint/core/catalog`.

`NetworkChart` lays its nodes out by force, the same on the server and in every browser for a given
`seed`, or draws them at the consumer's `x` and `y` when every node has them. Its `nodes` are data,
and `ContourChart`'s `levels` say how the data's values are read: like the `…Key` props, both are
ignored without `data`. The density bins are drawn the smaller the lighter their tone, so the count
survives `precision` mode; the heatmap shares that scale. The contours' grid demo is printed as its
values, its positions implied: the same rows, a fifth of the weight.

Each package README lists the 60 charts; the documentation site states how each wave-3 chart
computes what it derives.
