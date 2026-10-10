import type { LinearScale } from '../../scales/scales';
import type { ChartModel, ChartRecipe, DensityBinChartProps, HitArea, RecipeContext, Stroke, TextLabel, ToneLevel } from '../../types';
import { cardLayout } from '../shared/card';
import { LEGEND_BAND, cartesianPlot, legend } from '../shared/cartesian';
import { rectPath, toneOf } from '../shared/cells';
import { checkCeiling, checkPositive, readPointCloud } from '../shared/contracts';
import { hexBins, hexagonPath, rectBins, type Bin2D } from '../shared/field';
import { accessorName, formatNumber } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { xyFrame } from '../shared/xy';
import { DENSITY_BIN_CHART_DEMO, DENSITY_BIN_CHART_DEMO_KEYS } from './demo';

const CHART = 'DensityBinChart';
const BIN_SIZE = 14;
/** Room inside the plot for the bins along its edge. */
const EDGE = 4;

/** The data value at a position of a scale (its inverse, piecewise linear like the scale). */
function valueAt(scale: LinearScale, at: number): number {
  const [d0, d1] = scale.domain;
  const r0 = scale(d0);
  const r1 = scale(d1);
  return r1 === r0 ? d0 : d0 + ((at - r0) * (d1 - d0)) / (r1 - r0);
}

const round2 = (v: number) => Math.round(v * 100) / 100;

/**
 * The key of the four tones: the counts each level holds, `toneOf(count / max)` read backwards.
 * Levels that hold no whole count are left out.
 */
function keyEntries(max: number): { tone: ToneLevel; text: string }[] {
  const entries: { tone: ToneLevel; text: string }[] = [];
  for (let level = 1; level <= 4; level += 1) {
    const low = Math.floor((max * (level - 1)) / 4) + 1;
    const high = Math.floor((max * level) / 4);
    if (low <= high) entries.push({ tone: level as ToneLevel, text: low === high ? `${low}` : `${low}–${high}` });
  }
  return entries;
}

function buildDensityBinChart(props: DensityBinChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? DENSITY_BIN_CHART_DEMO;
  const xKey = usesDemo ? DENSITY_BIN_CHART_DEMO_KEYS.xKey : (props.xKey ?? 'x');
  const yKey = usesDemo ? DENSITY_BIN_CHART_DEMO_KEYS.yKey : (props.yKey ?? 'y');
  const hexagons = props.binShape !== 'rect';
  const size = checkPositive(CHART, 'binSize', props.binSize) ?? BIN_SIZE;
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const xName = accessorName(xKey, 'x');
  const yName = accessorName(yKey, 'y');
  const pointName = `${xName}, ${yName}`;

  const points = readPointCloud(CHART, data, { x: xKey, y: yKey });
  checkCeiling(CHART, yName, 'observations', points.length);
  // The bins are cut in pixels, so the table waits for the layout; this one names the chart until then.
  const named = modelBase(CHART, props, context, 'Density bins', { columns: [pointName, 'count'], rows: [] });
  const measured = measure(named, props, context);
  if ('deferred' in measured) return measured.deferred;
  const card = cardLayout(props, { width: measured.width, areaHeight: measured.height, chrome: props.chrome ?? 'card', locale });
  if (points.length === 0) return emptyModel(named, props, context, { viewBox: card.viewBox, plot: cartesianPlot(card.area), strokes: [...card.strokes], labels: [...card.labels] }, data.length === 0);

  // A pre-pass for the bins, so the key above the plot knows the counts.
  const keyArea = { ...card.area, y: card.area.y, height: LEGEND_BAND };
  const below = { ...card.area, y: card.area.y + LEGEND_BAND, height: Math.max(card.area.height - LEGEND_BAND, 1) };
  const plot = cartesianPlot(below);
  const extent = (values: number[]) => [Math.min(...values), Math.max(...values)] as const;
  const frame = xyFrame(below, plot, { x: extent(points.map((p) => p.x)), y: extent(points.map((p) => p.y)) }, { chart: CHART, xName, yName, padding: context.domainPadding, locale, numberFormat, inset: EDGE });
  const at = points.map((p) => ({ x: frame.x(p.x), y: frame.y(p.y), index: p.index }));
  const origin = { x: frame.region.x, y: frame.region.y };
  const bins: Bin2D[] = hexagons ? hexBins(at, size, origin) : rectBins(at, size, origin);
  const max = Math.max(...bins.map((b) => b.count));

  const summaries = bins.map((b) => Object.freeze({ x: round2(valueAt(frame.x, b.cx)), y: round2(valueAt(frame.y, b.cy)), count: b.count }));
  const base = modelBase(CHART, props, context, 'Density bins', {
    columns: [pointName, 'count'],
    rows: summaries.map((s) => [`${formatNumber(s.x, locale, numberFormat)}, ${formatNumber(s.y, locale, numberFormat)}`, formatNumber(s.count, locale, undefined)]),
  });

  const strokes: Stroke[] = [...card.strokes, ...frame.strokes];
  const labels: TextLabel[] = [...card.labels, ...frame.labels];
  const hitAreas: HitArea[] = [];
  const key = legend(keyArea, keyEntries(max).map((e) => ({ name: e.text, part: 'ink' as const, tone: e.tone })));
  strokes.push(...key.strokes);
  labels.push(...key.labels);

  // The keyboard's grid: rows that hold a bin, in order, and the bins of a row side by side, so
  // the first of every row lines up and a sparse lattice walls nothing off (I-29).
  const rows = [...new Set(bins.map((b) => b.row))];
  const rowOf = new Map(rows.map((row, r) => [row, r]));
  const columnOf = bins.map((b, k) => bins.slice(0, k).filter((o) => o.row === b.row).length);
  const half = size / 2;
  const marks = bins.map((bin, k) => {
    const d = hexagons ? hexagonPath(bin.cx, bin.cy, size) : rectPath({ x: bin.cx - half, y: bin.cy - half, width: size, height: size });
    // Tone by count against the densest bin, as the heatmap tones by value (DD-032).
    strokes.push({ d, role: 'encoding', part: 'ink', tone: toneOf(bin.count / max) });
    // The readout's mark stays in the plot, whatever the lattice does at its edge.
    const x = Math.min(Math.max(bin.cx, plot.x), plot.x + plot.width);
    const y = Math.min(Math.max(bin.cy, plot.y), plot.y + plot.height);
    hitAreas.push({ seriesKey: 'count', index: k, datum: summaries[k] as (typeof summaries)[number], value: bin.count, x, y, box: { x: bin.cx - half, y: bin.cy - half, width: size, height: size }, cell: { column: columnOf[k] as number, row: rowOf.get(bin.row) as number } });
    return d;
  });

  // One heightened element (REQ-442): the densest bin, the first of them in reading order.
  const densest = bins.findIndex((b) => b.count === max);
  strokes.push({ d: marks[densest] as string, role: 'encoding', part: 'heighten', paint: 'fill' });

  const peak = summaries[densest] as (typeof summaries)[number];
  const description =
    props.description ??
    `${base.name}. ${points.length} points of ${xName} across and ${yName} up, counted in ${bins.length} ${hexagons ? 'hexagonal' : 'square'} bins ${formatNumber(size, locale, undefined)} px across and toned by count against the densest, which holds ${formatNumber(max, locale, undefined)} near ${formatNumber(peak.x, locale, numberFormat)}, ${formatNumber(peak.y, locale, numberFormat)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `DensityBinChart` recipe (REQ-422): x-y points counted in hexagonal or square bins, toned by count. */
export const densityBinChart: ChartRecipe<DensityBinChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildDensityBinChart });
