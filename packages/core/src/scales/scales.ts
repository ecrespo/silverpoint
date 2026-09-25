import { scaleBand, scaleLinear } from 'd3-scale';
import { diagnose } from '../diagnostics/diagnose';

export interface ScaleSite {
  /** Chart name, for diagnostics. */
  readonly chart: string;
  /** Property the domain comes from, for diagnostics. */
  readonly property: string;
}

/**
 * Expands a zero-length domain by the ground's `domainPadding` instead of dividing by zero
 * (REQ-010). A constant `v` becomes `[v - |v|·p, v + |v|·p]`, or `[-p, p]` around zero — `[0, 2p]`
 * on a zero-based axis, which never shows a value below zero that no datum has.
 */
export function expandDomain(
  domain: readonly [number, number],
  padding: number,
  site: ScaleSite,
  /** A zero-based axis (bars, areas): a flat zero domain grows upward only, never below zero. */
  fromZero = false,
): [number, number] {
  const [low, high] = domain;
  if (low !== high) return [low, high];
  const spread = low === 0 ? padding : Math.abs(low) * padding;
  if (fromZero && low === 0) {
    if (process.env.NODE_ENV !== 'production') {
      diagnose('SP004', site.chart, { property: site.property, message: `Domain [0, 0] became [0, ${2 * spread}].` });
    }
    return [0, 2 * spread];
  }
  if (process.env.NODE_ENV !== 'production') {
    diagnose('SP004', site.chart, {
      property: site.property,
      message: `Domain [${low}, ${high}] became [${low - spread}, ${high + spread}].`,
    });
  }
  return [low - spread, high + spread];
}

export interface LinearScale {
  (value: number): number;
  readonly domain: readonly [number, number];
  ticks(count: number): number[];
}

/** Linear scale over `d3-scale`, with degenerate-domain expansion. */
export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
  options: ScaleSite & { readonly padding: number; readonly nice?: boolean; readonly fromZero?: boolean },
): LinearScale {
  const expanded = expandDomain(domain, options.padding, options, options.fromZero);
  const scale = scaleLinear().domain(expanded).range(range);
  if (options.nice) scale.nice(4);
  const [low, high] = scale.domain() as [number, number];
  const result = ((value: number) => scale(value)) as LinearScale;
  Object.defineProperty(result, 'domain', { value: [low, high] as const });
  (result as { ticks: LinearScale['ticks'] }).ticks = (count) => scale.ticks(count);
  return result;
}

export interface BandScale {
  /** Start of the band, or `undefined` for a value outside the domain. */
  (value: string): number | undefined;
  readonly bandwidth: number;
  /** Centre of the band. */
  center(value: string): number | undefined;
}

/** Band scale over `d3-scale`. */
export function bandScale(
  domain: readonly string[],
  range: readonly [number, number],
  options: { readonly paddingInner?: number; readonly paddingOuter?: number } = {},
): BandScale {
  const scale = scaleBand<string>()
    .domain(domain)
    .range(range)
    .paddingInner(options.paddingInner ?? 0)
    .paddingOuter(options.paddingOuter ?? 0);
  const bandwidth = scale.bandwidth();
  const result = ((value: string) => scale(value)) as BandScale;
  Object.defineProperty(result, 'bandwidth', { value: bandwidth });
  (result as { center: BandScale['center'] }).center = (value) => {
    const start = scale(value);
    return start === undefined ? undefined : start + bandwidth / 2;
  };
  return result;
}
