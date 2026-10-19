---
'@silverpoint/core': minor
---

`uiOverlaySync(element, kind, open)` on `@silverpoint/core/ui` (T-215): opens or closes a native
overlay as its state says —`showModal()`, `show()` or `close()` for a `<dialog>`, `showPopover()` or
`hidePopover()` for a popover— only when the element is in the other state, so no second `close` or
`toggle` event fires. Without the Popover API a popover stays in the page's flow.
