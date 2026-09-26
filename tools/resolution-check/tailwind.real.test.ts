import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from 'vitest';

const dist = join(import.meta.dirname, '../../packages/tailwind/dist');

/** DD-020: Tailwind 3 configs `require` their presets; the published CommonJS build must be the preset itself. */
test('REQ-047 · the built preset loads as the preset itself, by require and by import', async () => {
  const required = createRequire(import.meta.url)(join(dist, 'index.cjs')) as { theme?: { extend?: Record<string, unknown> } };
  const imported = ((await import(pathToFileURL(join(dist, 'index.js')).href)) as { default: unknown }).default;
  expect(Object.keys(required)).toEqual(['theme']);
  expect(required).toEqual(imported);
  expect(Object.keys(required.theme?.extend ?? {})).toEqual(['colors', 'fontFamily', 'borderRadius']);
});
