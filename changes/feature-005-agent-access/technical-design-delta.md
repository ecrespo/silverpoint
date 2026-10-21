# Technical Design delta — agent access

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 3, drafted and approved 2026-10-20; **folded into `specs/technical-design.md` (v1.11) on 2026-10-20** (T-251) |
| **Amends** | [Technical Design](../../specs/technical-design.md) v1.10 → v1.11: §1 (package map), §5.3 (allowlist: none for the core), new DD-044..DD-050 |

## Package map — addition

```
packages/mcp/                @silverpoint/mcp (fixed group)
  src/catalog.ts             loads agent-catalog.json (bundled), indexes by slug and name
  src/tools/*.ts             one module per tool; pure functions (input, catalog) → output
  src/render.ts              renderChart + toSVGString (@silverpoint/grounds) + inlined stylesheet
  src/diagnostics.ts         the capturing sink around a build (DD-048)
  src/codegen/{react,vue,angular,reflex}.ts
  src/server.ts              createServer(): registers tools, resources, prompts
  src/http.ts                handler(Request) → Response, stateless Streamable HTTP
  src/bin.ts                 stdio
  agent-catalog.json         generated (DD-045), committed
tools/agent-catalog/         private: the generator, the metadata file, the Reflex catalog pin
  charts.meta.ts             family, summary, data shape, field roles, intents per chart (Data Model §2.29)
  recommend.rules.ts         the recommender table (Data Model §2.31)
  reflex/reflex-catalog.json the pinned export of reflex-silverpoint-react (DD-049)
  generate.ts, check.ts
skills/silverpoint/          the skill (DD-050)
apps/mcp-vercel/             private: the deployment wrapper (api/mcp.ts → handler), vercel.json
```

## Decisions

### DD-044 — `@silverpoint/mcp` is a package of its own, in the fixed group

The server needs the core and the grounds at exactly the library's version, or `render_chart` and
`validate_props` describe another library. A package in the Changesets `fixed` group gets that by
construction (`workspace:*`, one version), is published by the same CI with provenance, and runs
locally as `npx @silverpoint/mcp`. It is not an adapter (it contributes no component layer, so the
"React, Angular and Vue only" decision holds); the constitution's scope line names it (amendment).
Rejected: a private app only (no stdio for users, no version guarantee on the catalog); a separate
repository (version drift is the very problem).

### DD-045 — One agent catalog, generated, committed, diffed

`tools/agent-catalog/generate.ts` composes: the props reference (the TypeScript-compiler pipeline
of `docs/site/scripts/props.ts`, moved to `tools/agent-catalog/props.ts` and imported back by the
docs site, so there is one), `CATALOG` (subpaths, recipes), `UI_COMPONENTS` (families, groups,
states), the demo names, `diagnose.ts`'s tables, the palettes, the API Spec naming rule (React
`PascalCase`, Vue `Sp`+`PascalCase`, Angular `sp-`+kebab), `charts.meta.ts` and the pinned Reflex
catalog. Output is sorted and stable (Art. 4). `check.ts` implements REQ-535/536/556; CI runs
`generate` and fails on a diff, as `props.json` is handled today. The site and the skills read the
same file.

### DD-046 — The recommender is a table, not a model

`recommend.rules.ts` maps `(shape, intent)` to candidate charts with a base score, and adjusts by
field counts and row volume (e.g. `categories` with > 12 rows demotes radial charts; `series` with
> 1 value field promotes multi-series charts). Ties break by catalog order. Reasons are the rule's
own sentences. Deterministic, testable with golden tables, reviewable in a PR.

### DD-047 — `render_chart` is the canonical pipeline plus a stylesheet

`renderChart(RECIPES[chart], props, { id, width })` then `toSVGString` — the same calls as
`tools/visual-gate/fixtures.ts` `coreSvgFor`, so REQ-543 holds by construction and REQ-567 proves it.
To render coloured outside a page, the root `<svg>` gets a `<style>` holding the ground's rules
from `@silverpoint/grounds/styles.css` (read at build time, 12 KB, minified) scoped to the root, and
the palette's declarations stay where the core writes them. The parity comparison sets the
`<style>` aside. Fonts: `font-family` falls back to `Georgia, serif`; `embedFonts: true` inlines a
WOFF2 subset of EB Garamond regular (OQ-E3). PNG (REQ-544) rasterises the standalone SVG with a WASM
SVG renderer, loaded only when asked (OQ-E4).

### DD-048 — Validation through the core's sink

`validate_props` builds the chart inside a scope that swaps the core's warning sink for a collector
(`__setDiagnosticSink`, restored in `finally`) and catches `SilverpointError` for error codes. The
internal function is used, not promoted: `@silverpoint/mcp` is in the fixed group, so it always
ships with the core it was tested against; a public sink would cost the core budget for every user
(OQ-E5). Unknown props are the props given minus the catalog's declared names.

### DD-049 — The Reflex side: an exported catalog, pinned here

`reflex-silverpoint-react` gains `scripts/export_catalog.py`, writing `reflex-catalog.json` (Data
Model §2.30) from `CHARTS`, `UI_COMPONENTS`, the builders' signatures and `SILVERPOINT_VERSION`,
attached to each GitHub release and checked in CI there (it must round-trip its own tests). This
repository pins one export under `tools/agent-catalog/reflex/` with `pnpm agent-catalog:pull-reflex
<version>`; the generator joins it by slug and applies REQ-556. The Reflex skill is generated in its
own repository from the same export, so both skills and the MCP agree on Python names.

### DD-050 — Skills are templates plus generated references; hosting is a rewrite

Hand-written prose (judgement, idioms, pitfalls) lives in `skills/*/templates`; generated tables are
written into `references/` by `tools/agent-catalog/skill.ts` (and `scripts/make_skill.py` in the
Reflex repository) in the release commit. CI extracts fenced code blocks and type-checks them
(REQ-557): React/Vue/Angular inside the example apps' compilers, Reflex by import and `.render()`.

Hosting: `apps/mcp-vercel` is a Vercel project whose function calls `handler`; `silverpoint_web`'s
`vercel.json` rewrites `/mcp` to it and its catch-all becomes `/((?!mcp|agent-catalog\.json|llms).*)`.
Stateless HTTP needs no session store; REQ-561's rate limit uses the platform's store if one is
configured and is skipped otherwise.

## Runtime allowlist (§5.3)

Unchanged for `@silverpoint/core`. `@silverpoint/mcp` dependencies: the core, the grounds, the MCP
TypeScript SDK (pinned at implementation to the then-stable major) and its schema library; the PNG
renderer as an optional dependency (OQ-E4).
