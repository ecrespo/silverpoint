import { describe, expect, test } from 'vitest';
import { checkChangeset } from './check-changeset.mjs';

const A = (file: string) => ({ status: 'A', file });
const M = (file: string) => ({ status: 'M', file });
const D = (file: string) => ({ status: 'D', file });

describe('check-changeset', () => {
  test('REQ-160 · TD §9 · a PR touching packages/ without a changeset fails', () => {
    const problems = checkChangeset([M('packages/core/src/index.ts'), M('README.md')]);
    expect(problems.join('\n')).toMatch(/REQ-160.*packages\/core\/src\/index.ts.*adds no changeset/);
  });

  test('REQ-160 · TD §9 · a PR touching packages/ with a new changeset passes', () => {
    expect(checkChangeset([M('packages/react/src/chart-frame.tsx'), A('.changeset/quiet-owls-sing.md')])).toEqual([]);
  });

  test('REQ-160 · TD §9 · a PR that touches nothing under packages/ needs no changeset', () => {
    expect(checkChangeset([M('docs/site/src/site.css'), M('e2e/wcag.spec.ts')])).toEqual([]);
  });

  test('REQ-160 · TD §9 · editing or deleting an existing changeset, or the README, is not a new one', () => {
    for (const other of [M('.changeset/quiet-owls-sing.md'), D('.changeset/quiet-owls-sing.md'), A('.changeset/README.md'), A('.changeset/config.json')]) {
      expect(checkChangeset([M('packages/vue/src/ChartShell.vue'), other])).not.toEqual([]);
    }
  });
});
