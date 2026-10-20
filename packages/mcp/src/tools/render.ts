/**
 * `render_chart` (API delta §3, REQ-543, DD-047): the canonical pipeline — `renderChart` then
 * `toSVGString`, as the canonical render calls them — with the ground's stylesheet on the root
 * `<svg>`, so the drawing keeps its colours outside a page. Nothing else in the markup changes.
 */
import { pathBytes, PATH_BYTE_BUDGET } from '@silverpoint/core';
import { PALETTES } from '@silverpoint/core/palettes';
import { renderChart as render, toSVGString } from '@silverpoint/grounds';
import { EB_GARAMOND_400, GROUND_CSS } from '../assets.generated';
import type { Catalog } from '../catalog';
import { capturing, type ReportedDiagnostic } from '../diagnostics';
import { ToolError, unknownName } from '../errors';
import { checkPayload, checkSize } from '../limits';
import { recipeOf } from '../recipes';

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
const FONT_FACE = `@font-face{font-family:'EB Garamond';font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,${EB_GARAMOND_400}) format('woff2')}`;

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
  const palette = typeof input.palette === 'string' ? PALETTES[catalog.palette(input.palette)] : input.palette;
  const props = {
    ...input.props,
    ...(input.data === undefined ? {} : { data: input.data }),
    id,
    width: input.width ?? DEFAULT_WIDTH,
    ...(input.height === undefined ? {} : { height: input.height }),
    ...(input.ground === undefined ? {} : { ground: catalog.ground(input.ground) }),
    ...(input.substrate === undefined ? {} : { substrate: catalog.substrate(input.ground ?? 'silverpoint', input.substrate) }),
    ...(input.mode === undefined ? {} : { mode: catalog.oneOf('mode', input.mode, ['ink', 'precision'] as const) }),
    ...(palette === undefined ? {} : { palette }),
  };

  let captured;
  try {
    captured = capturing(catalog, () => render(recipeOf(chart), props as never, { id }));
  } catch (error) {
    throw new ToolError('render_failed', `${chart.slug} could not be rendered: ${(error as Error).message}`);
  }
  const { value: rendered, diagnostics, failed } = captured;
  if (failed || !rendered) throw new ToolError('render_failed', diagnostics.filter((d) => d.severity === 'error').map((d) => d.message).join(' '));
  const bytes = pathBytes(rendered.geometry);
  if (bytes > PATH_BYTE_BUDGET) throw new ToolError('limit_exceeded', `${bytes} bytes of path data exceed the budget of ${PATH_BYTE_BUDGET}; use \`hatchFill: 'tile'\` or a smaller size.`);

  const markup = toSVGString(rendered);
  const open = markup.indexOf('>') + 1;
  const style = `<style>${input.embedFonts ? FONT_FACE : ''}${STANDALONE_STYLE}</style>`;
  const { width, height } = rendered.geometry.viewBox;
  return { svg: `${markup.slice(0, open)}${style}${markup.slice(open)}`, width, height, diagnostics };
}
