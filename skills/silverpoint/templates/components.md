# UI and composed components

Every component is named `Sp<Name>` in the three frameworks (`SpButton`, `<sp-input>`), imported
from its own subpath (`@silverpoint/react/ui/button`), and drawn in the same ground as the
charts. Import `@silverpoint/grounds/ui.css` once, after `styles.css`.

## Binding a value

| | Controlled | Uncontrolled | Change |
|---|---|---|---|
| React | `value` (`checked` for Checkbox and Switch) | `defaultValue` (`defaultChecked`) | `onChange(value)`: the value, not the DOM event |
| Vue | `v-model` | omit `v-model`, pass `default-value` | `update:modelValue`, then `change` on commit |
| Angular | `[(value)]`, or `formControl` / `ngModel` | `[defaultValue]` | `(valueChange)` |

Value events fire on user input only, never on a prop change, and never for a disabled component
or item. Angular value components are `ControlValueAccessor`s, so they work in reactive and
template-driven forms.

## Server rendering

In React, display components also have server entries (`@silverpoint/react/server/ui/<name>`):
`card`, `tag`, `badge`, `divider`, `progress`, `alert`, `skeleton`, `steps`, `surface`, `glyph`,
`table` (unsortable), `breadcrumb`, `avatar`, `statistic`, `descriptions`, `timeline-list`, `empty`
and `result`. Every other component is a client component.

## Notes

- `SpButton` is an attribute component in Angular (`<button spButton>`, `<a spButton>`), so your own
  element is the control. `SpSurface` is `[spSurface]` in the same way.
- `SpTabs` renders `SpTabPanel` children matched by `value`.
- `SpTable` draws its rows as given: sort them yourself on `onSort` (`@sort`, `(sort)`), which also
  keeps paging with `SpPagination` correct.
- A link's `href` (`SpButton`, `SpBreadcrumb`) keeps relative URLs and the `http`, `https`,
  `mailto` and `tel` schemes. Any other is dropped with `SP017`.
- Named content: React takes node props, Vue slots (`prefix`, `suffix`, `extra`, `footer`), and
  Angular templates (`<ng-template spExtra>`, `spFooter`, `spPrefix`, `spSuffix`).

<!-- generated:components -->
