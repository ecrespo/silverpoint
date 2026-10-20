/**
 * The payload limits of API delta §8 (REQ-560), checked before any work.
 */
import { ToolError } from './errors';

export const LIMITS = {
  body: 256 * 1024,
  rows: 5_000,
  string: 1_000,
  depth: 32,
  width: [320, 1600],
  height: [120, 1200],
} as const;

/** Every string, every `data` array and the whole input, against the limits. */
export function checkPayload(input: unknown): void {
  const bytes = JSON.stringify(input ?? null).length;
  if (bytes > LIMITS.body) throw new ToolError('limit_exceeded', `The input is ${bytes} bytes; the limit is ${LIMITS.body}.`);
  const walk = (value: unknown, path: string, depth: number): void => {
    if (depth > LIMITS.depth) throw new ToolError('invalid_input', `\`${path}\` nests deeper than ${LIMITS.depth} levels.`);
    if (typeof value === 'string') {
      if (value.length > LIMITS.string) throw new ToolError('limit_exceeded', `\`${path}\` is ${value.length} characters; the limit is ${LIMITS.string}.`);
      return;
    }
    if (Array.isArray(value)) {
      if (path.endsWith('data') && value.length > LIMITS.rows) throw new ToolError('limit_exceeded', `\`${path}\` holds ${value.length} rows; the limit is ${LIMITS.rows}.`);
      value.forEach((item, i) => walk(item, `${path}[${i}]`, depth + 1));
      return;
    }
    if (value !== null && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) walk(item, path ? `${path}.${key}` : key, depth + 1);
    }
  };
  walk(input, '', 0);
}

/** A render's size, within API delta §8's bounds. */
export function checkSize(width: number | undefined, height: number | undefined): void {
  for (const [name, value, [min, max]] of [
    ['width', width, LIMITS.width],
    ['height', height, LIMITS.height],
  ] as const) {
    if (value !== undefined && !(Number.isFinite(value) && value >= min && value <= max)) {
      throw new ToolError('invalid_input', `\`${name}\` is ${value}; it must be between ${min} and ${max} px.`);
    }
  }
}
