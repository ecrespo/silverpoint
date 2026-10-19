---
'@silverpoint/react': minor
'@silverpoint/vue': minor
'@silverpoint/angular': minor
---

The first composed components (T-213): `SpSurface`, `SpGlyph`, `SpTable`, `SpBreadcrumb`,
`SpAvatar`, `SpAvatarGroup`, `SpStatistic`, `SpDescriptions`, `SpTimelineList`, `SpEmpty` and
`SpResult`, each on its own `ui/<name>` subpath and on the `ui` barrel. React also has
`server/ui/<name>` for Server Components. A sortable table header reports its column's key (React
`onSort`, Vue `@sort`, Angular `(sort)`); the consumer sorts the rows with `uiSortRows`. Empty and
Result take actions in `extra` (React prop, Vue slot, Angular `<ng-template spExtra>`). In Angular,
the surface is the attribute component `[spSurface]` on the consumer's own element.
