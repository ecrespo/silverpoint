/**
 * `validate_props` (API delta §3, REQ-542, DD-048): the chart built by the core with the props
 * given, every diagnostic it raises, and the props it does not declare. Valid means neither. The
 * chart is built through `@silverpoint/embed` (feature-007, DD-061), with the declared props only.
 */
import { renderSpec, type ChartSpec } from '@silverpoint/embed';
import type { Catalog } from '../catalog';
import { asDevelopment, fromEmbed, type ReportedDiagnostic } from '../diagnostics';
import { checkPayload, checkSize } from '../limits';
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

/** Fields a spec carries at its top level, not in `props`. */
const TOP = ['data', 'width', 'height', 'id', 'ground', 'substrate', 'mode', 'palette'] as const;

export function validateProps(catalog: Catalog, input: ValidateInput): Validation {
  checkPayload(input);
  checkSize(input.width, input.height);
  const chart = catalog.chart(input.chart);
  const given = input.props ?? {};
  const declared = new Set([...chart.props, ...catalog.data.common.chart].map((p) => p.name));
  const unknownProps = Object.keys(given).filter((key) => !declared.has(key));
  const top: Record<string, unknown> = {};
  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(given)) {
    if (!declared.has(key)) continue;
    if ((TOP as readonly string[]).includes(key)) top[key] = value;
    else props[key] = value;
  }
  // Without a width the core defers the render and reads no data: the width render_chart draws at.
  const width = input.width ?? (typeof given.width === 'number' ? given.width : DEFAULT_WIDTH);
  const spec = { ...top, chart: chart.slug, props, id: typeof given.id === 'string' ? given.id : chart.slug, width, ...(input.height === undefined ? {} : { height: input.height }) } as ChartSpec;
  const result = asDevelopment(() => renderSpec(spec));
  const diagnostics = result.ok || result.error.kind === 'diagnostic' || result.error.kind === 'limit'
    ? result.diagnostics.map((d) => fromEmbed(catalog, d))
    : [fromEmbed(catalog, { code: 'SP026', severity: 'error', message: JSON.stringify(result.error) })];
  return { valid: diagnostics.length === 0 && unknownProps.length === 0, diagnostics, unknownProps };
}
