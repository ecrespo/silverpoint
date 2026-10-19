---
'@silverpoint/react': minor
'@silverpoint/vue': minor
'@silverpoint/angular': minor
---

`SpPagination`, `SpCollapse`, `SpCollapseItem`, `SpTextarea` and `SpInputNumber` (T-214), each on
its own `ui/<name>` subpath and on the `ui` barrel. Pagination binds `current` (React
`current`/`defaultCurrent`/`onChange`, Vue `v-model:current`, Angular `[(current)]`). A collapse item
is a native `<details>`: it binds `open` and reports `toggle`, and an `accordion` makes its items
exclusive through the native `name`. Textarea and InputNumber bind `value` and, in Angular, are
ControlValueAccessors. An InputNumber reports a typed value when it is committed (blur or Enter),
clamped and rounded; its steppers report the next value at once.
