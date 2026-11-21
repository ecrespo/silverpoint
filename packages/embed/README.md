# @silverpoint/embed

Silverpoint charts for hosts: any of the 60 charts from one JSON spec — a DOM-free render, a
framework-free client, a single standalone file, the host catalog and a conformance kit. The same
engine as `@silverpoint/react`, `@silverpoint/vue` and `@silverpoint/angular`, so the same picture,
keyboard reading and precision mode (Constitution Art. 2, Art. 3).

Use an adapter when your app is React, Vue or Angular. Use this package for a plain page, a server,
a workflow node, a BI tool, a notebook or a CMS.

## A chart is a spec

```json
{ "chart": "bar-chart",
  "data": [{ "team": "A", "wins": 12 }, { "team": "B", "wins": 9 }],
  "props": { "xKey": "team", "valueKey": "wins", "title": "Wins" },
  "width": 480, "ground": "silverpoint", "substrate": "cream", "mode": "ink", "palette": "sepia" }
```

Only `chart` is required. `props` takes the chart's own props and the common view props
(`title`, `badge`, `dataTable`, `seed`, `hatchFill`…); the other fields are the spec's own.
`validateSpec` says why a spec cannot render: bad JSON, a field the spec does not have, an unknown
chart (with the closest slugs), an undeclared prop, a size outside 160..1600 × 90..1200, or a spec
over 2 MB (`SP030`).

## In a page: one file, one element

```text
<script src="silverpoint-embed.full.js"></script>
<silverpoint-chart>
  <script type="application/json">{ "chart": "donut-chart", "props": { "title": "Budget" } }</script>
</silverpoint-chart>
```

The script defines `<silverpoint-chart>` and mounts every `[data-sp-embed]` box once the page is
parsed. It opens no connection, evaluates no string and writes no storage, so it runs under
`script-src 'self'; style-src 'self'` and in a `sandbox="allow-scripts"` frame. Serve the file
yourself and pin it with `integrity.json` (SHA-384 per file); no CDN is involved.

| File | What | gzip budget |
|---|---|---|
| `silverpoint-embed.js` / `.mjs` | the script (global `Silverpoint`) / the module | 140 kB |
| `silverpoint-embed.full.js` / `.full.mjs` | the same with EB Garamond's three cuts inlined | 220 kB |

The client API, for pages that drive the chart: `mount(target, spec, options)` returns a handle with
`update`, `destroy`, `getGeometry` and `toSVGString`; `onActiveChange`, `onSelect` and
`onDiagnostic`, and the bubbling `sp-activechange`, `sp-select` and `sp-diagnostic` events, report
what the reader does. An invalid spec draws an error figure naming the problem (`SP031`).

## On a server or in a flow

```ts
import { renderToHTML, renderToSVG } from '@silverpoint/embed';

const svg = renderToSVG({ chart: 'line-chart', props: { title: 'Hits' } });
const page = renderToHTML({ chart: 'line-chart' }, { as: 'document' });
```

Both run in Node with no DOM, byte for byte the same for the same spec. `renderToSVG` is the MCP
server's `render_chart`. `renderToHTML` writes the accessible chart root — complete with no script —
and, with `interactive`, the spec as JSON for a client on the page to adopt.

## From a table: the host catalog

```ts
import { HOST_CATALOG, specFromTable } from '@silverpoint/embed/hosts';

const spec = specFromTable({
  chart: 'heatmap-chart',
  table: { rows: [{ day: 'Mon', hour: '09', load: 12 }, { day: 'Mon', hour: '10', load: 34 }] },
  roles: { row: 'day', column: 'hour', value: 'load' },
});
```

`host-catalog.json` describes every chart a table can feed — its roles (`dimension`, `measure`,
`temporal`), its options and the appearance values — so a BI tool's property pane is generated,
never typed by hand. `specFromTable` binds; it does not aggregate, sort or filter. Four charts are
not fed from a table (orbit, sparkline rows, volvelle and the grid treemap): their entries say why.

## Proving a host draws correctly

```ts
import { conformance } from '@silverpoint/embed/conformance';
import { renderToSVG } from '@silverpoint/embed';

const { passed, failed } = await conformance((spec) => {
  const result = renderToSVG(spec);
  return result.ok ? result.value.svg : '';
});
```

Run it against the file you ship, in the runtime you ship it in. One case per chart plus the
appearance axes on four charts; SHA-256 per render.

## Licence

MIT. The `full` files embed EB Garamond under the SIL Open Font License 1.1.
