/**
 * Which fixture matrix a gate run compares (Data Model §5, TD §8): the reduced PR matrix, or the
 * full nightly one when `SP_MATRIX=full`.
 */
export function matrixScope(env: Readonly<Record<string, string | undefined>> = process.env): 'pr' | 'full' {
  const scope = env.SP_MATRIX ?? 'pr';
  if (scope !== 'pr' && scope !== 'full') throw new Error(`SP_MATRIX must be "pr" or "full", not "${scope}".`);
  return scope;
}
