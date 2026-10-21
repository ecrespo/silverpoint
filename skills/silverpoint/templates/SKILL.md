---
name: silverpoint
description: Build charts, dashboards and UI with the silverpoint library (React, Vue, Angular): choose the chart, write correct props, grounds and palettes. Use whenever code imports @silverpoint/* or the user mentions silverpoint charts.
---

# silverpoint

This skill describes **silverpoint {{version}}** (`@silverpoint/*@{{version}}`). If the project
installs another version, check the props you write against its types, or use the MCP server, which
answers for the version it ships with.

silverpoint draws data the way a silverpoint drawing is made: hatched tone, a hand-inked line,
prepared paper. It is 60 charts, 38 UI components, a dashboard and a timeline, with one API in
React, Vue and Angular, and a Python wrapper for Reflex (`reflex-silverpoint-react`). Every render
is deterministic: the same props and seed draw the same SVG on the server and in the browser.

## Prefer the MCP server when it is connected

When the `silverpoint` MCP server is connected, prefer its tools over these files. They read the
same catalog as these references, and they also check and draw:

- `recommend_chart`: up to five charts for a data shape and an intent.
- `get_chart`, `get_component`: props, data fields, imports and names in each framework.
- `generate_code`: the imports, stylesheets and code for one chart or component in one framework.
- `validate_props`: every diagnostic the library raises for a set of props, and the props it does
  not declare.
- `render_chart`: the chart as a standalone SVG, so you can look before you write the code.
- `check_palette`, `search_catalog`, `list_charts`, `list_components`, `get_version`.

Without it, these references hold the same tables. To connect it in Claude Code:
`claude mcp add --transport http silverpoint https://silverpointweb.vercel.app/mcp`. To run it locally:
`claude mcp add silverpoint -- npx -y @silverpoint/mcp`.

## Workflow

1. **Choose the chart.** Name the rows' *data shape* (series, categories, parts, matrix,
   hierarchy, links, points, distribution, intervals, events, single, field) and the reader's
   *intent* (trend, compare, rank, part-to-whole, distribution, correlation, flow, hierarchy,
   change, uncertainty, progress, schedule, kpi, network). Look the pair up in
   [references/choosing-charts.md](references/choosing-charts.md), or call `recommend_chart`.
2. **Read its entry** in `references/charts/<family>.md`: the accessor props that name the data
   fields, its own props, and a compiled example per framework.
3. **Write the code** in the project's framework, following [references/react.md](references/react.md),
   [references/vue.md](references/vue.md) or [references/angular.md](references/angular.md). Import
   the stylesheets once, in the application, not in each component.
4. **Check it.** Read [references/pitfalls.md](references/pitfalls.md) before you finish. If a
   diagnostic code (`SP001`…) appears in the console, look it up in
   [references/diagnostics.md](references/diagnostics.md).

## The rules that matter most

- **Props are identical in the three frameworks.** `valueKey` is `valueKey` in React, Vue
  (`value-key` in a template) and Angular. Only the component name changes: `LineChart`,
  `SpLineChart`, `<sp-line-chart>`. Python names are snake_case (`value_key`).
- **Every chart and component has its own subpath.** Import `@silverpoint/react/line-chart` or
  `@silverpoint/react/ui/modal`, not the barrel, so the application ships only what it uses.
- **Accessors name fields.** `xKey="hour"`, `valueKey="hits"`, `keys={['a', 'b']}`. Pass field names
  rather than functions: they serialise across a server boundary and into Reflex.
- **Without `data`, a chart draws its demo rows** and ignores the accessor props. That is for
  previews. Pass `data` for anything real.
- **A chart takes its container's width.** Give the container a width. A server entry (React
  `@silverpoint/react/server/<chart>`) needs `id`, `width` and `height`.
- **`id` makes the drawing stable.** The hand-inked jitter is seeded from `id` (or `seed`). Give
  each chart a fixed `id` when the page is server-rendered, so the server and the client draw the
  same lines.
- **Name every chart.** `title` or `label` is its accessible name. `description` is the long one,
  and `dataTable` keeps a table of the data for assistive technology.
- **Appearance is ground, substrate, mode and palette.** `ground` is `silverpoint` (hatched, the
  default) or `cyanotype` (a white line on Prussian blue). `substrate` is the paper. `mode="precision"`
  turns the hand-inking off. `palette` recolours field by field, and takes a *palette object*
  imported from `@silverpoint/core/palettes`, never a name. See
  [references/grounds-and-palettes.md](references/grounds-and-palettes.md).
- **A provider sets them for a subtree:** `SilverpointProvider` (React, Vue) or
  `provideSilverpoint` (Angular, Vue). A prop on the chart wins over its dashboard, and the
  dashboard over the provider.
- **Overlays take a native `<button type="button">` as their trigger**, not `SpButton` (React
  clones its trigger with ARIA, and `SpButton` drops it in this version). In Angular, put the
  `spTrigger` directive on the button.
- **UI components need `@silverpoint/grounds/ui.css`**, and the timeline needs its optional peer
  `@knight-lab/timelinejs`, which you install yourself.

## Charts

<!-- generated:chart-index -->

The props every chart shares (`data`, `title`, `height`, `ground`, `palette`…) are in
[references/choosing-charts.md](references/choosing-charts.md#common-chart-props).

## Components

<!-- generated:component-index -->

## Composition

- **Dashboard:** a responsive grid of cards that the charts fill, with an optional linked
  highlight across charts. See [references/dashboard.md](references/dashboard.md).
- **Timeline:** `SpTimeline`, a skin over TimelineJS. See [references/timeline.md](references/timeline.md).
- **Reflex:** builder names and Python props. See [references/reflex.md](references/reflex.md).
  For Reflex work, use the `reflex-silverpoint` skill when it is installed.

## Stylesheets

<!-- generated:stylesheets -->

React and Vue import them in the entry file. Angular lists them in the `styles` array of
`angular.json`.
