import { cardLayout } from '../charts/shared/card';
import { diagnose } from '../diagnostics/diagnose';
import { round2 } from '../render/round';
import type { ChartRecipe, CommonChartProps } from '../types';
import { BREAKPOINTS, DASHBOARD, DASHBOARD_DEFAULTS, resolveLayout } from './defaults';
import type { DashboardBreakpoint, DashboardModel, DashboardProps, ResolvedCell, ResolvedLayout, ResolvedSpan } from './types';

/** Characters an id keeps intact in an IDREF list and inside `url(#…)` — the rule of `renderChart`. */
const UNSAFE = /[^A-Za-z0-9_.:-]+/g;
/** Container widths where `md` and `lg` begin (TD DD-014); fixed in the stylesheet too. */
const MD_FROM = 640;
const LG_FROM = 1024;
/** Drawing-area height of the probe build that measures a chart's card chrome. */
const PROBE = 100;

/** An id with every character unsafe in an IDREF or `url(#…)` replaced by `-`. */
export function safeIdOf(id: string): string {
  return id.replace(UNSAFE, '-');
}

function warn(code: 'SP002' | 'SP015', property: string, message: string): void {
  if (process.env.NODE_ENV !== 'production') diagnose(code, DASHBOARD, { property, message });
}

/** The breakpoint a container of `width` px falls in (DD-014). */
export function breakpointOf(width: number): DashboardBreakpoint {
  return width >= LG_FROM ? 'lg' : width >= MD_FROM ? 'md' : 'sm';
}

/** A cell's outer box at `width`, DD-015: whole columns and the gaps they span, 2 decimals (REQ-002). */
function nominalBox(layout: ResolvedLayout, span: ResolvedSpan, width: number): { width: number; height: number } {
  const bp = breakpointOf(width);
  const { col, row } = span[bp];
  const cols = layout.columns[bp];
  const { gap, rowHeight } = layout;
  return {
    width: round2(((width - gap * (cols - 1)) / cols) * col + gap * (col - 1)),
    height: round2(rowHeight * row + gap * (row - 1)),
  };
}

function cellStyle(span: ResolvedSpan): Record<string, string> {
  const style: Record<string, string> = {};
  for (const bp of BREAKPOINTS) style[`--sp-cell-col-${bp}`] = String(span[bp].col);
  for (const bp of BREAKPOINTS) style[`--sp-cell-row-${bp}`] = String(span[bp].row);
  return style;
}

/**
 * The dashboard's resolved model (REQ-201): children matched to layout cells by id in the four
 * rules of Data Model §2.13, spans held to the columns, chart ids derived from the dashboard's id
 * (REQ-209), nominal boxes at `ssrWidth` (REQ-206) and the custom properties the adapters write
 * (REQ-202). Pure but for diagnostics; never throws on a mismatch (REQ-205).
 */
export function resolveDashboard(props: DashboardProps, childCells: readonly (string | undefined)[]): DashboardModel {
  const layout = resolveLayout(props.layout);
  let ssrWidth: number = DASHBOARD_DEFAULTS.ssrWidth;
  if (props.ssrWidth !== undefined) {
    if (Number.isFinite(props.ssrWidth) && props.ssrWidth > 0) ssrWidth = props.ssrWidth;
    else warn('SP002', 'ssrWidth', `${String(props.ssrWidth)} is not a width above 0; ${ssrWidth} is used.`);
  }

  // The layout's cells by id; a repeated id is ignored after its first declaration.
  const declared = new Map<string, ResolvedSpan>();
  const order: string[] = [];
  for (const cell of layout.cells) {
    if (declared.has(cell.id)) {
      warn('SP015', 'layout.cells', `Layout cell "${cell.id}" is declared twice; the later declaration is ignored.`);
      continue;
    }
    declared.set(cell.id, cell.span);
    order.push(cell.id);
  }

  // Rules 1 and 3: each child takes its cell once; the rest wait for source order.
  const holder = new Map<string, number>();
  const unplaced: number[] = [];
  childCells.forEach((cell, index) => {
    if (cell === undefined) {
      unplaced.push(index);
    } else if (!declared.has(cell)) {
      warn('SP015', 'cell', `Child ${index} names cell "${cell}", which the layout does not declare; it is placed in source order, span 1.`);
      unplaced.push(index);
    } else if (holder.has(cell)) {
      warn('SP015', 'cell', `Children ${holder.get(cell)} and ${index} both name cell "${cell}"; the later is placed in source order, span 1.`);
      unplaced.push(index);
    } else {
      holder.set(cell, index);
    }
  });

  // Rule 4: a layout cell with no child is dropped and leaves no hole.
  for (const id of order) {
    if (!holder.has(id)) warn('SP015', 'layout.cells', `Layout cell "${id}" has no child; it is dropped.`);
  }

  const single: ResolvedSpan = { sm: { col: 1, row: 1 }, md: { col: 1, row: 1 }, lg: { col: 1, row: 1 } };
  const base = safeIdOf(props.id);
  const taken = new Set<string>();
  const chartIdOf = (token: string): string => {
    const stem = `${base}--${token.replace(UNSAFE, '-')}`;
    let id = stem;
    for (let n = 2; taken.has(id); n += 1) id = `${stem}-${n}`;
    taken.add(id);
    return id;
  };
  const cellOf = (id: string, child: number, span: ResolvedSpan, token: string): ResolvedCell => ({
    id,
    child,
    chartId: chartIdOf(token),
    span,
    nominal: nominalBox(layout, span, ssrWidth),
    style: cellStyle(span),
  });

  // Rule 2: the reading order is the layout's, then the unplaced children in source order (I-11).
  const cells = [
    ...order.filter((id) => holder.has(id)).map((id) => cellOf(id, holder.get(id) as number, declared.get(id) as ResolvedSpan, id)),
    ...unplaced.map((index) => cellOf(String(index), index, single, String(index))),
  ];

  const style: Record<string, string> = {};
  for (const bp of BREAKPOINTS) style[`--sp-dashboard-columns-${bp}`] = String(layout.columns[bp]);
  style['--sp-dashboard-row-height'] = `${layout.rowHeight}px`;
  style['--sp-dashboard-layout-gap'] = `${layout.gap}px`;
  return { id: props.id, cells, style };
}

/**
 * The size a chart is drawn at inside a cell box (REQ-206): the cell's width, and its height less
 * the chart's own card chrome, so every card in a row has the same outer height (I-13). The chrome
 * is measured by building `recipe` at a probe height — the recipe may add rows of its own (KpiCard's
 * value line) — and read from `cardLayout` when no recipe is given. The chart's own `width` and
 * `height` take precedence (API Spec §7.1, size precedence).
 */
export function cellChartBox<P extends CommonChartProps>(cell: { width: number; height: number }, chartProps: P, recipe?: ChartRecipe<P>): { width: number; height: number } {
  const width = chartProps.width ?? cell.width;
  if (chartProps.height !== undefined) return { width, height: chartProps.height };
  let outer: number | undefined;
  if (recipe && width > 0) {
    const model = recipe.build({ ...chartProps, width, height: PROBE }, { id: 'sp-probe', width, locale: 'en', emptyState: { text: '', rule: false }, domainPadding: 0 });
    if (model.status !== 'deferred') outer = model.geometry.viewBox.height;
  }
  outer ??= cardLayout(chartProps, { width, areaHeight: PROBE, chrome: chartProps.chrome ?? 'card', locale: 'en' }).viewBox.height;
  return { width, height: Math.max(1, round2(cell.height - (outer - PROBE))) };
}
