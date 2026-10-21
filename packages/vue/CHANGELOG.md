# @silverpoint/vue

## 0.8.0

### Patch Changes

- @silverpoint/core@0.8.0
  - @silverpoint/grounds@0.8.0

## 0.7.0

### Minor Changes

- de97c3e: The first composed components (T-213): `SpSurface`, `SpGlyph`, `SpTable`, `SpBreadcrumb`,
  `SpAvatar`, `SpAvatarGroup`, `SpStatistic`, `SpDescriptions`, `SpTimelineList`, `SpEmpty` and
  `SpResult`, each on its own `ui/<name>` subpath and on the `ui` barrel. React also has
  `server/ui/<name>` for Server Components. A sortable table header reports its column's key (React
  `onSort`, Vue `@sort`, Angular `(sort)`); the consumer sorts the rows with `uiSortRows`. Empty and
  Result take actions in `extra` (React prop, Vue slot, Angular `<ng-template spExtra>`). In Angular,
  the surface is the attribute component `[spSurface]` on the consumer's own element.
- 3e1ba8c: `SpPagination`, `SpCollapse`, `SpCollapseItem`, `SpTextarea` and `SpInputNumber` (T-214), each on
  its own `ui/<name>` subpath and on the `ui` barrel. Pagination binds `current` (React
  `current`/`defaultCurrent`/`onChange`, Vue `v-model:current`, Angular `[(current)]`). A collapse item
  is a native `<details>`: it binds `open` and reports `toggle`, and an `accordion` makes its items
  exclusive through the native `name`. Textarea and InputNumber bind `value` and, in Angular, are
  ControlValueAccessors. An InputNumber reports a typed value when it is committed (blur or Enter),
  clamped and rounded; its steppers report the next value at once.
- 449ce95: The overlays (T-215, T-216): `SpModal`, `SpDrawer`, `SpPopover`, `SpTooltip`, `SpSelect`,
  `SpDropdownMenu`, `SpToast` and `SpToaster`, each on its own `ui/<name>` subpath and on the `ui`
  barrel. Modal and Drawer are a native `<dialog>`; Popover, Tooltip, the Select list and the Menu use
  the Popover API, placed against their trigger. Each binds `open` (React `open`/`defaultOpen`/
  `onOpenChange`, Vue `v-model:open`, Angular `[(open)]`). The trigger is the consumer's element: a
  `trigger` prop in React, a `trigger` slot in Vue, an element marked `spTrigger` in Angular. It gets
  the ARIA of the overlay's pattern, on the server too. The server markup carries the open state as
  `data-state` and the client opens the overlay once rendered. Select binds `value` and is a
  ControlValueAccessor in Angular. The Select and Menu keyboards follow the APG patterns, with
  typeahead. A toast closes after its duration —its own, its toaster's, or 5000 ms— and starts its
  count again once the pointer and focus leave it. F8 moves focus to the toaster.
- ba4ec0c: `palette` on every chart, UI component and dashboard, and on the provider (T-212): the root's
  `style` holds the palette's declarations, merged element → dashboard → provider field by field, and
  `toSVGString()` carries it. A provider inside another scopes a section: its own fields win and the
  rest are inherited. React's `SilverpointProvider` nests; Vue adds a `SilverpointProvider` component
  for sections (it renders no element); Angular's `provideSilverpoint` now returns a `Provider`, so it
  also works in a component's `providers`. A dashboard's root carries its own palette.
- 8ff16f9: **Palettes, composed components, overlays and the timeline, close-out (feature-004, step 8h):
  `0.7.0`.** The 21 new components —twelve composed, seven overlays on the platform's `<dialog>`
  and Popover API, the toast and its toaster— the palettes and the optional Knight Lab timeline
  are verified end to end on the composed, palettes and timeline pages of the four example apps and
  documented on the site. Grounds: `timeline.css` gives TimelineJS's eras a strip of their own below
  the axis labels —with an era, the axis grows to 57px and the era is laid in its lowest 18px, its
  title on a plate of the substrate— so an era's title no longer falls on the major ticks' row and
  its hatching no longer crosses the labels. Angular: a server-rendered `SpToaster` no longer reaches for
  `document` when it is torn down —it unlistens F8 only where it listened, on the client— so a server
  render that holds a toaster resolves instead of hanging on a `ReferenceError`. The seven packages
  move together to `0.7.0`; the rendered output of every existing chart is unchanged.
- 61e98a2: `SpTimeline` on `@silverpoint/react/timeline`, `@silverpoint/vue/timeline` and
  `@silverpoint/angular/timeline` (T-221): a Knight Lab TimelineJS timeline inside the ground's surface,
  with `@knight-lab/timelinejs` `^3.9.13` an optional peer. The server renders the surface, its probes
  and an empty mount; the client imports TimelineJS after render, builds it there without the `font`
  and `theme` options, and forwards its seven events (`change`, `loaded`, `navNext`, `navPrevious`,
  `zoomIn`, `zoomOut`, `backToStart`) as each framework's props, emits or outputs. If TimelineJS cannot
  be loaded, the mount shows the `fallback` (React's prop, Vue's slot, Angular's
  `<ng-template spFallback>`), `SP025` is warned in development, and nothing throws. Import the subpath
  only with the peer installed. The core's `@silverpoint/core/timeline` gains `timelineMount`,
  `timelineOptions` and `TIMELINE_EVENTS`, which the three adapters share, and `UiSlot` gains
  `fallback`.

### Patch Changes

- 3625f7e: Documentation for the 0.7.0 additions (T-224). Each adapter's README lists the 38 UI components and
  shows the palettes and the timeline, with TimelineJS as an optional peer; the grounds README names
  `ui.css` and `timeline.css`, and the core README its `ui`, `palettes` and `timeline` entries.
  `SpTimelineProps.data` gains its documentation comment.
- 62258b7: Fixes found by the end-to-end pass over the composed page (T-223). A disabled `SpCollapseItem`'s
  summary now carries `tabindex="-1"`, so Tab skips it as it skips every disabled control (REQ-522);
  this changes the normalised markup of a disabled item. `SpTooltip` hides on Escape wherever focus is,
  not only on its trigger, so a tooltip shown by hover can be dismissed without moving the pointer
  (WCAG 1.4.13, REQ-496).
- dec07a4: Fixes found by the pixel gate of the new components (T-219): `uiAnchor` re-places an overlay when
  its trigger or the overlay changes size, as when a web font replaces its fallback; the AvatarGroup's
  overlap and the dividers between CollapseItems also hold through the `display: contents` wrappers an
  Angular host keeps around each child; a Vue `SpDropdownMenu` mounted open focuses its active item, as
  React's and Angular's do.
- Updated dependencies [8ff16f9]
- Updated dependencies [3625f7e]
- Updated dependencies [62258b7]
- Updated dependencies [6c0fd2c]
- Updated dependencies [449ce95]
- Updated dependencies [d4d569d]
- Updated dependencies [dec07a4]
- Updated dependencies [194c0b4]
- Updated dependencies [61e98a2]
  - @silverpoint/core@0.7.0
  - @silverpoint/grounds@0.7.0

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
- ed5b943: **Vue `SpDashboard`.** `@silverpoint/vue/dashboard` exports `SpDashboard` and `SpDashboardCell`, with
  the same markup, layout and inheritance as the React `Dashboard`: each chart inside a cell takes its
  id, size and the dashboard's configuration from the cell, below its own props. Server-rendered with
  `@vue/server-renderer`, it hydrates at the nominal size and then follows its container.

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
