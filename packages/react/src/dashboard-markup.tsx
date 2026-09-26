import { dashboardView, type DashboardCellContext, type DashboardProps } from '@silverpoint/core';
import { Children, cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';

export interface DashboardCellProps {
  /** The layout cell this child fills. Omitted: next in source order, span 1 (API Spec §7.1). */
  readonly cell?: string;
  /** The chart. A single element receives the cell's id, size and configuration. */
  readonly children?: ReactNode;
}

/**
 * Marks a child of `Dashboard` with its layout cell. Rendered on its own it is its children; inside
 * a dashboard, the dashboard reads its `cell` and emits it as an `article` (REQ-200).
 */
export function DashboardCell({ children }: DashboardCellProps) {
  return <>{children}</>;
}

/** The internal prop through which a cell hands its chart id, box and config (TD §3.3). */
export interface CellChartProps {
  readonly dashboardCell?: DashboardCellContext;
}

const asStyle = (vars: Readonly<Record<string, string>>) => vars as CSSProperties;

/**
 * The dashboard's DOM (API Spec §10), shared by the client and server entries. It computes
 * nothing: the core's `dashboardView` gives every attribute, and each cell's chart gets its
 * context as a prop, which crosses a Server Components boundary as plain data (Art. 2).
 */
export function DashboardMarkup({ children, wrapGrid, ...props }: DashboardProps & { readonly children?: ReactNode; readonly wrapGrid?: (grid: ReactNode) => ReactNode }) {
  const given = Children.toArray(children).map((child) => {
    const marked = isValidElement<DashboardCellProps>(child) && child.type === DashboardCell;
    const content = marked ? child.props.children : child;
    const chart = isValidElement<{ id?: string }>(content) ? content : undefined;
    return { cell: marked ? child.props.cell : undefined, id: chart?.props.id, content, chart };
  });
  const view = dashboardView(props, given.map(({ cell, id }) => ({ cell, id })));
  const Heading = view.heading ? (`h${view.heading.level}` as const) : undefined;
  const grid = (
    <div className="sp-dashboard-grid" part="dashboard-grid">
      {view.cells.map((cell) => {
        const { chart, content } = given[cell.child]!;
        return (
          <article key={cell.context.chartId} className="sp-dashboard-cell" part="dashboard-cell" aria-labelledby={cell.labelledby} style={asStyle(cell.style)}>
            {chart ? cloneElement(chart as ReactElement<CellChartProps>, { dashboardCell: cell.context }) : content}
          </article>
        );
      })}
    </div>
  );
  return (
    <section
      className={view.section.className}
      part="dashboard"
      data-substrate={view.section.substrate}
      aria-labelledby={view.section.labelledby}
      aria-describedby={view.section.describedby}
      aria-label={view.section.label}
      style={asStyle(view.section.style)}
    >
      {Heading && view.heading && (
        <Heading className="sp-dashboard-title" part="dashboard-title" id={view.heading.id}>
          {view.heading.text}
        </Heading>
      )}
      {view.description && (
        <p className="sp-dashboard-description" part="dashboard-description" id={view.description.id}>
          {view.description.text}
        </p>
      )}
      {wrapGrid ? wrapGrid(grid) : grid}
    </section>
  );
}
