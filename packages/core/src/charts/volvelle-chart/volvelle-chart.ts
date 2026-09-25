import type { ChartModel, ChartRecipe, HitArea, RecipeContext, Stroke, TextLabel, VolvelleChartProps } from '../../types';
import { cardLayout } from '../shared/card';
import { warnValue } from '../shared/cells';
import { formatCategory } from '../shared/format';
import { pointAt, polarFrame, polarLabel, RIM_LABELS, sectorPath, type PolarFrame } from '../shared/polar';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { VOLVELLE_CHART_DEMO } from './demo';

const CHART = 'VolvelleChart';
/** Radius of the empty hub, as a share of the outer radius. */
const HUB = 0.22;
/** Room above the rings for the index pointer. */
const POINTER = 7;
/** Advance of one character of a 9.5 px label, to decide whether a name fits its segment. */
const CHAR = 5.2;

interface Ring {
  readonly label: string;
  readonly segments: readonly string[];
}

/** Cap height of a 9.5 px label. */
const CAP = 7;
/** Air kept between a name and its segment's edges. */
const AIR = 1;

/**
 * Whether a name, centred on `at`, fits its segment: every corner of its box lies inside the ring
 * and between the segment's two edges. A horizontal name at 3 o'clock runs across the ring, at 12
 * along it, so both the radial and the angular room are checked; the table names every segment.
 */
function fits(frame: PolarFrame, name: string, at: { x: number; y: number }, inner: number, outer: number, start: number, end: number): boolean {
  const width = name.length * CHAR;
  const corners = [
    [at.x - width / 2, at.y + 3 - CAP],
    [at.x + width / 2, at.y + 3 - CAP],
    [at.x - width / 2, at.y + 3],
    [at.x + width / 2, at.y + 3],
  ] as const;
  const middle = (start + end) / 2;
  return corners.every(([x, y]) => {
    const r = Math.hypot(x - frame.cx, y - frame.cy);
    // The corner's angle from 12 o'clock, measured from the segment's middle into (-π, π].
    let a = Math.atan2(x - frame.cx, frame.cy - y) - middle;
    a = Math.atan2(Math.sin(a), Math.cos(a));
    return r >= inner + AIR && r <= outer - AIR && Math.abs(a) <= (end - start) / 2 - AIR / Math.max(r, 1);
  });
}

function buildVolvelleChart(props: VolvelleChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const all = props.data ?? VOLVELLE_CHART_DEMO;
  const { locale } = context;
  const cap = props.rings !== undefined && Number.isInteger(props.rings) && props.rings > 0 ? props.rings : all.length;

  // Data (delta-010): rings from the inside out, each a label and a list of categories.
  const rings: Ring[] = [];
  all.slice(0, cap).forEach((datum, index) => {
    const segments = datum.segments;
    if (!Array.isArray(segments) || segments.length === 0) {
      warnValue(CHART, 'segments', `Ring ${index} has no list of segments; it is omitted.`);
      return;
    }
    rings.push({ label: formatCategory(datum.label, locale), segments: segments.map((s: unknown) => formatCategory(s, locale)) });
  });

  // The index angle: the middle of `indexValue` on `indexRing`; every ring is read there.
  let ringIndex = usesDemo ? 0 : (props.indexRing ?? 0);
  if (!Number.isInteger(ringIndex) || ringIndex < 0 || ringIndex >= rings.length) {
    if (rings.length > 0) warnValue(CHART, 'indexRing', `Ring ${String(props.indexRing)} does not exist; the index reads ring 0.`);
    ringIndex = 0;
  }
  const turned = rings[ringIndex];
  let segment = turned && !usesDemo && props.indexValue !== undefined ? turned.segments.indexOf(props.indexValue) : 0;
  if (segment < 0) {
    warnValue(CHART, 'indexValue', `"${String(props.indexValue)}" is not on ring "${turned?.label}"; the index reads its first segment.`);
    segment = 0;
  }
  const indexAngle = turned ? ((segment + 0.5) * 2 * Math.PI) / turned.segments.length : 0;
  // The segment of each ring holding the index angle, (segment + ½) / n of the turn, found in whole
  // numbers: a boundary shared by two rings (6 and 12 segments) is read exactly, never by rounding.
  const n = turned?.segments.length ?? 1;
  const underIndex = rings.map((r) => Math.floor(((2 * segment + 1) * r.segments.length) / (2 * n)));
  const combined = rings.map((r, k) => `${r.label} ${r.segments[underIndex[k] as number]}`).join(' · ');

  const base = modelBase(CHART, props, context, 'Volvelle', {
    columns: ['ring', 'segment', 'under the index'],
    rows: rings.flatMap((r, k) => r.segments.map((s, j) => [r.label, s, j === underIndex[k] ? 'yes' : 'no'])),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = card.area;
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];
  if (rings.length === 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, all.length === 0);

  // Room outside the rings for the outermost ring's names, which the pointer shares at 12 o'clock.
  const frame = polarFrame(plot, Math.max(POINTER, RIM_LABELS));
  const hub = frame.radius * HUB;
  const band = (frame.radius - hub) / rings.length;
  // The whole disc is turned so the index angle faces 12 o'clock.
  const turn = -indexAngle;
  let flat = 0;
  rings.forEach((r, k) => {
    const inner = hub + k * band;
    const outer = inner + band;
    const width = (2 * Math.PI) / r.segments.length;
    r.segments.forEach((name, j) => {
      const start = j * width + turn;
      const aligned = j === underIndex[k];
      const d = sectorPath(frame, { inner, outer, start, end: start + width });
      // The segments under the index are marked by tone and named in the readout (REQ-124).
      if (d) strokes.push({ d, role: 'encoding', part: 'ink', ...(aligned ? { tone: 3 as const } : {}) });
      const middle = pointAt(frame, start + width / 2, (inner + outer) / 2);
      if (fits(frame, name, middle, inner, outer, start, start + width)) {
        labels.push({ x: middle.x, y: middle.y + 3, text: name, kind: 'tick', part: 'text', anchor: 'middle' });
      } else if (k === rings.length - 1 && !aligned) {
        // The outermost ring is named around the rim; the segment under the pointer is in the readout.
        labels.push(polarLabel(frame, start + width / 2, outer + 8, name));
      }
      hitAreas.push({ seriesKey: 'segment', index: flat, datum: { ring: r.label, segment: name }, value: j, x: middle.x, y: middle.y, cell: { column: j, row: k } });
      flat += 1;
    });
  });

  // The fixed pointer above 12 o'clock, and the combined readout under the disc.
  const tip = frame.cy - frame.radius - 1;
  strokes.push({ d: `M${frame.cx - 4},${tip - POINTER + 1}L${frame.cx + 4},${tip - POINTER + 1}L${frame.cx},${tip}Z`, role: 'ornament', part: 'ink', paint: 'fill' });
  labels.push({ x: plot.x, y: plot.y + plot.height - 4, text: combined, kind: 'tick', part: 'text', anchor: 'start' });

  const description = props.description ?? `${base.name}. Volvelle of ${rings.length} rings from the inside out; under the index: ${combined}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `VolvelleChart` recipe (REQ-090): concentric categorical rings read against one index. */
export const volvelleChart: ChartRecipe<VolvelleChartProps> = /* @__PURE__ */ Object.freeze({ name: 'VolvelleChart', build: buildVolvelleChart });
