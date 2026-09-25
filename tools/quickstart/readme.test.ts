import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { QUICKSTARTS } from '../../docs/site/src/quickstart';

/** The README's quickstart is the site's React one, word for word, so neither drifts (T-098). */
test('PRD §4.2 · the README gives the React quickstart exactly as the site does', () => {
  const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8');
  const react = QUICKSTARTS.find((q) => q.framework === 'React')!;
  expect(readme).toContain(react.create);
  expect(readme).toContain(react.install);
  for (const file of react.files) {
    expect(readme).toContain(file.path);
    expect(readme).toContain(file.code);
  }
});
