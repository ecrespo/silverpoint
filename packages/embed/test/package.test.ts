/** T-291 · the package's shape (REQ-629, REQ-652). */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const json = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const manifest = json('../package.json');

describe('@silverpoint/embed manifest', () => {
  test('REQ-629 · depends only on the core and the grounds, with no peer', () => {
    expect(Object.keys(manifest.dependencies).sort()).toEqual(['@silverpoint/core', '@silverpoint/grounds']);
    expect(manifest.peerDependencies).toBeUndefined();
  });

  test('REQ-629 · exports every entry of API delta §1.5', () => {
    expect(Object.keys(manifest.exports)).toEqual([
      '.',
      './client',
      './hosts',
      './conformance',
      './host-catalog.json',
      './conformance.json',
      './integrity.json',
      './silverpoint-embed.js',
      './silverpoint-embed.mjs',
      './silverpoint-embed.full.js',
      './silverpoint-embed.full.mjs',
      './package.json',
    ]);
  });

  test('REQ-629 · is the tenth package of the fixed group, at the group version', () => {
    const changesets = json('../../../.changeset/config.json');
    expect(changesets.fixed[0]).toContain('@silverpoint/embed');
    expect(manifest.version).toBe(json('../../core/package.json').version);
  });

  test('REQ-652 · neither the core, the grounds nor an adapter depends on it', () => {
    for (const name of ['core', 'grounds', 'react', 'vue', 'angular', 'marp', 'fonts', 'tailwind']) {
      const other = json(`../../${name}/package.json`);
      expect({ name, ...other.dependencies, ...other.peerDependencies }).not.toHaveProperty('@silverpoint/embed');
    }
  });
});
