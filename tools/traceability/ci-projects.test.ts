import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file: string) => readFileSync(join(ROOT, file), 'utf8');

/** The vitest projects CI runs, across every `vitest run --project …` step of `ci.yml`. */
function ciProjects(): Set<string> {
  const runs = read('.github/workflows/ci.yml').match(/vitest run[^\n]*/g) ?? [];
  return new Set(runs.flatMap((run) => [...run.matchAll(/--project ([\w-]+)/g)].map((m) => m[1])));
}

test('REQ-183 · CI runs every vitest project, so no cited test goes unrun', () => {
  const declared = [...read('vitest.config.ts').matchAll(/name: '([\w-]+)'/g)].map((m) => m[1]);
  expect(declared.length).toBeGreaterThan(5);
  expect(declared.filter((name) => !ciProjects().has(name))).toEqual([]);
});

test('Art. 3 · the contrast gate runs after the build, whose dist/ it imports (a clean checkout has none)', () => {
  const ci = read('.github/workflows/ci.yml');
  const build = ci.indexOf('- run: pnpm build');
  expect(build).toBeGreaterThan(-1);
  expect(ci.indexOf('tools/contrast-gate/contrast-gate.ts')).toBeGreaterThan(build);
});
