# Reflex

`reflex-silverpoint-react` {{reflexVersion}} wraps the React components for Reflex, so the same
charts and components are Python builders. For anything beyond names and a first example, use the
`reflex-silverpoint` skill, which covers state, events and the demo app's patterns.

```sh
pip install reflex-silverpoint-react
```

- Builders are snake_case: `line_chart`, `sankey_chart`, `sp_modal`, `sp_select`. Props are
  snake_case too (`x_key`, `value_key`), with the same meaning as in React.
- Data comes from a `rx.State` field, as a list of dicts.
- `palette` takes a preset's name (`"sanguine"`).
- An overlay's `trigger` is the trigger's text.

<!-- generated:reflex-examples -->

## Builders

<!-- generated:reflex-names -->
