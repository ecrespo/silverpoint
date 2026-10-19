---
'@silverpoint/core': patch
'@silverpoint/grounds': patch
'@silverpoint/vue': patch
---

Fixes found by the pixel gate of the new components (T-219): `uiAnchor` re-places an overlay when
its trigger or the overlay changes size, as when a web font replaces its fallback; the AvatarGroup's
overlap and the dividers between CollapseItems also hold through the `display: contents` wrappers an
Angular host keeps around each child; a Vue `SpDropdownMenu` mounted open focuses its active item, as
React's and Angular's do.
