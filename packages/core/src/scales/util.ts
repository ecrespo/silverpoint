/**
 * `extent`, `min` and `max` are owned here instead of imported from `d3-array`, which is
 * not in the allowlist (TD §5.3).
 */

export function min(values: readonly number[]): number | undefined {
  let result: number | undefined;
  for (const value of values) {
    if (Number.isFinite(value) && (result === undefined || value < result)) result = value;
  }
  return result;
}

export function max(values: readonly number[]): number | undefined {
  let result: number | undefined;
  for (const value of values) {
    if (Number.isFinite(value) && (result === undefined || value > result)) result = value;
  }
  return result;
}

export function extent(values: readonly number[]): [number, number] | undefined {
  const low = min(values);
  const high = max(values);
  return low === undefined || high === undefined ? undefined : [low, high];
}
