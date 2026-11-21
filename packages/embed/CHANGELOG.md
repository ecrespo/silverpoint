# @silverpoint/embed

## 0.11.0

### Minor Changes

- a3aefc5: Every chart's handle gains `toStandaloneSVGString(extraCss?)`, a self-painting SVG file with the stylesheet loaded on demand (#25). A chart's accessible name is now a `<desc id="{id}-title">` instead of an SVG `<title>`, so browsers no longer show a native tooltip over a chart (#29); the normalised SVG output changes by that element name.
- 3a670ef: feature-007, host embedding: `@silverpoint/embed`, a tenth package — any of the 60 charts from one JSON spec (`validateSpec`, `renderToSVG`, `renderToHTML`), a framework-free client (`mount`, `mountAll`, `<silverpoint-chart>`, `hostAppearance`), four standalone files with `integrity.json`, the host catalog with `specFromTable`, and a conformance kit. The core declares `SP030` (a spec over its limits) and `SP031` (an invalid spec in the client). The MCP server's `render_chart` renders through the embed with unchanged output; the agent catalog lists the host integrations (`hosts`), `search_catalog` finds them, `generate_code` takes `framework: "html"`, and the skill gains `references/hosts.md`.

### Patch Changes

- Updated dependencies [5ac7d14]
- Updated dependencies [a3aefc5]
- Updated dependencies [3a670ef]
  - @silverpoint/grounds@0.11.0
  - @silverpoint/core@0.11.0
