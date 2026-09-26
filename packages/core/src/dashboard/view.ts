import { DEFAULTS } from '../config/resolve';
import type { ChartRecipe, CommonChartProps, ProviderConfig } from '../types';
import { DASHBOARD_DEFAULTS } from './defaults';
import { cellChartBox, resolveDashboard, safeIdOf } from './resolve';
import type { DashboardCellContext, DashboardProps, DashboardView } from './types';

/**
 * The dashboard as an adapter writes it (REQ-200, REQ-214): the section's class, substrate, name
 * and variables, the heading and description, and per cell its variables, its label and the
 * context its chart reads. `children` gives, in source order, each child's `cell` and its chart's
 * own `id` when the adapter can read it.
 */
export function dashboardView(props: DashboardProps, children: readonly { readonly cell?: string; readonly id?: string }[]): DashboardView {
  const model = resolveDashboard(props, children.map((c) => c.cell));
  const base = safeIdOf(props.id);
  const ground = props.ground ?? DEFAULTS.ground;
  const groundName = typeof ground === 'string' ? ground : ground.name;
  const titled = props.title !== undefined;
  const heading = titled ? { level: props.headingLevel ?? DASHBOARD_DEFAULTS.headingLevel, id: `${base}-title`, text: props.title } : undefined;
  const description = props.description !== undefined ? { id: `${base}-desc`, text: props.description } : undefined;
  const config: ProviderConfig = {};
  for (const key of ['ground', 'substrate', 'mode', 'locale'] as const) {
    if (props[key] !== undefined) (config as Record<string, unknown>)[key] = props[key];
  }
  return {
    model,
    section: {
      className: ['sp-dashboard', `sp-ground-${groundName}`, props.className].filter(Boolean).join(' '),
      substrate: props.substrate ?? DEFAULTS.substrate,
      ...(heading ? { labelledby: heading.id } : { label: props.label }),
      ...(description ? { describedby: description.id } : {}),
      style: model.style,
    },
    ...(heading ? { heading } : {}),
    ...(description ? { description } : {}),
    cells: model.cells.map((cell) => ({
      child: cell.child,
      labelledby: `${children[cell.child]?.id ?? cell.chartId}-title`,
      style: cell.style,
      context: { chartId: cell.chartId, box: cell.nominal, config },
    })),
  };
}

/**
 * A chart's props inside a cell (API Spec §7.1, size precedence; REQ-212 config precedence): its
 * own `id`, `height` and config win; the cell supplies the rest. `width` is the width to draw at
 * until the chart is measured — the chart's own, else the cell's nominal width (REQ-207).
 */
export function inCell<P extends CommonChartProps>(props: P, cell: DashboardCellContext | undefined, recipe: ChartRecipe<P>): { props: P; width: number | undefined } {
  if (!cell) return { props, width: props.width };
  const box = cellChartBox(cell.box, props, recipe);
  return {
    props: { ...cell.config, ...props, id: props.id ?? cell.chartId, height: props.height ?? box.height } as P,
    width: props.width ?? box.width,
  };
}
