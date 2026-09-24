import { GALLERY } from '@silverpoint/example-harness';
import { DonutChart } from '@silverpoint/react/donut-chart';
import { RadarChart } from '@silverpoint/react/radar-chart';
import { PolarBarChart } from '@silverpoint/react/polar-bar-chart';
import { RadialArcGroup } from '@silverpoint/react/radial-arc-group';
import { RadialRings } from '@silverpoint/react/radial-rings';
import { GaugeArc } from '@silverpoint/react/gauge-arc';
import { MeterChart } from '@silverpoint/react/meter-chart';
import { CoxcombChart } from '@silverpoint/react/coxcomb-chart';
import { WindRose } from '@silverpoint/react/wind-rose';
import { VolvelleChart } from '@silverpoint/react/volvelle-chart';
import { ChordRing } from '@silverpoint/react/chord-ring';
import { OrbitChart } from '@silverpoint/react/orbit-chart';
import { Hydrated } from '../hydrated';

/** The twelve Phase 3 charts (the polar engine), in plan order. */
const POLAR = { DonutChart, RadarChart, PolarBarChart, RadialArcGroup, RadialRings, GaugeArc, MeterChart, CoxcombChart, WindRose, VolvelleChart, ChordRing, OrbitChart } as const;

/** A showcase of Phase 3: each polar chart with its demo data, hand-inked and in precision. */
export default function Phase3() {
  const charts = (Object.keys(POLAR) as (keyof typeof POLAR)[]).map((name) => ({
    name,
    Chart: POLAR[name],
    props: GALLERY.find(({ chart }) => chart === name)?.props ?? {},
  }));
  return (
    <main>
      <h1>silverpoint · Phase 3 · the polar charts</h1>
      {charts.map(({ name, Chart, props }) => (
        <section key={name} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 500, margin: '0 0 8px' }}>{name}</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="sp-harness" data-size="md">
              <Chart {...props} id={`${name}-ink`} mode="ink" />
            </div>
            <div className="sp-harness" data-size="md">
              <Chart {...props} id={`${name}-precision`} mode="precision" />
            </div>
          </div>
        </section>
      ))}
      <Hydrated />
    </main>
  );
}
