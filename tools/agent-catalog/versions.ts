/** Two versions on the same release line (major.minor): a patch changes no surface the wrapper names (REQ-556, delta-015). */
export const sameLine = (a: string, b: string): boolean => a.split('.').slice(0, 2).join('.') === b.split('.').slice(0, 2).join('.');
