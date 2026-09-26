# @silverpoint/angular

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
