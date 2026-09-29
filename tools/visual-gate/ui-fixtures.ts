/** The committed UI fixtures (fixtures/ui); the matrix itself is `ui-matrix.ts`, free of `fs`. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURES_DIR } from './fixtures';
import type { UiFixture } from './ui-matrix';

export * from './ui-matrix';

/** The committed UI fixtures, sorted by id. */
export function loadUiFixtures(scope: 'pr' | 'full' = 'full'): UiFixture[] {
  const dir = join(FIXTURES_DIR, 'ui');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.ui.json'))
    .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')) as UiFixture)
    .filter((f) => scope === 'full' || f.scope === 'pr')
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

