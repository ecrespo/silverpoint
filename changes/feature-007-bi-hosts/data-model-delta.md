# Data Model delta — host embedding

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 3, approved 2026-11-20 (user decision: every gate approved) |
| **Amends** | [Data Model](../../specs/data-model.md) v1.13 → v1.14: new §2.38..§2.44, §2.28 (the agent catalog's `hosts`), §5 (fixtures), §6 (I-53..I-60) |

## §2.38 `ChartSpec`

The shape of §2.32 (`ChartFenceSpec`) with three differences, and no others:

| Field | Fence (§2.32) | `ChartSpec` |
|---|---|---|
| `width` | 160..1280; the slide's content width when absent | 160..1600; measured (client) or 480 (DOM-free) when absent |
| `height` | 90..720; 360 when absent | 90..1200; the recipe's default when absent |
| `id` | `<deck>-s<slide>-c<ordinal>` when absent | the slug (DOM-free) or `sp-embed-<n>` (client) when absent |
| `ground`, `substrate`, `mode` | the slide's when absent | the mount's `appearance`, then the library defaults |

`data` is whatever the chart's `data` prop takes, restricted to JSON values. A prop whose type is a
function has no JSON form: accessors are given as key strings, which every accessor prop accepts.

## §2.39 `SpecError`, `SpecResult`, `EmbedDiagnostic`

As API delta §2. `SpecError.kind` is a closed set of eight; `role` is produced only by
`specFromTable`, `diagnostic` only by a render. A `SpecResult` always carries `diagnostics`, the
warnings raised while validating or rendering, in the order raised.

## §2.40 `HostCatalog`

```ts
interface HostCatalog {
  schema: 1;
  version: string;                         // the library version described
  appearance: {
    grounds: { name: string; label: string; substrates: { name: string; label: string }[] }[];
    modes: { name: 'ink' | 'precision'; label: string }[];
    palettes: { name: PaletteName; label: string }[];
  };
  common: HostOption[];                    // title, badge, value, unit, footerLeft, footerRight, label, description, dataTable, chrome, hatchFill, locale
  charts: HostChart[];                     // 60, in the agent catalog's order
}
```

`common` is the agent catalog's `common.chart` filtered by the option rule of §2.41, minus the fields
a spec carries at top level (`data`, `ground`, `substrate`, `mode`, `palette`, `id`, `width`,
`height`), `seed`, `numberFormat` and `className`.

## §2.41 `HostChart`, `HostRole`, `HostOption`

```ts
interface HostChart {
  slug: string; title: string; family: string; summary: string;
  shape: DataShape;                                        // §2.28
  binding: 'rows' | 'pivot' | 'scalar' | 'none';
  reshape?: 'matrix' | 'dimensions' | 'first-row';         // with `pivot` / `scalar`
  reason?: string;                                         // with `none`
  roles: HostRole[];                                       // [] with `none`
  options: HostOption[];
  demo?: { roles: Record<string, string | string[]>; rows: Record<string, unknown>[] };   // absent with `none`
}
interface HostRole {
  id: string;                    // the agent catalog's `role`, or the reshape's role
  prop: string | null;           // the accessor prop a column name is written to; null for reshape-only roles
  label: string;
  kind: 'dimension' | 'measure' | 'temporal' | 'any';
  dataType: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  multiple: boolean;             // takes several columns
}
interface HostOption {
  name: string; label: string; doc: string;
  kind: 'boolean' | 'number' | 'string' | 'enum';
  values?: string[];             // with `enum`
  default?: boolean | number | string;
}
```

`demo.rows` is the chart's demo dataset in the table form a host would hand over: for `rows` charts
the demo itself with `demoKeys` as `roles`; for `pivot` charts the long form whose reshape gives the
demo back; for `scalar` charts one row.

## §2.42 `Table`, `TableBinding`

As API delta §9 (API Spec §15.2). A `Table` in column form is row-major: `values[i][j]` is row `i`, column
`columns[j]`. Duplicate column names are a `shape` error. A role with `multiple` and a single string
is read as a one-element list.

## §2.43 `HostEntry` (the agent catalog's `hosts`, amends §2.28)

```ts
interface HostEntry {
  id: string;                    // 'powerbi', 'tableau', 'knime', 'n8n', 'superset', 'volto', 'plone-classic', 'python', 'flask', 'django', 'jupyter', 'databricks'
  name: string; kind: 'bi' | 'workflow' | 'notebook' | 'web' | 'cms' | 'language';
  via: 'embed' | 'react' | 'python';
  repository: string | null;     // null where the host has no repository (jupyter, databricks, flask, django)
  package: string | null; registry: 'npm' | 'pypi' | 'github-release' | 'github-pages' | 'knime-hub' | 'none';
  status: 'planned' | 'preview' | 'released';
  summary: string;
}
```

Source: `tools/agent-catalog/hosts.meta.ts`, edited by hand when a host changes status. It is the one
hand-written list in the feature, and deliberately so: the library cannot derive what exists in
other repositories.

## §2.44 `Conformance`

```ts
interface Conformance { version: string; cases: { name: string; spec: ChartSpec; sha256: string }[] }
```

`sha256` is over the UTF-8 bytes of `renderToSVG(spec).svg` with default options. Cases: one per
chart (its demo, `width: 480`, `id` = the slug), and the appearance axes over four charts chosen to
cover hatched fills, weighted lines, a radial layout and text-heavy chrome.

## §5 Fixtures — add

- **Embed tree fixtures**: none stored. The gate derives a spec from each chart fixture and compares
  against that fixture's existing canonical (DD-065).
- **`fixtures/embed/html/*.html`**: `renderToHTML` goldens — static document, static fragment,
  interactive fragment — for three charts. They are the contract another language writes (DD-069).
- **`fixtures/embed/hostile/*.json`**: the hostile-input corpus.
- **`fixtures/embed/tables/*.json`**: `TableBinding` inputs with expected specs or errors, one set
  per `binding` kind.

## §6 Invariants — add

| ID | Invariant | Verified by |
|---|---|---|
| I-53 | For every valid spec, `renderToSVG(spec).svg`, its `<style>` set aside, parses to the tree of the canonical render of the same recipe, props, size and id | T-294 |
| I-54 | `validateSpec` is total: for any input value it returns a `SpecResult` and does not throw | T-292 (property test over arbitrary JSON) |
| I-55 | `CHART_SLUGS` equals the agent catalog's chart slugs, in order, and every slug resolves to a recipe | T-293 |
| I-56 | The nodes `mount` builds serialise, normalised, to `toChartRootString(renderSpec(spec))`, normalised | T-298, T-322 |
| I-57 | No `@silverpoint/embed` build output contains a forbidden identifier of REQ-644 | T-310 |
| I-58 | Every role `prop` and every option `name` in the host catalog is a declared prop of that chart in the agent catalog, and no prop is both a role and an option | T-313 |
| I-59 | For every chart with `binding ≠ 'none'`, `specFromTable(demo)` renders the same tree as the chart's canonical demo render | T-316 |
| I-60 | `conformance(renderToSVG)` passes with zero failures on the package's own built files | T-325 |

## Constitution check

Art. 2 and Art. 3 are I-53 and I-56. Art. 4: `Conformance.sha256` is only meaningful because output
is byte-stable (REQ-634). Art. 7: `appearance` lists tokens' names; no colour appears in the host
catalog. Art. 9: every invariant names the task that tests it.
