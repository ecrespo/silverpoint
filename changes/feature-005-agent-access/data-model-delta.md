# Data Model delta — agent access

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 3, drafted and approved 2026-10-20; **folded into `specs/data-model.md` (v1.9) on 2026-10-20** (T-251) |
| **Amends** | [Data Model](../../specs/data-model.md) v1.8 → v1.9: new §2.28..§2.31, invariants I-37..I-42 |

## §2.28 `AgentCatalog`

```ts
interface AgentCatalog {
  readonly schema: 1;
  readonly version: string;                         // library version (REQ-534)
  readonly reflex: { readonly version: string; readonly wraps: string; readonly stale: boolean };
  readonly frameworks: readonly Framework[];        // ['react', 'vue', 'angular', 'reflex']
  readonly common: { readonly chart: readonly PropEntry[]; readonly ui: readonly PropEntry[] };
  readonly charts: readonly ChartEntry[];           // 60, catalog order
  readonly components: readonly ComponentEntry[];   // 38, UI_COMPONENTS order
  readonly dashboard: { readonly props: readonly PropEntry[]; readonly layout: readonly PropEntry[]; readonly cell: readonly PropEntry[]; readonly names: Names; readonly imports: Imports };
  readonly grounds: readonly { readonly name: string; readonly substrates: readonly string[]; readonly summary: string }[];
  readonly palettes: { readonly fields: readonly PropEntry[]; readonly presets: Readonly<Record<string, Palette>> };
  readonly timeline: { readonly props: readonly PropEntry[]; readonly names: Names; readonly imports: Imports; readonly peer: string };
  readonly diagnostics: readonly { readonly code: string; readonly severity: 'warn' | 'error'; readonly req: string; readonly what: string; readonly todo: string }[];
  readonly stylesheets: { readonly always: readonly string[]; readonly ui: readonly string[]; readonly timeline: readonly string[] };
}
type Framework = 'react' | 'vue' | 'angular' | 'reflex';
type Names = Readonly<Record<Framework, string>>;
type Imports = Readonly<Record<Framework, string>>;
interface PropEntry {
  readonly name: string;            // camelCase, as the types
  readonly reflex?: string;         // snake_case, from the Reflex catalog; absent when Reflex lacks it
  readonly type: string;
  readonly optional: boolean;
  readonly default?: string;        // from API Spec §5.1 / JSDoc "Default `…`."
  readonly doc: string;
}
interface ChartEntry {
  readonly slug: string; readonly names: Names; readonly imports: Imports;
  readonly family: Family; readonly summary: string;
  readonly data: DataSpec; readonly intents: readonly Intent[];
  readonly props: readonly PropEntry[];   // own props only; common ones in `common.chart`
  readonly demo: string;                  // demo export name
  readonly drillable?: boolean;           // rootId + onRootChange
}
interface ComponentEntry {
  readonly slug: string; readonly names: Names; readonly imports: Imports;
  readonly family: 'ui' | 'composed' | 'overlay'; readonly group: string; readonly summary: string;
  readonly props: readonly PropEntry[];
  readonly binding?: { readonly value?: Readonly<Record<Framework, string>>; readonly open?: Readonly<Record<Framework, string>> };
  readonly events: readonly string[]; readonly slots: readonly string[];
}
```

## §2.29 Chart metadata (`tools/agent-catalog/charts.meta.ts`)

The only hand-written data of the catalog: per chart `family` (the site's nine: `trends`,
`comparisons`, `parts-of-a-whole`, `distributions`, `relations`, `flows`, `hierarchies`, `radial`,
`fields-networks`; final list fixed at T-227 against the site and the Reflex `FAMILIES`), a
one-line `summary`, `data: DataSpec` and `intents`.

```ts
interface DataSpec {
  readonly shape: DataShape;                  // API delta §3
  readonly fields: readonly { readonly role: string; readonly prop: string; readonly type: 'string' | 'number' | 'date'; readonly required: boolean }[];
}
```

`fields[].prop` names the accessor prop (`xKey`, `valueKey`, `sourceKey`…) the role maps to; this is
what `generate_code` uses to turn the user's field names into accessors.

## §2.30 Reflex catalog (`reflex-catalog.json`, exported by `reflex-silverpoint-react`)

```ts
interface ReflexCatalog {
  readonly schema: 1;
  readonly package: 'reflex-silverpoint-react';
  readonly version: string;                    // the wheel's version
  readonly wraps: string;                      // SILVERPOINT_VERSION
  readonly charts: readonly { readonly slug: string; readonly builder: string; readonly cls: string; readonly family: string; readonly props: readonly { readonly name: string; readonly js: string; readonly type: string }[] }[];
  readonly components: readonly { readonly slug: string; readonly builder: string; readonly cls: string; readonly props: readonly { readonly name: string; readonly js: string; readonly type: string }[]; readonly positional: readonly string[]; readonly deprecated: Readonly<Record<string, string>> }[];
  readonly helpers: readonly string[];         // sort_rows, check_palette, silverpoint_palette, download_svg…
}
```

## §2.31 Recommender rules (`tools/agent-catalog/recommend.rules.ts`)

```ts
interface Rule {
  readonly shape: DataShape; readonly intent: Intent;
  readonly charts: readonly { readonly slug: string; readonly score: number; readonly reason: string }[];
  readonly adjust?: readonly { readonly when: 'rows>' | 'rows<' | 'values>'; readonly n: number; readonly slug: string; readonly delta: number; readonly reason: string }[];
}
```

## Invariants — additions

- **I-37** Every chart and component exported by any adapter has exactly one catalog entry, and
  vice versa (REQ-536).
- **I-38** Every `PropEntry` of a chart or component equals the props reference's entry for it
  (name, type, optional, doc); only `default` and `reflex` are added (REQ-530).
- **I-39** `catalog.version` equals the version of `@silverpoint/mcp` and of the core it ships with
  (REQ-550).
- **I-40** `reflex.stale` is `reflex.wraps !== version`; a release build requires `false` (REQ-556).
- **I-41** Every `DataSpec.fields[].prop` is a prop of that chart (REQ-541).
- **I-42** Every slug a rule names exists in `charts` (REQ-540).
