# Technical Design delta — host embedding

| Field | Value |
|---|---|
| **Status** | `APPROVED` and **folded into `specs/` 2026-11-21** (T-329) — gate 3, approved 2026-11-20 (user decision: every gate approved); DD-062 filled from the PoC ([`poc.md`](poc.md)), DD-070 amended by its finding F-P1, §7 resolved; amended in implementation 2026-11-21 (deviations 1–9 of the plan's ledger, accepted by the user) |
| **Amends** | [Technical Design](../../specs/technical-design.md) v1.15 → v1.16: §3 (package map), §4 (DD-061..DD-072), §5.3 (allowlist note), §6 (a row), §8 (gates), §9 (publication) |
| **Requirements** | REQ-629..REQ-668 |

## 1. Architecture — add to §3

```
@silverpoint/core ──► @silverpoint/grounds ──► @silverpoint/embed ──► @silverpoint/mcp (render_chart)
      │                        │                    │  main      validateSpec · renderSpec · renderToSVG · renderToHTML
      │                        │                    │  /client   mount · mountAll · defineElement · hostAppearance
      │                        │                    │  /hosts    HOST_CATALOG · specFromTable
      │                        │                    │  /conformance
      │                        │                    └─ dist/silverpoint-embed[.full].{js,mjs}   (everything inlined)
      ▼                        ▼
 react · vue · angular   (unchanged; never import embed)
```

`packages/embed/src/`

| Folder | Entry | Content |
|---|---|---|
| `spec/` | main | `ChartSpec`, `validateSpec`, the generated prop tables (`charts.generated.ts`), limits |
| `registry.ts` | main | slug → recipe over `@silverpoint/core` and `/catalog` (the third copy; DD-061 says why it is the last) |
| `render/` | main | `renderSpec`, `renderToSVG`, `renderToHTML`, JSON-for-script escaping, `assets.generated.ts` (stylesheet text, font data) |
| `client/` | `/client` | `dom.ts` (view → nodes), `mount.ts`, `interaction.ts`, `overlay.ts`, `styles.ts`, `element.ts`, `mount-all.ts`, `appearance.ts` |
| `hosts/` | `/hosts` | `host-catalog.json` (generated), `spec-from-table.ts`, `reshape.ts`, `follows.ts` |
| `conformance/` | `/conformance` | `conformance.json` (generated), `conformance.ts` |
| `standalone/` | — | the two entry files of the standalone builds (`index.ts`, `full.ts`) |

## 2. Design decisions — add to §4

### DD-061 — The embed owns "spec → picture"; the MCP is re-pointed, the deck later

- **Context.** Rendering a chart by name from JSON exists twice, privately (`mcp/src/recipes.ts` +
  `tools/render.ts`; `marp/src/fence/*`). Hosts need it publicly.
- **Decision.** `@silverpoint/embed` is its public home. `render_chart` calls `renderToSVG` in this
  release, deleting `mcp/src/recipes.ts` and the render half of `tools/render.ts` (the MCP keeps its
  input checks against the agent catalog, its `capturing` of diagnostics and its tool errors).
  `@silverpoint/marp` keeps its fence parser and registry in `0.11.0`.
  *Amended in implementation:* `validate_props` renders through the embed too (declared props
  only), so the MCP keeps no recipe map at all. `SP030` and `SP031` are templated in the embed
  (`spec/codes.ts`), not in the core's `ERRORS` table, which every production bundle carries
  (REQ-444); the core gains only the two names in `SpCode`. `STANDALONE_INTEGRITY` is exported by the
  main entry and written into `dist` after hashing, for `generate_code { framework: 'html' }` (the MCP
  imports no Node built-in, REQ-551, so it cannot read `integrity.json`).
- **Why not move the deck now.** The fence has slide-contextual defaults (the slide's ground, a
  content width per slide size, ids `<deck>-s<n>-c<m>`), narrower size ranges, and 59 requirements
  resting on fixtures. Moving it is a refactor with no user-visible gain and belongs in a delta of its
  own, after the embed has a release behind it (PRD §5.3, D11).
- **Why not `@silverpoint/grounds/spec`.** The registry imports all 60 recipes; in grounds it would
  sit one careless import away from every adapter's bundle. In a package no adapter may import
  (REQ-652, enforced by `check-deps`) it cannot leak.
- **Consequences.** `mcp` → `embed` is a new workspace dependency; `tools/release/publish.mjs` orders
  it by itself. REQ-567's gate proves the move changed nothing. The prop tables are written by
  `tools/agent-catalog` into both `marp` and `embed` from one source, so they cannot disagree.

### DD-062 — The standalone file: format, contents and budget *(PoC, step 11a — measured)*

- **Decision** (from [`poc.md`](poc.md), 2026-11-20, packages at `0.10.1`). (1) Format: IIFE
  (`.js`, `globalName: 'Silverpoint'`, the element defined on load) + ESM (`.mjs`, no side effect on
  import), `target: es2020`, minified, no source map in the package. (2) Contents of the base file:
  60 recipes imported by name, both grounds and inkers (rough.js), the stylesheet text. (3) The
  `full` file adds EB Garamond 400, 500 and 400 italic as base64 WOFF2 in one `@font-face` sheet —
  all three cuts, the fonts fallback is not needed. (4) Budgets, gzip (the unit of
  `.size-limit.json`): `silverpoint-embed.js` / `.mjs` **≤ 140 kB**; `.full.js` / `.full.mjs`
  **≤ 220 kB**; main entry own code **≤ 34 kB**; client entry own code **≤ 11 kB** (amended in implementation,
  user decision 2026-11-21: gate 3 set 12 / 8 kB; the main entry carries EB Garamond 400 for
  `renderToSVG`'s `embedFonts`, 24 kB of its measured 31.6 kB, and the client measures 10.1 kB).
  Brotli is recorded, not gated. (5) `silverpoint-embed.js` carries no face: `embedFonts` there
  draws the fallback stack and reports `SP013`. (6) `HOST_CATALOG` is not in the standalone files
  (580 kB with its demos); they carry `specFromTable` over a generated binding table
  (`hosts/bindings.generated.ts`), and hosts pin `host-catalog.json`.
- **Measured.** Base 374.6 KB minified, 121.1 kB gzip, 99.0 kB brotli; `full` 474.4 KB, 197.5 kB,
  173.9 kB (with a 6 kB prototype client; the margin holds the real client, validation,
  `specFromTable`, `conformance` and the prop tables). The core's recipes are 77 % of the file.
  Module build in plain Node with throwing DOM globals: 60/60 charts, deterministic. The full
  fixture matrix through a JSON spec: 3 402/3 402 canonicals reproduced. Chromium 153: every
  scenario of the protocol passes — `file://` (1, 20 charts, `mountAll`), the strict CSP page, a
  `sandbox="allow-scripts"` srcdoc frame and a sandboxed frame of the CSP page, and an executed
  Jupyter notebook — with the keyboard readout announced, zero requests of the chart's own beyond
  its page and script, zero console errors, one adopted sheet, the three faces loaded, the last of
  twenty charts drawn at 231 ms.
- **Carried.** Firefox and WebKit were not available to the PoC's environment; their rows,
  OQ-H2 included, are an exit of T-324 (`browser-embed`, three engines, pinned image). A failure
  there reopens this decision through the fallbacks below, with the user.
- **Fallbacks, in order, if a host refuses the size or an engine fails.** Fonts: 400 only in
  `full`. Size: a `silverpoint-embed.core.js` with the first catalog (33 charts; measured 62.8 kB
  gzip) beside the complete file — not shipped unless needed. CSP: if `font-src data:` is refused
  by a host, `fonts: 'none'` is that host's setting, not a library change.
- **Status.** Decided 2026-11-20 with gate 3.

### DD-063 — Nodes, not markup; styles through the CSSOM

- **Decision.** `client/dom.ts` walks the core's `SvgView` and the chart root's parts and creates
  nodes with `createElementNS` / `createElement`, sets attributes with `setAttribute`, text with
  `textContent`. The root's palette declarations are applied with `style.setProperty`, never by a
  `style` attribute string. The stylesheet is a constructable `CSSStyleSheet` (`replaceSync`) pushed
  to `adoptedStyleSheets` of the document or shadow root, once per root (a `WeakMap` keyed by root);
  where constructable sheets are missing, one `<style data-sp-embed>` element.
- **Why.** TD §6 forbids `innerHTML` everywhere (REQ-637). A host's policy often forbids inline
  styles (`style-src 'self'`): CSSOM writes are not inline styles, an attribute string is.
- **Consequence for parity.** `style.setProperty` serialises back as a `style` attribute, so the
  normalised tree equals the canonical one (REQ-636); the gate's normaliser already orders
  declarations.
- **Rejected.** `DOMParser` + `importNode` over `toChartRootString`: shorter, and the same bytes by
  construction, but it parses a string as markup and puts the palette in an attribute string.

### DD-064 — The interaction binder is the adapters' client chart, ported once

- **Decision.** `client/interaction.ts` is `create-chart.tsx` without React: listeners on the root
  (`pointermove`, `pointerdown`, `click`, `pointerleave`, `focus`, `blur`, `keydown`), each reduced by
  `reduceInteraction`; the document-level Escape listener while a readout shows (WCAG 1.4.13);
  `preventDefault` when the reducer reports `handled`. `client/overlay.ts` draws what the adapters'
  `Overlay` draws —the active mark, the readout, the live region's text— from the same core outputs.
- **Source of truth.** The overlay's markup is specified by API §10 and exercised by the adapters'
  fixtures in an active state; the embed gets the same state fixtures (step 11g).
- **Not ported.** Custom `tooltip` renderers (a host passes data, not components); dashboard cells
  and links (out of scope, PRD §5.2); `ref` handles become the `ChartMount` methods.

### DD-065 — The embed is the fourth comparison against the canonical render

- **Decision.** `tools/visual-gate` gains an `embed` target: for each fixture of the PR matrix it
  mounts the spec equivalent of the fixture with the built client in the pinned Chromium, serialises
  the root and compares trees with the existing comparer (DD-017's rules). The nightly matrix runs the
  full set. The pixel gate adds the embed as an "adapter" column.
- **Fixtures.** A fixture is `(recipe, props, ground, mode, size)`; its spec is derived mechanically
  (`chart` = the recipe's slug, the appearance fields lifted out of props). Fixtures whose props hold
  functions (accessor functions, formatters) have no JSON form and are skipped by rule, counted and
  reported, not silently dropped.
- **Cost.** One more comparison per fixture, as Art. 3 intends.

### DD-066 — The host catalog is a projection, computed by rules

- **Decision.** `tools/agent-catalog` gains `hosts.ts`: agent catalog in, host catalog out.
  - *Roles* from `data.fields`: `type: 'number'` → `measure`; `'date'` → `temporal`; `'string'` →
    `dimension`; `'array'` → the chart is `pivot` and its roles come from `hosts.meta.ts`.
  - *Options* from `props`, by parsing the type text with the TypeScript compiler API the generator
    already uses: `boolean`; `number`; `string`; a union of string literals → `enum`. Everything else
    (accessors, functions, arrays, records, object types) is excluded. Role props are excluded.
  - *Labels*: sentence-cased names; overrides and the per-chart `title` in `hosts.meta.ts`.
  - *Binding and reshape*: `rows` unless `hosts.meta.ts` says otherwise; a chart with an `array` field
    or no field and no entry in `hosts.meta.ts` fails generation (a new chart cannot slip in unbound).
- **As built** *(amended in implementation)*. 52 `rows`, 2 `pivot`, 2 `scalar`, 4 `none`
  (`treemap-chart`, whose tiles carry their own grid spans; `sparkline-rows`; `volvelle-chart`;
  `orbit-chart`). A demo carries `options` for the canonical demo's non-role props, so I-59 holds.
- **Why a second catalog and not more fields in the first.** The agent catalog is read by models and
  documented field by field (Data Model §2.28); hosts need a smaller, stricter, typed shape, and may
  need it to stay stable while the agent catalog grows. Same generator, same `check`, two views.
- **Why data and not five emitters here.** Research §5. A satellite's manifest generator is ~100
  lines over this file, lives beside the manifest's schema, and breaks in the repository that can
  fix it.

### DD-067 — `specFromTable` binds, it does not query

- **Decision.** Pure functions in `hosts/`: resolve the chart; check roles against the table's
  columns; project the mapped columns; apply the chart's reshape; assemble props (`role.prop` →
  column name; options; common view options); run `validateSpec` on the result so a host gets one
  error shape. No aggregation, sorting, filtering or type coercion beyond dates to ISO strings.
- **Why.** Every host has a query engine and its own aggregation semantics; a second one here would
  disagree with it. The pivot is the one transformation no host offers in the shape a chart needs.
- **Gate.** REQ-659: the catalog's own demo, through `specFromTable`, renders the canonical demo.

### DD-068 — Hosts are separate repositories, bound by a pin and a kit, never a release gate

- **Decision.** Each host integration is a repository (list and rationale in
  [`repositories/README.md`](repositories/README.md)) that
  1. pins a silverpoint **release line** (`major.minor`) and states it in its manifest and README;
  2. carries the engine as a **build-time** artefact: the standalone file vendored into its package
     (Python, Power BI, Tableau, n8n, KNIME through Python) or `@silverpoint/react` as an ordinary
     dependency (Superset, Volto);
  3. generates its tool's manifest from `host-catalog.json` and checks it in CI;
  4. runs the conformance kit against what it ships;
  5. follows a new line with a mechanical bump: update the pin, regenerate, run the kit, release.
- **Asymmetry with Reflex.** REQ-556 makes the Reflex wrapper's pin a release check of the library,
  because the agent catalog publishes Reflex names. Hosts publish nothing into the library's
  catalogs except a `status` line, so a stale host never blocks or warns a library release.
- **Version relation.** A host's own version is its own (`semver`, starting `0.1.0`); the line it
  draws with is metadata. The exception is the Python package, which is the standalone file's
  Python distribution and mirrors its version (its spec pack, PY-DD-01).

### DD-069 — Python renders in the browser; a server-side SVG needs a JavaScript runtime

- **Decision.** The Python package's `to_html()` writes `renderToHTML`'s **interactive** shape
  itself —the spec as JSON plus the standalone script— and the picture is drawn when a browser runs
  it. It cannot write the static chart root, because that is the engine's output. `to_svg()` is
  offered only where a runtime is available (Node on `PATH`, running the vendored file's DOM-free
  entry in a subprocess) and raises a clear error otherwise.
- **Why not a Python port of the engine.** Art. 2. **Why not an embedded JS engine by default.** A
  compiled dependency (a V8 or QuickJS binding) in the base install would make `pip install
  silverpoint` fail on some platforms for a feature most users do not need; it can be an extra later.
- **Consequence here.** `renderToHTML`'s interactive shape is a **documented contract** (API delta §3,
  §5) with a fixture, because another language writes it.

### DD-070 — The custom element: light DOM by default

- **Decision.** `<silverpoint-chart>` renders into its own light DOM; `shadow` opts into an open
  shadow root. **Why.** The library themes through inherited `--sp-*` properties and a page-level
  stylesheet (Art. 8); adapters' charts are light DOM, and a host page that overrides a variable
  expects every chart to follow. Shadow DOM is for hosts that must protect the chart from a hostile
  stylesheet (a CMS theme): custom properties still inherit through it, class rules do not leak in.
- **Reading the spec** *(amended by the PoC, F-P1)*. With the script in `<head>` —the integration
  API delta §1.5 shows— the element is upgraded at its start tag, before the parser reaches its JSON
  child, so `connectedCallback` finds it empty. The element SHALL wait for the child (a
  `MutationObserver` on itself, disconnected once a complete spec is read or the element is
  removed) and SHALL treat JSON that does not parse yet as not arrived. A `spec` property set before
  the child arrives wins. Verified red-first in T-304.
- **Mounting on load** *(as implemented)*. The script builds define the element and call `mountAll` once the document is parsed, so a page needs no inline script to bring `renderToHTML`'s interactive boxes to life.
- **Server-rendered roots.** The element and `mountAll` adopt an existing chart root when its
  serialisation equals what they would build (DD-063's nodes compared through the gate's
  normaliser); otherwise they replace it. No hydration-mismatch warning: there is no framework to
  mismatch with.

### DD-071 — A host's theme selects; it never tints

- **Decision.** `hostAppearance` maps a host's background to one of the **declared**
  ground/substrate pairs by relative-luminance distance, and `highContrast` to `precision`. It
  returns names. It does not produce a palette from host colours.
- **Why.** The palette is computed and contrast-checked, not chosen by eye (settled decision); a
  palette derived from an arbitrary report theme would ship unverified contrast.

### DD-072 — Databricks AI/BI dashboards are out

- **Decision.** No integration. Their custom visualization takes a Vega-Lite specification; the
  grounds' tonal mechanisms and inking are not expressible in it, and an approximation would be the
  second engine Art. 2 forbids. Databricks **notebooks** are served by the Python package.
- **Revisit** if the product accepts arbitrary HTML or a script-based visual.

## 3. Patterns — add to §5

- **§5.3 allowlist.** Unchanged. `@silverpoint/embed` has two dependencies, both workspace packages.
  The standalone files inline them; that is a build output, not a dependency.
- **`check-deps` rules.** New: no package but `@silverpoint/mcp` imports `@silverpoint/embed`;
  `embed`'s main, `/hosts` and `/conformance` entries reference no DOM global (`document`, `window`,
  `HTMLElement`, `customElements`) — the same lint the core has.
- **Forbidden-API scan** (REQ-644): `tools/lint-rules/no-network.mjs` over `packages/embed/dist/**`,
  failing on the listed identifiers; run after build in `ci.yml`.
- **Generated files.** `charts.generated.ts`, `assets.generated.ts`, `host-catalog.json`,
  `conformance.json`, `integrity.json`: written by `generate`, diffed by `check`.

## 4. Supply chain — add a row to §6

| Vector | Mitigation |
|---|---|
| A host serves a tampered standalone file | `integrity.json` (REQ-651) for `<script integrity>`; hosts vendor the file from the npm tarball published with provenance, not from a CDN at run time; the conformance kit detects a file that draws differently |
| A spec carries hostile strings (a column name, a title from a report) | Nodes and `textContent` only (DD-063); JSON-for-script escaping in `renderToHTML`; a hostile-input corpus as in T-255, over `title`, labels, ids, column names and palette values |

## 5. Testing strategy — add to §8

| Level | What | Requirement |
|---|---|---|
| Unit (vitest, project `embed`) | `validateSpec` per error kind; `renderToSVG` vs canonical trees; determinism; limits; `specFromTable` and each reshape; `hostCatalogFollows`; JSON escaping; hostile corpus | REQ-630..635, 656..658 |
| Generator | Host-catalog projection rules, golden file; `check` | REQ-653..655 |
| DOM (vitest + happy-dom) | `mount` / `update` / `destroy`; events; element attributes; `mountAll` idempotence; no `innerHTML` (a spy that throws) | REQ-636..646, 668 |
| Gate (pinned Chromium) | Embed tree gate and pixel column; demo gate | REQ-664, REQ-659 |
| E2E (`browser-embed` job, three engines) | The standalone file: keyboard, pointer, resize, CSP page, sandboxed frame, request log empty | REQ-665 |
| Contract | `render_chart` unchanged (REQ-567); `generate_code { framework: 'html' }` output validates | REQ-660, REQ-662 |
| Bundle | Budgets; forbidden-API scan; REQ-444 one-chart builds | REQ-650, 644, 652 |
| Conformance | `conformance()` passes on the built files, in Node and in the browser | REQ-666 |

## 6. Publication — add to §9

`@silverpoint/embed` is the tenth package of the `fixed` group; first publish by hand as a
placeholder, then its trusted publisher, then CI ([`first-publish.md`](first-publish.md)). The
standalone files and the three JSON files are in the tarball (`files: ["dist"]`); nothing is
uploaded anywhere else by this repository. Each GitHub release attaches a **hosts kit** zip —the
standalone files, `host-catalog.json`, `conformance.json`, `integrity.json`, the `renderToHTML`
goldens and the table fixtures, all of which are also in the tarball under `dist`— for hosts that
vendor from release assets instead of npm (the Python package's build).

## 7. Open questions — resolved at gate 3 (2026-11-20)

| ID | Question | Resolution |
|---|---|---|
| OQ-H1 | The budgets (DD-062) | Measured by the PoC; DD-062 and API delta §7 |
| OQ-H2 | Does WebKit apply `adoptedStyleSheets` inside a sandboxed frame without `allow-same-origin`? | Verified in Chromium (one adopted sheet, no `<style>`, opaque origin). WebKit could not run in the PoC's environment: **carried to T-324** as a required case in all three engines; on failure the client keeps the `<style>` fallback and the host page needs `style-src` for it, decided with the user |
| OQ-H3 | Should `orbit-chart` get a long-form binding in `0.11.0`? | **No.** It stays `binding: 'none'` with its reason (API delta §15.3): a row carries an array of markers, and a long form needs a new `marker` reshape. Revisit in a delta when a host asks; the PY, N8N, SUP, VOL, PBI, TAB and KN chart lists exclude it until then, generated from the catalog |
| OQ-H4 | Labels in the host catalog are English only; do hosts need a localisation table here, or do they translate? | **Hosts translate.** The catalog keeps one English label per entry and no localisation table. Every entry already carries a stable key —chart `slug`, role `id`, option `name`, ground, substrate, mode and palette ids— and a host keys its own translations on them (Volto's i18n, Power BI's localisation API). A host's CI checks that every key of the pinned catalog has a translation in each language it ships, so a new chart or option fails there, not at run time |

## Constitution check

Art. 2: DD-061 removes a private copy and forbids new ones; DD-066..068 keep every host on the
engine. Art. 3: DD-063, DD-065. Art. 4: DD-062's files are deterministic builds; ids per API delta
§4. Art. 5: DD-064 ports the whole interaction, not a subset. Art. 7: DD-071 selects among declared
tokens. Art. 8: §3, no allowlist change; REQ-652 guarded by `check-deps`. Art. 9: DD-062 stays open
until measured, and says so.
