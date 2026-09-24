import type { ChartModel, ChartRecipe, HitArea, RecipeContext, Stroke, TextLabel, TreemapChartProps } from '../../types';
import { cardLayout } from '../shared/card';
import { finite, inset, rectPath, toneLevel, toneOf, warnValue } from '../shared/cells';
import { accessorName, formatNumber, formatValue, read } from '../shared/format';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { TREEMAP_CHART_DEMO } from './demo';

const CHART = 'TreemapChart';
const PLOT_INSET = 6;
const TILE_GAP = 3;
const TEXT_INSET = 6;
const LINE = 13;
/** The grid a treemap declares when `columns` and `rows` are not given. */
const DEFAULT_COLUMNS = 6;
const DEFAULT_ROWS = 4;

const wholeCount = (raw: unknown): number | undefined => {
  const value = finite(raw);
  return value !== undefined && Number.isInteger(value) && value > 0 ? value : undefined;
};

/**
 * First-fit, row-major placement (Data Model §2.5): each tile takes the first cell, reading
 * the grid left to right and top to bottom, where its `cols × rows` block is free.
 */
function place(taken: boolean[][], cols: number, rows: number): { column: number; row: number } | undefined {
  const gridRows = taken.length;
  const gridColumns = taken[0]?.length ?? 0;
  for (let row = 0; row + rows <= gridRows; row += 1) {
    for (let column = 0; column + cols <= gridColumns; column += 1) {
      let free = true;
      for (let r = row; r < row + rows && free; r += 1) {
        for (let c = column; c < column + cols && free; c += 1) free = !taken[r]?.[c];
      }
      if (!free) continue;
      for (let r = row; r < row + rows; r += 1) for (let c = column; c < column + cols; c += 1) (taken[r] as boolean[])[c] = true;
      return { column, row };
    }
  }
  return undefined;
}

function buildTreemapChart(props: TreemapChartProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? TREEMAP_CHART_DEMO;
  const labelKey = usesDemo ? 'label' : (props.labelKey ?? 'label');
  const shareKey = usesDemo ? 'share' : (props.shareKey ?? 'share');
  const gridColumns = wholeCount(props.columns) ?? DEFAULT_COLUMNS;
  const gridRows = wholeCount(props.rows) ?? DEFAULT_ROWS;
  const { locale } = context;
  const numberFormat = props.numberFormat;
  const shareName = accessorName(shareKey, 'share');

  const tiles = data.map((datum, index) => ({
    index,
    datum,
    label: formatValue(read(labelKey, datum, index), locale, undefined),
    share: finite(read(shareKey, datum, index)),
    cols: wholeCount(datum.cols),
    rows: wholeCount(datum.rows),
    tone: finite(datum.tone),
  }));
  const shareText = (share: number | undefined) => (share === undefined ? '—' : `${formatNumber(share, locale, numberFormat)}%`);

  const base = modelBase(CHART, props, context, 'Treemap', {
    columns: [accessorName(labelKey, 'label'), shareName],
    rows: tiles.map((t) => [t.label, shareText(t.share)]),
  });

  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = inset(card.area, PLOT_INSET);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const hitAreas: HitArea[] = [];

  const taken = Array.from({ length: gridRows }, () => Array<boolean>(gridColumns).fill(false));
  const cellWidth = plot.width / gridColumns;
  const cellHeight = plot.height / gridRows;

  for (const tile of tiles) {
    if (tile.cols === undefined || tile.rows === undefined) {
      warnValue(CHART, 'cols', `Tile ${tile.index} needs whole, positive cols and rows; it is omitted.`);
      continue;
    }
    const spot = place(taken, tile.cols, tile.rows);
    if (!spot) {
      warnValue(CHART, 'cols', `Tile ${tile.index} (${tile.cols} × ${tile.rows}) no longer fits the ${gridColumns} × ${gridRows} grid; it is omitted.`);
      continue;
    }
    // The pointer answers anywhere in the tile's block; the drawn tile leaves a gap around it.
    const box = { x: plot.x + spot.column * cellWidth, y: plot.y + spot.row * cellHeight, width: tile.cols * cellWidth, height: tile.rows * cellHeight };
    const drawn = inset(box, TILE_GAP / 2);
    // Without a tone of its own a tile repeats its share, which it also prints.
    const tone = tile.tone === undefined ? toneOf((tile.share ?? 0) / 100) : toneLevel(tile.tone);
    strokes.push({ d: rectPath(drawn), role: 'encoding', part: 'ink', ...(tone > 0 ? { tone } : {}) });
    const x = drawn.x + TEXT_INSET;
    labels.push({ x, y: drawn.y + LINE, text: tile.label, kind: 'tick', part: 'text', anchor: 'start' });
    labels.push({ x, y: drawn.y + 2 * LINE, text: shareText(tile.share), kind: 'tick', part: 'axis', anchor: 'start' });
    // A consumer tone is information of its own, so it is printed as well as hatched (REQ-124).
    if (tile.tone !== undefined) labels.push({ x, y: drawn.y + 3 * LINE, text: `tone ${tone}`, kind: 'tick', part: 'axis', anchor: 'start' });
    hitAreas.push({ seriesKey: shareName, index: tile.index, datum: tile.datum, value: tile.share ?? 0, x: box.x + box.width / 2, y: box.y + box.height / 2, box });
  }

  if (hitAreas.length === 0) {
    return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, tiles.length === 0);
  }

  const description =
    props.description ??
    `${base.name}. Treemap of ${hitAreas.length} tiles in a ${gridColumns} by ${gridRows} grid; ${tiles.map((t) => `${t.label} ${shareText(t.share)}`).join(', ')}.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `TreemapChart` recipe (REQ-085): tiles placed first-fit in a declared grid, each labelled with its share. */
export const treemapChart: ChartRecipe<TreemapChartProps> = Object.freeze({
  name: CHART,
  build: buildTreemapChart,
});
