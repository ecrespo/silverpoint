import { bandScale, type LinearScale } from '../../scales/scales';
import { extent } from '../../scales/util';
import type { Accessor, ChartModel, ChartOrientation, CommonChartProps, Datum, HitArea, Rect, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from './card';
import { AXIS_BAND, PLOT_INSET, cartesianPlot, categoryLabels, horizontalValueAxis, valueAxis } from './cartesian';
import { checkCeiling, readObservations, warnTooSmall } from './contracts';
import { accessorName, fitText, formatNumber } from './format';
import { emptyModel, measure, modelBase, readyModel } from './shell';
import { sortedValues } from './stats';

/**
 * The skeleton the box plot, the violin and the ridgeline share (DD-036), as `points.ts` serves
 * the scatter and the bubble: observations read and grouped, a sorted sample per group, the derived
 * table, the card, the empty state; each family then draws its groups on the frame.
 */

/** A group's observations, ascending. */
export interface DistributionGroup {
  readonly name: string;
  readonly sorted: readonly number[];
  /** Fewer observations than the family's statistic needs: drawn as points (REQ-434). */
  readonly small: boolean;
}

export interface DistributionProps extends CommonChartProps {
  valueKey?: Accessor<number | null | undefined>;
  groupKey?: Accessor<string | null | undefined>;
  orientation?: ChartOrientation;
}

/** What a family draws on the frame; every coordinate in it comes from the frame's scales. */
export interface DistributionDrawing {
  readonly plot: Rect;
  readonly strokes: readonly Stroke[];
  readonly labels: readonly TextLabel[];
  readonly hitAreas: readonly HitArea[];
  /** What the description says after the chart's name and its groups. */
  readonly summary: string;
}

export interface DistributionFamily<P extends DistributionProps> {
  readonly chart: string;
  readonly fallbackName: string;
  readonly demo: readonly Datum[];
  readonly demoKeys: { readonly valueKey: string; readonly groupKey: string };
  /** Observations a group needs for the statistic (REQ-434). */
  readonly minimum: number;
  /** The derived columns after the group's name, and a group's cells (REQ-431). */
  readonly columns: readonly string[];
  row(group: DistributionGroup, props: P, format: (v: number) => string, groups: readonly DistributionGroup[]): readonly string[];
  draw(frame: { readonly props: P; readonly context: RecipeContext; readonly groups: readonly DistributionGroup[]; readonly area: Rect; readonly valueName: string; readonly format: (v: number) => string }): DistributionDrawing;
}

export function buildDistribution<P extends DistributionProps>(family: DistributionFamily<P>, props: P, context: RecipeContext): ChartModel {
  const { chart } = family;
  const usesDemo = props.data === undefined;
  const data = props.data ?? family.demo;
  const valueKey = usesDemo ? family.demoKeys.valueKey : (props.valueKey ?? 'value');
  const groupKey = usesDemo ? family.demoKeys.groupKey : props.groupKey;
  const { locale } = context;
  const format = (v: number) => formatNumber(v, locale, props.numberFormat);
  const valueName = accessorName(valueKey, 'value');
  const groupName = groupKey === undefined ? 'group' : accessorName(groupKey, 'group');

  const read = readObservations(chart, data, { value: valueKey, ...(groupKey === undefined ? {} : { group: groupKey }) });
  checkCeiling(chart, valueName, 'observations', read.observations.length);
  const groups: DistributionGroup[] = read.groups.map((name) => {
    const sorted = sortedValues(read.observations.filter((o) => o.group === name).map((o) => o.value));
    return { name: groupKey === undefined ? valueName : name, sorted, small: sorted.length < family.minimum };
  });
  for (const g of groups) if (g.small && g.sorted.length > 0) warnTooSmall(chart, g.name, g.sorted.length, family.minimum);

  const base = modelBase(chart, props, context, family.fallbackName, {
    columns: [groupName, ...family.columns],
    rows: groups.map((g) => [g.name, ...family.row(g, props, format, groups)]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  if (read.observations.length === 0) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot: cartesianPlot(card.area), strokes: [...card.strokes], labels: [...card.labels] }, data.length === 0);
  }
  const drawing = family.draw({ props, context, groups, area: card.area, valueName, format });
  const description = props.description ?? `${base.name}. ${family.fallbackName} of ${valueName} in ${groups.length} ${groups.length === 1 ? 'group' : 'groups'}; ${drawing.summary}.`;
  return readyModel(base, description, {
    viewBox: card.viewBox,
    plot: drawing.plot,
    strokes: [...card.strokes, ...drawing.strokes],
    labels: [...card.labels, ...drawing.labels],
    hitAreas: drawing.hitAreas,
  });
}

/** Room at the left for the group names when groups run in rows. */
export const ROW_LABELS = 56;

/** The frame of the box plot and the violin: a band per group, a value scale across them. */
export interface BandFrame {
  readonly plot: Rect;
  readonly rows: boolean;
  /** Data value → px along the value axis. */
  readonly value: LinearScale;
  /** Centre of group `i` across the value axis. */
  centre(i: number): number;
  readonly bandwidth: number;
  readonly strokes: readonly Stroke[];
  readonly labels: readonly TextLabel[];
}

export function bandFrame(
  area: Rect,
  groups: readonly DistributionGroup[],
  domain: readonly [number, number],
  options: { readonly chart: string; readonly property: string; readonly padding: number; readonly locale: string; readonly numberFormat: Intl.NumberFormatOptions | undefined; readonly orientation: ChartOrientation | undefined },
): BandFrame {
  const rows = options.orientation === 'rows';
  const plot: Rect = rows
    ? { x: area.x + ROW_LABELS, y: area.y + PLOT_INSET, width: Math.max(area.width - ROW_LABELS - PLOT_INSET, 1), height: Math.max(area.height - AXIS_BAND - PLOT_INSET, 1) }
    : cartesianPlot(area);
  const axisOptions = { chart: options.chart, property: options.property, padding: options.padding, locale: options.locale, numberFormat: options.numberFormat };
  const axis = rows ? horizontalValueAxis(plot, area, domain, axisOptions) : valueAxis(plot, domain, { ...axisOptions, zero: false });
  const across = rows ? ([plot.y, plot.y + plot.height] as const) : ([plot.x, plot.x + plot.width] as const);
  const band = bandScale(groups.map((_, i) => String(i)), across, { paddingInner: 0.3, paddingOuter: 0.15 });
  const centre = (i: number) => band.center(String(i)) ?? across[0];
  const names = groups.map((g) => g.name);
  const labels: TextLabel[] = [...axis.labels];
  if (rows) names.forEach((text, i) => labels.push({ x: area.x + PLOT_INSET, y: centre(i) + 4, text: fitText(text, ROW_LABELS - PLOT_INSET - 6), kind: 'tick', part: 'axis', anchor: 'start' }));
  else labels.push(...categoryLabels(names, centre, area, plot));
  return { plot, rows, value: axis.scale, centre, bandwidth: band.bandwidth, strokes: axis.strokes, labels };
}

/** The value extent of every group, for a shared scale. */
export function valueExtent(groups: readonly DistributionGroup[], pad = 0): [number, number] {
  const [low, high] = extent(groups.flatMap((g) => g.sorted)) ?? [0, 0];
  return [low - pad, high + pad];
}
