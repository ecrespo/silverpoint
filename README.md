# silverpoint

Charts for React, Vue and Angular whose visual language is historical drawing technique.

The first style reproduces the mechanics of Renaissance **silverpoint**: a prepared
middle-tone substrate, a fine silver line, tonal value built from hatch density, and white
heightening reserved for the live value. The engine supports several *grounds*; the
Renaissance one is the first, and `cyanotype` the second: a white line on Prussian blue, whose
tone is the weight of the line (`ground="cyanotype"`).

Unlike every other hand-drawn charting library, the irregularity here lives only in the
ornament: the geometry of the data is exact, and every chart offers a `precision` mode with
inking switched off entirely.

![silverpoint, dark and light](docs/assets/probe-silverpoint.png)

## Packages

| Package | |
|---|---|
| [`@silverpoint/react`](packages/react/README.md) | React 18.2+ and 19 components, with server entry points for RSC |
| [`@silverpoint/vue`](packages/vue/README.md) | Vue 3.5 components, with server rendering |
| [`@silverpoint/angular`](packages/angular/README.md) | Angular 21 and 22 standalone components |
| [`@silverpoint/grounds`](packages/grounds/README.md) | The grounds and the stylesheet every app imports once |
| [`@silverpoint/fonts`](packages/fonts/README.md) | Optional self-hosted EB Garamond |
| [`@silverpoint/core`](packages/core/README.md) | The framework-free engine the adapters share |

Each adapter's README has its installation steps, quickstart and examples.

## Quickstart (React)

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

Then `npm run dev`. Vue and Angular take the same three steps; the documentation site
(`pnpm --filter @silverpoint/docs dev`) gives them, with the gallery of all 33 charts, the ground
playground and every chart's props. A bundler is required (Vite, Next.js or the Angular CLI).

Charts compose into a **dashboard**, a responsive grid of cards laid out by the core from plain
data, identical in the three adapters and server-renderable:

```tsx
import { Dashboard, DashboardCell } from '@silverpoint/react/dashboard';

<Dashboard id="ops" title="Operations" layout={{ cells: [{ id: 'kpi' }, { id: 'trend', colSpan: { md: 2, lg: 3 } }] }}>
  <DashboardCell cell="kpi"><KpiCard title="Orders" /></DashboardCell>
  <DashboardCell cell="trend"><LineChart title="Hits per hour" data={data} xKey="hour" valueKey="hits" /></DashboardCell>
</Dashboard>
```

Using Tailwind? The optional [`@silverpoint/tailwind`](packages/tailwind/README.md) preset names the
same variables as utilities (`bg-sp-substrate`, `text-sp-ink`, `font-sp-display`); silverpoint itself
never requires it.

The specifications live in [`specs/`](specs/): eight Spec-Driven Design artifacts, from the
constitution through to the Analyze gate.

Releases: see [`.changeset/README.md`](.changeset/README.md). Every merge into `main` publishes
whatever version npm does not have yet, from CI, with provenance.

MIT. Typeface: EB Garamond, SIL Open Font License.