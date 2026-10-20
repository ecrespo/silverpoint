# @silverpoint/fonts

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

## 0.6.0

No changes in this release.

## 0.3.0

### Minor Changes

- eb2bd8e: **UI components, close-out (feature-002, step 6f): `0.3.0`.** The 17 `Sp`-prefixed components are
  verified end to end on the UI page of the four example apps —keyboard patterns, native form
  submit, focus ring, target size, reduced motion, RTL, axe A/AA— and documented on the site with a
  live example per state and a props reference read from the types. Every prop of the UI types now
  carries its JSDoc. Angular: `SpUiControl` hands the `.sp-ui` root to the roving-focus helper, so a
  `dir="rtl"` set on the component mirrors the arrows. Grounds: `ui.css` removes the browser's own focus ring from
  the native, text and range controls, whose exact ring is drawn on their item, box or thumb, so a
  focused `SpInput` shows one ring, not two. The seven packages move together to `0.3.0`;
  the rendered output of every chart is unchanged.

## 0.2.0

No changes in this release.

## 0.1.1

### Patch Changes

- **Package pages and the release pipeline.** Every package now ships a README, so its npm page
  explains how to install it. The React, Vue and Angular READMEs give the tested quickstart and
  examples for a provider, precision mode, interaction, a custom readout, the imperative handle and
  server rendering. From this release on, the packages are published from CI on every merge into
  `main`, through npm Trusted Publishing and with provenance. No change to the rendered output.
