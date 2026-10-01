# @silverpoint/tailwind

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

### Minor Changes

- dd1f82c: **`@silverpoint/tailwind`, an optional Tailwind preset.** It names the public `--sp-` variables as
  theme tokens (REQ-047): `bg-sp-substrate`, `text-sp-ink`, `border-sp-rule` and the other
  colours, plus `font-sp-display` and `rounded-sp`. For Tailwind 4, `@import
  '@silverpoint/tailwind/theme.css'`; for 3.4, `presets: [require('@silverpoint/tailwind')]`. The
  values stay in `@silverpoint/grounds`, so the utilities follow the ground, the substrate and your
  overrides. It depends on nothing, not even Tailwind, and no silverpoint package depends on it.
