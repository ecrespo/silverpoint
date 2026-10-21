# @silverpoint/grounds

## 0.8.0

### Patch Changes

- @silverpoint/core@0.8.0

## 0.7.0

### Minor Changes

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
- 6c0fd2c: Two feature-004 `ui` tokens a ground may declare (T-209): `backdrop`, the tonal level behind a
  modal overlay, and `rowTone`, the level of a table's striped and hovered rows. Unset, they are 2
  and 1; the built-in grounds keep those defaults, so no ground needs a change.
  
  `ui.css` lays out the 21 feature-004 components (T-210): Surface, Glyph, Table (toned rows by the
  ground's `rowTone` level, never opacity), Pagination, Breadcrumb, Avatar, Statistic, Descriptions,
  TimelineList, Collapse, Empty, Result, Textarea, InputNumber, and the overlays on `<dialog>` and the
  Popover API —Modal, Drawer, Popover, Tooltip, Select, DropdownMenu, Toast— with a hatched backdrop at
  the ground's `backdrop` level.
  
  New opt-in stylesheet `@silverpoint/grounds/timeline.css` (T-211): Knight Lab TimelineJS drawn with
  the ground's `--sp-` properties, scoped to `SpTimeline`'s surface, and, once `timelineInk` has read
  the probes, framed and hatched with the ground's own frame masks and tone tiles.
  
  `renderChart` returns the palette's declarations as `rendered.style` (the provider's palette under the
  chart's own), and `toSVGString` writes them on its `<svg>` (T-212).

### Patch Changes

- 3625f7e: Documentation for the 0.7.0 additions (T-224). Each adapter's README lists the 38 UI components and
  shows the palettes and the timeline, with TimelineJS as an optional peer; the grounds README names
  `ui.css` and `timeline.css`, and the core README its `ui`, `palettes` and `timeline` entries.
  `SpTimelineProps.data` gains its documentation comment.
- dec07a4: Fixes found by the pixel gate of the new components (T-219): `uiAnchor` re-places an overlay when
  its trigger or the overlay changes size, as when a web font replaces its fallback; the AvatarGroup's
  overlap and the dividers between CollapseItems also hold through the `display: contents` wrappers an
  Angular host keeps around each child; a Vue `SpDropdownMenu` mounted open focuses its active item, as
  React's and Angular's do.
- Updated dependencies [8ff16f9]
- Updated dependencies [3625f7e]
- Updated dependencies [62258b7]
- Updated dependencies [449ce95]
- Updated dependencies [d4d569d]
- Updated dependencies [dec07a4]
- Updated dependencies [194c0b4]
- Updated dependencies [61e98a2]
  - @silverpoint/core@0.7.0

## 0.6.0

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
- 5146e68: **The components' stylesheet (feature-002, step 6b).** `@silverpoint/grounds/ui.css`, a new,
  opt-in stylesheet: control sizes and focus from each ground's new `ui` tokens, hand-drawn frames
  and hatch tones generated at build time by the ground's own inker and laid as CSS masks painted
  with `--sp-` properties, an exact `precision` frame, a forced-colors block, and motion only under
  `prefers-reduced-motion: no-preference`. `silverpoint` inks its frames in four variants;
  `cyanotype` keeps an exact frame and reads tone as line weight. `styles.css` is unchanged, byte
  for byte.

### Patch Changes

- Updated dependencies [281dfa5]
- Updated dependencies [41805a0]
- Updated dependencies [eb2bd8e]
- Updated dependencies [5a1b53f]
- Updated dependencies [10cc90a]
  - @silverpoint/core@0.3.0

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
- ac0571f: **Dashboard stylesheet.** `@silverpoint/grounds/styles.css` now carries the `.sp-dashboard` rules:
  a CSS Grid inside a named inline-size container, switching columns and spans at 640 px and
  1024 px of the dashboard's own width, from the `--sp-dashboard-*` and `--sp-cell-*` variables
  the adapters write. No `order`, no dense packing, no line placement: the DOM order is the reading
  order. Colours and type come from the ground's tokens only. No change to any chart's output.

### Patch Changes

- Updated dependencies [edcfb8e]
- Updated dependencies [1a8c006]
- Updated dependencies [5f69fde]
- Updated dependencies [5191333]
- Updated dependencies [81f9b59]
- Updated dependencies [5359ab8]
- Updated dependencies [8ee76ad]
- Updated dependencies [ed5b943]
  - @silverpoint/core@0.2.0

## 0.1.1

### Patch Changes

- **Package pages and the release pipeline.** Every package now ships a README, so its npm page
  explains how to install it. The React, Vue and Angular READMEs give the tested quickstart and
  examples for a provider, precision mode, interaction, a custom readout, the imperative handle and
  server rendering. From this release on, the packages are published from CI on every merge into
  `main`, through npm Trusted Publishing and with provenance. No change to the rendered output.
- Updated dependencies
  - @silverpoint/core@0.1.1
