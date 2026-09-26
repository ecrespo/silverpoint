# Technical Design delta — Dashboard composition

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-25 ("Apruebo el cambio que mencionas, las 4 puertas del dashboard y el delta-011") — gate 3; **folded into `specs/technical-design.md` (v1.5) on 2026-09-25** |
| **Amends** | [Technical Design](../../specs/technical-design.md) v1.4 → v1.5: §3.2, §3.3, new DD-013..DD-018, §5.1, §8, §10 |
| **Inputs** | [`prd-delta.md`](prd-delta.md), [`api-delta.md`](api-delta.md), [`research.md`](research.md) |

## 1. Components (§3.2) — additions

| Component | Package | Responsibility |
|---|---|---|
| `dashboard/resolve.ts` | core | `resolveDashboard`: defaults, span clamping, cell matching, chart ids, CSS variables, nominal boxes |
| `dashboard/cell-box.ts` | core | `cellChartBox`: cell box → chart width and drawing-area height, reusing `cardLayout`'s chrome measure |
| `interaction/linked.ts` | core | `linkedItems`: items of a model whose datum matches a value |
| `Dashboard` / `DashboardCell` | react, vue, angular | Call the core, write the wrapper, the heading and the variables; provide the cell box and the inherited config to the charts below |
| `.sp-dashboard` rules | grounds (stylesheet) | CSS Grid, the three `@container` breakpoints, gap and heading type from ground tokens |

## 2. Data flow (§3.3)

```
DashboardProps + [cell id of each child]  ──►  core.resolveDashboard  ──►  DashboardModel
                                                                         │
            adapter writes <section> + --sp-* vars; per cell <article>   │
                         and a cell context { box, chartId, config } ◄───┘
                                                                         │
chart inside cell: id ?? chartId; size ?? core.cellChartBox(box, props) ─┘──► existing chart pipeline

client only, when `link`:  chart A active item ─► dashboard link value (one reactive value)
                           ─► each chart: core.linkedItems(model, key, value) ─► `part="linked"` marks
```

## 3. Design decisions

### DD-013: Composition by children, layout matched by cell id

- **Decision:** charts are children (`<DashboardCell cell="traffic"><LineChart/></DashboardCell>`);
  the layout is a separate, data-only object matched to children by `cell` id.
- **Options:**

| Option | For | Against |
|---|---|---|
| **A. Children + layout by id (chosen)** | Each chart is imported by its own subpath (REQ-107 holds); the layout is JSON and becomes the fixture; framework-idiomatic | Two things to keep in step — mismatches are warned, never thrown (REQ-205) |
| B. JSON cells naming chart types (`{ chart: 'LineChart', props }`) | One object describes everything (Highcharts, Grafana) | Needs a registry of all 33 charts, which defeats tree-shaking; props lose their per-chart types; functions (tooltip renderers) cannot live in JSON |
| C. Coordinates (`row`, `col`, `x/y/w/h`) | Precise placement | Serves drag-and-drop, which is out of scope; lets visual order diverge from DOM order (WCAG 1.3.2) |

### DD-014: CSS Grid with container queries, three fixed breakpoints

- **Decision:** the wrapper is `display: grid; container-type: inline-size`. Columns and spans are
  CSS variables written from the model; the stylesheet switches between the `sm`/`md`/`lg`
  variables with `@container` at 640 px and 1024 px.
- **Context:** `@container` conditions cannot read `var()`, so breakpoint widths cannot be
  per-dashboard props; they are fixed and documented, while columns and spans per breakpoint stay
  configurable.
- **Rejected:** viewport media queries (a dashboard in a sidebar is narrow on a wide screen);
  JS-measured placement or masonry (DOM measurement to place cells — REQ-202 — and a server render
  that cannot match the client).
- **No `order`, no `dense`, no line placement** (REQ-203): `grid-auto-flow: row`. A wide cell that
  does not fit leaves a gap at the row end rather than pulling a later cell forward. The
  documentation shows how to order cells to avoid gaps.

### DD-015: Nominal boxes in the core; hydrate at nominal, then measure

- **Decision:** the core computes each cell's box at `ssrWidth` for the `lg` breakpoint — when
  `ssrWidth` is under 1024 px, for the breakpoint it falls in —
  `width = (ssrWidth − gap·(cols−1)) / cols · span + gap·(span−1)`,
  `height = rowHeight·rowSpan + gap·(rowSpan−1)`, 2 decimals. `cellChartBox` subtracts the chart's
  card chrome (title, value, footers — already known to `cardLayout`) from the height.
  The server and the hydration pass render at that box; after hydration, the chart's existing
  container measurement takes over (REQ-207).
- **Rejected:** requiring `width` on every chart in a server-rendered dashboard (unusable); scaling
  one SVG by `viewBox` to fill the cell (scales text off the type scale of DD-010 and the 9.5 px
  label rules, and breaks the golden images).
- **Consequence:** a phone that receives a server render sees one re-render after hydration; the
  first paint is still a correct chart, only at the nominal width. Documented, and `ssrWidth` lets
  a mobile-first app choose `360`.

### DD-016: Linked interaction — one value per dashboard, matching in the core

- **Decision:** the dashboard holds one reactive value `{ key, value } | null`. A chart publishes
  its active item's `datum[key]`; every other chart asks `linkedItems(model, key, value)` and marks
  those items with `part="linked"`. Matching is by **value**, like Recharts' `syncMethod: 'value'`,
  never by index — charts with different rows still line up, and a chart without the value shows
  nothing (REQ-217).
- **Why value, not index:** index matching is right only when every chart shares the same rows,
  which a dashboard rarely does.
- **Not an active item:** the linked mark fires no `onActiveChange`, no readout, and no
  announcement (REQ-218); it is `aria-hidden` decoration over the chart.
- **Client only** (REQ-219): the React server entry point rejects `link` by type; the Vue and
  Angular server renders never hold a value.

### DD-017: Parity extends to the wrapper markup

- **Decision:** dashboard fixtures render wrapper + charts. The DD-004 tree comparison parses the
  whole fragment (HTML wrapper and inline SVG) with the same parser and compares element names,
  attributes (sorted) and text; numbers in `style` variables are compared at 2 decimals like
  coordinates. No string normalisation is added.
- **Pixel gates** run each dashboard fixture at three container widths — 375, 800, 1280 px — one
  per breakpoint (REQ-211).
- **Framework noise:** adapters must not emit comments or empty text nodes in the wrapper; the
  existing rule that strips framework hydration markers from chart SVG is applied to the wrapper
  too, and it is the only stripping allowed.

### DD-018: No new package; `dashboard` subpath in each adapter

- **Decision:** the code lives in the existing packages behind a `dashboard` subpath each.
- **Why:** the six packages share one version (Changesets `fixed`), and a new package would need its
  own trusted publisher before its first release; the dashboard depends on internals of each
  adapter (chart context, measurement) that a separate package would have to make public.

## 4. Monorepo structure (§5.1) — additions

```
packages/core/src/dashboard/{resolve.ts, cell-box.ts, types.ts}
packages/core/src/interaction/linked.ts
packages/react/src/dashboard/{dashboard.tsx, dashboard-cell.tsx, dashboard-link.tsx}
packages/react/src/server/dashboard.tsx
packages/vue/src/{SpDashboard.vue, SpDashboardCell.vue, dashboard.ts}
packages/angular/dashboard/{sp-dashboard.ts, sp-dashboard-cell.ts, public-api.ts, ng-package.json}
packages/grounds/src/styles/dashboard.css
fixtures/dashboard/<name>--<substrate>--<mode>--<breakpoint>.{fixture.json, canonical.txt}
examples/*/…/dashboard page
```

## 5. Testing strategy (§8) — additions

| Level | What | REQ |
|---|---|---|
| Core unit | Defaults, clamping (`SP014`), mismatch (`SP015`), chart ids, nominal boxes, chrome subtraction, `linkedItems` with missing values, 24-cell benchmark | 201, 204–206, 208, 209, 216, 217 |
| Adapter unit | Wrapper markup, variables, precedence of inherited config, name required by type (type test), no link on the server entry | 200, 212–214, 219 |
| Parity (Node) | Parsed-tree gate on the dashboard fixtures, three adapters vs canonical | 210 |
| Pixel (Docker) | Three widths per fixture | 211 |
| E2E (four apps) | Hydration without mismatch, then measured re-render; axe; Tab order = reading order; linked marks appear and clear | 207, 215, 216, 218, 221 |
| Budget | size-limit on each `dashboard` subpath; path-weight on the 12-card reference | 220, NFR |
| Lint | No `order`/`dense`/`grid-row-start`/`grid-column-start` in the dashboard stylesheet | 203 |

## 6. Open questions (§10) — additions

| # | Question | Leaning / decision |
|---|---|---|
| OQ-D1 | One heightening per dashboard, or per chart? | **Decided 2026-09-25:** one heightening **per chart**, as Art. 6 says; the dashboard adds no cap and no diagnostic |
| OQ-D2 | DD-007 scopes hatch tiles per instance (REQ-030). A dashboard could share one `<defs>` of tiles across its cards and cut weight further, at the cost of per-chart stroke variation | Out of this feature; measure on the reference dashboard first |
| OQ-D3 | Shared scales (Vega-Lite `resolve`) | Future Considerations; needs a common domain prop |
| OQ-D4 | Release version | **Decided 2026-09-25:** the line stays on 0.x; ships in **`0.2.0`** (changeset `minor` from 0.1.1). `1.0.0` stays parked |

## Constitution check

- **Art. 1** — the dashboard draws no encoding; linked marks are an overlay and change no vertex.
- **Art. 2** — every size and span is computed in the core (DD-015); adapters write variables.
- **Art. 3** — parity grows to the wrapper (DD-017), pixel gates per breakpoint.
- **Art. 4** — no measurement or time on the server path; ids from dashboard + cell.
- **Art. 5 / Art. 8** — landmark and reading order; CSS Grid, no CSS framework, budgets.
- **Exception requested:** none.
