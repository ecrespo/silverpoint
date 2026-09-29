---
'@silverpoint/core': minor
'@silverpoint/grounds': minor
'@silverpoint/react': minor
'@silverpoint/vue': minor
'@silverpoint/angular': minor
---

**First UI components: batch B1 (feature-002, step 6c).** `SpButton`, `SpInput`, `SpCheckbox`,
`SpSwitch`, `SpCard` and `SpDivider` in React (`@silverpoint/react/ui/<name>`, plus
`server/ui/card` and `server/ui/divider` for Server Components), Vue (`@silverpoint/vue/ui/<name>`)
and Angular (`@silverpoint/angular/ui/<name>`; `SpButton` decorates the consumer's own `<button>`).
The markup is the core's view tree (`@silverpoint/core/ui`: `resolveUi`, `ui*View`), identical in
the three adapters; `ui.css` gains their layout and folds frame slots and tone states onto each
ground's tokens. The Angular adapter now takes `@angular/forms` as a peer, for its
ControlValueAccessors, and its tokens and environment move to `@silverpoint/angular/env`
(re-exported from `@silverpoint/angular`). No change to the rendered output of any chart.
