/** Two versions on the same release line (major.minor): a patch changes no surface the wrapper names (REQ-556, delta-015). */
export const sameLine = (a: string, b: string): boolean => a.split('.').slice(0, 2).join('.') === b.split('.').slice(0, 2).join('.');

/**
 * The library is exactly one release line ahead of the one the wrapper wraps, in the same major
 * (REQ-556 as amended by delta-017): the wrapper is built on the published library, so it can only
 * follow a new line, never precede it.
 */
export const followsLine = (wraps: string, version: string): boolean => {
  const [wMajor, wMinor] = wraps.split('.').map(Number);
  const [vMajor, vMinor] = version.split('.').map(Number);
  return wMajor === vMajor && vMinor === (wMinor ?? Number.NaN) + 1;
};
