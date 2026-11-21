# PRD delta — silverpoint in BI tools and flows

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 1, approved 2026-11-20 (user decision: every gate approved) |
| **Amends** | [PRD](../../specs/prd.md) v1.18 → v1.19: §1, §3 (Personas 7 and 8), §5.1, §5.2, §5.3, new §6.16, §6.14 (agent access gains hosts and `html`), §7, §9 (Epic K), §11 |
| **Applicable Constitution** | [`constitution.md`](../../specs/constitution.md) v1.11, with the v1.12 amendment proposed in [`constitution-amendment.md`](constitution-amendment.md) |
| **Research** | [`research.md`](research.md) |
| **Size** | Complex feature (a new package, a generated catalog, a blocking PoC, eight dependent repositories): PRD + API + TD + Data Model + Plan + Tasks + Analyze (Art. 9) |
| **Target release** | `0.11.0` (`minor`) |

## 1. Summary

A new framework-free package, `@silverpoint/embed`, draws any of the 60 charts from one JSON
document, the **chart spec**: on a server as a standalone SVG or a self-contained HTML document, and
in a page as live nodes with the same keyboard reading, readout, precision mode and tabular
alternative the three adapters give. It ships as a **single standalone file** as well as a module.
Beside it, a **host catalog** —generated from the agent catalog— tells a BI or workflow tool, in
data, which roles each chart binds columns to and which options deserve a control, and
`specFromTable` turns "these columns in these roles" into a chart spec. Host integrations for Power
BI, Tableau, KNIME, n8n, Apache Superset, Plone, Flask, Django, Databricks and Jupyter are built on
those three pieces in repositories of their own, specified in [`repositories/`](repositories/README.md).

## 2. Problem

| Today | Cost |
|---|---|
| A silverpoint chart exists only inside a React, Vue, Angular or Reflex app | An analyst who lives in Power BI, Tableau, KNIME or a notebook cannot use it at all |
| Leaving the app means exporting a picture | The readout, keyboard reading, the data table and precision mode are lost; the picture does not follow the data |
| A workflow (n8n, KNIME) that produces a report has no way to draw in this style | Reports and dashboards of the same organisation look like two products |
| Each integration would write its own "columns → props" mapping and its own render-by-name | N copies of the same logic, each free to diverge from the library (research §2.3) |
| Python reaches silverpoint only through Reflex | Flask, Django, Plone and notebook users have nothing |

## 3. Scope changes

### §5.1 In Scope — add

- [ ] `@silverpoint/embed`: the chart spec, its validation, the DOM-free render (§6.16.1).
- [ ] The embed client: `mount`, `update`, `destroy`, events, the `<silverpoint-chart>` element,
      `mountAll` (§6.16.2).
- [ ] The standalone file, with and without fonts, under a budget fixed by a PoC (§6.16.3).
- [ ] The host catalog and `specFromTable` (§6.16.4).
- [ ] `render_chart` through the embed; hosts and `html` in the agent catalog, the MCP server and
      the skill (§6.16.5).
- [ ] Parity, pixel and end-to-end gates for the client; the conformance kit for hosts (§6.16.6).

### §5.2 Out of Scope — add

- Any host's SDK, manifest or packaging in this repository (research §6; DD-068).
- Databricks AI/BI dashboard visualizations: Vega-Lite only (DD-072).
- A server-side SVG from Python without a JavaScript runtime (DD-069).
- The dashboard composition, the UI components, the timeline and the deck in the embed. `0.11.0`
  embeds charts. *(They are React, Vue and Angular features; a host that is React may use them.)*
- Cross-filtering, selection write-back and drill-through into the host. The client reports
  `select`; what a host does with it is the host repository's requirement.
- A PNG render (REQ-544 stays deferred).
- Editing a chart: no configuration UI ships in the embed. Each host has its own property pane.

### §5.3 Future Considerations — add

- `@silverpoint/marp` reading its fence through the embed's validator (decision D11).
- The dashboard composition in the embed (`DashboardSpec`).
- A per-family split of the standalone file, if the PoC's budget proves tight in the field.
- A hosted `render` endpoint (SVG over HTTP) for hosts that can only show an image.
- `generate_code` for `python`, once the Python package exports its own catalog as Reflex does.

## 4. Personas served

- **Persona 7 — new — analyst in a BI tool.** Builds reports in Power BI, Tableau or Superset, or
  workflows in KNIME. Does not write code. Needs to pick a chart, drop fields on roles, set a ground
  and a mode, and get the same chart the organisation's apps show.
- **Persona 8 — new — integrator.** Maintains a host integration, or embeds charts in a
  server-rendered site or an automation (n8n). Needs one file, one JSON shape, a description of every
  chart in data, and a way to prove the integration still draws correctly after an upgrade.
- **Persona 2** (data scientist, Python): a chart from a DataFrame in a notebook cell.
- **Persona 4** (precision or accessibility needs): nothing is lost on the way into a host.

## 5. New §6.16 — Host embedding

Patterns: *ubiquitous*, *event* (WHEN), *state* (WHILE), *optional* (WHERE), *unwanted* (IF/THEN).

### 6.16.1 The chart spec and the DOM-free render

| ID | Pattern | Requirement | Priority |
|---|---|---|---|
| REQ-629 | ubiquitous | THE SYSTEM SHALL publish `@silverpoint/embed` in the `fixed` group, depending only on `@silverpoint/core` and `@silverpoint/grounds`, with no framework and no peer dependency. | MUST |
| REQ-630 | ubiquitous | THE SYSTEM SHALL accept a chart as one JSON-serialisable `ChartSpec` with the fields `chart`, `data`, `props`, `width`, `height`, `id`, `ground`, `substrate`, `mode` and `palette`, with the meanings of Data Model §2.32, for each of the 60 charts by its catalog slug. | MUST |
| REQ-631 | unwanted | IF a value given as a spec is not valid, THEN `validateSpec` SHALL return a `SpecError` of kind `json`, `shape`, `chart`, `prop`, `size` or `limit` —with the closest slugs for `chart` and the offending names for `prop`— and SHALL never throw. | MUST |
| REQ-632 | event | WHEN `renderToSVG` receives a valid spec, THE SYSTEM SHALL return a standalone SVG whose parsed tree, with the inlined stylesheet set aside, is identical to the canonical render of the same chart, props, size and id. | MUST |
| REQ-633 | event | WHEN `renderToHTML` receives a valid spec, THE SYSTEM SHALL return markup that holds the canonical chart root, the stylesheet and, WHERE `interactive` is set, the spec as JSON for the client to mount, and that requests no resource the caller did not name. | MUST |
| REQ-634 | ubiquitous | THE SYSTEM SHALL return byte-identical output from `renderToSVG` and `renderToHTML` for the same spec and options. | MUST |
| REQ-635 | unwanted | IF a spec's serialised size exceeds 2 MB, or its rendered path data exceeds the path byte budget, THEN THE SYSTEM SHALL refuse it with a `limit` error and raise `SP030`. | MUST |

### 6.16.2 The client

| ID | Pattern | Requirement | Priority |
|---|---|---|---|
| REQ-636 | event | WHEN `mount` receives a target element and a valid spec, THE SYSTEM SHALL build under the target a chart root whose serialised, normalised form is identical to the canonical chart root for the same input. | MUST |
| REQ-637 | ubiquitous | THE SYSTEM SHALL build the client's nodes from the core's view with DOM methods, and SHALL never parse a string as markup nor assign `innerHTML`. | MUST |
| REQ-638 | ubiquitous | THE SYSTEM SHALL give a mounted chart the interaction of the adapters' client charts —pointer, focus, arrow keys, Home and End, Enter and Space, Escape; the active mark, the readout and the live region— by forwarding events to the core's interaction reducer (REQ-140..REQ-143). | MUST |
| REQ-639 | event | WHEN the active item changes or an item is chosen, THE SYSTEM SHALL call the `onActiveChange` or `onSelect` option and dispatch a bubbling `sp-activechange` or `sp-select` event on the target, whose `detail` is the item or `null`. | MUST |
| REQ-640 | state | WHILE a mounted chart has no `width` in its spec, THE SYSTEM SHALL draw it at its container's measured width and redraw when that width changes, and SHALL raise no diagnostic for a container that is not displayed. | MUST |
| REQ-641 | state | WHILE `prefers-contrast: more` or `forced-colors: active` holds, THE SYSTEM SHALL draw a mounted chart in `precision` mode whatever its spec says. | MUST |
| REQ-642 | event | WHEN `update` receives a new spec, THE SYSTEM SHALL redraw in place, keeping focus and keeping the active item where one with the same series and index still exists; WHEN `destroy` is called, THE SYSTEM SHALL remove its nodes, listeners and observers. | MUST |
| REQ-643 | ubiquitous | THE SYSTEM SHALL apply the client's stylesheet and every style declaration through the CSS object model, once per document or shadow root, so that a page whose policy forbids inline styles renders the chart; WHERE `styles: 'none'` is given it SHALL apply no stylesheet. | MUST |
| REQ-644 | ubiquitous | THE SYSTEM SHALL NOT, in any `@silverpoint/embed` entry, open a network connection, evaluate a string as code, import dynamically, or read or write cookies or web storage. CI SHALL fail if the built files reference `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `eval`, `new Function`, `import(`, `localStorage`, `sessionStorage` or `document.cookie`. | MUST |
| REQ-645 | ubiquitous | THE SYSTEM SHALL provide a `<silverpoint-chart>` custom element that reads its spec from a child `<script type="application/json">` or from its `spec` property, takes `chart`, `ground`, `substrate`, `mode`, `palette`, `width` and `height` as attributes that override the spec, and redraws when any of them changes. | MUST |
| REQ-646 | event | WHEN `mountAll` is called, THE SYSTEM SHALL mount every element carrying `data-sp-embed` that holds a JSON spec and is not mounted yet, and SHALL return their handles. | MUST |
| REQ-647 | optional | WHERE `fonts: 'embedded'` is given and the file in use carries them, THE SYSTEM SHALL register EB Garamond's three cuts from inlined data; otherwise it SHALL draw with the ground's fallback stack and request no font. | MUST |
| REQ-648 | optional | WHERE the host passes its background and foreground colours to `hostAppearance`, THE SYSTEM SHOULD return the ground, substrate and mode among the declared ones that sit closest to them, for the host to use as defaults. | SHOULD |
| REQ-668 | unwanted | IF the spec given to `mount`, to the element or to `mountAll` is not valid, THEN THE SYSTEM SHALL draw the error figure of the deck fence (REQ-591) naming the error, raise `SP031`, and leave the page's other charts untouched. | MUST |

### 6.16.3 The standalone file

| ID | Pattern | Requirement | Priority |
|---|---|---|---|
| REQ-649 | ubiquitous | THE SYSTEM SHALL build, in `@silverpoint/embed`, `silverpoint-embed.js` —one script with no import, defining the global `Silverpoint` with every export of the main and client entries, every chart, both grounds and the stylesheet— its module twin `silverpoint-embed.mjs`, and `silverpoint-embed.full.js` and `.full.mjs`, which add the fonts. The custom element is defined on load in the script builds only. | MUST |
| REQ-650 | ubiquitous | THE SYSTEM SHALL keep each standalone file within the budget DD-062 records from the PoC, verified in CI. | MUST |
| REQ-651 | ubiquitous | THE SYSTEM SHALL expose the library version as `Silverpoint.version` and in a banner comment, and SHALL publish `integrity.json` with a SHA-384 digest of each standalone file. | MUST |
| REQ-652 | ubiquitous | THE SYSTEM SHALL leave every adapter's one-chart build within REQ-444's allowance; no adapter, and neither `@silverpoint/core` nor `@silverpoint/grounds`, SHALL import `@silverpoint/embed`. | MUST |

### 6.16.4 The host catalog

| ID | Pattern | Requirement | Priority |
|---|---|---|---|
| REQ-653 | ubiquitous | THE SYSTEM SHALL generate `host-catalog.json` from the agent catalog with the same generator, never by hand; its `check` SHALL fail on any difference. | MUST |
| REQ-654 | ubiquitous | THE SYSTEM SHALL describe each chart in the host catalog by `slug`, `title`, `family`, `summary`, `shape`, `binding`, its `roles` (`id`, `prop`, `kind`, `dataType`, `required`, `multiple`), its `options` (`name`, `kind`, `values`, `default`, `label`, `doc`) and a `demo` of roles and rows. | MUST |
| REQ-655 | ubiquitous | THE SYSTEM SHALL list in the host catalog the grounds with their substrates, the modes, the palette presets and the view options common to every chart, each with a label. | MUST |
| REQ-656 | event | WHEN `specFromTable` receives a chart, a table as rows or as columns, a mapping of roles to column names, options and an appearance, THE SYSTEM SHALL return the `ChartSpec` that binds them, or a `SpecError` of kind `role` naming each required role left unmapped and each mapped column the table lacks. | MUST |
| REQ-657 | ubiquitous | THE SYSTEM SHALL reshape the table for every chart whose `binding` is `pivot` or `scalar` —a matrix from long rows, a set of dimensions from columns, a single value from the first row— and SHALL mark `binding: 'none'` every chart it cannot feed from a table, each with the reason. | MUST |
| REQ-658 | ubiquitous | THE SYSTEM SHALL stamp the host catalog with `schema` and the library `version`, and SHALL export `hostCatalogFollows(pinned, current)`, true when both are on the same major and minor. | MUST |
| REQ-659 | ubiquitous | CI SHALL, for every chart whose `binding` is not `none`, run `specFromTable` over the catalog's own `demo` and compare the render with the canonical render of the chart's demo dataset, tree for tree. | MUST |

### 6.16.5 Agent access

| ID | Pattern | Requirement | Priority |
|---|---|---|---|
| REQ-660 | ubiquitous | THE SYSTEM SHALL render `render_chart` through `@silverpoint/embed`'s `renderToSVG`, with REQ-543 and the gate of REQ-567 unchanged. | MUST |
| REQ-661 | ubiquitous | THE SYSTEM SHALL list in the agent catalog a `hosts` section —for each host integration its `id`, `name`, `repository`, `package`, `registry`, `via` (`embed`, `react` or `python`) and `status`— read from one source file, and SHALL return it from `search_catalog` as hits of kind `host`. | MUST |
| REQ-662 | event | WHEN `generate_code` receives `framework: 'html'` with a chart target, THE SYSTEM SHALL return a page fragment that loads the standalone file and holds a `<silverpoint-chart>` with the spec, whose spec passes `validateSpec`. | MUST |
| REQ-663 | ubiquitous | THE SYSTEM SHALL add to the `silverpoint` skill a generated `references/hosts.md` naming each host, what it is built on and how a chart reaches it. | MUST |

### 6.16.6 Gates and documentation

| ID | Pattern | Requirement | Priority |
|---|---|---|---|
| REQ-664 | ubiquitous | CI SHALL compare the embed client's nodes against the canonical chart root over the PR fixture matrix with zero tolerance, and SHALL include the client in the pixel gate of Art. 3. | MUST |
| REQ-665 | ubiquitous | CI SHALL exercise the standalone file end to end: keyboard and pointer, resize, `update` and `destroy`, the custom element, `mountAll`, a page under `script-src 'self'; style-src 'self'`, and a frame under `sandbox="allow-scripts"`, with no console error and no request beyond the page's own files. | MUST |
| REQ-666 | ubiquitous | THE SYSTEM SHALL publish in `@silverpoint/embed` a conformance kit —for a declared set of specs, the SHA-256 of each `renderToSVG` result— and a `conformance` function a host repository runs to prove the embed it carries draws them unchanged. | MUST |
| REQ-667 | ubiquitous | THE SYSTEM SHALL document the embed with a README, an `examples/embed-html` page that uses nothing but the standalone file, and an `#/embed` page on the docs site listing the hosts. | MUST |

*Numbering note:* REQ-668 sits in §6.16.2, where it belongs; it was written last and keeps its number
so that the range stays contiguous.

## 6. Amendments to §6.14 (agent access)

- REQ-539's tool list is unchanged in number (thirteen): `generate_code` gains a framework value
  (REQ-662), `search_catalog` a hit kind (REQ-661).
- REQ-556 (the Reflex pin) is unchanged. A host integration's pin is the host's own affair and is
  never a release gate of this repository (DD-068): the library does not wait for eight repositories.

## 7. Non-functional requirements — add to §7

| Area | Requirement |
|---|---|
| Size | The standalone files' budgets (REQ-650), measured compressed and uncompressed, in `.size-limit.json` |
| Compatibility | The standalone file targets ES2020 and the evergreen engines of the last two years; it uses `ResizeObserver` and constructable stylesheets where present and degrades to a fixed width and a `<style>` element where not |
| Security | REQ-637, REQ-644; the TD §6 table gains a row for hosts (TD delta §6) |
| Accessibility | Art. 5 in full inside a host; the tabular alternative is part of the chart root and is never dropped by the client |

## 8. User stories — Epic K (add to §9)

| Story | Requirements |
|---|---|
| K-1 As Persona 8, I draw a chart from JSON on a server and get an SVG I can attach to a report | REQ-630, REQ-632, REQ-634 |
| K-2 As Persona 8, I drop one script and one element into a template and the chart is live | REQ-645, REQ-649, REQ-638 |
| K-3 As Persona 8, my host's property pane is generated from data, not typed by hand | REQ-653..REQ-655 |
| K-4 As Persona 7, I put fields on roles and the chart appears, heatmap included | REQ-656, REQ-657 |
| K-5 As Persona 4, a chart inside a BI report reads by keyboard and switches to precision mode | REQ-638, REQ-641 |
| K-6 As Persona 8, I upgrade the file my integration carries and know in one CI job that it still draws correctly | REQ-666, REQ-658 |
| K-7 As Persona 8, my integration passes a certification that forbids network access | REQ-644, REQ-647 |
| K-8 As an agent, I am asked for "a chart in a plain HTML page" and write one that validates | REQ-662 |

## 9. Risks — add to §11

Research §7, R1..R8.

## Constitution check

Art. 1, 4, 6, 7: unchanged by construction — the embed calls `renderChart`, so vertices, seeds,
tonal mechanism and ground tokens are the library's (REQ-632, REQ-634). Art. 2: REQ-629, REQ-660 and
the amendment bind the embed and the hosts to the single engine. Art. 3: REQ-636, REQ-664. Art. 5:
REQ-638, REQ-641, and the chart root's table. Art. 8: REQ-629, REQ-652. Art. 9: every MUST has an id;
tasks cite them (plan). No exception is requested.
