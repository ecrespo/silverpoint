# @silverpoint/vue

Vue 3 components for **silverpoint**: charts drawn in the manner of a Renaissance silverpoint
drawing, with a fine silver line on a prepared ground, tone built from hatching, and white
heightening on the live value. The hand-drawn irregularity is only in the ornament. The data
geometry is exact, and every chart has a `precision` mode that turns the inking off.

- 33 charts written with `<script setup>`, with typed props and typed emits, and each one
  importable on its own subpath.
- Server rendering with `@vue/server-renderer`, hydrating without a mismatch.
- Accessible: an accessible name, a hidden data table, keyboard navigation, and a
  `prefers-contrast` / `forced-colors` fallback to `precision`.

## Installation

```sh
npm install @silverpoint/vue @silverpoint/grounds @silverpoint/fonts
```

| Package | Why |
|---|---|
| `@silverpoint/vue` | The components. Brings `@silverpoint/core` with it. |
| `@silverpoint/grounds` | The stylesheet (`styles.css`) that colours the strokes. Required. |
| `@silverpoint/fonts` | Optional. Self-hosted EB Garamond, the typeface the charts are designed for. |

Peer dependency: `vue` `^3.5.0`. You need a bundler. Vite is the validated one, and no
`optimizeDeps` entry is needed.

Import the two stylesheets **once**, in `main.ts` or in the root component.

## Quickstart (Vite)

```sh
npm create vite@latest my-charts -- --template vue-ts
cd my-charts
npm install @silverpoint/vue @silverpoint/grounds @silverpoint/fonts
```

Replace `src/App.vue` with:

```vue
<script setup lang="ts">
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import { SpLineChart } from '@silverpoint/vue/line-chart';

const data = [
  { hour: '00', hits: 18 },
  { hour: '04', hits: 11 },
  { hour: '08', hits: 42 },
  { hour: '12', hits: 64 },
  { hour: '16', hits: 57 },
  { hour: '20', hits: 30 },
];
</script>

<template>
  <div style="width: 480px">
    <SpLineChart :data="data" x-key="hour" value-key="hits" title="Hits per hour" />
  </div>
</template>
```

Then run `npm run dev`. The chart takes the width of its container. `height` is the height of
the drawing area and defaults to 160 px. In templates, props can be written in `kebab-case`.

## Examples

### One ground for the whole app

The `provideSilverpoint` plugin sets the ground, the substrate, the mode and the locale for every
chart. A prop on a chart overrides it.

```ts
// src/main.ts
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import { createApp } from 'vue';
import { provideSilverpoint } from '@silverpoint/vue';
import App from './App.vue';

createApp(App)
  .use(provideSilverpoint({ ground: 'silverpoint', substrate: 'green', locale: 'en-GB' }))
  .mount('#app');
```

```vue
<script setup lang="ts">
import { SpBarChart } from '@silverpoint/vue/bar-chart';
import { SpDonutChart } from '@silverpoint/vue/donut-chart';

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
</script>

<template>
  <SpBarChart :data="sales" x-key="month" value-key="units" title="Units sold" unit="units" />
  <SpDonutChart :data="channels" name-key="channel" value-key="share" title="Sales by channel" center-label="%" />
</template>
```

Substrates: `cream` (the default), `green`, `blue`, `ochre`.

### Precision mode

`mode="precision"` switches the inking off entirely and draws exact, even strokes. The chart
switches to it by itself when the system asks for more contrast (`prefers-contrast: more` or
`forced-colors: active`). No prop can override that.

```vue
<SpLineChart :data="data" x-key="hour" value-key="hits" title="Hits per hour" mode="precision" />
```

### Interaction and a custom readout

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SpLineChart } from '@silverpoint/vue/line-chart';
import type { ActiveItem } from '@silverpoint/vue';

defineProps<{ data: { hour: string; hits: number }[] }>();
const active = ref<ActiveItem | null>(null);
</script>

<template>
  <SpLineChart
    :data="data"
    x-key="hour"
    value-key="hits"
    title="Hits per hour"
    @active-change="active = $event"
    @select="(item) => console.log('selected', item.datum)"
  >
    <template #tooltip="{ active: item }">
      <strong>{{ item.value }} hits</strong>
    </template>
  </SpLineChart>
  <p>Under the pointer: {{ active ? `${active.datum.hour}: ${active.value}` : '—' }}</p>
</template>
```

`@active-change` carries the item under the pointer or keyboard focus, and `null` when it
leaves. `@select` fires on click, `Enter` or `Space`.

### Imperative handle

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SpLineChart } from '@silverpoint/vue/line-chart';

defineProps<{ data: { hour: string; hits: number }[] }>();
const chart = ref<InstanceType<typeof SpLineChart>>();

function download() {
  const svg = chart.value?.toSVGString() ?? '';
  window.open(URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })));
}
</script>

<template>
  <SpLineChart ref="chart" :data="data" x-key="hour" value-key="hits" title="Hits per hour" />
  <button @click="download">Export SVG</button>
</template>
```

### Server rendering

The components render under `@vue/server-renderer` without touching the DOM, and they hydrate
with `createSSRApp`:

```ts
// entry-server.ts
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { provideSilverpoint } from '@silverpoint/vue';
import App from './App.vue';

export function render(): Promise<string> {
  return renderToString(createSSRApp(App).use(provideSilverpoint({ locale: 'en' })));
}
```

Nuxt apps consume the package like any other Vue app. Nuxt itself is not a validated
integration.

## Props every chart shares

| Prop | Default | |
|---|---|---|
| `data` | demo dataset | The rows to draw. |
| `ground` / `substrate` / `mode` | `'silverpoint'` / `'cream'` / `'ink'` | Style; `mode: 'precision'` turns off inking. |
| `seed`, `id` | derived, stable | The hand drawing is deterministic: same props, same strokes. |
| `height`, `width` | `160`, container width | Size of the drawing area in px. |
| `chrome` | `'card'` | `'bare'` draws only the plot. |
| `title`, `badge`, `value`, `unit`, `footer-left`, `footer-right` | — | The card's text. |
| `label`, `description`, `data-table` | from `title`, —, `'hidden'` | Accessibility. |
| `locale`, `number-format` | environment | Number formatting. |
| `hatch-fill` | `'tile'` | `'per-shape'` gives richer hatching at a much greater weight. |

## The 33 charts

Every chart is available as `@silverpoint/vue/<kebab-case-name>` (and from the barrel
`@silverpoint/vue`), prefixed `Sp`:

`SpLineChart`, `SpStepChart`, `SpSparklineRows`, `SpKpiCard`, `SpBarChart`, `SpStackedBarChart`,
`SpComposedChart`, `SpWaterfallChart`, `SpFunnelChart`, `SpBulletChart`, `SpPyramidChart`,
`SpCandlestickChart`, `SpAreaChart`, `SpRangeBandChart`, `SpStreamChart`, `SpDonutChart`,
`SpRadarChart`, `SpPolarBarChart`, `SpRadialArcGroup`, `SpRadialRings`, `SpGaugeArc`,
`SpMeterChart`, `SpScatterChart`, `SpBubbleChart`, `SpHeatmapChart`, `SpTreemapChart`,
`SpSankeyChart`, `SpActivityGrid`, `SpCoxcombChart`, `SpWindRose`, `SpVolvelleChart`,
`SpChordRing`, `SpOrbitChart`.

Each chart's own props are typed in its `*Props` type, exported from `@silverpoint/vue`. The
[repository](https://github.com/ecrespo/silverpoint) holds the API specification and the
documentation site with the gallery.

## Related packages

[`@silverpoint/react`](https://www.npmjs.com/package/@silverpoint/react) ·
[`@silverpoint/angular`](https://www.npmjs.com/package/@silverpoint/angular) ·
[`@silverpoint/grounds`](https://www.npmjs.com/package/@silverpoint/grounds) ·
[`@silverpoint/fonts`](https://www.npmjs.com/package/@silverpoint/fonts) ·
[`@silverpoint/core`](https://www.npmjs.com/package/@silverpoint/core)

MIT.
