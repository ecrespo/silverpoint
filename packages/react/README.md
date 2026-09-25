# @silverpoint/react

React components for **silverpoint**: charts drawn in the manner of a Renaissance silverpoint
drawing, with a fine silver line on a prepared ground, tone built from hatching, and white
heightening on the live value. The hand-drawn irregularity is only in the ornament. The data
geometry is exact, and every chart has a `precision` mode that turns the inking off.

- 33 charts, each importable on its own subpath so you only ship the charts you use.
- React 18.2+ and 19. Client components (`"use client"`) and server entry points for React
  Server Components.
- Accessible: an accessible name, a hidden data table, keyboard navigation, and a
  `prefers-contrast` / `forced-colors` fallback to `precision`.

## Installation

```sh
npm install @silverpoint/react @silverpoint/grounds @silverpoint/fonts
```

| Package | Why |
|---|---|
| `@silverpoint/react` | The components. Brings `@silverpoint/core` with it. |
| `@silverpoint/grounds` | The stylesheet (`styles.css`) that colours the strokes. Required. |
| `@silverpoint/fonts` | Optional. Self-hosted EB Garamond, the typeface the charts are designed for. |

Peer dependencies: `react` and `react-dom` `^18.2.0 || ^19.0.0`. You need a bundler (Vite,
Next.js, or anything else that resolves `exports` and CSS imports). No `optimizeDeps` entry and
no extra configuration are needed.

Import the two stylesheets **once**, at the root of the app.

## Quickstart (Vite)

```sh
npm create vite@latest my-charts -- --template react-ts
cd my-charts
npm install @silverpoint/react @silverpoint/grounds @silverpoint/fonts
```

Replace `src/App.tsx` with:

```tsx
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import { LineChart } from '@silverpoint/react/line-chart';

const data = [
  { hour: '00', hits: 18 },
  { hour: '04', hits: 11 },
  { hour: '08', hits: 42 },
  { hour: '12', hits: 64 },
  { hour: '16', hits: 57 },
  { hour: '20', hits: 30 },
];

export default function App() {
  return (
    <div style={{ width: 480 }}>
      <LineChart data={data} xKey="hour" valueKey="hits" title="Hits per hour" />
    </div>
  );
}
```

Then run `npm run dev`. The chart takes the width of its container. `height` is the height of
the drawing area and defaults to 160 px.

## Examples

### One ground for the whole app

`SilverpointProvider` sets the ground, the substrate, the mode and the locale for every chart
below it. A prop on a chart overrides the provider.

```tsx
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import { SilverpointProvider } from '@silverpoint/react';
import { BarChart } from '@silverpoint/react/bar-chart';
import { DonutChart } from '@silverpoint/react/donut-chart';

const sales = [
  { month: 'Jan', units: 120 },
  { month: 'Feb', units: 98 },
  { month: 'Mar', units: 143 },
];

const channels = [
  { channel: 'Web', share: 54 },
  { channel: 'Stores', share: 31 },
  { channel: 'Partners', share: 15 },
];

export function Dashboard() {
  return (
    <SilverpointProvider ground="silverpoint" substrate="green" locale="en-GB">
      <BarChart data={sales} xKey="month" valueKey="units" title="Units sold" unit="units" />
      <DonutChart data={channels} nameKey="channel" valueKey="share" title="Sales by channel" centerLabel="%" />
    </SilverpointProvider>
  );
}
```

Substrates: `cream` (the default), `green`, `blue`, `ochre`.

### Precision mode

`mode="precision"` switches the inking off entirely and draws exact, even strokes. It suits
print, dense dashboards, and readers who prefer it. The chart switches to it by itself when the
system asks for more contrast (`prefers-contrast: more` or `forced-colors: active`). No prop can
override that.

```tsx
<LineChart data={data} xKey="hour" valueKey="hits" title="Hits per hour" mode="precision" />
```

### Interaction and a custom readout

```tsx
import { useState } from 'react';
import { LineChart } from '@silverpoint/react/line-chart';

export function Explorer({ data }: { data: { hour: string; hits: number }[] }) {
  const [active, setActive] = useState<string>('—');
  return (
    <>
      <LineChart
        data={data}
        xKey="hour"
        valueKey="hits"
        title="Hits per hour"
        onActiveChange={(item) => setActive(item ? `${item.datum.hour}: ${item.value}` : '—')}
        onSelect={(item) => console.log('selected', item.datum)}
        tooltip={(item) => <strong>{item.value} hits</strong>}
      />
      <p>Under the pointer: {active}</p>
    </>
  );
}
```

`onActiveChange` receives the item under the pointer or keyboard focus, and `null` when it
leaves. `onSelect` fires on click, `Enter` or `Space`.

### Imperative handle

```tsx
import { useRef } from 'react';
import { LineChart, type ChartHandle } from '@silverpoint/react/line-chart';

export function Exportable({ data }: { data: { hour: string; hits: number }[] }) {
  const chart = useRef<ChartHandle>(null);
  const download = () => {
    const svg = chart.current?.toSVGString() ?? '';
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    window.open(url);
  };
  return (
    <>
      <LineChart ref={chart} data={data} xKey="hour" valueKey="hits" title="Hits per hour" />
      <button onClick={download}>Export SVG</button>
    </>
  );
}
```

### Next.js and React Server Components

The default subpaths are client components (`"use client"`). They work in the App Router and
hydrate without a mismatch. For pure SVG with no client JavaScript, use the server entry point.
It has no interaction, and `id`, `width` and `height` are required:

```tsx
// app/page.tsx — a Server Component
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import { LineChart } from '@silverpoint/react/server/line-chart';

const data = [
  { hour: '00', hits: 18 },
  { hour: '12', hits: 64 },
  { hour: '20', hits: 30 },
];

export default function Page() {
  return <LineChart id="hits" width={480} height={160} data={data} xKey="hour" valueKey="hits" title="Hits per hour" />;
}
```

## Props every chart shares

| Prop | Default | |
|---|---|---|
| `data` | demo dataset | The rows to draw. |
| `ground` / `substrate` / `mode` | `'silverpoint'` / `'cream'` / `'ink'` | Style; `mode: 'precision'` turns off inking. |
| `seed`, `id` | derived, stable | The hand drawing is deterministic: same props, same strokes. |
| `height`, `width` | `160`, container width | Size of the drawing area in px. |
| `chrome` | `'card'` | `'bare'` draws only the plot. |
| `title`, `badge`, `value`, `unit`, `footerLeft`, `footerRight` | — | The card's text. |
| `label`, `description`, `dataTable` | from `title`, —, `'hidden'` | Accessibility. |
| `locale`, `numberFormat` | environment | Number formatting. |
| `hatchFill` | `'tile'` | `'per-shape'` gives richer hatching at a much greater weight. |

## The 33 charts

Every chart is available as `@silverpoint/react/<kebab-case-name>` (and from the barrel
`@silverpoint/react`):

`LineChart`, `StepChart`, `SparklineRows`, `KpiCard`, `BarChart`, `StackedBarChart`,
`ComposedChart`, `WaterfallChart`, `FunnelChart`, `BulletChart`, `PyramidChart`,
`CandlestickChart`, `AreaChart`, `RangeBandChart`, `StreamChart`, `DonutChart`, `RadarChart`,
`PolarBarChart`, `RadialArcGroup`, `RadialRings`, `GaugeArc`, `MeterChart`, `ScatterChart`,
`BubbleChart`, `HeatmapChart`, `TreemapChart`, `SankeyChart`, `ActivityGrid`, `CoxcombChart`,
`WindRose`, `VolvelleChart`, `ChordRing`, `OrbitChart`.

Each chart's own props (`xKey`, `valueKey`, `nameKey`…) are typed and documented in its
`*Props` type. The [repository](https://github.com/ecrespo/silverpoint) holds the API
specification and the documentation site with the gallery.

## Related packages

[`@silverpoint/vue`](https://www.npmjs.com/package/@silverpoint/vue) ·
[`@silverpoint/angular`](https://www.npmjs.com/package/@silverpoint/angular) ·
[`@silverpoint/grounds`](https://www.npmjs.com/package/@silverpoint/grounds) ·
[`@silverpoint/fonts`](https://www.npmjs.com/package/@silverpoint/fonts) ·
[`@silverpoint/core`](https://www.npmjs.com/package/@silverpoint/core)

MIT.
