import { DEFAULTS } from '../config/resolve';
import { diagnose } from '../diagnostics/diagnose';
import type { ChartRecipe, CommonChartProps, ProviderConfig } from '../types';
import { DASHBOARD_DEFAULTS } from './defaults';
import { cellChartBox, resolveDashboard, safeIdOf } from './resolve';
import type { DashboardCellContext, DashboardProps, DashboardView } from './types';

/**
 * A dashboard root's class, substrate and style for a configuration (REQ-212, REQ-462): the
 * dashboard's own over `under`, the provider an adapter reads, over the defaults (#17). `palette` is
 * that configuration's palette as declarations, written first; `layout` is the model's style.
 */
export function dashboardSection(
  config: Pick<DashboardProps, 'ground' | 'substrate' | 'className'>,
  palette: string,
  layout: Readonly<Record<string, string>>,
  under?: Pick<ProviderConfig, 'ground' | 'substrate'> | null,
): Pick<DashboardView['section'], 'className' | 'substrate' | 'style'> {
  const ground = config.ground ?? under?.ground ?? DEFAULTS.ground;
  return {
    className: ['sp-dashboard', `sp-ground-${typeof ground === 'string' ? ground : ground.name}`, config.className].filter(Boolean).join(' '),
    substrate: config.substrate ?? under?.substrate ?? DEFAULTS.substrate,
    style: { ...Object.fromEntries(palette.split(';').filter(Boolean).map((d) => d.split(':') as [string, string])), ...layout },
  };
}

/**
 * The dashboard as an adapter writes it (REQ-200, REQ-214): the section's class, substrate, name
 * and variables, the heading and description, and per cell its variables, its label and the
 * context its chart reads. `children` gives, in source order, each child's `cell` and its chart's
 * own `id` when the adapter can read it. `palette` is the section's own palette as declarations
 * (`paletteStyle`, from `@silverpoint/core/palettes`, off this entry's budget), written first in its
 * style; the cells hand the palette on to their charts and components (REQ-461, REQ-462). `under`
 * is the provider the adapter reads, which the root follows where the dashboard sets nothing (#17).
 */
export function dashboardView(
  props: DashboardProps,
  children: readonly { readonly cell?: string; readonly id?: string }[],
  palette = '',
  under?: Pick<ProviderConfig, 'ground' | 'substrate'> | null,
): DashboardView {
  const model = resolveDashboard(props, children.map((c) => c.cell));
  // React and Vue reject a nameless dashboard by type; Angular's signal inputs cannot (REQ-214).
  if (props.title === undefined && props.label === undefined && process.env.NODE_ENV !== 'production') {
    diagnose('SP002', 'Dashboard', { property: 'title', message: 'Name the region with `title` or `label`.' });
  }
  const base = safeIdOf(props.id);
  const titled = props.title !== undefined;
  const heading = titled ? { level: props.headingLevel ?? DASHBOARD_DEFAULTS.headingLevel, id: `${base}-title`, text: props.title } : undefined;
  const description = props.description !== undefined ? { id: `${base}-desc`, text: props.description } : undefined;
  const config: ProviderConfig = {};
  for (const key of ['ground', 'substrate', 'mode', 'locale', 'palette'] as const) {
    if (props[key] !== undefined) (config as Record<string, unknown>)[key] = props[key];
  }
  return {
    model,
    section: {
      ...dashboardSection(props, palette, model.style, under),
      ...(heading ? { labelledby: heading.id } : { label: props.label }),
      ...(description ? { describedby: description.id } : {}),
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
  // An own prop wins only when it has a value: Vue hands every declared prop, absent ones undefined.
  const merged: Record<string, unknown> = { ...(props as Record<string, unknown>) };
  for (const [key, value] of Object.entries(cell.config)) merged[key] ??= value;
  // A palette merges field by field, the chart's own fields over the dashboard's (REQ-462).
  if (props.palette && cell.config.palette) {
    const palette: Record<string, unknown> = { ...cell.config.palette };
    for (const [field, value] of Object.entries(props.palette)) if (value !== undefined) palette[field] = value;
    merged.palette = palette;
  }
  return {
    props: { ...merged, id: props.id ?? cell.chartId, height: props.height ?? box.height } as P,
    width: props.width ?? box.width,
  };
}
