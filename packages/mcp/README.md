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
| `search_catalog` | A token search over names, summaries, prop docs and diagnostic codes |

Every result carries the version it describes. A name the catalog does not hold is a tool error with
the closest valid names.

## Resources and prompts

`silverpoint://catalog`, `silverpoint://diagnostics`, `silverpoint://charts/{slug}` and
`silverpoint://components/{slug}`; the prompts `choose-chart` and `build-dashboard`.

## In your own server

```ts
import { createServer, AGENT_CATALOG } from '@silverpoint/mcp';
```

`createServer()` returns an `McpServer` from the MCP TypeScript SDK, ready to connect to any
transport.

## License

MIT
