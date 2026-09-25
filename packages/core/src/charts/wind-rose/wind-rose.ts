import { linearScale } from '../../scales/scales';
import type { ChartModel, ChartRecipe, HitArea, RecipeContext, Stroke, TextLabel, ToneLevel, WindRoseProps } from '../../types';
import { cardLayout } from '../shared/card';
import { finite, warnValue } from '../shared/cells';
import { accessorName, formatNumber, read } from '../shared/format';
import { arcPath, pointAt, polarFrame, RIM_LABELS, rimLabels, sectorLegend, sectorPath } from '../shared/polar';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { WIND_ROSE_DEMO } from './demo';

const CHART = 'WindRose';
const COUNTS = [4, 8, 16, 32];
const DEFAULT_SECTORS = 16;
const DEFAULT_BINS: readonly number[] = [5, 10, 15, 20];
const POINTS_16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const BIN_TONES: readonly ToneLevel[] = [1, 2, 3, 4];
/** Share of each sector's angle left empty on either side. */
const SECTOR_GAP = 0.08;
const LEGEND_ASPECT = 1.5;
const LEGEND_GAP = 14;

/** The compass name of sector `k` of `count`: the 16 points, or degrees for 32 sectors. */
function compass(k: number, count: number, locale: string): string {
  if (count <= 16) return POINTS_16[(k * 16) / count] as string;
  return `${formatNumber((k * 360) / count, locale, { maximumFractionDigits: 2 })}°`;
}

const validBins = (bins: readonly number[] | undefined): bins is readonly number[] =>
  !!bins && bins.length > 0 && bins.every((b, i) => Number.isFinite(b) && b > 0 && (i === 0 || b > (bins[i - 1] as number)));

function buildWindRose(props: WindRoseProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? WIND_ROSE_DEMO;
  const bearingKey = usesDemo ? 'bearing' : (props.bearingKey ?? 'bearing');
  const valueKey = usesDemo ? 'speed' : (props.valueKey ?? 'speed');
  const { locale } = context;
  const bearingName = accessorName(bearingKey, 'bearing');
  const speedName = accessorName(valueKey, 'speed');

  const count = props.sectors === undefined || COUNTS.includes(props.sectors) ? (props.sectors ?? DEFAULT_SECTORS) : DEFAULT_SECTORS;
  if (count !== (props.sectors ?? DEFAULT_SECTORS)) warnValue(CHART, 'sectors', `${String(props.sectors)} sectors cannot divide a compass; ${DEFAULT_SECTORS} are drawn.`);
  const bins = props.bins === undefined ? DEFAULT_BINS : validBins(props.bins) ? props.bins : DEFAULT_BINS;
  if (bins !== (props.bins ?? DEFAULT_BINS)) warnValue(CHART, 'bins', 'The speed bins must be positive and ascending; the defaults are used.');
  const binLabels = [
    `< ${formatNumber(bins[0] as number, locale, undefined)}`,
    ...bins.slice(1).map((b, i) => `${formatNumber(bins[i] as number, locale, undefined)}–${formatNumber(b, locale, undefined)}`),
    `≥ ${formatNumber(bins.at(-1) as number, locale, undefined)}`,
  ];

  // Each observation: a sector by bearing and a bin by speed; a calm has neither.
  const width = (2 * Math.PI) / count;
  const tally = Array.from({ length: count }, () => new Array<number>(binLabels.length).fill(0));
  let calm = 0;
  let observed = 0;
  data.forEach((datum, index) => {
    const bearing = finite(read(bearingKey, datum, index));
    const speed = finite(read(valueKey, datum, index));
    if (bearing === undefined || speed === undefined || speed < 0) {
      warnValue(CHART, bearing === undefined ? bearingName : speedName, `Row ${index} lacks a finite bearing or a speed ≥ 0; it is omitted.`);
      return;
    }
    observed += 1;
    if (speed === 0) {
      calm += 1;
      return;
    }
    const k = Math.round((((bearing % 360) + 360) % 360) / (360 / count)) % count;
    const bin = bins.filter((b) => speed >= b).length;
    (tally[k] as number[])[bin] = ((tally[k] as number[])[bin] as number) + 1;
  });
  const pct = (n: number) => (observed > 0 ? (n / observed) * 100 : 0);
  const printed = (n: number) => `${formatNumber(pct(n), locale, { maximumFractionDigits: 0 })}%`;
  const totals = tally.map((row) => row.reduce((a, b) => a + b, 0));

  const base = modelBase(CHART, props, context, 'Wind rose', {
    columns: ['direction', 'share', ...binLabels],
    rows: tally.map((row, k) => [compass(k, count, locale), printed(totals[k] as number), ...row.map(printed)]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = card.area;
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];
  if (observed === 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const withLegend = plot.width >= plot.height * LEGEND_ASPECT;
  const roseArea = withLegend ? { x: plot.x, y: plot.y, width: plot.height, height: plot.height } : plot;
  const frame = polarFrame(roseArea, RIM_LABELS);
  const largest = Math.max(...totals.map(pct));
  const radius = linearScale([0, Math.max(largest, Number.MIN_VALUE)], [0, frame.radius], { chart: CHART, property: 'share', padding: 0, nice: true });

  // Rings at the share ticks (ornament), labelled between the first two sectors.
  for (const tick of radius.ticks(3)) {
    const r = radius(tick);
    if (r <= 0 || r > frame.radius + 0.01) continue;
    strokes.push({ d: arcPath(frame, r, 0, 2 * Math.PI), role: 'ornament', part: 'grid' });
    // The outermost ring's value would sit among the compass names; the inner rings give the scale.
    if (r > frame.radius - RIM_LABELS) continue;
    const at = pointAt(frame, width / 2, r);
    labels.push({ x: at.x + 2, y: at.y - 2, text: `${formatNumber(tick, locale, { maximumFractionDigits: 0 })}%`, kind: 'tick', part: 'axis', anchor: 'start' });
  }

  tally.forEach((row, k) => {
    const start = k * width - width / 2 + width * SECTOR_GAP;
    const end = (k + 1) * width - width / 2 - width * SECTOR_GAP;
    // Stacked outward from the calmest bin: a band's outer edge is the running share.
    let running = 0;
    row.forEach((n, bin) => {
      if (n === 0) return;
      const inner = radius(pct(running));
      running += n;
      const d = sectorPath(frame, { inner, outer: radius(pct(running)), start, end });
      if (d) strokes.push({ d, role: 'encoding', part: 'ink', tone: BIN_TONES[bin % BIN_TONES.length] as ToneLevel });
    });
    const tip = pointAt(frame, k * width, radius(pct(running)));
    const direction = compass(k, count, locale);
    hitAreas.push({ seriesKey: 'share', index: k, datum: { direction, share: pct(running) }, value: pct(running), x: tip.x, y: tip.y });
  });
  labels.push(...rimLabels(frame, tally.map((_, k) => ({ angle: k * width, text: compass(k, count, locale) })), 16));

  const calmText = `calm ${printed(calm)}`;
  if (withLegend) {
    const x = roseArea.x + roseArea.width + LEGEND_GAP;
    const area = { x, y: plot.y, width: Math.max(plot.x + plot.width - x, 1), height: plot.height - 16 };
    const binTotals = binLabels.map((_, bin) => tally.reduce((sum, row) => sum + (row[bin] as number), 0));
    const key = sectorLegend(area, binLabels.map((name, bin) => ({ name, share: printed(binTotals[bin] as number), tone: BIN_TONES[bin % BIN_TONES.length] as ToneLevel })));
    strokes.push(...key.strokes);
    labels.push(...key.labels);
    labels.push({ x: x + 14, y: plot.y + plot.height - 4, text: calmText, kind: 'tick', part: 'axis', anchor: 'start' });
  } else {
    labels.push({ x: plot.x, y: plot.y + plot.height - 4, text: calmText, kind: 'tick', part: 'axis', anchor: 'start' });
  }

  const prevailing = totals.indexOf(Math.max(...totals));
  const description =
    props.description ??
    `${base.name}. Wind rose of ${observed} observations in ${count} sectors; ${
      (totals[prevailing] as number) > 0 ? `most often from ${compass(prevailing, count, locale)} (${printed(totals[prevailing] as number)})` : 'no wind from any direction'
    }; calm ${printed(calm)}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `WindRose` recipe (REQ-089): the share of observations per compass sector, stacked by speed. */
export const windRose: ChartRecipe<WindRoseProps> = /* @__PURE__ */ Object.freeze({ name: 'WindRose', build: buildWindRose });
