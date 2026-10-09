import { linearScale } from '../../scales/scales';
import { extent } from '../../scales/util';
import type { ChartModel, ChartRecipe, EcdfChartProps, HitArea, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { cartesianPlot, legend } from '../shared/cartesian';
import { warnValue } from '../shared/cells';
import { checkCeiling, checkQuantiles, readObservations } from '../shared/contracts';
import { accessorName, circlePath, formatNumber, numberFormatter } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { ecdf, quantile, sortedValues, type EcdfStep } from '../shared/stats';
import { ECDF_CHART_DEMO, ECDF_CHART_DEMO_KEYS } from './demo';

const CHART = 'EcdfChart';
const HEIGHTEN_RADIUS = 3.5;
/** Groups drawn: the catalog's two-series grammar, `ink` and `ink-secondary` dotted (DD-035). */
const MAX_GROUPS = 2;
/** The share grid: the quartiles and the whole (DD-035). */
const SHARES = [0.25, 0.5, 0.75, 1] as const;
const PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 1 };

interface Group {
  readonly name: string;
  readonly sorted: readonly number[];
  readonly steps: readonly EcdfStep[];
}

function buildEcdfChart(props: EcdfChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? ECDF_CHART_DEMO;
  const valueKey = usesDemo ? ECDF_CHART_DEMO_KEYS.valueKey : (props.valueKey ?? 'value');
  const groupKey = usesDemo ? ECDF_CHART_DEMO_KEYS.groupKey : props.groupKey;
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const valueName = accessorName(valueKey, 'value');

  const read = readObservations(CHART, data, { value: valueKey, ...(groupKey === undefined ? {} : { group: groupKey }) });
  checkCeiling(CHART, valueName, 'observations', read.observations.length);
  if (read.groups.length > MAX_GROUPS) {
    warnValue(CHART, groupKey === undefined ? 'group' : accessorName(groupKey, 'group'), `${read.groups.length} groups; the ECDF draws the first ${MAX_GROUPS}.`);
  }
  const markers = checkQuantiles(CHART, props.markers) ?? [];
  const groups: Group[] = read.groups.slice(0, MAX_GROUPS).map((name, i) => {
    const sorted = sortedValues(read.observations.filter((o) => o.group === name).map((o) => o.value));
    return { name: groupKey === undefined && i === 0 ? 'cumulative share' : name, sorted, steps: ecdf(sorted) };
  });

  // One row per distinct value across the groups; each cell is that group's share at or below it.
  const values = sortedValues([...new Set(groups.flatMap((g) => g.steps.map((s) => s.value)))]);
  const row = new Map(values.map((v, i) => [v, i]));
  // Each group's share at every row, in one pass: values and steps are both sorted (REQ-445).
  const shares = groups.map((group) => {
    let k = 0;
    let p = 0;
    return values.map((v) => {
      while (k < group.steps.length && (group.steps[k] as EcdfStep).value <= v) p = (group.steps[k++] as EcdfStep).p;
      return p;
    });
  });
  // A row per distinct value: each column's formatter is resolved once (REQ-445).
  const value = numberFormatter(locale, numberFormat);
  const percent = numberFormatter(locale, PERCENT);
  const base = modelBase(CHART, props, context, 'Cumulative distribution', {
    columns: [valueName, ...groups.map((g) => g.name)],
    rows: values.map((v, i) => [value(v), ...shares.map((column) => percent(column[i] as number))]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const key = groups.length > 1
    ? legend(card.area, groups.map((g, i) => (i === 0 ? { name: g.name, part: 'ink' as const } : { name: g.name, part: 'ink-secondary' as const, dash: 'dotted' as const })))
    : { area: card.area, strokes: [], labels: [] };
  const area = key.area;
  const plot = cartesianPlot(area);
  const strokes: Stroke[] = [...card.strokes, ...key.strokes];
  const labels: TextLabel[] = [...card.labels, ...key.labels];
  const hitAreas: HitArea[] = [];

  const domain = extent(values);
  if (domain === undefined) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const right = plot.x + plot.width;
  const bottom = plot.y + plot.height;
  const x = linearScale(domain, [plot.x, right], { chart: CHART, property: valueName, padding: context.domainPadding, nice: true });
  const y = linearScale([0, 1], [bottom, plot.y], { chart: CHART, property: 'share', padding: context.domainPadding });
  for (const share of SHARES) {
    strokes.push({ d: `M${plot.x},${y(share)}H${right}`, role: 'ornament', part: 'grid' });
    labels.push({ x: plot.x, y: y(share) - 3, text: formatNumber(share, locale, PERCENT), kind: 'tick', part: 'axis', anchor: 'start' });
  }
  strokes.push({ d: `M${plot.x},${bottom}H${right}`, role: 'ornament', part: 'rule' });
  for (const tick of x.ticks(4)) {
    labels.push({ x: x(tick), y: area.y + area.height - 5, text: formatNumber(tick, locale, numberFormat), kind: 'tick', part: 'axis', anchor: 'middle' });
  }
  // A quantile marker is a dotted rule across the plot at its share.
  for (const p of markers) strokes.push({ d: `M${plot.x},${y(p)}H${right}`, role: 'ornament', part: 'rule', dash: 'dotted' });

  groups.forEach((group, series) => {
    // The step function: zero until the first value, up at each value, held to the end.
    let d = '';
    group.steps.forEach((step, i) => {
      d += i === 0 ? `M${x(step.value)},${bottom}V${y(step.p)}` : `H${x(step.value)}V${y(step.p)}`;
    });
    d += `H${right}`;
    strokes.push({ d, role: 'encoding', part: series === 0 ? 'ink' : 'ink-secondary', ...(series === 0 ? {} : { dash: 'dotted' as const }) });
    group.steps.forEach((step, column) => {
      hitAreas.push({
        seriesKey: group.name,
        index: row.get(step.value) as number,
        datum: Object.freeze({ value: step.value, p: step.p, group: group.name }),
        value: step.p,
        x: x(step.value),
        y: y(step.p),
        cell: { column, row: series },
      });
    });
  });

  // One heightened element (REQ-442): where the first group crosses its median.
  const first = groups[0] as Group;
  const median = quantile(first.sorted, 0.5);
  const mark = circlePath(x(median), y(0.5), HEIGHTEN_RADIUS);
  strokes.push({ d: mark, role: 'encoding', part: 'heighten', paint: 'fill' });
  strokes.push({ d: mark, role: 'encoding', part: 'ink', paint: 'stroke' });

  const summary = groups.map((g) => `${g.name}: ${g.sorted.length} values, median ${formatNumber(quantile(g.sorted, 0.5), locale, numberFormat)}`).join('; ');
  const description =
    props.description ??
    `${base.name}. Empirical cumulative distribution of ${valueName}, the share of observations at or below each value, from ${formatNumber(domain[0], locale, numberFormat)} to ${formatNumber(domain[1], locale, numberFormat)}; ${summary}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `EcdfChart` recipe (REQ-401): the empirical cumulative distribution as an exact step line. */
export const ecdfChart: ChartRecipe<EcdfChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildEcdfChart });
