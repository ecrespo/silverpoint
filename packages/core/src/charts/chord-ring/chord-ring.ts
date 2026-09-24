import { chordDirected } from 'd3-chord';
import { diagnose } from '../../diagnostics/diagnose';
import type { ChartModel, ChartRecipe, ChordRingProps, HitArea, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { finite, warnValue } from '../shared/cells';
import { accessorName, formatCategory, formatNumber, formatValue, read } from '../shared/format';
import { pointAt, polarFrame, RIM_LABELS, rimLabels, ringTone, sectorPath, type PolarFrame } from '../shared/polar';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { CHORD_RING_DEMO } from './demo';

const CHART = 'ChordRing';
/** The v1 ceiling: ribbons grow with the square of the categories (PRD NFR "Data volume"). */
const CEILING = 12;
const OTHER = 'Other';
/** Width of the category band, as a share of the radius. */
const BAND = 0.08;
const PAD = 0.04;

/** An arc command along radius `r` to angle `to`, clockwise, as the ribbon ends need. */
function along(frame: PolarFrame, r: number, from: number, to: number): string {
  const p = pointAt(frame, to, r);
  return `A${r},${r},0,${to - from > Math.PI ? 1 : 0},1,${p.x},${p.y}`;
}

/**
 * A ribbon (DD-005): out along the source's span, a quadratic curve through the centre to the
 * target's span, along it, and back through the centre — d3's ribbon, written with the polar
 * frame's exact arcs so it is placed like every other polar path.
 */
function ribbonPath(frame: PolarFrame, r: number, s0: number, s1: number, t0: number, t1: number): string {
  const start = pointAt(frame, s0, r);
  const target = pointAt(frame, t0, r);
  const c = `${frame.cx},${frame.cy}`;
  return `M${start.x},${start.y}${along(frame, r, s0, s1)}Q${c},${target.x},${target.y}${along(frame, r, t0, t1)}Q${c},${start.x},${start.y}Z`;
}

function buildChordRing(props: ChordRingProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? CHORD_RING_DEMO;
  const sourceKey = usesDemo ? 'source' : (props.sourceKey ?? 'source');
  const targetKey = usesDemo ? 'target' : (props.targetKey ?? 'target');
  const valueKey = usesDemo ? 'value' : (props.valueKey ?? 'value');
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const valueName = accessorName(valueKey, 'value');
  const most = props.maxCategories !== undefined && Number.isInteger(props.maxCategories) && props.maxCategories >= 2 ? props.maxCategories : CEILING;

  // Data Model §2.7: a flow needs both ends and a value > 0.
  const flows: { index: number; source: string; target: string; value: number }[] = [];
  data.forEach((datum, index) => {
    const rawSource = read(sourceKey, datum, index);
    const rawTarget = read(targetKey, datum, index);
    const value = finite(read(valueKey, datum, index));
    if (rawSource === undefined || rawSource === null || rawSource === '' || rawTarget === undefined || rawTarget === null || rawTarget === '' || value === undefined || value <= 0) {
      warnValue(CHART, valueName, `Row ${index} lacks a source, a target or a ${valueName} > 0; it is omitted.`);
      return;
    }
    flows.push({ index, source: formatCategory(rawSource, locale), target: formatCategory(rawTarget, locale), value });
  });

  // The categories, in order of first appearance; past the ceiling the smallest merge into "Other".
  const throughput = new Map<string, number>();
  for (const f of flows) {
    throughput.set(f.source, (throughput.get(f.source) ?? 0) + f.value);
    throughput.set(f.target, (throughput.get(f.target) ?? 0) + f.value);
  }
  const all = [...throughput.keys()];
  // A warning (API Spec §11): stripped from production builds like every other.
  if (process.env.NODE_ENV !== 'production' && (all.length > CEILING || all.length > most)) {
    diagnose('SP010', CHART, {
      property: 'maxCategories',
      message: `${all.length} categories${all.length > most ? `; the ${all.length - most + 1} smallest are merged into "${OTHER}"` : ''}.`,
    });
  }
  const kept = new Set(all.length > most ? [...all].sort((a, b) => (throughput.get(b) ?? 0) - (throughput.get(a) ?? 0)).slice(0, most - 1) : all);
  const categories = [...all.filter((c) => kept.has(c)), ...(all.length > most ? [OTHER] : [])];
  const slot = (name: string) => categories.indexOf(kept.has(name) ? name : OTHER);

  const base = modelBase(CHART, props, context, 'Chord ring', {
    columns: [accessorName(sourceKey, 'source'), accessorName(targetKey, 'target'), valueName],
    rows: data.map((datum, index) => [
      formatCategory(read(sourceKey, datum, index), locale),
      formatCategory(read(targetKey, datum, index), locale),
      formatValue(finite(read(valueKey, datum, index)), locale, numberFormat),
    ]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = card.area;
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];
  if (flows.length === 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  // The square matrix is ours (DD-005); d3-chord allocates the angles, one chord per directed cell.
  const n = categories.length;
  const matrix = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const first = new Map<string, (typeof flows)[number]>();
  for (const f of flows) {
    const [i, j] = [slot(f.source), slot(f.target)];
    (matrix[i] as number[])[j] = ((matrix[i] as number[])[j] as number) + f.value;
    if (!first.has(`${i}>${j}`)) first.set(`${i}>${j}`, f);
  }
  const chords = chordDirected().padAngle(PAD)(matrix);

  const frame = polarFrame(plot, RIM_LABELS);
  const inner = frame.radius * (1 - BAND);
  chords.groups.forEach((g) => {
    const d = sectorPath(frame, { inner, outer: frame.radius, start: g.startAngle, end: g.endAngle });
    if (d) strokes.push({ d, role: 'encoding', part: 'ink', tone: ringTone(g.index, n) });
  });
  // Ribbons in the order of their first row, so drawing and keyboard follow the consumer's data.
  const order = (c: (typeof chords)[number]) => first.get(`${c.source.index}>${c.target.index}`)?.index ?? Number.MAX_SAFE_INTEGER;
  for (const c of [...chords].sort((x, y) => order(x) - order(y))) {
    // A ribbon is a surface: hatched in its source's tone, which ties it to the arc it leaves.
    strokes.push({ d: ribbonPath(frame, inner, c.source.startAngle, c.source.endAngle, c.target.startAngle, c.target.endAngle), role: 'encoding', part: 'ink', tone: ringTone(c.source.index, n) });
    const flow = first.get(`${c.source.index}>${c.target.index}`);
    if (!flow) continue;
    // The ribbon's midpoint: a quarter of each end and half the centre, on its quadratic curves.
    const a = pointAt(frame, (c.source.startAngle + c.source.endAngle) / 2, inner);
    const b = pointAt(frame, (c.target.startAngle + c.target.endAngle) / 2, inner);
    const datum = data[flow.index] ?? {};
    hitAreas.push({ seriesKey: valueName, index: flow.index, datum, value: c.source.value, x: 0.25 * a.x + 0.5 * frame.cx + 0.25 * b.x, y: 0.25 * a.y + 0.5 * frame.cy + 0.25 * b.y });
  }
  labels.push(...rimLabels(frame, chords.groups.map((g) => ({ angle: (g.startAngle + g.endAngle) / 2, text: categories[g.index] as string }))));

  const busiest = chords.groups.reduce((x, y) => (y.value > x.value ? y : x));
  const description =
    props.description ??
    `${base.name}. Chord ring of ${flows.length} flows between ${n} categories; the busiest is ${categories[busiest.index]}, sending ${formatNumber(
      (matrix[busiest.index] as number[]).reduce((s, v) => s + v, 0),
      locale,
      numberFormat,
    )}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `ChordRing` recipe (REQ-091): directed flows between categories, ribbons over `d3-chord`. */
export const chordRing: ChartRecipe<ChordRingProps> = /* @__PURE__ */ Object.freeze({ name: 'ChordRing', build: buildChordRing });
