import type { ChartModel, ChartRecipe, FunnelChartProps, HitArea, RecipeContext, Stroke, TextLabel } from '../../types';
import { cardLayout } from '../shared/card';
import { checkCount } from '../shared/cartesian';
import { finite, inset, rectPath, toneOf, warnValue } from '../shared/cells';
import { accessorName, formatCategory, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { FUNNEL_CHART_DEMO } from './demo';

const CHART = 'FunnelChart';
const PLOT_INSET = 6;
/** Room at the left for the stage names and at the right for value and share. */
const LABEL_COLUMN = 64;
const VALUE_COLUMN = 64;
const STAGE_GAP = 3;

function buildFunnelChart(props: FunnelChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? FUNNEL_CHART_DEMO;
  const stageKey = usesDemo ? 'stage' : (props.stageKey ?? 'stage');
  const valueKey = usesDemo ? 'value' : (props.valueKey ?? 'value');
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const valueName = accessorName(valueKey, 'value');
  checkCount(CHART, valueName, data.length);

  const stages = data.map((datum, index) => ({
    index,
    datum,
    stage: formatCategory(read(stageKey, datum, index), locale),
    value: finite(read(valueKey, datum, index)),
  }));
  // Shares are of the first stage that has a positive value: the funnel's entry.
  const entry = stages.find((s) => s.value !== undefined && s.value > 0)?.value;
  const share = (value: number) => (entry ? `${formatNumber((value / entry) * 100, locale, { maximumFractionDigits: 0 })}%` : '—');

  const base = modelBase(CHART, props, context, 'Funnel chart', {
    columns: [accessorName(stageKey, 'stage'), valueName, 'share'],
    rows: stages.map((s) => [s.stage, formatValue(s.value, locale, numberFormat), s.value === undefined ? '—' : share(Math.max(s.value, 0))]),
  });
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = inset(card.area, PLOT_INSET);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  const largest = Math.max(0, ...stages.map((s) => s.value ?? 0));
  if (stages.length > 0 && largest <= 0) warnValue(CHART, valueName, `No stage has a ${valueName} above zero; there is no funnel to draw.`);
  if (stages.length === 0 || largest <= 0) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, stages.length === 0);
  }

  const track = { x: plot.x + LABEL_COLUMN, width: Math.max(plot.width - LABEL_COLUMN - VALUE_COLUMN, 1) };
  const centre = track.x + track.width / 2;
  const rowHeight = plot.height / stages.length;
  const right = plot.x + plot.width;

  for (const s of stages) {
    const top = plot.y + s.index * rowHeight;
    const baseline = top + rowHeight / 2 + 4;
    labels.push({ x: plot.x, y: baseline, text: s.stage, kind: 'tick', part: 'text', anchor: 'start' });
    if (s.value === undefined) {
      warnValue(CHART, valueName, `Stage ${s.index} has no finite value; it is omitted.`);
      continue;
    }
    const value = Math.max(s.value, 0);
    if (value !== s.value) warnValue(CHART, valueName, `Stage ${s.index} is ${s.value}; a funnel stage cannot be negative, so it is drawn at zero.`);
    const width = (value / largest) * track.width;
    const stage = { x: centre - width / 2, y: top + STAGE_GAP / 2, width, height: Math.max(rowHeight - STAGE_GAP, 0) };
    const tone = toneOf(value / largest);
    if (width > 0) strokes.push({ d: rectPath(stage), role: 'encoding', part: 'ink', ...(tone > 0 ? { tone } : {}) });
    // The width, the value and the share all say the same thing; the tone only repeats it (REQ-124).
    labels.push({ x: right, y: baseline - 6, text: formatNumber(s.value, locale, numberFormat), kind: 'tick', part: 'text', anchor: 'end' });
    labels.push({ x: right, y: baseline + 5, text: share(value), kind: 'tick', part: 'axis', anchor: 'end' });
    hitAreas.push({ seriesKey: valueName, index: s.index, datum: s.datum, value: s.value, x: centre, y: stage.y + stage.height / 2, box: stage });
  }

  const last = [...stages].reverse().find((s) => s.value !== undefined);
  const description =
    props.description ??
    `${base.name}. Funnel of ${stages.length} stages, from ${stages[0]?.stage} to ${last?.stage}; ${last?.value === undefined ? '' : `${share(Math.max(last.value, 0))} of the entry reach the last stage`}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `FunnelChart` recipe (REQ-068): centred stages, width ∝ value, value and share printed. */
export const funnelChart: ChartRecipe<FunnelChartProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildFunnelChart });
