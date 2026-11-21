# API delta — `@silverpoint/embed`, the host catalog and the agent-access changes

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 2, approved 2026-11-20 (user decision: every gate approved); §7 budgets filled from the PoC |
| **Amends** | [API Spec](../../specs/api-spec.md) v1.15 → v1.16: §1 (a row), new §1.5, new §3.7, §11 (two diagnostics), §12 (budgets), §14.2, §14.3, §14.6, new §15 |
| **Requirements** | REQ-629..REQ-668 |

Nothing published in `0.10.x` changes shape. Every addition is additive; `0.x` rules apply (§13).

## 1. Packages and entry points — add to §1

| Package | Contents | Dependencies |
|---|---|---|
| `@silverpoint/embed` | **Optional, for hosts.** Any chart from one JSON spec: a DOM-free render, a framework-free client, the same as a single standalone file, the host catalog and the conformance kit (§1.5, §3.7, §15) | `@silverpoint/core`, `@silverpoint/grounds`; no framework, no peer |

`@silverpoint/mcp` gains `@silverpoint/embed` as a dependency (REQ-660).

### 1.5 Host embedding (feature-007) — new

| Entry | Environment | Exports |
|---|---|---|
| `@silverpoint/embed` | any (no DOM) | `validateSpec`, `renderSpec`, `renderToSVG`, `renderToHTML`, `CHART_SLUGS`, `VERSION`, the types of §3.7 |
| `@silverpoint/embed/client` | browser | `mount`, `mountAll`, `defineElement`, `hostAppearance`, `ELEMENT_NAME`, and everything of the main entry |
| `@silverpoint/embed/hosts` | any (no DOM) | `HOST_CATALOG`, `specFromTable`, `hostCatalogFollows`, the types of §15 |
| `@silverpoint/embed/conformance` | any (no DOM) | `CONFORMANCE`, `conformance(renderToSVG)` (§15.4) |
| `@silverpoint/embed/host-catalog.json` | — | the host catalog file |
| `@silverpoint/embed/conformance.json` | — | the conformance file |
| `@silverpoint/embed/silverpoint-embed.js`, `.mjs` | browser, or Node for the DOM-free functions | the standalone file: main + client + hosts + the `conformance` function, no import; the script build defines `globalThis.Silverpoint` and the element. Importing the module build touches no DOM global, so Node can call `renderToSVG`, `specFromTable` and `conformance` from it |
| `@silverpoint/embed/silverpoint-embed.full.js`, `.full.mjs` | browser | the same with EB Garamond's three cuts inlined |
| `@silverpoint/embed/integrity.json` | — | `{ "<file>": "sha384-…" }` for the four standalone files (REQ-651) |

The module entries import `@silverpoint/core` and `@silverpoint/grounds` normally, so a bundler
shares them with an adapter. The standalone files inline them and are for hosts with no bundler or
no dependency allowance. Do not load a standalone file and an adapter on one page expecting them to
share a provider: they do not.

```html
<!-- the whole integration, for a host that can serve one file -->
<script src="/static/silverpoint-embed.full.js"></script>
<silverpoint-chart ground="silverpoint" substrate="cream">
  <script type="application/json">
    { "chart": "bar-chart", "data": [{ "team": "A", "wins": 12 }, { "team": "B", "wins": 9 }],
      "props": { "xKey": "team", "valueKey": "wins", "title": "Wins" } }
  </script>
</silverpoint-chart>
```

## 2. Shared types — new §3.7

```ts
/** A chart as data. The deck fence's spec (Data Model §2.32), with no slide to inherit from. */
export interface ChartSpec {
  readonly chart: string;                       // catalog slug: "bar-chart"
  readonly data?: unknown;                      // the chart's demo dataset when absent
  readonly props?: Readonly<Record<string, unknown>>;   // own and common view props; not the fields below
  readonly width?: number;                      // 160..1600; measured by the client when absent, 480 by the DOM-free render
  readonly height?: number;                     // 90..1200; the recipe's default when absent
  readonly id?: string;                         // /^[A-Za-z0-9_.:-]+$/; the slug when absent (DOM-free) or a per-mount id (client)
  readonly ground?: string;
  readonly substrate?: string;
  readonly mode?: 'ink' | 'precision';
  readonly palette?: PaletteName | Palette;
}

export type SpecError =
  | { readonly kind: 'json'; readonly message: string }
  | { readonly kind: 'shape'; readonly message: string }
  | { readonly kind: 'chart'; readonly chart: string; readonly suggestions: readonly string[] }
  | { readonly kind: 'prop'; readonly props: readonly string[] }
  | { readonly kind: 'size'; readonly width?: number; readonly height?: number }
  | { readonly kind: 'limit'; readonly message: string }                       // REQ-635
  | { readonly kind: 'role'; readonly missing: readonly string[]; readonly unknownColumns: readonly string[] }  // specFromTable only
  | { readonly kind: 'diagnostic'; readonly code: string; readonly message: string };  // an error-severity SPnnn at render

export type SpecResult<T> = { readonly ok: true; readonly value: T; readonly diagnostics: readonly EmbedDiagnostic[] }
                          | { readonly ok: false; readonly error: SpecError; readonly diagnostics: readonly EmbedDiagnostic[] };

export interface EmbedDiagnostic { readonly code: string; readonly severity: 'warn' | 'error'; readonly message: string }
```

`width` and `height` ranges are wider than the fence's (a slide is at most 1280 × 720; a report tile
is not). Everything else is the fence's rule, word for word: unknown top-level fields, a field
repeated inside `props`, an undeclared prop and an unknown preset are errors (REQ-631).

## 3. The DOM-free entry

```ts
/** Accepts a parsed value or a JSON string. Total: never throws (REQ-631). */
export function validateSpec(input: unknown): SpecResult<ChartSpec>;

/** The library's pipeline for a spec: the recipe by slug, then `renderChart`. */
export function renderSpec(spec: ChartSpec, environment?: Partial<RenderEnvironment>): SpecResult<RenderedChart>;

export interface SVGOptions { readonly embedFonts?: boolean }   // EB Garamond 400 as a data URI, as `render_chart` does
export function renderToSVG(spec: ChartSpec | string, options?: SVGOptions): SpecResult<{ svg: string; width: number; height: number }>;

export interface HTMLOptions {
  /** `document`: `<!doctype html>` … ; `fragment`: one `<div>` to place in a page. Default `document`. */
  readonly as?: 'document' | 'fragment';
  /** Adds the spec as JSON and `data-sp-embed`, so a client on the page mounts it. Default `false`: a static chart. */
  readonly interactive?: boolean;
  /** With `interactive`: where the standalone file comes from. `inline` needs `script`. Default `none` (the page loads it). */
  readonly script?: { readonly src: string; readonly integrity?: string } | { readonly inline: string } | 'none';
  /** `inline` (default) writes the stylesheet in a `<style>`; `none` leaves styling to the page or the client. */
  readonly styles?: 'inline' | 'none';
  readonly embedFonts?: boolean;
  readonly title?: string;        // the document's <title>; the chart's name when absent
  readonly lang?: string;         // default "en"
}
export function renderToHTML(spec: ChartSpec | string, options?: HTMLOptions): SpecResult<{ html: string }>;

export const CHART_SLUGS: readonly string[];   // 60
export const VERSION: string;
```

- `renderToSVG` is `render_chart`'s function moved here (REQ-660): the ground's stylesheet as the
  root's first child, nothing else in the markup changed (REQ-632).
- `renderToHTML` writes `toChartRootString`'s markup: the focusable root, the SVG, the live region,
  the data table. A static document is a complete, accessible chart with no script at all.
- With `interactive`, the root sits inside
  `<div data-sp-embed><script type="application/json">…</script>…</div>`; the JSON is escaped for a
  script context (`<`, `>`, `&`, U+2028, U+2029 as `\uXXXX`). The client adopts the server's nodes if
  their serialisation equals what it would build, and replaces them otherwise.
- An invalid spec returns `ok: false` and, for `renderToHTML`, no markup: the caller decides what to
  show. (The client, which must show something, draws the error figure — REQ-668.)

## 4. The client

```ts
export interface MountOptions {
  readonly onActiveChange?: (item: ActiveItem | null) => void;
  readonly onSelect?: (item: ActiveItem) => void;
  readonly onDiagnostic?: (diagnostic: EmbedDiagnostic) => void;   // console.warn/error when absent, outside production
  /** Defaults under the spec's own fields (the host's theme). */
  readonly appearance?: { readonly ground?: string; readonly substrate?: string; readonly mode?: 'ink' | 'precision'; readonly palette?: PaletteName | Palette };
  readonly styles?: 'adopt' | 'none';              // default 'adopt' (REQ-643)
  readonly fonts?: 'embedded' | 'none';            // default 'embedded' in a `full` file, 'none' otherwise (REQ-647)
  readonly locale?: string;
}

export interface ChartMount {
  readonly element: HTMLElement;                   // the chart root
  update(spec: ChartSpec | string, options?: Pick<MountOptions, 'appearance'>): void;   // REQ-642
  getGeometry(): Geometry | null;                  // null while showing the error figure
  toSVGString(options?: { standalone?: boolean }): string;   // canonical markup; with `standalone`, self-painting
  destroy(): void;
}

export function mount(target: Element, spec: ChartSpec | string, options?: MountOptions): ChartMount;
export function mountAll(root?: ParentNode, options?: MountOptions): ChartMount[];   // REQ-646
export const ELEMENT_NAME = 'silverpoint-chart';
export function defineElement(name?: string): void;   // idempotent; a no-op without `customElements`

/** REQ-648. Picks among declared grounds and substrates; computes no colour of its own. */
export function hostAppearance(host: { background: string; foreground?: string; highContrast?: boolean }): { ground: string; substrate: string; mode: 'ink' | 'precision' };
```

**Events (REQ-639).** On the target: `sp-activechange` (`detail: ActiveItem | null`), `sp-select`
(`detail: ActiveItem`), `sp-diagnostic` (`detail: EmbedDiagnostic`). All bubble and are composed;
none is cancelable.

**The element (REQ-645).**

| Attribute / property | Meaning |
|---|---|
| child `<script type="application/json">` | the spec; read on connection and when the child list changes |
| `spec` (property) | a `ChartSpec` object or JSON string; wins over the child |
| `chart`, `ground`, `substrate`, `mode`, `palette`, `width`, `height` (attributes) | override the spec's fields; observed |
| `styles`, `fonts` (attributes) | as `MountOptions` |
| `mounted` (property, read-only) | the `ChartMount` or `null` |

The element renders in the light DOM by default, so the page's `--sp-*` overrides reach it as they
reach an adapter's chart. With the boolean attribute `shadow` it attaches an open shadow root and
adopts the stylesheet there (DD-070).

**Ids.** A mount with no `spec.id` takes `sp-embed-<n>`, `n` counting mounts in document order from
the first; `mountAll` over server-rendered roots reuses the id the server wrote. Give `id` whenever
the output must be stable across pages (Art. 4).

## 5. Markup contract — add to §10

The chart root is §10's, unchanged. Around it:

```html
<silverpoint-chart …>                 <!-- or any element given to mount(); or div[data-sp-embed] -->
  <script type="application/json">…</script>   <!-- kept; never rendered -->
  <div class="sp-root sp-ground-…" …> … </div> <!-- §10: svg.sp-chart, .sp-live, .sp-table-box -->
</silverpoint-chart>
```

The error figure (REQ-668) is the deck fence's: `figure.sp-embed-error[role="alert"]` holding the
error's message as text, in the ground's type. Parts: `data-sp-embed` (the mount box),
`data-sp-embed-state="mounted" | "error"`.

## 6. Diagnostics — add to §11

| Code | Severity | Requirement | Raised when | What to do |
|---|---|---|---|---|
| `SP030` | error | REQ-635 | A spec exceeds 2 MB serialised, or its path data exceeds the path byte budget | Send fewer rows, aggregate before charting, or use `hatchFill: 'tile'` |
| `SP031` | error | REQ-668 | The client was given a spec that does not validate; the error figure is shown | Read the message: it names the field, the unknown chart with suggestions, or the undeclared props |

The catalog of §11 grows from `SP029` to `SP031`; the agent catalog's `diagnostics`
follows by generation.

## 7. Limits and budgets — add to §12

| Item | Limit | Verified by |
|---|---|---|
| Spec, serialised | 2 MB | REQ-635 |
| `width` / `height` | 160..1600 / 90..1200 | REQ-631 |
| `silverpoint-embed.js` / `.mjs` | **140 kB** gzip (measured 121.1 kB; DD-062) | `.size-limit.json` |
| `silverpoint-embed.full.js` / `.full.mjs` | **220 kB** gzip (measured 197.5 kB) | `.size-limit.json` |
| `@silverpoint/embed` main entry, own code | **12 kB** gzip | `.size-limit.json` |
| `@silverpoint/embed/client` entry, own code | **8 kB** gzip | `.size-limit.json` |
| One-chart builds of the adapters | unchanged (REQ-444) | existing gate |

## 8. Agent access — amend §14

**§14.2.** The agent catalog gains

```jsonc
"hosts": [
  { "id": "powerbi", "name": "Power BI", "kind": "bi", "via": "embed",
    "repository": "https://github.com/ecrespo/silverpoint-powerbi", "package": "silverpoint-powerbi", "registry": "github-release",
    "status": "planned", "summary": "A custom visual: fields on roles, any of the tabular charts." }
  // tableau, knime, n8n, superset, volto, plone-classic, python, flask, django, jupyter, databricks
]
```

`status` ∈ `planned`, `preview`, `released`; `via` ∈ `embed`, `react`, `python`; `registry` ∈ `npm`,
`pypi`, `github-release`, `github-pages`, `knime-hub`, `none`. `frameworks` is **not** extended:
a host is not a framework, and `names`/`imports` stay keyed by the four frameworks.

**§14.3.** `generate_code`'s `framework` accepts `'html'` for a `{ chart }` target (REQ-662): the
result's `code` is the fragment of §1.5 —the `<silverpoint-chart>` with the spec in its JSON child,
`fields` mapped to accessor props as for the other frameworks— `imports` is the one `<script>` tag
for `silverpoint-embed.full.js` with its `integrity`, `stylesheets` is empty, and `notes` says where
the file comes from. `{ component }` and `{ deck }` with `html` are `invalid_input`.
`search_catalog` returns `kind: 'host'` hits (REQ-661). `render_chart`'s contract is unchanged.

**§14.6.** The `silverpoint` skill gains `references/hosts.md`, generated (REQ-663).

## 9. Host catalog and table binding — new §15

### 15.1 The host catalog (summary; shape in Data Model §2.40)

```jsonc
{
  "schema": 1,
  "version": "0.11.0",
  "appearance": {
    "grounds": [{ "name": "silverpoint", "label": "Silverpoint", "substrates": [{ "name": "cream", "label": "Cream" }, …] }, …],
    "modes": [{ "name": "ink", "label": "Ink" }, { "name": "precision", "label": "Precision" }],
    "palettes": [{ "name": "silverpoint", "label": "Silverpoint" }, …]
  },
  "common": [ { "name": "title", "kind": "string", "label": "Title", "doc": "…" }, … ],
  "charts": [
    {
      "slug": "bar-chart", "title": "Bar chart", "family": "bars", "summary": "…",
      "shape": "categories", "binding": "rows",
      "roles": [
        { "id": "x",         "prop": "xKey",         "label": "Category",  "kind": "dimension", "dataType": "string", "required": true,  "multiple": false },
        { "id": "value",     "prop": "valueKey",     "label": "Value",     "kind": "measure",   "dataType": "number", "required": true,  "multiple": false },
        { "id": "secondary", "prop": "secondaryKey", "label": "Secondary", "kind": "measure",   "dataType": "number", "required": false, "multiple": false }
      ],
      "options": [ { "name": "orientation", "kind": "enum", "values": ["columns", "rows"], "label": "Orientation", "doc": "…" } ],
      "demo": { "roles": { "x": "x", "value": "value", "secondary": "previous" }, "rows": [ … ] }
    }
  ]
}
```

- `kind` ∈ `dimension` (a category), `measure` (a number to aggregate), `temporal` (a date or time),
  `any`. `dataType` ∈ `string`, `number`, `date`, `boolean`.
- `binding` ∈ `rows` (a role is a column, a prop names it), `pivot` (long rows reshaped; `reshape`
  says how), `scalar` (one value from the first row), `none` (not feedable from a table; `reason`).
- `options` holds only props a control can express: `boolean`, `number`, `string`, `enum` (with
  `values`). Accessors, callbacks, objects and arrays are not options. `label` is the prop's name in
  sentence case unless the chart's metadata gives one.

### 15.2 `specFromTable`

```ts
export type Table =
  | { readonly rows: readonly Readonly<Record<string, unknown>>[] }
  | { readonly columns: readonly string[]; readonly values: readonly (readonly unknown[])[] };   // row-major

export interface TableBinding {
  readonly chart: string;
  readonly table: Table;
  /** role id → column name; a role with `multiple` takes an array of names. */
  readonly roles: Readonly<Record<string, string | readonly string[]>>;
  readonly options?: Readonly<Record<string, unknown>>;      // own options and common view options
  readonly appearance?: Pick<ChartSpec, 'ground' | 'substrate' | 'mode' | 'palette'>;
  readonly size?: Pick<ChartSpec, 'width' | 'height'>;
  readonly id?: string;
}

export function specFromTable(binding: TableBinding): SpecResult<ChartSpec>;
export function hostCatalogFollows(pinned: string, current: string): boolean;   // same major.minor (REQ-658)
export const HOST_CATALOG: HostCatalog;
```

`specFromTable` copies only the mapped columns into `data` (a host's table may carry fields the
chart never reads), under their own names, and sets each role's `prop` to its column's name. It does
not aggregate, sort or filter: the host's query did. Dates given as `Date` objects are written as ISO
strings; `null` and `undefined` cells pass through as `null`.

### 15.3 Reshapes (REQ-657)

| Chart | `binding` | Roles offered to a host | Reshape |
|---|---|---|---|
| `heatmap-chart` | `pivot` | `row` (dimension), `column` (dimension), `value` (measure) | One output row per distinct `row`, its `values` array in the order columns first appear; the distinct columns to `columnLabels` |
| `parallel-coordinates-chart` | `pivot` | `label` (dimension, optional), `dimensions` (measure, `multiple`) | `dimensions` prop takes the mapped column names |
| `gauge-arc`, `meter-chart` | `scalar` | `percent` (measure) | The first row's cell to the `percent` prop |
| `kpi-card` | `rows` | as the catalog | — |
| `orbit-chart` | `none` | — | `reason`: each row carries an array of markers no flat table states. *(Revisit with a `marker` long form.)* |

The final table is produced by the generator from the chart metadata and reviewed at gate 3; the rows
above are the ones the agent catalog of `0.10.1` forces.

### 15.4 The conformance kit (REQ-666)

```ts
export interface ConformanceCase { readonly name: string; readonly spec: ChartSpec; readonly sha256: string }   // of renderToSVG(spec).svg, UTF-8
export const CONFORMANCE: { readonly version: string; readonly cases: readonly ConformanceCase[] };
export function conformance(
  render: (spec: ChartSpec) => string | Promise<string>,
  hash?: (text: string) => string | Promise<string>,        // SHA-256 hex; Web Crypto when absent
  cases?: Conformance,                                      // `CONFORMANCE` when absent; a host passes the `conformance.json` it pinned
): Promise<{ readonly passed: number; readonly failed: readonly { name: string; expected: string; actual: string }[] }>;
```

One case per chart with its demo dataset at 480 px, plus the appearance axes on four charts (each
ground, each mode, two palettes). A host repository runs it against **the file it ships**, in the
runtime it ships it in.

## Constitution check

Art. 2: every render entry is `renderSpec` → `renderChart`; the client holds no maths (§4). Art. 3:
the markup contract is §10's, and §5 adds only a wrapper. Art. 4: ids (§4), byte-identical output
(§3). Art. 5: the static document is a complete chart root; the client's interaction is the
reducer's. Art. 8: no new runtime dependency anywhere; `@silverpoint/embed` is optional. Art. 9: every
surface cites its requirement.
