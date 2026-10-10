# @silverpoint/angular

## 0.6.0

### Minor Changes

- fa8dc13: **Second catalog, wave 1 in every adapter (feature-003, T-177, T-178).** The 14 charts of wave 1 —
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
- 2171e7d: **Second catalog, wave 2 in every adapter (feature-003, T-187..T-189).** The 8 charts of wave 2 —
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
- 68d2b7c: **Second catalog, wave 3 in every adapter (feature-003, T-196..T-198).** The 5 charts of wave 3 —
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

### Patch Changes

- Updated dependencies [fa8dc13]
- Updated dependencies [da77adb]
- Updated dependencies [c1d0ebd]
- Updated dependencies [a83ca34]
- Updated dependencies [2171e7d]
- Updated dependencies [0e724d6]
- Updated dependencies [68d2b7c]
- Updated dependencies [c6191de]
  - @silverpoint/core@0.6.0
  - @silverpoint/grounds@0.6.0

## 0.3.0

### Minor Changes

- 281dfa5: **First UI components: batch B1 (feature-002, step 6c).** `SpButton`, `SpInput`, `SpCheckbox`,
  `SpSwitch`, `SpCard` and `SpDivider` in React (`@silverpoint/react/ui/<name>`, plus
  `server/ui/card` and `server/ui/divider` for Server Components), Vue (`@silverpoint/vue/ui/<name>`)
  and Angular (`@silverpoint/angular/ui/<name>`; `SpButton` decorates the consumer's own `<button>`).
  The markup is the core's view tree (`@silverpoint/core/ui`: `resolveUi`, `ui*View`), identical in
  the three adapters; `ui.css` gains their layout and folds frame slots and tone states onto each
  ground's tokens. The Angular adapter now takes `@angular/forms` as a peer, for its
  ControlValueAccessors, and its tokens and environment move to `@silverpoint/angular/env`
  (re-exported from `@silverpoint/angular`). No change to the rendered output of any chart.
- 41805a0: **UI components, batches B2 and B3 (feature-002, step 6c): the catalog's 17 are complete.**
  `SpRadioGroup`, `SpSegmented`, `SpTabs` with `SpTabPanel`, `SpSlider`, `SpRate`, `SpSteps`,
  `SpTag`, `SpBadge`, `SpProgress`, `SpAlert` and `SpSkeleton` in React, Vue and Angular
  (`ui/<name>`). React also ships `server/ui/steps`, `tag`, `badge`, `progress`, `alert` and
  `skeleton` for Server Components. Each component writes the core's view tree
  (`ui*View` in `@silverpoint/core/ui`), so the markup is the same in the three adapters.
  
  - **Keyboard.** The composites follow the WAI-ARIA patterns through the core's `uiRovingFocus`,
    which calls `uiRovingKey`. Disabled items are skipped and `dir="rtl"` mirrors the arrows.
  - **Values.** Every value component is controlled or uncontrolled, and the Angular ones are
    ControlValueAccessors.
  - **Heightening.** Each component has at most one heightened element.
  - **Styles.** `ui.css` gains the components' layout. Slider and Progress use exact fractions on
    logical properties. An indeterminate Progress only moves when reduced motion is off.
  
  No change to the rendered output of any chart.
- eb2bd8e: **UI components, close-out (feature-002, step 6f): `0.3.0`.** The 17 `Sp`-prefixed components are
  verified end to end on the UI page of the four example apps —keyboard patterns, native form
  submit, focus ring, target size, reduced motion, RTL, axe A/AA— and documented on the site with a
  live example per state and a props reference read from the types. Every prop of the UI types now
  carries its JSDoc. Angular: `SpUiControl` hands the `.sp-ui` root to the roving-focus helper, so a
  `dir="rtl"` set on the component mirrors the arrows. Grounds: `ui.css` removes the browser's own focus ring from
  the native, text and range controls, whose exact ring is drawn on their item, box or thumb, so a
  focused `SpInput` shows one ring, not two. The seven packages move together to `0.3.0`;
  the rendered output of every chart is unchanged.

### Patch Changes

- Updated dependencies [281dfa5]
- Updated dependencies [41805a0]
- Updated dependencies [eb2bd8e]
- Updated dependencies [5a1b53f]
- Updated dependencies [5146e68]
- Updated dependencies [10cc90a]
  - @silverpoint/core@0.3.0
  - @silverpoint/grounds@0.3.0

## 0.2.0

### Minor Changes

- 3bb6313: **Angular `sp-dashboard`.** `@silverpoint/angular/dashboard` exports the standalone, OnPush
  `SpDashboard` (`<sp-dashboard>`) and `SpDashboardCell` (`<sp-dashboard-cell>`), with the same markup,
  layout and inheritance as the React and Vue dashboards. Every chart component now reads the cell it
  sits in, if any, for its id, size and the dashboard's configuration, below its own inputs.
- edcfb8e: **A second ground: `cyanotype`, where tone is line weight.** `ground="cyanotype"` prints any chart
  as a white line on Prussian blue (REQ-028). It hatches nothing. A toned shape, such as a bar, a cell
  or a band, is drawn as its own outline, and its tone is how thick that outline is. No chart code
  changed to add it.
  
  - **New exports.** `cyanotype` and `WeightInker` from `@silverpoint/grounds`, both registered by
    default. From `@silverpoint/core`: `ToneSpec` becomes a union, `HatchToneSpec | WeightToneSpec`.
  - **One substrate,** `prussian`. The ground ignores `substrate`, so it needs none.
  - **Heightening inverts.** The heightened element is the deepest blue, outlined in the white ink.
  - **Rendered output.** A weighted path carries `data-weight="1"`–`"4"`. The stylesheet turns it
    into a stroke width with `--sp-weight-1..4`, so a consumer re-weights with CSS. `silverpoint`
    output is unchanged: no path of it carries a weight.
- 5191333: **Linked dashboards.** A dashboard with `link={{ key: 'hour' }}` marks, in every other chart, the items
  whose datum carries the same `hour` as the active item of the chart being explored, and clears them
  when it clears. The marks are hidden from assistive technology, and linked state never reaches the
  server render. The dashboard reports the linked value through `onLinkChange` (React),
  `@link-change` (Vue) or `(linkChange)` (Angular). A chart whose data has no such field warns `SP016`.
  In React the link is its own client boundary, `@silverpoint/react/dashboard-link`, rendered only when
  `link` is set.

### Patch Changes

- Updated dependencies [edcfb8e]
- Updated dependencies [1a8c006]
- Updated dependencies [5f69fde]
- Updated dependencies [5191333]
- Updated dependencies [81f9b59]
- Updated dependencies [ac0571f]
- Updated dependencies [5359ab8]
- Updated dependencies [8ee76ad]
- Updated dependencies [ed5b943]
  - @silverpoint/core@0.2.0
  - @silverpoint/grounds@0.2.0

## 0.1.1

### Patch Changes

- **Package pages and the release pipeline.** Every package now ships a README, so its npm page
  explains how to install it. The React, Vue and Angular READMEs give the tested quickstart and
  examples for a provider, precision mode, interaction, a custom readout, the imperative handle and
  server rendering. From this release on, the packages are published from CI on every merge into
  `main`, through npm Trusted Publishing and with provenance. No change to the rendered output.
- Updated dependencies
  - @silverpoint/core@0.1.1
  - @silverpoint/grounds@0.1.1
