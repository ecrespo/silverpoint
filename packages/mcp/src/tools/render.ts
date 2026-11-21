/**
 * `render_chart` (API delta §3, REQ-543, DD-047; feature-007 REQ-660, DD-061): the server checks its
 * input against the agent catalog, then renders through `@silverpoint/embed`'s `renderToSVG` — the
 * canonical pipeline with the ground's stylesheet on the root `<svg>`. The bytes are the embed's;
 * the REQ-567 gate holds them to every fixture's canonical render.
 */
import { renderToSVG, type ChartSpec } from '@silverpoint/embed';
import { EB_GARAMOND_400, GROUND_CSS } from '../assets.generated';
import type { Catalog } from '../catalog';
import { asDevelopment, fromEmbed, type ReportedDiagnostic } from '../diagnostics';
import { ToolError, unknownName } from '../errors';
import { checkPayload, checkSize } from '../limits';

export interface RenderInput {
  readonly chart: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly data?: readonly Readonly<Record<string, unknown>>[];
  readonly width?: number;
  readonly height?: number;
  readonly id?: string;
  readonly ground?: string;
  readonly substrate?: string;
  readonly mode?: string;
  /** A preset name, or a palette's fields. */
  readonly palette?: string | Readonly<Record<string, string>>;
  readonly embedFonts?: boolean;
}

export interface Rendered {
  readonly svg: string;
  readonly width: number;
  readonly height: number;
  readonly diagnostics: ReportedDiagnostic[];
}

export const DEFAULT_WIDTH = 480;
/** The ground's rules, as every standalone render carries them. */
export const STANDALONE_STYLE = GROUND_CSS;
/** EB Garamond's regular face, inlined by `embedFonts` (`render_deck`; `render_chart`'s comes from the embed). */
export const FONT_FACE = `@font-face{font-family:'EB Garamond';font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,${EB_GARAMOND_400}) format('woff2')}`;

/** Characters the core keeps intact in IDREFs and `url(#…)` (grounds `SAFE_ID`). */
const SAFE_ID = /^[A-Za-z0-9_.:-]+$/;
const OWN_INPUTS = ['data', 'width', 'height', 'id', 'ground', 'substrate', 'mode', 'palette'];

export function renderChart(catalog: Catalog, input: RenderInput): Rendered {
  checkPayload(input);
  checkSize(input.width, input.height);
  const chart = catalog.chart(input.chart);
  const id = input.id ?? chart.slug;
  if (!SAFE_ID.test(id)) throw new ToolError('invalid_input', `\`id\` "${id}" holds characters an IDREF cannot; use letters, digits, '_', '.', ':' or '-'.`);
  const declared = [...chart.props, ...catalog.data.common.chart].map((p) => p.name);
  for (const key of Object.keys(input.props ?? {})) {
    if (OWN_INPUTS.includes(key)) throw new ToolError('invalid_input', `Give \`${key}\` as its own input, not in \`props\`.`);
    if (!declared.includes(key)) throw unknownName(`prop of ${chart.slug}`, key, declared);
  }
  const spec: ChartSpec = {
    chart: chart.slug,
    ...(input.props === undefined ? {} : { props: input.props }),
    ...(input.data === undefined ? {} : { data: input.data }),
    id,
    width: input.width ?? DEFAULT_WIDTH,
    ...(input.height === undefined ? {} : { height: input.height }),
    ...(input.ground === undefined ? {} : { ground: catalog.ground(input.ground) }),
    ...(input.substrate === undefined ? {} : { substrate: catalog.substrate(input.ground ?? 'silverpoint', input.substrate) }),
    ...(input.mode === undefined ? {} : { mode: catalog.oneOf('mode', input.mode, ['ink', 'precision'] as const) }),
    ...(input.palette === undefined ? {} : { palette: typeof input.palette === 'string' ? (catalog.palette(input.palette) as ChartSpec['palette']) : (input.palette as ChartSpec['palette']) }),
  };

  const result = asDevelopment(() => renderToSVG(spec, { embedFonts: input.embedFonts }));
  const diagnostics = result.diagnostics.filter((d) => d.code !== 'SP030').map((d) => fromEmbed(catalog, d));
  if (!result.ok) {
    if (result.error.kind === 'limit') throw new ToolError('limit_exceeded', `${result.error.message} Use \`hatchFill: 'tile'\` or a smaller size.`);
    if (result.error.kind === 'diagnostic') {
      throw new ToolError('render_failed', diagnostics.filter((d) => d.severity === 'error').map((d) => d.message).join(' ') || result.error.message);
    }
    throw new ToolError('invalid_input', `${chart.slug}: ${JSON.stringify(result.error)}`);
  }
  return { ...result.value, diagnostics };
}
