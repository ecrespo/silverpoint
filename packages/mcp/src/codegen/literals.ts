/**
 * Values written into generated code: TypeScript literals for React, Vue and Angular, Python
 * literals for Reflex. Plain JSON values only; key order is the input's, so output is stable.
 */

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

export function js(value: unknown): string {
  if (value === null || value === undefined) return 'undefined';
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map(js).join(', ')}]`;
  const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return '{}';
  return `{ ${entries.map(([k, v]) => `${IDENTIFIER.test(k) ? k : js(k)}: ${js(v)}`).join(', ')} }`;
}

export function py(value: unknown): string {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'string' || typeof value === 'number') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(py).join(', ')}]`;
  const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}: ${py(v)}`).join(', ')}}`;
}

/** The TypeScript type of a bound value's initial literal; `null` is an unset string. */
export function tsType(value: unknown): string {
  if (value === null || value === undefined) return 'string | undefined';
  if (Array.isArray(value)) return 'string[]';
  return typeof value;
}

export function pyType(value: unknown): string {
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float';
  if (Array.isArray(value)) return 'list[str]';
  return 'str';
}

/** Text between tags, safe in JSX, Vue and Angular templates alike. */
export function text(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[{}]/g, (b) => (b === '{' ? '&#123;' : '&#125;'));
}

/** A string attribute's value between double quotes. */
export function attribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export const pascal = (slug: string) => slug.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());
export const snake = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
export const humanised = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
