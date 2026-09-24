import type { DataTable } from '@silverpoint/core';
import type { RenderedChart } from '@silverpoint/grounds';
import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { ChartSvg } from './chart-svg';

function Table({ table, id, visibility }: { readonly table: DataTable; readonly id: string; readonly visibility: string }) {
  return (
    <table className="sp-table" id={id} data-visibility={visibility}>
      <caption>{table.caption}</caption>
      <thead>
        <tr>
          {table.columns.map((column, index) => (
            <th key={index} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, column) =>
              column === 0 ? (
                <th key={column} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={column}>{cell}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export interface ChartFrameProps {
  readonly rendered: RenderedChart;
  readonly className?: string;
  /** Interaction handlers and focus attributes, supplied by the client component only. */
  readonly rootProps?: HTMLAttributes<HTMLDivElement>;
  readonly rootRef?: Ref<HTMLDivElement>;
  /** Readout and marker, drawn over the chart by the client component. */
  readonly overlay?: ReactNode;
}

/** The chart's DOM: root, SVG, overlay and tabular alternative (API Spec §10). */
export function ChartFrame({ rendered, className, rootProps, rootRef, overlay }: ChartFrameProps) {
  const classes = ['sp-root', `sp-ground-${rendered.ground}`, className].filter(Boolean).join(' ');
  return (
    <div
      className={classes}
      data-substrate={rendered.substrate}
      data-chrome={rendered.chrome}
      data-status={rendered.status}
      ref={rootRef}
      {...rootProps}
    >
      <ChartSvg view={rendered.view} />
      {overlay}
      {rendered.dataTable !== 'none' && (
        <Table table={rendered.table} id={rendered.ids.table} visibility={rendered.dataTable} />
      )}
    </div>
  );
}
