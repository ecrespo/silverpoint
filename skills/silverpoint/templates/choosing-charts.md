# Choosing a chart

Choose a chart in two steps. First name the shape of the rows, then name what the reader is asked to
see. The recommender (`recommend_chart` on the MCP server) reads the table below. It is a reviewed
table, not a model, and a pair that is missing from it falls back on the charts that declare both.

## Data shapes

| Shape | The rows hold | For example |
|---|---|---|
| `series` | one row per point along an ordered x (time, sequence) | hits per hour |
| `categories` | one row per category with one or more values | revenue by region |
| `parts` | shares of one whole | traffic by channel |
| `matrix` | a value per pair of categories | errors by day and hour |
| `hierarchy` | one row per node, with an `id` and its `parent` (`null` for the root) | a budget by department |
| `links` | rows with a source, a target and a value | signup funnel steps |
| `points` | two or more numeric measures per row | price against rating |
| `distribution` | many raw observations of one measure | response times |
| `intervals` | a start and an end per row | task schedule |
| `events` | dated occurrences, or marks along a cycle | commits per day |
| `single` | one figure, perhaps with a target | revenue this month |
| `field` | a measure or a vector (`x`, `y`, `u`, `v`) over a plane | a wind field |

## The charts by shape and intent

<!-- generated:chart-table -->

## The recommender's table

The scores run from 0 to 1. An adjustment applies when the row count (`rows`) or the number of
value columns (`values`) passes its bound.

<!-- generated:recommend-table -->

## Common chart props

Every chart takes these, under the same names in React, Vue and Angular.

<!-- generated:common-chart-props -->

Defaults to know:

- `height` is 160, the drawing area without the card frame.
- `chrome` is `card`. `bare` drops the frame.
- `dataTable` is `hidden`: the table stays in the page for screen readers only.
- `hatchFill` is `tile`. `per-shape` traces the hatching shape by shape, which costs 10 to 40 times
  the path weight, so keep it for a hero chart or an export.

## Events

| React | Vue | Angular | Payload |
|---|---|---|---|
| `onActiveChange` | `@active-change` | `(activeChange)` | the item under the pointer or keyboard focus, or `null` |
| `onSelect` | `@select` | `(select)` | the item clicked or chosen with Enter or Space |
| `onRootChange` | `@root-change` | `(rootChange)` | the sunburst's or treemap's new root id, `null` for the data root |
