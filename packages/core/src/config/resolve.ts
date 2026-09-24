import type { CommonChartProps, GroundRef, InkMode, ProviderConfig, SubstrateName } from '../types';

export interface ResolvedConfig {
  readonly ground: GroundRef;
  readonly substrate: SubstrateName;
  readonly mode: InkMode;
  readonly chrome: 'card' | 'bare';
  readonly hatchFill: 'tile' | 'per-shape';
  readonly height: number;
  readonly dataTable: 'visible' | 'hidden' | 'none';
  readonly locale: string;
}

/** Default values, part of the contract (API Spec §5.1). */
export const DEFAULTS = Object.freeze({
  ground: 'silverpoint',
  substrate: 'cream',
  mode: 'ink',
  chrome: 'card',
  hatchFill: 'tile',
  height: 160,
  dataTable: 'hidden',
  locale: 'en',
} as const);

/**
 * Resolves `ground`, `substrate` and `mode` with the precedence of API Spec §5.1: chart prop,
 * then provider, then library default — except that a media query forcing precision wins
 * over everything, because it is an accessibility requirement (REQ-123).
 */
export function resolveConfig(
  props: CommonChartProps,
  provider: ProviderConfig = {},
  environment: { readonly forcedPrecision?: boolean; readonly locale?: string } = {},
): ResolvedConfig {
  const mode: InkMode = environment.forcedPrecision
    ? 'precision'
    : (props.mode ?? provider.mode ?? DEFAULTS.mode);
  return {
    ground: props.ground ?? provider.ground ?? DEFAULTS.ground,
    substrate: props.substrate ?? provider.substrate ?? DEFAULTS.substrate,
    mode,
    chrome: props.chrome ?? DEFAULTS.chrome,
    hatchFill: props.hatchFill ?? DEFAULTS.hatchFill,
    height: props.height ?? DEFAULTS.height,
    dataTable: props.dataTable ?? DEFAULTS.dataTable,
    locale: props.locale ?? provider.locale ?? environment.locale ?? DEFAULTS.locale,
  };
}

/** Media query under which the environment forces `precision` mode (REQ-123). */
export const FORCED_PRECISION_QUERY = '(prefers-contrast: more), (forced-colors: active)';

/**
 * Builds a deterministic instance id from the chart name and a token the adapter owns, such
 * as React's `useId()` or Angular's creation order. The result is safe inside `id` and `url()`.
 */
export function instanceId(chart: string, token: string | number): string {
  const slug = chart.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const safe = String(token).replace(/[^A-Za-z0-9_-]/g, '');
  return `sp-${slug}-${safe}`;
}
