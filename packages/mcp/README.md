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

Over stdio, for a local client:

```sh
npx @silverpoint/mcp
```

For Claude Code:

```sh
claude mcp add silverpoint -- npx -y @silverpoint/mcp
```

## Tools

| Tool | What it answers |
|---|---|
| `get_version` | The silverpoint version described, the Reflex wrapper it is joined with, and the protocol version |
| `list_charts`, `get_chart` | The charts, by family, intent or data shape; one chart's props, fields and imports |
| `list_components`, `get_component` | The UI components; one component's props, binding, events and slots |
| `recommend_chart` | Up to five charts for a data shape and an intent, from a reviewed table |
| `generate_code` | The imports, stylesheets and code for one chart or component in one framework |
| `validate_props` | Every diagnostic the core raises for a chart's props, and the props it does not declare |
| `render_chart` | The chart's canonical render as a standalone SVG, the ground's stylesheet inlined |
| `check_palette` | The contrast findings of a palette preset or of your own palette's fields |
| `search_catalog` | A token search over names, summaries, prop docs and diagnostic codes |

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
