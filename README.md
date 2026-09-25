# silverpoint

Charts for React, Vue and Angular whose visual language is historical drawing technique.

The first style reproduces the mechanics of Renaissance **silverpoint**: a prepared
middle-tone substrate, a fine silver line, tonal value built from hatch density, and white
heightening reserved for the live value. The engine supports several *grounds*; the
Renaissance one is the first.

Unlike every other hand-drawn charting library, the irregularity here lives only in the
ornament: the geometry of the data is exact, and every chart offers a `precision` mode with
inking switched off entirely.

![silverpoint, dark and light](docs/assets/probe-silverpoint.png)

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

The specifications live in [`specs/`](specs/): eight Spec-Driven Design artifacts, from the
constitution through to the Analyze gate.

MIT. Typeface: EB Garamond, SIL Open Font License.