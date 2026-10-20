---
'@silverpoint/core': patch
---

`timelineMount` (`@silverpoint/core/timeline`, T-222) builds TimelineJS in a `<div>` of its own inside
the mount, so TimelineJS's `className` rewrite leaves the mount's `sp-kl-mount` class alone, and hands
it a copy of `data` (`structuredClone`): TimelineJS writes each slide's `unique_id` into its data,
which threw on a frozen object such as `TIMELINE_DEMO` and left the timeline loading forever. An
error thrown while TimelineJS is built is now handled as a failed load: its container is removed,
`SP025` is warned and the fallback is shown.
