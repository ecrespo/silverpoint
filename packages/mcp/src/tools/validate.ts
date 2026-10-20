/**
 * `validate_props` (API delta §3, REQ-542, DD-048): the chart built by the core with the props
 * given, every diagnostic it raises, and the props it does not declare. Valid means neither.
 */
import { renderChart } from '@silverpoint/grounds';
import type { Catalog } from '../catalog';
import { capturing, type ReportedDiagnostic } from '../diagnostics';
import { checkPayload, checkSize } from '../limits';
import { recipeOf } from '../recipes';
import { DEFAULT_WIDTH } from './render';

export interface ValidateInput {
  readonly chart: string;
  readonly props: Readonly<Record<string, unknown>>;
  readonly width?: number;
  readonly height?: number;
}

export interface Validation {
  readonly valid: boolean;
  readonly diagnostics: ReportedDiagnostic[];
  readonly unknownProps: string[];
}

export function validateProps(catalog: Catalog, input: ValidateInput): Validation {
  checkPayload(input);
  checkSize(input.width, input.height);
  const chart = catalog.chart(input.chart);
  const given = input.props ?? {};
  const declared = new Set([...chart.props, ...catalog.data.common.chart].map((p) => p.name));
  const unknownProps = Object.keys(given).filter((key) => !declared.has(key));
  const props = {
    ...given,
    // Without a width the core defers the render and reads no data: the width render_chart draws at.
    width: input.width ?? (typeof given.width === 'number' ? given.width : DEFAULT_WIDTH),
    ...(input.height === undefined ? {} : { height: input.height }),
  };
  const id = typeof given.id === 'string' ? given.id : chart.slug;
  const { diagnostics } = capturing(catalog, () => renderChart(recipeOf(chart), props as never, { id }));
  return { valid: diagnostics.length === 0 && unknownProps.length === 0, diagnostics, unknownProps };
}
