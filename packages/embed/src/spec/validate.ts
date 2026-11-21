/**
 * `validateSpec` (REQ-630, REQ-631, I-54): a value or JSON text → the spec, or the reason it cannot
 * render. The deck fence's rules, word for word (Data Model §2.32), with the embed's size ranges and
 * the 2 MB limit. Total: it never throws.
 */
import { PALETTE_NAMES } from '@silverpoint/core/palettes';
import { closest, didYouMean } from '../util/closest';
import { CHART_PROPS, COMMON_PROPS } from './charts.generated';
import { errorDiagnostic } from './codes';
import { HEIGHT, SPEC_BYTES, WIDTH } from './limits';
import type { ChartSpec, SpecResult } from './types';

/** The spec's fields, in the order of the agent catalog's fence schema (REQ-630). */
export const SPEC_KEYS = ['chart', 'data', 'props', 'width', 'height', 'id', 'ground', 'substrate', 'mode', 'palette'] as const;
/** Fields a spec must not repeat inside `props`. */
export const SPEC_OWN = ['data', 'width', 'height', 'id', 'ground', 'substrate', 'mode', 'palette'] as const;
/** Characters the core keeps intact in IDREFs and `url(#…)` (grounds `SAFE_ID`). */
export const SPEC_ID = /^[A-Za-z0-9_.:-]+$/;
const MODES = ['ink', 'precision'] as const;

const own = (o: object, key: string): boolean => Object.prototype.hasOwnProperty.call(o, key);
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const fail = (error: Extract<SpecResult<ChartSpec>, { ok: false }>['error']): SpecResult<ChartSpec> => ({ ok: false, error, diagnostics: [] });
const shape = (message: string): SpecResult<ChartSpec> => fail({ kind: 'shape', message });

/** Ranges are a parameter so the deck can share this function after D11 (analyze A-03). */
export interface Ranges {
  readonly width: { readonly min: number; readonly max: number };
  readonly height: { readonly min: number; readonly max: number };
}

export function validateSpec(input: unknown, ranges: Ranges = { width: WIDTH, height: HEIGHT }): SpecResult<ChartSpec> {
  let value: unknown = input;
  let size: number;
  if (typeof input === 'string') {
    size = input.length;
    if (size > SPEC_BYTES) return limit(size);
    try {
      value = JSON.parse(input);
    } catch (e) {
      return fail({ kind: 'json', message: `The spec is not JSON: ${(e as Error).message}` });
    }
  } else {
    try {
      size = JSON.stringify(input)?.length ?? 0;
    } catch (e) {
      return fail({ kind: 'json', message: `The spec cannot be written as JSON: ${(e as Error).message}` });
    }
    if (size > SPEC_BYTES) return limit(size);
  }
  if (!isObject(value)) return shape('The spec must be one JSON object.');
  // A field set to `undefined` is absent, as JSON would write it.
  value = Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined));
  if (!isObject(value)) return shape('The spec must be one JSON object.');
  for (const key of Object.keys(value)) {
    if (!(SPEC_KEYS as readonly string[]).includes(key)) return shape(`\`${key}\` is not a field of a spec; use ${SPEC_KEYS.map((k) => `\`${k}\``).join(', ')}.`);
  }
  const v = value;
  if (typeof v.chart !== 'string') return shape('`chart` must name a chart, such as "bar-chart".');
  if (own(v, 'props') && !isObject(v.props)) return shape('`props` must be an object.');
  for (const key of ['width', 'height'] as const) {
    if (own(v, key) && (typeof v[key] !== 'number' || !Number.isFinite(v[key]))) return shape(`\`${key}\` must be a number.`);
  }
  if (own(v, 'id') && (typeof v.id !== 'string' || !SPEC_ID.test(v.id))) return shape("`id` must use letters, digits, '_', '.', ':' or '-'.");
  for (const key of ['ground', 'substrate'] as const) {
    if (own(v, key) && typeof v[key] !== 'string') return shape(`\`${key}\` must be a name.`);
  }
  if (own(v, 'mode') && !MODES.includes(v.mode as never)) return shape(`\`mode\` must be ${MODES.map((m) => `"${m}"`).join(' or ')}.`);
  if (own(v, 'palette') && typeof v.palette !== 'string' && !isObject(v.palette)) return shape('`palette` must be a preset name or a palette object.');
  if (typeof v.palette === 'string' && !(PALETTE_NAMES as readonly string[]).includes(v.palette)) return shape(`\`palette\` "${v.palette}" is not a preset.${didYouMean(v.palette, PALETTE_NAMES)}`);

  const props = (v.props ?? {}) as Record<string, unknown>;
  for (const key of SPEC_OWN) if (own(props, key)) return shape(`Give \`${key}\` as a field of the spec, not in \`props\`.`);

  const declared = own(CHART_PROPS, v.chart) ? CHART_PROPS[v.chart] : undefined;
  if (!declared) return fail({ kind: 'chart', chart: v.chart, suggestions: closest(v.chart, Object.keys(CHART_PROPS)) });
  const undeclared = Object.keys(props).filter((k) => !declared.includes(k) && !COMMON_PROPS.includes(k));
  if (undeclared.length > 0) return fail({ kind: 'prop', props: undeclared });

  const width = v.width as number | undefined;
  const height = v.height as number | undefined;
  const badWidth = width !== undefined && (width < ranges.width.min || width > ranges.width.max);
  const badHeight = height !== undefined && (height < ranges.height.min || height > ranges.height.max);
  if (badWidth || badHeight) return fail({ kind: 'size', ...(badWidth ? { width } : {}), ...(badHeight ? { height } : {}) });

  return { ok: true, value: v as unknown as ChartSpec, diagnostics: [] };
}

function limit(size: number): SpecResult<ChartSpec> {
  const message = `The spec is ${size} characters serialised; the limit is ${SPEC_BYTES}.`;
  return { ok: false, error: { kind: 'limit', message }, diagnostics: [errorDiagnostic('SP030', 'spec', 'data', message)] };
}

/** The sentence for an error, naming the closest valid names (REQ-591's wording, REQ-668). */
export function specErrorMessage(error: Extract<SpecResult<ChartSpec>, { ok: false }>['error'], chart?: string): string {
  switch (error.kind) {
    case 'json':
    case 'shape':
    case 'limit':
    case 'diagnostic':
      return error.message;
    case 'chart':
      return `unknown chart "${error.chart}".${didYouMean(error.chart, Object.keys(CHART_PROPS))}`;
    case 'prop': {
      const names = [...(CHART_PROPS[chart ?? ''] ?? []), ...COMMON_PROPS];
      const near = error.props.map((p) => closest(p, names)[0]).filter((n): n is string => n !== undefined);
      const hint = near.length === 0 ? '' : ` Did you mean ${near.map((n) => `"${n}"`).join(' or ')}?`;
      return `${chart ?? 'the chart'} does not declare ${error.props.map((p) => `"${p}"`).join(', ')}.${hint}`;
    }
    case 'size': {
      const parts = [
        ...(error.width === undefined ? [] : [`width ${error.width} is outside ${WIDTH.min}..${WIDTH.max}`]),
        ...(error.height === undefined ? [] : [`height ${error.height} is outside ${HEIGHT.min}..${HEIGHT.max}`]),
      ];
      return `${parts.join('; ')}.`;
    }
    case 'role':
      return [
        ...(error.missing.length === 0 ? [] : [`no column for the required role${error.missing.length > 1 ? 's' : ''} ${error.missing.map((r) => `"${r}"`).join(', ')}`]),
        ...(error.unknownColumns.length === 0 ? [] : [`the table has no column ${error.unknownColumns.map((c) => `"${c}"`).join(', ')}`]),
      ].join('; ') + '.';
  }
}
