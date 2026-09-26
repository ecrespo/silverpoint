# Research — how charting and UI libraries compose dashboards

> Input to [`prd-delta.md`](prd-delta.md). Gathered 2026-09-25 from current documentation; each
> row cites its source. Libraries that could not be verified are listed as such.

## Survey

| Library | Layout model | How a cell is declared | Responsive | Cross-chart sync | SSR | Accessibility | Serialisable config |
|---|---|---|---|---|---|---|---|
| **Highcharts Dashboards** | `gui.layouts → rows → cells` (Flexbox, % sizes), nestable | `{ type, renderTo: cellId }`, components (Highcharts, KPI, Grid, HTML) | CSS media or container queries | `sync: { highlight, extremes, visibility, crossfilter }`, only between components sharing a DataPool connector, narrowed by `group` | Client-only | Via the Highcharts a11y module | Partial: `board.getOptions()`, functions dropped |
| **Grafana** | 24-column grid, `gridPos { x, y, w, h }`, `h` = 30 px, gravity pulls panels up | Panel JSON | Grid collapses | Dashboard-wide `graphTooltip`: none / shared crosshair / crosshair + tooltip | App | — | Yes (JSON model) |
| **Tremor** (React) | `<Grid numItems numItemsSm/Md/Lg>` + `<Col numColSpan…>` | Children | Tailwind breakpoints | None | Plain React | — | No |
| **Recharts** | — (single chart) | — | — | Same `syncId` shares Tooltip and Brush; `syncMethod: 'index' \| 'value' \| fn` | Yes | — | — |
| **ECharts** | — | — | — | `chart.group = 'g'; echarts.connect('g')` shares tooltip and axisPointer | `ssr: true` + `renderToSVGString()` per chart | — | Options JSON |
| **Chart.js** | — | — | — | None in core; `chartjs-plugin-crosshair` `sync: { group }` | — | — | — |
| **Vega-Lite** | `concat` / `hconcat` / `vconcat` / `facet` / `repeat` / `layer` | One JSON spec | Autosize | **Shared scales** by `resolve: { scale\|axis\|legend: { channel: 'shared'\|'independent' } }` — deterministic, not an event bus | Yes (vega-cli) | — | Fully |
| **Observable Framework** | CSS classes `grid grid-cols-{2,3,4}`, `grid-colspan-*`, `grid-rowspan-*`, `grid-auto-rows: 1fr` | Markup + `card` | 4 → 2 → 1 and 3/2 → 1 | None | Static Markdown, charts on the client | Card title `h2`, subtitle `h3` | No |
| **Kendo UI TileLayout** (React, Vue, Angular) | CSS Grid: `columns`, `rowHeight`, `gap`; items `rowSpan`, `colSpan`, `col`, `row`, `order` | Items array | — | None | — | Container `role=list`, tiles `role=listitem` + `aria-labelledby` header | App persists `onReposition` |
| **Syncfusion Dashboard Layout** (React, Vue, Angular) | `columns`, `cellSpacing`, `cellAspectRatio`; panels `row`, `col`, `sizeX`, `sizeY` | Panels | Stacks at ≤ 600 px (`mediaQuery`) | None | — | WAI-ARIA; keyboard "not applicable" | `serialize()` |
| **Unovis** (React, Vue, Angular, Svelte, Solid) | Composition *inside* one chart (`XYContainer`, `SingleContainer`) | Children | — | None documented | `@unovis/ssr` (jsdom shims) | — | — |
| **Evidence.dev** | `<Grid cols=2>`, `<Group>` | Children | Stacks on narrow screens | None | Static build | — | No |
| **Monocharts** (the catalog's functional reference) | Not verified: no dashboard, grid or sync concept found in readable sources | — | — | — | — | — | — |

Sources:
[Highcharts layout](https://www.highcharts.com/docs/dashboards/layout-description) ·
[sync](https://www.highcharts.com/docs/dashboards/synchronize-components) ·
[edit mode](https://www.highcharts.com/docs/dashboards/edit-mode) ·
[get options](https://www.highcharts.com/docs/dashboards/get-options) ·
[Grafana JSON model](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/view-dashboard-json-model/) ·
[Tremor changelog](https://npm.tremor.so/changelog) ·
[Recharts synchronized](https://recharts.github.io/en-US/examples/SynchronizedLineChart/) ·
[ECharts API](https://echarts.apache.org/en/api.html) ·
[ECharts SSR](https://echarts.apache.org/handbook/en/how-to/cross-platform/server/) ·
[chartjs-plugin-crosshair](https://chartjs-plugin-crosshair.netlify.app/options) ·
[Vega-Lite resolve](https://vega.github.io/vega-lite/docs/resolve.html) ·
[Vega-Lite concat](https://vega.github.io/vega-lite/docs/concat.html) ·
[Observable Framework markdown](https://github.com/observablehq/framework/blob/main/docs/markdown.md) ·
[Kendo TileLayout](https://www.telerik.com/kendo-react-ui/components/layout/tilelayout) ·
[Syncfusion responsive](https://ej2.syncfusion.com/react/documentation/dashboard-layout/responsive-adaptive) ·
[Syncfusion a11y](https://help.syncfusion.com/chart-sdk/vue/dashboard-layout/accessibility) ·
[Unovis](https://unovis.dev/docs/intro) ·
[Unovis SSR PR](https://github.com/f5/unovis/pull/873) ·
[Evidence Grid](https://docs.evidence.dev/components/ui/grid)

## What silverpoint takes, and what it leaves

| # | Observation | Consequence for silverpoint |
|---|---|---|
| 1 | Coordinates (`gridPos`, `row/col/sizeX`) exist to serve drag-and-drop. The libraries that are not builders (Observable, Evidence, Tremor) offer only columns, column span and row span | **Take** the small model: columns per breakpoint, `colSpan`, `rowSpan`. **Leave** coordinates and `order` (PRD §5.2 keeps builders out) |
| 2 | Everyone stacks to one column on narrow screens; Observable collapses 4 → 2 → 1 | **Take** three container breakpoints with 1 / 2 / 4 columns by default |
| 3 | Grids are CSS; container queries beat viewport media queries for a component placed anywhere | **Take** CSS Grid driven by `--sp-` custom properties plus `@container` — no maths in the adapter, no DOM measurement to place cells (Art. 2, Art. 8) |
| 4 | Every hover sync is a runtime event bus (`syncId`, `connect`, `sync.group`); Recharts needed `syncMethod: 'value'` for charts whose data do not line up | **Take** a named link group matching by **category value**, resolved in the core; **specify** what a chart with no matching item does (shows nothing, never interpolates) |
| 5 | Vega-Lite's `resolve` is the only deterministic, serialisable shared scale | **Defer**: silverpoint's cartesian charts have no common domain prop yet; shared scales go to Future Considerations with this as the reference model |
| 6 | Highcharts needs a shared DataPool before components sync — the dependency is explicit | **Take** the explicitness: a chart joins a link group only by an explicit key; no hidden coupling |
| 7 | Serialisation breaks where functions live (`getOptions()` drops events) | **Take** a data-only `DashboardLayout` — it doubles as the parity fixture |
| 8 | Observable's `h2`/`h3` card headings and Kendo's `list`/`listitem` + `aria-labelledby` are the accessible models; Syncfusion has no keyboard support | **Take** a labelled `section` region with a heading and one labelled `article` per cell; charts keep their own keyboard model (REQ-122) |
| 9 | No dashboard layer surveyed claims SSR output identical across frameworks; ECharts and Unovis render single charts to SVG only | **Differentiator**: a server-renderable dashboard held to the Art. 3 parity gate across three adapters |
| 10 | `order` and dense auto-flow make visual order differ from DOM order (WCAG 1.3.2, 2.4.3) | **Rule**: DOM order is reading order at every breakpoint; no `order`, no `dense` |
