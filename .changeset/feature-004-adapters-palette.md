---
'@silverpoint/react': minor
'@silverpoint/vue': minor
'@silverpoint/angular': minor
---

`palette` on every chart, UI component and dashboard, and on the provider (T-212): the root's
`style` holds the palette's declarations, merged element → dashboard → provider field by field, and
`toSVGString()` carries it. A provider inside another scopes a section: its own fields win and the
rest are inherited. React's `SilverpointProvider` nests; Vue adds a `SilverpointProvider` component
for sections (it renders no element); Angular's `provideSilverpoint` now returns a `Provider`, so it
also works in a component's `providers`. A dashboard's root carries its own palette.
