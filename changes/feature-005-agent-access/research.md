# Research — agent access to silverpoint and `reflex-silverpoint-react`

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 0, drafted and approved 2026-10-20 |
| **Sources** | this repository at `808fc15` (`0.7.0`); `reflex-silverpoint-react` at `29fb9cb` (`0.7.1`, branch `feat/silverpoint-0.7.0-native`); `silverpoint_web` at `6d3bc60`; https://silverpointweb.vercel.app (2026-10-20) |

## 1. The problem, measured

silverpoint `0.1.0` reached npm on 2026-09-25 and `0.7.0` on 2026-10-20. Every current model's
training data predates it. Asked to "draw a sankey in silverpoint", an agent has nothing to go on but
the package name: it invents props (`nodes`/`links` shapes, `colors`), misses `ground`, `substrate`,
`mode` and `palette`, imports from a path that does not exist, and cannot see the result. The same
holds for `reflex-silverpoint-react`, whose snake_case builders (`sankey_chart`, `sp_table`) and
Reflex idioms (state vars, event handlers) are one more step removed.

What an agent needs, in order of value:

| Need | Static text can give it | Needs execution |
|---|---|---|
| Which chart fits this data and intent | Yes (a guide) | — |
| The exact props, types and defaults of one chart or component, per framework | Yes, if generated from the types | — |
| Working code in React, Vue, Angular or Reflex | Yes (examples) | Better generated for the user's data |
| Whether the props it wrote are valid | No | Yes: the core's diagnostics |
| What the chart looks like | No | Yes: the canonical render |

## 2. What already exists to build on

Everything an agent needs is already computed somewhere in the repositories; nothing has to be
written by hand again.

| Asset | Where | Use here |
|---|---|---|
| Props reference generated from the published types (TypeScript compiler, JSDoc included) | `docs/site/scripts/props.ts` → `docs/site/generated/props.json`: `common`, 60 `charts`, `dashboard`, 38 `ui` components with `group`, `palette`, `timeline` | The props half of the agent catalog (DD-045) |
| Chart catalog: chart → recipe, subpath, accessor sample | `tools/visual-gate/catalog.ts` (`CATALOG`) | Chart list, subpaths, recipes for rendering |
| UI catalog: 38 rows, `family: 'ui' \| 'composed' \| 'overlay'`, states | `@silverpoint/core/ui` (`UI_COMPONENTS`), `@silverpoint/core/ui-demos` (`UI_DEMOS`) | Component list and demo props |
| Demo dataset of every chart | each recipe's `demo.ts`; a chart without `data` draws it | Default data for renders and examples |
| Headless render: `renderChart(recipe, props, env)` + `toSVGString` | `@silverpoint/grounds` (public) | `render_chart`: the same pipeline as the canonical renders (`tools/visual-gate/fixtures.ts`, `coreSvgFor`) |
| Ground stylesheets | `@silverpoint/grounds/styles.css` (12 KB), `ui.css`, `timeline.css` | Inlined into a standalone SVG so it renders coloured outside a page |
| 25 diagnostic codes with REQ, what and what to do | `packages/core/src/diagnostics/diagnose.ts`; sink replaceable through the internal `__setDiagnosticSink` | `validate_props` (DD-048) |
| Palettes and their contrast check | `@silverpoint/core/palettes` (`PALETTES`, `checkPalette`) | `check_palette` tool |
| Chart families and one-line summaries | `reflex-silverpoint-react` `catalog.py` (`CHARTS`, `FAMILIES`); the site's gallery (9 families) | Not yet in this repository: the agent catalog's own metadata file (Data Model §2.28) |
| Python API of every chart and component | `reflex-silverpoint-react` `catalog.py`, `ui_catalog.py`, the builders' signatures | The Reflex catalog export (DD-049) |

The API Spec's naming table (§2: `LineChart`, `SpLineChart`, `sp-line-chart`) and the Reflex
convention (`line_chart`, snake_case props) make the four frameworks' code derivable from one row.

## 3. The Reflex wrapper is aligned first

Until 2026-10-20 `reflex-silverpoint-react` 0.7.0 wrapped `@silverpoint/react` **0.6.0** and carried
Reflex-only copies of the palettes, composed components, overlays (on Radix) and timeline that
silverpoint 0.7.0 had just taken into the library (feature-004). An agent catalog that described
both would have described two different components under one name.

Resolved before this feature, on `reflex-silverpoint-react` branch `feat/silverpoint-0.7.0-native`
(version `0.7.1`, not yet released): `SILVERPOINT_VERSION = "0.7.0"`; palettes are the npm `palette`
prop (provider included); the 12 composed components, 7 overlays and toaster, `SpSurface`, `SpGlyph`
and `SpTimeline` are the npm components; Radix and `reflex-knightlab-timeline` are gone; 0.7.0's
argument names stay as deprecated aliases. Verified: 295 tests, `reflex export` of the demo against
npm `0.7.0`, and the `/components` and `/timeline` pages driven in Chromium (triggers carry
`aria-haspopup`/`aria-expanded`/`aria-controls`, the drawer opens and closes on Escape, the popover
places itself, TimelineJS builds with its markers).

One gap remains on the npm side, recorded as [`delta-014`](../delta-014-button-as-trigger.md): an
overlay clones its `trigger` with ARIA and handlers, and `SpButton` drops them. The Reflex wrapper
works around it with a small trigger of its own (`sp_trigger`). The MCP must not generate
`trigger={<SpButton>…</SpButton>}` until delta-014 lands (REQ-547).

The rule this feature adds, so the two never drift again: **a Reflex release names the silverpoint
version it wraps, and the agent catalog refuses a Reflex catalog that wraps another one** (REQ-556).

## 4. Skill or MCP: what each can do

| | Skill | MCP server |
|---|---|---|
| Form | Folder of Markdown (`SKILL.md` + `references/`), loaded by the agent on demand | A process speaking MCP (stdio or Streamable HTTP) |
| Runs code | No (beyond scripts the agent may run locally) | Yes: the core's render and diagnostics |
| Clients | Claude (Code, apps), any agent that reads skills | Any MCP client (Claude, Cursor, VS Code, Zed…) |
| Freshness | A file per release; stale if not regenerated | Pinned to the library version it ships with |
| Cost | Nothing to host | A serverless function; a public compute endpoint |
| Unique value | Judgement: which chart, which ground, idioms, pitfalls | Validation and the picture |

They are complementary, not alternatives: the skill tells the agent *how to think* about
silverpoint and tells it to use the MCP tools when they are connected; the MCP gives it facts it can
check. Both read one catalog (DD-045), so they cannot disagree.

## 5. Hosting: not in the Reflex backend of the site

The official site (`silverpoint_web`) is a Reflex app exported as static files
(`rx.App(enable_state=False)`, `reflex export --frontend-only`, `public/` served by Vercel). Its
`CLAUDE.md` forbids `rx.State` and backend events. A Reflex backend needs a long-lived server with
WebSockets, which Vercel's static output does not host.

| Option | Verdict |
|---|---|
| Reflex backend (`rx.State`, an API route in the app) | **No.** Breaks the site's frontend-only rule, needs a persistent server, and the engine is TypeScript: Python would have to shell out to Node to render |
| A Python MCP (FastMCP) reading the catalog JSON | Possible for read-only tools; cannot render or validate (Art. 2: the maths stay in the core) |
| **A TypeScript MCP package in this monorepo, deployed as a Vercel function, reached at `silverpointweb.vercel.app/mcp` through a rewrite** | **Yes.** Imports the core and grounds directly (no second engine), runs the canonical pipeline, keeps the site static. The same package runs locally over stdio (`npx @silverpoint/mcp`) |

Vercel's MCP adapter (`mcp-handler`) serves Streamable HTTP from a function and follows the current
MCP spec ([vercel/mcp-handler](https://github.com/vercel/mcp-handler),
[changelog](https://vercel.com/changelog/latest-mcp-spec-now-supported-in-mcp-handler)); the
official TypeScript SDK supports stateless Streamable HTTP
([MCP TypeScript SDK](https://ts.sdk.modelcontextprotocol.io/documents/server.html)). The exact
versions are pinned in the Technical Design at implementation time (the SDK has a v2 in beta).

The site's own change is small and stays static: one rewrite in `vercel.json` (and `/mcp`
excluded from its SPA catch-all `/(.*)` → `/index.html`), `/llms.txt` and `/llms-full.txt` generated
at export, and a "Use with AI" page.

## 6. Risks

| Risk | Mitigation |
|---|---|
| A public endpoint that computes | Stateless, read-only, no auth needed; payload caps (rows, string length, path budget `PATH_BYTE_BUDGET`); per-IP rate limit; a timeout per call (REQ-560..562) |
| The typeface does not travel with an SVG | `render_chart` inlines the ground stylesheet; the face is referenced, with a serif fallback, unless `embedFonts` asks for the subset (DD-047, OQ-E3) |
| Catalog drift between the npm types, the Reflex wrapper and the skills | One generated catalog; CI regenerates and diffs it; version stamps on every artifact (REQ-552..556) |
| An agent copies a pattern that does not work (`SpButton` as trigger) | The skill and `generate_code` use only patterns the example apps run (REQ-547); delta-014 |
| Skills go stale between releases | Generated in the release commit; the skill names its version and tells the agent to prefer the MCP's `get_version` when connected |
| Prompt-injection through the catalog | The catalog is built from this repository's own types and docs only; tool results are data, never instructions (REQ-563) |
| Server cost | Serverless, cold-start budget (REQ-559); static resources cacheable |
