---
'@silverpoint/embed': minor
'@silverpoint/core': minor
'@silverpoint/mcp': minor
---

feature-007, host embedding: `@silverpoint/embed`, a tenth package — any of the 60 charts from one JSON spec (`validateSpec`, `renderToSVG`, `renderToHTML`), a framework-free client (`mount`, `mountAll`, `<silverpoint-chart>`, `hostAppearance`), four standalone files with `integrity.json`, the host catalog with `specFromTable`, and a conformance kit. The core declares `SP030` (a spec over its limits) and `SP031` (an invalid spec in the client). The MCP server's `render_chart` renders through the embed with unchanged output; the agent catalog lists the host integrations (`hosts`), `search_catalog` finds them, `generate_code` takes `framework: "html"`, and the skill gains `references/hosts.md`.
