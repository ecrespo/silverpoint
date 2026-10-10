import type { ChartModel, ChartRecipe, HitArea, Rect, RecipeContext, SquarifiedTreemapProps, Stroke, TextLabel, ToneLevel } from '../../types';
import { cardLayout } from '../shared/card';
import { TICK_CHAR } from '../shared/cartesian';
import { inset, rectPath, ringTone, warnValue } from '../shared/cells';
import { fitText, formatNumber } from '../shared/format';
import { squarify, type TreeNode } from '../shared/hierarchy';
import { nodeHitAreas, readTree, treeSummary } from '../shared/nodes';
import { emptyModel, measure, modelBase, readyModel } from '../shared/shell';
import { SQUARIFIED_TREEMAP_DEMO, SQUARIFIED_TREEMAP_DEMO_KEYS } from './demo';

const CHART = 'SquarifiedTreemap';
/** A label's line: its baseline below the line's top, and the line's height. */
const BASELINE = 10;
const LINE = 13;
/** A tile narrower or shorter than this carries no label; the table and the readout name it. */
const LABEL_WIDTH = 28;

const PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0 };

function buildSquarifiedTreemap(props: SquarifiedTreemapProps, context: RecipeContext): ChartModel {
  const usesDemo = props.data === undefined;
  const data = props.data ?? SQUARIFIED_TREEMAP_DEMO;
  const k = SQUARIFIED_TREEMAP_DEMO_KEYS;
  const keys = usesDemo
    ? { id: k.idKey, parent: k.parentKey, label: k.labelKey, value: k.valueKey }
    : { id: props.idKey ?? 'id', parent: props.parentKey ?? 'parent', value: props.valueKey ?? 'value', ...(props.labelKey === undefined ? {} : { label: props.labelKey }) };
  const { locale } = context;
  const numberFormat = props.numberFormat;

  // Largest first, ties by id: squarify's order, and one no shuffle of the rows can change (I-23).
  const read = readTree(CHART, data, keys, props, context, 'value');
  const base = modelBase(CHART, props, context, 'Treemap', read.table);
  const size = measure(base, props, context);
  if ('deferred' in size) return size.deferred;
  const card = cardLayout(props, { width: size.width, areaHeight: size.height, chrome: props.chrome ?? 'card', locale });
  const plot = inset(card.area, 2);
  const strokes: Stroke[] = [...card.strokes];
  const labels: TextLabel[] = [...card.labels];
  const root = read.root;

  if (root && root.value <= 0) warnValue(CHART, read.valueName, 'Every leaf is zero; a treemap has nothing to divide.');
  if (!root || root.value <= 0) return emptyModel(base, props, context, { viewBox: card.viewBox, plot, strokes, labels }, data.length === 0);

  // Every drawn node's rectangle: the root is the plot, children squarified inside their parent.
  const rects = new Map<TreeNode, Rect>([[root, plot]]);
  const drawn: TreeNode[] = [root];
  const lay = (node: TreeNode) => {
    if (node.depth >= read.depth) return;
    const children = node.children.filter((c) => c.value > 0);
    const tiles = squarify(children.map((c) => c.value), rects.get(node) as Rect);
    children.forEach((child, i) => {
      rects.set(child, tiles[i] as Rect);
      drawn.push(child);
      lay(child);
    });
  };
  lay(root);
  drawn.sort((a, b) => a.order - b.order);

  // Tone by the first level below the root, the ring's rule (DD-032, REQ-440): leaves inherit it.
  const first = root.children.filter((c) => c.value > 0);
  const toneOf = new Map<TreeNode, ToneLevel>();
  const tone = (node: TreeNode): ToneLevel => {
    const known = toneOf.get(node);
    if (known) return known;
    const own = node.depth <= 1 ? ringTone(Math.max(first.indexOf(node), 0), first.length) : tone(node.parent as TreeNode);
    toneOf.set(node, own);
    return own;
  };
  // A root drawn alone (a leaf as `rootId`) is its own tile.
  const isTile = (node: TreeNode) => (node !== root || drawn.length === 1) && (node.depth === read.depth || node.children.every((c) => c.value <= 0));

  const share = (node: TreeNode) => formatNumber(node.value / root.value, locale, PERCENT);
  /** Where a first-level frame's name sits, so a leaf label below it does not cover it. */
  const headers: Rect[] = [];
  for (const node of drawn) {
    if (node === root && !isTile(node)) continue;
    const r = rects.get(node) as Rect;
    if (isTile(node)) {
      strokes.push({ d: rectPath(r), role: 'encoding', part: 'ink', tone: tone(node) });
    } else {
      // An internal node: its frame, heavier for the first level, over its tiles.
      strokes.push({ d: rectPath(r), role: 'encoding', part: 'ink', paint: 'stroke', ...(node.depth === 1 ? { weight: 2 } : {}) });
    }
    if (node.depth === 1 && r.width >= LABEL_WIDTH && r.height >= LINE) {
      labels.push({ x: r.x + 3, y: r.y + BASELINE, text: fitText(`${node.label} ${share(node)}`, r.width - 6), kind: 'tick', part: 'text', anchor: 'start' });
      headers.push({ x: r.x, y: r.y, width: r.width, height: LINE });
    }
  }
  // Leaf names, where the tile holds them: below a first-level name when they would meet it.
  for (const node of drawn) {
    if (node.depth < 2 || !isTile(node)) continue;
    const r = rects.get(node) as Rect;
    const covered = headers.some((h) => r.x < h.x + h.width && h.x < r.x + r.width && r.y < h.y + h.height);
    const top = covered ? r.y + LINE : r.y;
    if (r.width < LABEL_WIDTH || r.y + r.height - top < LINE || node.label.length * TICK_CHAR > r.width * 3) continue;
    labels.push({ x: r.x + 3, y: top + BASELINE, text: fitText(node.label, r.width - 6), kind: 'tick', part: 'text', anchor: 'start' });
  }

  const hitAreas: HitArea[] = nodeHitAreas(
    read,
    drawn.map((node) => {
      const r = rects.get(node) as Rect;
      return { node, x: r.x + r.width / 2, y: r.y + r.height / 2, box: r };
    }),
  );

  // One heightened element (REQ-442): the largest tile, the tile itself.
  const tiles = drawn.filter(isTile);
  const largest = tiles.reduce((a, b) => (b.value > a.value ? b : a));
  strokes.push({ d: rectPath(rects.get(largest) as Rect), role: 'encoding', part: 'heighten', paint: 'fill' });

  const description =
    props.description ??
    `${base.name}. Squarified treemap of ${treeSummary(read, locale, numberFormat)}; each tile's area is its value. The largest tile is ${largest.path.join(' › ')}, ${share(largest)} of the whole.`;
  return readyModel(base, description, { viewBox: card.viewBox, plot, strokes, labels, hitAreas });
}

/** `SquarifiedTreemap` recipe (REQ-416): a hierarchy laid out by the squarified algorithm, frames per level. */
export const squarifiedTreemap: ChartRecipe<SquarifiedTreemapProps> = /* @__PURE__ */ Object.freeze({ name: CHART, build: buildSquarifiedTreemap });
