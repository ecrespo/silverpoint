---
'@silverpoint/core': minor
'@silverpoint/react': minor
'@silverpoint/vue': minor
'@silverpoint/angular': minor
---

`SpTimeline` on `@silverpoint/react/timeline`, `@silverpoint/vue/timeline` and
`@silverpoint/angular/timeline` (T-221): a Knight Lab TimelineJS timeline inside the ground's surface,
with `@knight-lab/timelinejs` `^3.9.13` an optional peer. The server renders the surface, its probes
and an empty mount; the client imports TimelineJS after render, builds it there without the `font`
and `theme` options, and forwards its seven events (`change`, `loaded`, `navNext`, `navPrevious`,
`zoomIn`, `zoomOut`, `backToStart`) as each framework's props, emits or outputs. If TimelineJS cannot
be loaded, the mount shows the `fallback` (React's prop, Vue's slot, Angular's
`<ng-template spFallback>`), `SP025` is warned in development, and nothing throws. Import the subpath
only with the peer installed. The core's `@silverpoint/core/timeline` gains `timelineMount`,
`timelineOptions` and `TIMELINE_EVENTS`, which the three adapters share, and `UiSlot` gains
`fallback`.
