import { describe, expect, test } from 'vitest';
import { QUICKSTARTS } from '../../docs/site/src/quickstart';
import { BUDGET_MS, withTarballs } from './quickstart';

/** T-098: the quickstart run installs this checkout's tarballs in place of the registry's packages. */
describe('quickstart substitution', () => {
  test('PRD §4.2 · the budget is ten minutes', () => {
    expect(BUDGET_MS).toBe(600_000);
  });

  test('PRD §4.2 · every @silverpoint package of the command is a tarball, core and grounds included', () => {
    expect(withTarballs('npm install @silverpoint/react @silverpoint/fonts', (p) => `/t/${p}.tgz`)).toBe('npm install /t/react.tgz /t/fonts.tgz /t/core.tgz /t/grounds.tgz');
  });

  test('PRD §4.2 · the site’s install commands keep their other words, and name no registry package', () => {
    for (const q of QUICKSTARTS) {
      const command = withTarballs(q.install, (p) => `/t/${p}.tgz`);
      expect(command.startsWith('npm install '), q.framework).toBe(true);
      expect(command, q.framework).not.toMatch(/@silverpoint\//);
    }
  });
});
