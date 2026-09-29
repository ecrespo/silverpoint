---
'@silverpoint/core': minor
'@silverpoint/grounds': minor
'@silverpoint/react': minor
'@silverpoint/vue': minor
'@silverpoint/angular': minor
---

**UI components, batches B2 and B3 (feature-002, step 6c): the catalog's 17 are complete.**
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
