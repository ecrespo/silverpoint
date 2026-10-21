# @silverpoint/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server for
[silverpoint](https://github.com/ecrespo/silverpoint): it tells an agent what the library holds —
every chart and UI component, their props, data shapes and diagnostics — recommends a chart for a
dataset, and writes the code that draws it in React, Vue, Angular or Reflex.

Everything it answers comes from the agent catalog, generated from the published types of the same
silverpoint version, so it never describes a prop that does not exist.

```sh
npm install @silverpoint/mcp
```

## Run it

Hosted, over Streamable HTTP, read-only and without an account:

```sh
claude mcp add --transport http silverpoint https://silverpointweb.vercel.app/mcp
```

In Claude Code, the `silverpoint` plugin connects the hosted server and installs the `silverpoint`
skill in one step:

```sh
/plugin marketplace add ecrespo/silverpoint
/plugin install silverpoint@silverpoint
```

Over stdio, for a local client:

```sh
npx @silverpoint/mcp
```

For Claude Code:

```sh
claude mcp add silverpoint -- npx -y @silverpoint/mcp
```

## Tools

<!-- tools:start -->
| Tool | What it answers |
|---|---|
| `get_version` | The silverpoint version this server describes, the Reflex wrapper it is joined with, and the MCP protocol version. |
| `list_charts` | Every chart, optionally filtered by family, intent (trend, compare, rank, part-to-whole, distribution, correlation, flow, hierarchy, change, uncertainty, progress, schedule, kpi, network) or data shape (series, categories, parts, matrix, hierarchy, links, points, distribution, intervals, events, single, field). |
| `get_chart` | One chart’s catalog entry: data shape, fields, props with defaults, names and imports. With `framework`, only that framework’s name, import and prop spelling. |
| `list_components` | Every UI component, optionally filtered by family (ui, composed, overlay) or group. |
| `get_component` | One component’s catalog entry: props, binding, events, slots and states. With `framework`, in that framework’s terms. |
| `recommend_chart` | Up to five charts for a data shape and an intent, ranked by a reviewed table, with the reasons. Deterministic: no model involved. |
| `generate_code` | The imports, stylesheets and code that draw one chart or one component in React, Vue, Angular or Reflex, using only names, paths and props the catalog holds. `fields` maps the chart’s data roles to your field names. |
| `search_catalog` | A token search over chart and component names, summaries, prop docs and diagnostic codes, best first; at most 20 hits. |
| `validate_props` | Builds the chart with the core and returns every diagnostic it raises (code, severity, requirement, message, remedy) and the props it does not declare. |
| `render_chart` | The canonical render of one chart as a standalone SVG, the ground’s stylesheet inlined: what every adapter draws for the same props, data, size and id. Without `data`, the demo dataset. |
| `check_palette` | The contrast findings of the core’s checkPalette for a preset or a palette of fields, over a substrate given as a hex or by name. |
<!-- tools:end -->

Every result carries the version it describes. A name the catalog does not hold is a tool error with
the closest valid names.

## Resources and prompts

`silverpoint://catalog`, `silverpoint://diagnostics`, `silverpoint://charts/{slug}`,
`silverpoint://components/{slug}` and `silverpoint://guides/{topic}`, the `silverpoint` skill's
guides as Markdown (`choosing-charts`, `grounds-and-palettes`, `dashboard`, `ui-components`,
`overlays`, `timeline`, `react`, `vue`, `angular`, `reflex`). The prompts are `choose-chart` and
`build-dashboard`.

## In your own server

```ts
import { createServer, AGENT_CATALOG } from '@silverpoint/mcp';
```

`createServer()` returns an `McpServer` from the MCP TypeScript SDK, ready to connect to any
transport.

Over HTTP, `@silverpoint/mcp/http` serves stateless Streamable HTTP on Web `Request` and `Response`,
so any serverless runtime can call it:

```ts
import { handler } from '@silverpoint/mcp/http';

export const POST = handler;
export const OPTIONS = handler;
```

Each request gets a server of its own and leaves nothing behind. Only POST carries messages (GET and
DELETE answer 405, since there are no sessions), CORS is open, a body over 256 KB is refused with
413 before it is parsed, and nothing is logged.

## License

MIT
