# @silverpoint/core

## 0.2.0

### Minor Changes

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
- 1a8c006: **Reference dashboards.** `DASHBOARD_DEMOS` holds three frozen, data-only dashboards —
  `kpi-strip`, `ops` and `mixed-spans` — shared by the fixtures, the example apps and the
  documentation. No change to the rendered output of any chart.
- 5f69fde: **Dashboard layout types (Phase 5, first step).** The core's internal surface gains the types of
  the upcoming Dashboard composition (`DashboardProps`, `DashboardLayout`, `DashboardCellLayout`,
  `DashboardModel`, …) and their defaults: `DASHBOARD_DEFAULTS` (1 / 2 / 4 columns at `sm` / `md` /
  `lg`, row unit 240 px, gap 16 px), `perBreakpoint` and `resolveLayout`. A dashboard's `id` and its
  `title` or `label` are required by the type. No component uses them yet; no change to the rendered
  output.
- 5191333: **Linked dashboards.** A dashboard with `link={{ key: 'hour' }}` marks, in every other chart, the items
  whose datum carries the same `hour` as the active item of the chart being explored, and clears them
  when it clears. The marks are hidden from assistive technology, and linked state never reaches the
  server render. The dashboard reports the linked value through `onLinkChange` (React),
  `@link-change` (Vue) or `(linkChange)` (Angular). A chart whose data has no such field warns `SP016`.
  In React the link is its own client boundary, `@silverpoint/react/dashboard-link`, rendered only when
  `link` is set.
- 81f9b59: **Dashboard resolution in the core.** `resolveDashboard(props, childCells)` matches children to
  layout cells by id, keeps the reading order, clamps spans to the breakpoint's columns (`SP014`),
  reports every mismatch without throwing (`SP015`), derives chart ids (`ops--traffic`), and gives
  each cell its nominal box at `ssrWidth`. `cellChartBox` sizes a chart to fill its cell with its
  own card chrome subtracted. New diagnostic codes `SP014`, `SP015`, `SP016`. No change to the
  rendered output of any chart.
- 5359ab8: **The demo applies view props; `VolvelleChart`'s index turns it.** Without `data`, a chart
  renders its demo dataset (REQ-093). It now follows one written rule (REQ-098): accessor props
  (`…Key`, `keys`, `names`) are ignored, because they point into your rows, and every other prop
  applies exactly as it would to your data.
  
  - **Behaviour change.** `<VolvelleChart indexRing={1} indexValue="Night" />` without `data` now
    turns the demo so `Night` faces the pointer, and the readout becomes `Day Sat · Shift Night ·
    Team Eridanus`. Before, the demo kept its own index and a development-only `SP002` said so; that
    warning is gone. An out-of-range `indexRing` or an absent `indexValue` warns `SP002` and falls
    back, as it does with your rings.
  - **Rendered output.** The normalised SVG changes only for a `VolvelleChart` given `indexRing` or
    `indexValue` without `data`. With no index, and in every canonical fixture, it is unchanged.
  - **Props reference (REQ-099).** Every accessor prop's documentation ends "Ignored without
    `data`."; `data` states the rule; `indexRing` and `indexValue` name the demo's rings.
- 8ee76ad: **React `Dashboard`.** `@silverpoint/react/dashboard` and `@silverpoint/react/server/dashboard` export
  `Dashboard` and `DashboardCell`: a `section` labelled by its heading, a CSS-grid of `article` cells in
  reading order, laid out by the core from a data-only `layout`. Each chart inside a cell gets a derived
  id, a size that fills its cell with its own card chrome, and the dashboard's `ground`, `substrate`,
  `mode` and `locale` below its own props. Neither entry adds a client boundary.
  
  Server charts (`@silverpoint/react/server/*`) no longer require `id`, `width` and `height` by type:
  inside a `Dashboard` the cell supplies them; standing alone, a missing one warns (`SP002`, `SP003`).
  
  The reference dashboards moved to their own subpath, `@silverpoint/core/dashboard-demos`, off the
  core's main entry. No change to any chart's rendered output.
- ed5b943: **Vue `SpDashboard`.** `@silverpoint/vue/dashboard` exports `SpDashboard` and `SpDashboardCell`, with
  the same markup, layout and inheritance as the React `Dashboard`: each chart inside a cell takes its
  id, size and the dashboard's configuration from the cell, below its own props. Server-rendered with
  `@vue/server-renderer`, it hydrates at the nominal size and then follows its container.

## 0.1.1

### Patch Changes

- **Package pages and the release pipeline.** Every package now ships a README, so its npm page
  explains how to install it. The React, Vue and Angular READMEs give the tested quickstart and
  examples for a provider, precision mode, interaction, a custom readout, the imperative handle and
  server rendering. From this release on, the packages are published from CI on every merge into
  `main`, through npm Trusted Publishing and with provenance. No change to the rendered output.
