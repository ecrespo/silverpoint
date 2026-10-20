---
'@silverpoint/core': minor
'@silverpoint/grounds': minor
'@silverpoint/react': minor
'@silverpoint/vue': minor
'@silverpoint/angular': minor
'@silverpoint/fonts': minor
'@silverpoint/tailwind': minor
---

**Palettes, composed components, overlays and the timeline, close-out (feature-004, step 8h):
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
