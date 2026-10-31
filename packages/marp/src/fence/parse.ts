/**
 * The body of a `silverpoint` fence → its spec or the reason it cannot render (Data Model §2.32,
 * REQ-589, REQ-591). Pure and total: it never throws. The `diagnostic` kind is raised at render.
 */
import type { ChartFenceSpec, FenceError } from '../types';
import { PALETTE_NAMES } from '@silverpoint/core/palettes';
import { MODES } from '../engine/directives';
import { closest, didYouMean } from '../util/closest';
import { CHART_PROPS, COMMON_PROPS } from './charts.generated';
import { CHART_SLUGS } from './recipes';

export type FenceParse = { readonly spec: ChartFenceSpec; readonly error?: undefined } | { readonly spec?: undefined; readonly error: FenceError };

/** The fence's fields, in the order the agent catalog's schema lists them (REQ-619). */
export const FENCE_KEYS = ['chart', 'data', 'props', 'width', 'height', 'id', 'ground', 'substrate', 'mode', 'palette'] as const;
/** Fence fields a body must not repeat inside `props` (they would override the slide's). */
export const FENCE_OWN = ['data', 'width', 'height', 'id', 'ground', 'substrate', 'mode', 'palette'] as const;
/** Characters the core keeps intact in IDREFs and `url(#…)` (grounds `SAFE_ID`). */
export const FENCE_ID = /^[A-Za-z0-9_.:-]+$/;
export const WIDTH = { min: 160, max: 1280 } as const;
export const HEIGHT = { min: 90, max: 720 } as const;

const own = (o: object, key: string): boolean => Object.prototype.hasOwnProperty.call(o, key);
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const shape = (message: string): FenceParse => ({ error: { kind: 'shape', message } });

export function parseChartFence(body: string): FenceParse {
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch (e) {
    return { error: { kind: 'json', message: `The fence is not JSON: ${(e as Error).message}` } };
  }
  if (!isObject(value)) return shape('The fence must hold one JSON object.');
  for (const key of Object.keys(value)) {
    if (!(FENCE_KEYS as readonly string[]).includes(key)) return shape(`\`${key}\` is not a field of the fence; use ${FENCE_KEYS.map((k) => `\`${k}\``).join(', ')}.`);
  }
  const v = value;
  if (typeof v.chart !== 'string') return shape('`chart` must name a chart, such as "bar-chart".');
  if (own(v, 'props') && !isObject(v.props)) return shape('`props` must be an object.');
  for (const key of ['width', 'height'] as const) {
    if (own(v, key) && (typeof v[key] !== 'number' || !Number.isFinite(v[key]))) return shape(`\`${key}\` must be a number.`);
  }
  if (own(v, 'id') && (typeof v.id !== 'string' || !FENCE_ID.test(v.id))) return shape("`id` must use letters, digits, '_', '.', ':' or '-'.");
  for (const key of ['ground', 'substrate'] as const) {
    if (own(v, key) && typeof v[key] !== 'string') return shape(`\`${key}\` must be a name.`);
  }
  if (own(v, 'mode') && !MODES.includes(v.mode as never)) return shape(`\`mode\` must be ${MODES.map((m) => `"${m}"`).join(' or ')}.`);
  if (own(v, 'palette') && typeof v.palette !== 'string' && !isObject(v.palette)) return shape('`palette` must be a preset name or a palette object.');
  if (typeof v.palette === 'string' && !PALETTE_NAMES.includes(v.palette)) return shape(`\`palette\` "${v.palette}" is not a preset.${didYouMean(v.palette, PALETTE_NAMES)}`);

  const props = (v.props ?? {}) as Record<string, unknown>;
  for (const key of FENCE_OWN) if (own(props, key)) return shape(`Give \`${key}\` as a field of the fence, not in \`props\`.`);

  const declared = CHART_PROPS[v.chart];
  if (!own(CHART_PROPS, v.chart) || !declared) return { error: { kind: 'chart', chart: v.chart, suggestions: closest(v.chart, CHART_SLUGS) } };
  const undeclared = Object.keys(props).filter((k) => !declared.includes(k) && !COMMON_PROPS.includes(k));
  if (undeclared.length > 0) return { error: { kind: 'prop', props: undeclared } };

  const width = v.width as number | undefined;
  const height = v.height as number | undefined;
  const badWidth = width !== undefined && (width < WIDTH.min || width > WIDTH.max);
  const badHeight = height !== undefined && (height < HEIGHT.min || height > HEIGHT.max);
  if (badWidth || badHeight) return { error: { kind: 'size', ...(badWidth ? { width } : {}), ...(badHeight ? { height } : {}) } };

  return { spec: v as unknown as ChartFenceSpec };
}
