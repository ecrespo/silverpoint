import type { ChartModel, CommonChartProps, Datum, HitArea, Rect, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from './card';
import { warnValue } from './cells';
import { accessorName, formatValue } from './format';
import type { Accessor } from '../../types';
import { arcPath, checkSectors, pointAt, readSectors, sectorLegend, sectorPath, type PolarFrame, type Sector } from './polar';
import { emptyModel, measure, modelBase, readyModel } from './shell';
import { PLOT_INSET } from './cartesian';

/** Radius of the empty centre, as a share of the outer radius. */
const HOLE = 0.3;
/** Share of each track's band that the value fills; the rest is the gap to the next track. */
const BAND_FILL = 0.72;
/** Width kept for the legend column beside the tracks. */
const LEGEND_WIDTH = 110;
const LEGEND_GAP = 12;

export interface TrackFamily {
  readonly chart: string;
  readonly fallbackName: string;
  /** Where every track starts and how far a full value sweeps, in radians clockwise from 12. */
  readonly start: number;
  readonly span: number;
  /** Lays the tracks' circle out in the space left of the legend. */
  frameIn(area: Rect): PolarFrame;
  /** The share of the span a sector sweeps, before saturation. */
  shareOf(sector: Sector, sectors: readonly Sector[]): number;
  /** What the legend prints beside a track's name. */
  printed(sector: Sector, locale: string, numberFormat: Intl.NumberFormatOptions | undefined): string;
  readonly demo: readonly Datum[];
}

interface TrackProps extends CommonChartProps {
  nameKey?: Accessor<string | number>;
  valueKey?: Accessor<number | null | undefined>;
}

/**
 * Concentric tracks, outermost first (REQ-078, REQ-079): a guide arc per item (ornament) and a
 * value band swept from the family's start. A legend beside them names each track with its value,
 * in the same order; the tracks share one tone, so order and print tell them apart (REQ-124).
 */
export function buildTracks(family: TrackFamily, props: TrackProps, context: RecipeContext): ChartModel {
  const { chart } = family;
  const usesDemo = props.data === undefined;
  const data = props.data ?? family.demo;
  const nameKey = usesDemo ? 'name' : (props.nameKey ?? 'name');
  const valueKey = usesDemo ? 'value' : (props.valueKey ?? 'value');
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const valueName = accessorName(valueKey, 'value');
  checkSectors(chart, valueName, data.length);

  const sectors = readSectors(data, nameKey, valueKey, chart, locale);
  const byRow = new Map(sectors.map((s) => [s.index, s]));
  const base = modelBase(chart, props, context, family.fallbackName, {
    columns: [accessorName(nameKey, 'name'), valueName],
    rows: data.map((_, index) => {
      const s = byRow.get(index);
      return s ? [s.name, formatValue(s.value, locale, numberFormat)] : ['—', '—'];
    }),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = card.area;
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];
  if (sectors.length === 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  const withLegend = plot.width >= LEGEND_WIDTH * 2;
  const drawing = withLegend ? { ...plot, width: plot.width - LEGEND_WIDTH - LEGEND_GAP } : plot;
  const frame = family.frameIn(drawing);
  const hole = frame.radius * HOLE;
  const band = (frame.radius - hole) / sectors.length;

  let saturated = 0;
  sectors.forEach((s, k) => {
    const outer = frame.radius - k * band;
    const inner = outer - band * BAND_FILL;
    const middle = (outer + inner) / 2;
    strokes.push({ d: arcPath(frame, middle, family.start, family.start + family.span), role: 'ornament', part: 'grid' });
    const raw = family.shareOf(s, sectors);
    const share = Math.min(Math.max(raw, 0), 1);
    if (share !== raw) saturated += 1;
    const end = family.start + share * family.span;
    const d = sectorPath(frame, { inner, outer, start: family.start, end });
    if (d) strokes.push({ d, role: 'encoding', part: 'ink', tone: 2 });
    const tip = pointAt(frame, end, middle);
    hitAreas.push({ seriesKey: valueName, index: s.index, datum: s.datum, value: s.value, x: tip.x, y: tip.y });
  });
  if (saturated > 0) warnValue(chart, valueName, `${saturated} values fall outside the track's range; they are drawn at its end.`);

  if (withLegend) {
    const x = drawing.x + drawing.width + LEGEND_GAP;
    const key = sectorLegend(
      { x, y: plot.y, width: plot.x + plot.width - x, height: plot.height },
      sectors.map((s) => ({ name: s.name, share: family.printed(s, locale, numberFormat), tone: 2 })),
    );
    strokes.push(...key.strokes);
    labels.push(...key.labels);
  }

  const description =
    props.description ??
    `${base.name}. ${sectors.length} concentric tracks, outermost first: ${sectors.map((s) => `${s.name} ${family.printed(s, locale, numberFormat)}`).join(', ')}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** A half circle standing on the bottom of the area, as wide as fits. */
export function halfCircleFrame(area: Rect, bottomRoom: number): PolarFrame {
  const radius = Math.max(Math.min(area.width / 2, area.height - bottomRoom) - PLOT_INSET, 1);
  return { cx: area.x + area.width / 2, cy: area.y + area.height - bottomRoom, radius };
}
