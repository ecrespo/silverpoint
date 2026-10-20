# @silverpoint/angular

Angular components for **silverpoint**: charts drawn in the manner of a Renaissance silverpoint
drawing, with a fine silver line on a prepared ground, tone built from hatching, and white
heightening on the live value. The hand-drawn irregularity is only in the ornament. The data
geometry is exact, and every chart has a `precision` mode that turns the inking off.

- 60 standalone components with signal inputs and `OnPush`. They work zoneless.
- Angular Package Format, with one secondary entry point per chart, so you only ship the charts
  you use.
- Accessible: an accessible name, a hidden data table, keyboard navigation, and a
  `prefers-contrast` / `forced-colors` fallback to `precision`.

## Installation

```sh
npm install @silverpoint/angular @silverpoint/grounds @silverpoint/fonts
```

| Package | Why |
|---|---|
| `@silverpoint/angular` | The components. Brings `@silverpoint/core` with it. |
| `@silverpoint/grounds` | The stylesheet (`styles.css`) that colours the strokes. Required. |
| `@silverpoint/fonts` | Optional. Self-hosted EB Garamond, the typeface the charts are designed for. |

Peer dependencies: `@angular/core` and `@angular/common` `>=21.0.0 <23.0.0` (Angular 21 and
22). Built with the Angular CLI (`@angular/build`, on Vite). No extra configuration is needed.

Load the two stylesheets **once**, as global styles.

## Quickstart (Angular CLI)

```sh
npx @angular/cli@22 new my-charts --defaults --skip-git
cd my-charts
npm install @silverpoint/angular @silverpoint/grounds @silverpoint/fonts
```

Replace `src/styles.css` with:

```css
@import '@silverpoint/fonts/fonts.css';
@import '@silverpoint/grounds/styles.css';
```

Replace `src/app/app.ts` with:

```ts
import { Component } from '@angular/core';
import { SpLineChart } from '@silverpoint/angular/line-chart';

@Component({
  selector: 'app-root',
  imports: [SpLineChart],
  template: `
    <div style="width: 480px">
      <sp-line-chart [data]="data" xKey="hour" valueKey="hits" title="Hits per hour" />
    </div>
  `,
})
export class App {
  protected readonly data = [
  { hour: '00', hits: 18 },
  { hour: '04', hits: 11 },
  { hour: '08', hits: 42 },
  { hour: '12', hits: 64 },
  { hour: '16', hits: 57 },
  { hour: '20', hits: 30 },
];
}
```

Then run `npm start`. The chart takes the width of its container. `height` is the height of
the drawing area and defaults to 160 px.

## Examples

### One ground for the whole app

`provideSilverpoint` sets the ground, the substrate, the mode and the locale for every chart. An
input on a chart overrides it.

```ts
// src/app/app.config.ts
import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideSilverpoint } from '@silverpoint/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideSilverpoint({ ground: 'silverpoint', substrate: 'green', locale: 'en-GB' }),
  ],
};
```

```ts
import { Component } from '@angular/core';
import { SpBarChart } from '@silverpoint/angular/bar-chart';
import { SpDonutChart } from '@silverpoint/angular/donut-chart';

@Component({
  selector: 'app-dashboard',
  imports: [SpBarChart, SpDonutChart],
  template: `
    <sp-bar-chart [data]="sales" xKey="month" valueKey="units" title="Units sold" unit="units" />
    <sp-donut-chart [data]="channels" nameKey="channel" valueKey="share" title="Sales by channel" centerLabel="%" />
  `,
})
export class Dashboard {
  protected readonly sales = [
    { month: 'Jan', units: 120 },
    { month: 'Feb', units: 98 },
    { month: 'Mar', units: 143 },
  ];
  protected readonly channels = [
    { channel: 'Web', share: 54 },
    { channel: 'Stores', share: 31 },
    { channel: 'Partners', share: 15 },
  ];
}
```

Substrates: `cream` (the default), `green`, `blue`, `ochre`.

### Precision mode

`mode="precision"` switches the inking off entirely and draws exact, even strokes. The chart
switches to it by itself when the system asks for more contrast (`prefers-contrast: more` or
`forced-colors: active`). No input can override that.

```html
<sp-line-chart [data]="data" xKey="hour" valueKey="hits" title="Hits per hour" mode="precision" />
```

### Interaction and a custom readout

```ts
import { Component, input, signal } from '@angular/core';
import { SpTooltip } from '@silverpoint/angular';
import { SpLineChart } from '@silverpoint/angular/line-chart';

type Row = { hour: string; hits: number };

@Component({
  selector: 'app-explorer',
  imports: [SpLineChart, SpTooltip],
  template: `
    <sp-line-chart
      [data]="data()"
      xKey="hour"
      valueKey="hits"
      title="Hits per hour"
      (activeChange)="active.set($event ? $event.datum['hour'] + ': ' + $event.value : '—')"
      (select)="selected($event.datum)"
    >
      <ng-template spTooltip let-item>
        <strong>{{ item.value }} hits</strong>
      </ng-template>
    </sp-line-chart>
    <p>Under the pointer: {{ active() }}</p>
  `,
})
export class Explorer {
  readonly data = input.required<Row[]>();
  protected readonly active = signal('—');
  protected selected(datum: unknown) {
    console.log('selected', datum);
  }
}
```

`(activeChange)` carries the item under the pointer or keyboard focus, and `null` when it
leaves. `(select)` fires on click, `Enter` or `Space`.

### Imperative handle

Each component exposes `getGeometry()` and `toSVGString()`:

```ts
import { Component, viewChild } from '@angular/core';
import { SpLineChart } from '@silverpoint/angular/line-chart';

@Component({
  selector: 'app-exportable',
  imports: [SpLineChart],
  template: `
    <sp-line-chart #chart [data]="data" xKey="hour" valueKey="hits" title="Hits per hour" />
    <button (click)="download()">Export SVG</button>
  `,
})
export class Exportable {
  protected readonly data = [
    { hour: '00', hits: 18 },
    { hour: '12', hits: 64 },
  ];
  private readonly chart = viewChild.required<SpLineChart>('chart');

  protected download() {
    const svg = this.chart().toSVGString();
    window.open(URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })));
  }
}
```

## Inputs every chart shares

| Input | Default | |
|---|---|---|
| `data` | demo dataset | The rows to draw. |
| `ground` / `substrate` / `mode` | `'silverpoint'` / `'cream'` / `'ink'` | Style; `mode: 'precision'` turns off inking. |
| `seed`, `id` | derived, stable | The hand drawing is deterministic: same inputs, same strokes. |
| `height`, `width` | `160`, container width | Size of the drawing area in px. |
| `chrome` | `'card'` | `'bare'` draws only the plot. |
| `title`, `badge`, `value`, `unit`, `footerLeft`, `footerRight` | — | The card's text. |
| `label`, `description`, `dataTable` | from `title`, —, `'hidden'` | Accessibility. |
| `locale`, `numberFormat` | environment | Number formatting. |
| `hatchFill` | `'tile'` | `'per-shape'` gives richer hatching at a much greater weight. |

## The 60 charts

Every chart is a secondary entry point, `@silverpoint/angular/<kebab-case-name>`, exporting the
`Sp…` component with the `sp-…` selector:

| Component | Selector | Component | Selector |
|---|---|---|---|
| `SpLineChart` | `sp-line-chart` | `SpDonutChart` | `sp-donut-chart` |
| `SpStepChart` | `sp-step-chart` | `SpRadarChart` | `sp-radar-chart` |
| `SpSparklineRows` | `sp-sparkline-rows` | `SpPolarBarChart` | `sp-polar-bar-chart` |
| `SpKpiCard` | `sp-kpi-card` | `SpRadialArcGroup` | `sp-radial-arc-group` |
| `SpBarChart` | `sp-bar-chart` | `SpRadialRings` | `sp-radial-rings` |
| `SpStackedBarChart` | `sp-stacked-bar-chart` | `SpGaugeArc` | `sp-gauge-arc` |
| `SpComposedChart` | `sp-composed-chart` | `SpMeterChart` | `sp-meter-chart` |
| `SpWaterfallChart` | `sp-waterfall-chart` | `SpScatterChart` | `sp-scatter-chart` |
| `SpFunnelChart` | `sp-funnel-chart` | `SpBubbleChart` | `sp-bubble-chart` |
| `SpBulletChart` | `sp-bullet-chart` | `SpHeatmapChart` | `sp-heatmap-chart` |
| `SpPyramidChart` | `sp-pyramid-chart` | `SpTreemapChart` | `sp-treemap-chart` |
| `SpCandlestickChart` | `sp-candlestick-chart` | `SpSankeyChart` | `sp-sankey-chart` |
| `SpAreaChart` | `sp-area-chart` | `SpActivityGrid` | `sp-activity-grid` |
| `SpRangeBandChart` | `sp-range-band-chart` | `SpCoxcombChart` | `sp-coxcomb-chart` |
| `SpStreamChart` | `sp-stream-chart` | `SpWindRose` | `sp-wind-rose` |
| `SpVolvelleChart` | `sp-volvelle-chart` | `SpChordRing` | `sp-chord-ring` |
| `SpOrbitChart` | `sp-orbit-chart` | | |

The second catalog, for distributions, comparisons, ranks and uncertainty (since `0.6.0`):

| Component | Selector | Component | Selector |
|---|---|---|---|
| `SpHistogramChart` | `sp-histogram-chart` | `SpEcdfChart` | `sp-ecdf-chart` |
| `SpBoxPlotChart` | `sp-box-plot-chart` | `SpViolinChart` | `sp-violin-chart` |
| `SpRidgelineChart` | `sp-ridgeline-chart` | `SpBeeswarmChart` | `sp-beeswarm-chart` |
| `SpLollipopChart` | `sp-lollipop-chart` | `SpDumbbellChart` | `sp-dumbbell-chart` |
| `SpSlopeChart` | `sp-slope-chart` | `SpBumpChart` | `sp-bump-chart` |
| `SpErrorBarChart` | `sp-error-bar-chart` | `SpIntervalChart` | `sp-interval-chart` |
| `SpDivergingBarChart` | `sp-diverging-bar-chart` | `SpConnectedScatterChart` | `sp-connected-scatter-chart` |

Hierarchies, parts of a whole, many dimensions and polar charts (since `0.6.0`):

| Component | Selector | Component | Selector |
|---|---|---|---|
| `SpWaffleChart` | `sp-waffle-chart` | `SpMarimekkoChart` | `sp-marimekko-chart` |
| `SpSquarifiedTreemap` | `sp-squarified-treemap` | `SpSunburstChart` | `sp-sunburst-chart` |
| `SpTreeChart` | `sp-tree-chart` | `SpParallelCoordinatesChart` | `sp-parallel-coordinates-chart` |
| `SpPolarLineChart` | `sp-polar-line-chart` | `SpPolarScatterChart` | `sp-polar-scatter-chart` |

Fields and networks (since `0.6.0`):

| Component | Selector | Component | Selector |
|---|---|---|---|
| `SpDensityBinChart` | `sp-density-bin-chart` | `SpContourChart` | `sp-contour-chart` |
| `SpDelaunayChart` | `sp-delaunay-chart` | `SpVectorFieldChart` | `sp-vector-field-chart` |
| `SpNetworkChart` | `sp-network-chart` | | |

`<sp-ridgeline-chart>` requires `groupKey`, `<sp-diverging-bar-chart>` requires `levels` and `<sp-parallel-coordinates-chart>` requires `dimensions` (`input.required`), even with the demo dataset, which ignores them.

`<sp-squarified-treemap>` and `<sp-sunburst-chart>` drill down under your control: bind `[rootId]` and
update it from `(rootChange)`, which a click, Enter or Space on a node emits with its id (its centre
or frame emits the parent's, `null` for the top). The component keeps no root of its own.

The [repository](https://github.com/ecrespo/silverpoint) holds the API specification and the
documentation site with the gallery and every chart's inputs.

## The 38 UI components

Forms, navigation, data display and overlays, drawn in the same engraving language as the charts:
an exact frame, tone by hatching, and the keyboard and screen-reader semantics of the native element.
Import the UI stylesheet once in `src/styles.css`, after the ground's:

```css
@import '@silverpoint/grounds/styles.css';
@import '@silverpoint/grounds/ui.css';
```

Each component is standalone, on `@silverpoint/angular/ui/<kebab-case-name>` (or the barrel
`@silverpoint/angular/ui`):

```ts
import { Component, signal } from '@angular/core';
import { SpButton } from '@silverpoint/angular/ui/button';
import { SpInput } from '@silverpoint/angular/ui/input';
import { SpModal } from '@silverpoint/angular/ui/modal';
import { SpTrigger } from '@silverpoint/angular/ui';
import { SpTable } from '@silverpoint/angular/ui/table';

@Component({
  selector: 'app-orders',
  imports: [SpButton, SpInput, SpModal, SpTable, SpTrigger],
  template: `
    <sp-input [(value)]="customer" label="Customer" />
    <sp-table caption="Orders" rowKey="id" [columns]="columns" [data]="orders" />
    <sp-modal title="Edit order">
      <button type="button" spTrigger>Edit order</button>
      Changes reach the workshop before the order is packed.
      <sp-button>Save</sp-button>
    </sp-modal>
  `,
})
export class Orders {
  protected readonly customer = signal('Ada');
  protected readonly columns = [{ key: 'id', title: 'Order' }, { key: 'customer', title: 'Customer' }, { key: 'status', title: 'Status' }];
  protected readonly orders = [
    { id: '1042', customer: 'Ada Lovelace', status: 'Shipped' },
    { id: '1043', customer: 'Grace Hopper', status: 'Packed' },
  ];
}
```

A value binds with `[(value)]` or any forms directive (`ngModel`, `formControlName`); an overlay's
open state with `[(open)]`.

The form and display components (since `0.3.0`):

`SpButton`, `SpInput`, `SpCheckbox`, `SpRadioGroup`, `SpSwitch`, `SpSlider`, `SpRate`,
`SpSegmented`, `SpTabs`, `SpSteps`, `SpCard`, `SpTag`, `SpBadge`, `SpDivider`, `SpProgress`, `SpAlert`,
`SpSkeleton`.

Composed components (since `0.7.0`):

`SpSurface`, `SpGlyph`, `SpTable`, `SpPagination`, `SpBreadcrumb`, `SpAvatar`, `SpStatistic`,
`SpDescriptions`, `SpTimelineList`, `SpCollapse`, `SpEmpty`, `SpResult`, `SpTextarea`, `SpInputNumber`.

Overlays (since `0.7.0`), each opened by a trigger you write; toasts sit in an `SpToaster`:

`SpModal`, `SpDrawer`, `SpPopover`, `SpTooltip`, `SpSelect`, `SpDropdownMenu`, `SpToast`.

`SpTabs` holds `SpTabPanel`s, `SpCollapse` holds `SpCollapseItem`s and `SpAvatarGroup` holds `SpAvatar`s.
Every component takes `ground`, `substrate`, `mode`, `size`, `palette` and `id`.

## Palettes

A palette recolours the ground: substrate, inks, rules, text and focus ring. Six presets ship on
`@silverpoint/core/palettes` (`silverpoint`, `sanguine`, `sepia`, `ironGall`, `verdigris`, `indigo`),
each computed for WCAG contrast; `checkPalette` checks one of yours the same way.

Your adapter already depends on `@silverpoint/core`; name it in your own dependencies to import
the presets (a strict package manager such as pnpm requires it):

```sh
npm install @silverpoint/core
```

```ts
// src/app/app.config.ts
import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { sanguine } from '@silverpoint/core/palettes';
import { provideSilverpoint } from '@silverpoint/angular';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideSilverpoint({ palette: sanguine })],
};
```

`provideSilverpoint` in a component's `providers` scopes a section of the app; a `[palette]` input
overrides the outer palette field by field.

## Timeline

`SpTimeline` draws a [TimelineJS](https://timeline.knightlab.com/) story in the ground's hand. TimelineJS is an
optional peer dependency: install it only if you use the timeline, and import its stylesheet before
the ground's.

```sh
npm install @knight-lab/timelinejs
```

```css
@import '@knight-lab/timelinejs/dist/css/timeline.css';
@import '@silverpoint/grounds/timeline.css';
```

```ts
import { Component } from '@angular/core';
import { SpTimeline, SpTimelineFallback } from '@silverpoint/angular/timeline';

@Component({
  selector: 'app-history',
  imports: [SpTimeline, SpTimelineFallback],
  template: `
    <sp-timeline [data]="story" height="560px">
      <ng-template spFallback><p>The timeline could not be loaded.</p></ng-template>
    </sp-timeline>
  `,
})
export class History {
  protected readonly story = {
    title: { text: { headline: 'Silverpoint', text: '<p>A line that cannot be erased.</p>' } },
    events: [{ start_date: { year: 1400 }, text: { headline: "Cennini's handbook" } }],
  };
}
```

The server renders the surface and an empty mount; TimelineJS builds in the browser.

## Related packages

[`@silverpoint/react`](https://www.npmjs.com/package/@silverpoint/react) ·
[`@silverpoint/vue`](https://www.npmjs.com/package/@silverpoint/vue) ·
[`@silverpoint/grounds`](https://www.npmjs.com/package/@silverpoint/grounds) ·
[`@silverpoint/fonts`](https://www.npmjs.com/package/@silverpoint/fonts) ·
[`@silverpoint/core`](https://www.npmjs.com/package/@silverpoint/core)

MIT.
