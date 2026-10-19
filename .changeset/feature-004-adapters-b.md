---
'@silverpoint/react': minor
'@silverpoint/vue': minor
'@silverpoint/angular': minor
---

The overlays (T-215, T-216): `SpModal`, `SpDrawer`, `SpPopover`, `SpTooltip`, `SpSelect`,
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
