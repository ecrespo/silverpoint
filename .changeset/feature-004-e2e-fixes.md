---
'@silverpoint/core': minor
'@silverpoint/react': patch
'@silverpoint/vue': patch
'@silverpoint/angular': patch
---

Fixes found by the end-to-end pass over the composed page (T-223). A disabled `SpCollapseItem`'s
summary now carries `tabindex="-1"`, so Tab skips it as it skips every disabled control (REQ-522);
this changes the normalised markup of a disabled item. `SpTooltip` hides on Escape wherever focus is,
not only on its trigger, so a tooltip shown by hover can be dismissed without moving the pointer
(WCAG 1.4.13, REQ-496).
