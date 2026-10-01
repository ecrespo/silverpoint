# @silverpoint/core

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
- 5a1b53f: **UI components in the core (feature-002, step 6a).** The new subpath `@silverpoint/core/ui` holds
  the framework-neutral half of the 17 UI components of `0.3.0`: their props types (`SpButtonProps` …), the catalog `UI_COMPONENTS`, value
  geometry (`uiValue`, `uiRateCount`, `uiProgressArc`, `uiSteps`), the WAI-ARIA roving-focus
  transition `uiRovingKey`, the frame variant and outlines (`uiFrameVariant`, `uiFrameOutline`,
  `UI_FRAME_KINDS`), and the checks `uiItems` and `uiRequireName`. The reference states `UI_DEMOS`
  live on the new subpath `@silverpoint/core/ui-demos`. New diagnostic codes `SP017`, `SP018`,
  `SP019`. The main entry is unchanged, and so is the rendered output of every chart.
- 10cc90a: **UI tokens and tone tiles in the core (feature-002, step 6b).** `Ground` gains an optional `ui`
  section (Data Model §3.8: frame style and variants, control heights, radius, focus width, tone per
  state); a ground without it takes `UI_TOKEN_DEFAULTS`. `@silverpoint/core/ui` gains
  `resolveUiTokens`, which holds a ground's tokens to their domain, and `uiToneTile`, the seamless
  tile geometry the grounds build draws a control's tone from. No change to the rendered output of
  any chart.

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
