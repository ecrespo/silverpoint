import type { ChartModel, ChartRecipe, Datum, HitArea, OrbitChartProps, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { PLOT_INSET } from '../shared/cartesian';
import { finite, warnValue } from '../shared/cells';
import { accessorName, circlePath, formatCategory, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { ORBIT_CHART_DEMO } from './demo';

const CHART = 'OrbitChart';
/** The orbits are seen at a tilt, as on an armillary sphere: height over width of each ellipse. */
const TILT = 0.42;
/** The innermost orbit's width, as a share of the outermost's. */
const HOLE = 0.3;
/** Radius of the largest marker. */
const MARKER = 6;

interface Marker {
  readonly flat: number;
  readonly orbit: number;
  readonly column: number;
  readonly datum: Datum;
  readonly period: number;
  readonly value: number;
}

/** A full ellipse as two half arcs, from its top clockwise: a closed path that survives inking. */
function ellipsePath(cx: number, cy: number, a: number, b: number): string {
  return `M${cx},${cy - b}A${a},${b},0,1,1,${cx},${cy + b}A${a},${b},0,1,1,${cx},${cy - b}Z`;
}

function buildOrbitChart(props: OrbitChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const all = props.data ?? ORBIT_CHART_DEMO;
  const markerKey = usesDemo ? 'markers' : (props.markerKey ?? 'markers');
  const periodKey = usesDemo ? 'period' : (props.periodKey ?? 'period');
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const shown = props.orbits !== undefined && Number.isInteger(props.orbits) && props.orbits > 0 ? Math.min(props.orbits, all.length) : all.length;
  const data = all.slice(0, shown);
  const periodName = accessorName(periodKey, 'period');

  // Every marker, flat, in orbit order: its place in the table is its index (delta-009).
  const rows: string[][] = [];
  const markers: Marker[] = [];
  data.forEach((datum, orbit) => {
    const label = formatCategory(datum.label, locale);
    const list = read(markerKey, datum, orbit);
    (Array.isArray(list) ? list : []).forEach((raw: unknown, column) => {
      const m = (typeof raw === 'object' && raw !== null ? raw : {}) as Datum;
      const period = finite(read(periodKey, m, column));
      const value = finite(m.value);
      rows.push([label, formatValue(period, locale, undefined), formatValue(value, locale, numberFormat)]);
      const flat = rows.length - 1;
      if (period === undefined || period < 0 || period > 1 || value === undefined || value < 0) {
        warnValue(CHART, periodName, `Marker ${column} of orbit "${label}" needs a period in 0-1 and a value ≥ 0; it is omitted.`);
        return;
      }
      markers.push({ flat, orbit, column, datum: { orbit: label, ...m }, period, value });
    });
  });

  const base = modelBase(CHART, props, context, 'Orbit chart', { columns: ['orbit', periodName, 'value'], rows });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = card.area;
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];
  if (data.length === 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, all.length === 0);

  const cx = plot.x + plot.width / 2;
  const cy = plot.y + plot.height / 2;
  const outer = Math.max(Math.min(plot.width / 2, plot.height / 2 / TILT) - PLOT_INSET - MARKER, 1);
  const hole = outer * HOLE;
  const widthOf = (orbit: number) => (data.length === 1 ? outer : hole + (orbit / (data.length - 1)) * (outer - hole));

  data.forEach((datum, orbit) => {
    const a = widthOf(orbit);
    // The orbit names the series; it carries no value, so it is an ornament.
    strokes.push({ d: ellipsePath(cx, cy, a, a * TILT), role: 'ornament', part: 'grid' });
    labels.push({ x: cx - a + 3, y: cy + 3, text: formatCategory(datum.label, locale), kind: 'tick', part: 'axis', anchor: 'start' });
  });

  // A marker's place along its orbit is its period; its AREA is its value.
  const largest = Math.max(0, ...markers.map((m) => m.value));
  for (const m of markers) {
    const a = widthOf(m.orbit);
    const angle = m.period * 2 * Math.PI;
    const x = cx + a * Math.sin(angle);
    const y = cy - a * TILT * Math.cos(angle);
    const r = largest > 0 ? MARKER * Math.sqrt(m.value / largest) : 0;
    if (r > 0) strokes.push({ d: circlePath(x, y, r), role: 'encoding', part: 'ink', paint: 'fill' });
    hitAreas.push({ seriesKey: 'value', index: m.flat, datum: m.datum, value: m.value, x, y, box: { x: x - r, y: y - r, width: 2 * r, height: 2 * r }, cell: { column: m.column, row: m.orbit } });
  }

  const description =
    props.description ??
    `${base.name}. ${data.length} orbits from the inside out (${data.map((d) => formatCategory(d.label, locale)).join(', ')}) with ${markers.length} markers placed by ${periodName} over the cycle; the largest is ${formatNumber(largest, locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `OrbitChart` recipe (REQ-092): nested tilted orbits, markers along them by period, sized by value. */
export const orbitChart: ChartRecipe<OrbitChartProps> = /* @__PURE__ */ Object.freeze({ name: 'OrbitChart', build: buildOrbitChart });
