import { PALETTES_PAGE } from '@silverpoint/example-harness';
import { LineChart } from '@silverpoint/react/server/line-chart';
import { SpCard } from '@silverpoint/react/server/ui/card';
import { SpProgress } from '@silverpoint/react/server/ui/progress';
import { SpTable } from '@silverpoint/react/server/ui/table';
import { Hydrated } from '../hydrated';

/** The palettes page (T-222): each preset over a LineChart, a Card holding a Progress, and a Table; Server Components. */
export default function PalettesPage() {
  return (
    <main>
      <h1>{PALETTES_PAGE.title} · Next.js (React)</h1>
      <div className="sp-palettes-page">
        {PALETTES_PAGE.presets.map((preset) => (
          <section key={preset.key} className="sp-palette-preset sp-ground-silverpoint" data-substrate="cream" data-preset={preset.key} aria-labelledby={`${preset.key}-title`}>
            <h2 id={`${preset.key}-title`}>{preset.title}</h2>
            <LineChart {...preset.chart} />
            <SpCard {...preset.card}>
              <SpProgress {...preset.progress} />
            </SpCard>
            <SpTable {...preset.table} />
          </section>
        ))}
      </div>
      <Hydrated />
    </main>
  );
}
