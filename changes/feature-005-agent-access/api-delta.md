# API Spec delta — agent access

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 2, drafted and approved 2026-10-20 |
| **Amends** | [API Spec](../../specs/api-spec.md) v1.11 → v1.12: §1 (a new package), new §14 (agent access) |
| **SemVer** | `minor` — a new package in the `fixed` group (OQ-E1); no change to any existing package's API |

## 1. Packages and entry points (§1)

| Package | Entry | Exports |
|---|---|---|
| `@silverpoint/mcp` (new) | `.` | `createServer(options?)` → an MCP `McpServer` with every tool, resource and prompt; `AGENT_CATALOG` (the parsed catalog); `type AgentCatalog` and the types of Data Model §2.28 |
| `@silverpoint/mcp` | `./http` | `handler(request: Request): Promise<Response>` — stateless Streamable HTTP (Web `Request`/`Response`, so any serverless runtime) |
| `@silverpoint/mcp` | `bin: silverpoint-mcp` | stdio transport: `npx @silverpoint/mcp` |
| `@silverpoint/mcp` | `./agent-catalog.json` | the catalog file itself |

`@silverpoint/mcp` depends on `@silverpoint/core` and `@silverpoint/grounds` (`workspace:*`, so always
the same version) and on the MCP TypeScript SDK; it has no peer dependencies and no framework. It is
never imported by the adapters, and no adapter imports it.

## 2. The agent catalog (summary; shape in Data Model §2.28)

```jsonc
{
  "schema": 1,
  "version": "0.8.0",                       // the library version described
  "reflex": { "version": "0.8.0", "wraps": "0.8.0", "stale": false },
  "frameworks": ["react", "vue", "angular", "reflex"],
  "common": { "chart": [/* PropEntry */], "ui": [/* PropEntry */] },
  "charts": [
    {
      "slug": "sankey-chart", "family": "flows", "summary": "Flows between stages, widths by value.",
      "data": { "shape": "links", "fields": [{ "role": "source", "type": "string" }, …] },
      "intents": ["flow", "part-to-whole"],
      "names": { "react": "SankeyChart", "vue": "SpSankeyChart", "angular": "sp-sankey-chart", "reflex": "sankey_chart" },
      "imports": { "react": "@silverpoint/react/sankey-chart", "vue": "@silverpoint/vue/sankey-chart",
                   "angular": "@silverpoint/angular/sankey-chart", "reflex": "reflex_silverpoint_react" },
      "props": [{ "name": "sourceKey", "reflex": "source_key", "type": "Accessor<string>", "optional": true, "default": "'source'", "doc": "…" }],
      "demo": "SANKEY_CHART_DEMO"
    }
  ],
  "components": [ /* slug, family (ui|composed|overlay), group, names, imports, props, binding, events, slots */ ],
  "dashboard": { … }, "grounds": [ … ], "palettes": { "fields": [ … ], "presets": { … } },
  "timeline": { … }, "diagnostics": [ { "code": "SP011", "severity": "warn", "req": "REQ-097", "what": "…", "todo": "…" } ],
  "stylesheets": { "always": ["@silverpoint/fonts/fonts.css", "@silverpoint/grounds/styles.css"], "ui": ["@silverpoint/grounds/ui.css"], "timeline": [ … ] }
}
```

## 3. Tools (REQ-539)

Every result is `structuredContent` (matching the tool's output schema) plus a short text summary,
and carries `version` (REQ-550). Errors are tool errors (`isError: true`) with `{ code, message,
suggestions? }`; codes: `unknown_name`, `invalid_input`, `limit_exceeded`, `render_failed`
(REQ-549, REQ-560).

| Tool | Input | Output |
|---|---|---|
| `get_version` | — | `{ version, reflex: { version, wraps, stale }, protocol }` |
| `list_charts` | `{ family?, intent?, shape? }` | `{ charts: [{ slug, family, summary, intents, shape }] }` |
| `get_chart` | `{ slug, framework? }` | the chart's catalog entry; with `framework`, only that framework's names, import and prop spelling |
| `list_components` | `{ family?: 'ui' \| 'composed' \| 'overlay', group? }` | `{ components: [{ slug, family, group, summary }] }` |
| `get_component` | `{ slug, framework? }` | the component's catalog entry, as `get_chart` |
| `recommend_chart` | `{ shape: DataShape, fields?: FieldDesc[], intent: Intent, rows?: number }` | `{ recommendations: [{ slug, score, reasons: string[] }] }`, ≤ 5, deterministic (REQ-540) |
| `generate_code` | `{ target: { chart } \| { component }, framework, fields?: Record<role, string>, props?: object, ground?, substrate?, mode?, palette? }` | `{ imports: string[], stylesheets: string[], code: string, notes: string[] }` (REQ-541, REQ-547) |
| `validate_props` | `{ chart, props, width?, height? }` | `{ valid: boolean, diagnostics: [{ code, severity, req, message, todo }], unknownProps: string[] }` (REQ-542) |
| `render_chart` | `{ chart, props?, data?, width? (320..1600, 480), height?, id?, ground?, substrate?, mode?, palette?, format?: 'svg' \| 'png', embedFonts?: boolean }` | `{ svg: string, width, height, diagnostics[] }`; with `png`, also an image content block (REQ-543, REQ-544) |
| `check_palette` | `{ palette: Palette \| presetName, substrate? }` | `{ findings: PaletteFinding[] }` (REQ-545) |
| `search_catalog` | `{ query: string, limit? (≤ 20) }` | `{ hits: [{ kind: 'chart' \| 'component' \| 'prop' \| 'diagnostic' \| 'guide', slug, title, snippet }] }` — token match over names, summaries, docs; no embeddings |

`DataShape` ∈ `series` (x → one or more values), `categories` (label → value), `parts` (label →
share of a whole), `matrix` (row × column → value), `hierarchy` (parent/child or nested), `links`
(source → target → value), `points` (x, y, size?), `distribution` (samples of one variable),
`intervals` (low/high or OHLC), `events` (date → item), `single` (one figure, optional target),
`field` (a 2-D scalar or vector field). `Intent` ∈ `trend`, `compare`, `rank`, `part-to-whole`,
`distribution`, `correlation`, `flow`, `hierarchy`, `change`, `uncertainty`, `progress`,
`schedule`, `kpi`, `network`. The rule table is Data Model §2.31.

`generate_code` emits, per framework: the stylesheet imports of `stylesheets`; the component
import from its subpath; the element with the accessor props mapped from `fields`; `title` and
`label`; `ground`, `substrate`, `mode`, `palette` when given. Reflex code is a page function with
`rx` imports and builder calls; state-driven values are left as `State.<name>` placeholders named in
`notes`. Overlays get a native `<button>` (Reflex: `sp_trigger`) as `trigger` while delta-014 is
open (REQ-547).

## 4. Resources (REQ-546)

| URI | Content |
|---|---|
| `silverpoint://catalog` | `agent-catalog.json` (`application/json`) |
| `silverpoint://charts/{slug}` | one chart entry (template resource, listable) |
| `silverpoint://components/{slug}` | one component entry |
| `silverpoint://diagnostics` | the 25 codes |
| `silverpoint://guides/{topic}` | the `silverpoint` skill's references as Markdown: `choosing-charts`, `grounds-and-palettes`, `dashboard`, `ui-components`, `overlays`, `timeline`, `react`, `vue`, `angular`, `reflex` |

## 5. Prompts (REQ-548, SHOULD)

| Prompt | Arguments | Sequence it asks for |
|---|---|---|
| `choose-chart` | `description` (the data and the question) | `recommend_chart` → `render_chart` of the top two → `generate_code` |
| `build-dashboard` | `framework`, `charts` (a list of needs) | per need `recommend_chart`; then the dashboard layout from the catalog; `generate_code` per cell |

## 6. Skills (REQ-552..555)

```
skills/silverpoint/                      (this repository; generated + hand-written)
  SKILL.md                               frontmatter: name, description; body ≤ 500 lines (hand-written + version stamp)
  references/
    choosing-charts.md                   families, shapes, intents, the recommender's table (generated)
    charts/<family>.md                   per chart: summary, data shape, props table, example per framework (generated)
    components.md, overlays.md           (generated tables + hand-written usage)
    grounds-and-palettes.md, dashboard.md, timeline.md
    react.md, vue.md, angular.md         imports, stylesheets, SSR, binding idioms (hand-written)
    pitfalls.md                          (hand-written: delta-014, accessors are field names, tone is density…)
.claude-plugin/marketplace.json          plugin "silverpoint": the skill + .mcp.json → https://silverpointweb.vercel.app/mcp

reflex-silverpoint-react/skills/reflex-silverpoint/
  SKILL.md                               builders, State patterns, provider and palettes, the version it wraps
  references/
    charts/<family>.md                   snake_case props tables and examples (generated from reflex-catalog.json)
    components.md, overlays.md, timeline.md, dashboard.md, palettes.md
    state-and-events.md                  controlled/uncontrolled, event payloads, rx.foreach-free data (hand-written)
reflex-silverpoint-react/.claude-plugin/marketplace.json   plugin "reflex-silverpoint": the skill + the same MCP
```

Skill descriptions (frontmatter), verbatim:

- `silverpoint`: "Build charts, dashboards and UI with the silverpoint library (React, Vue, Angular):
  choose the chart, write correct props, grounds and palettes. Use whenever code imports
  @silverpoint/* or the user mentions silverpoint charts."
- `reflex-silverpoint`: "Build silverpoint charts, dashboards and UI in Python with Reflex through
  reflex-silverpoint-react. Use whenever code imports reflex_silverpoint_react or the user wants
  silverpoint in Reflex."

## 7. Official site (REQ-564, REQ-565; `silverpoint_web`)

| Path | Content |
|---|---|
| `/mcp` | rewrite to the MCP deployment (`vercel.json`), excluded from the SPA catch-all |
| `/agent-catalog.json` | the catalog (REQ-537) |
| `/llms.txt` | the llms.txt index: what silverpoint is, links to `/llms-full.txt`, the docs pages and the MCP |
| `/llms-full.txt` | the catalog as Markdown: every chart and component with props, per framework |
| `/docs/ai` | "Use with AI": MCP URL, client configs (Claude Code `claude mcp add`, Claude connectors, Cursor, VS Code), skill install, `npx @silverpoint/mcp` |

## 8. Limits (§12) — additions

| Limit | Value | On exceeding it |
|---|---|---|
| Request body | 256 KB | `limit_exceeded` |
| Rows in `data` | 5,000 | `limit_exceeded` |
| Any string | 1,000 characters | `limit_exceeded` |
| Render path data | `PATH_BYTE_BUDGET` (40,000 bytes) | `limit_exceeded` (the core's own budget) |
| `render_chart` width × height | 320..1600 × 120..1200 px | `invalid_input` |
| `search_catalog` limit | 20 | clamped |
| Calls per client address | 60 / min (SHOULD) | HTTP 429 |

## Constitution check

- **Art. 2** — the server computes nothing: it calls the core and the grounds (render, diagnostics,
  `checkPalette`); the recommender is a data table.
- **Art. 3** — `render_chart` is held to the canonical render (REQ-543, REQ-567).
- **Art. 4** — every tool is a pure function of its input and the catalog version.
- **Art. 8** — the core's allowlist is untouched; the SDK is a dependency of `@silverpoint/mcp` only.
- **Art. 9** — this delta.
- **Exception requested:** the scope line (constitution amendment).
