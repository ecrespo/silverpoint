import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';
import { packProblems, planPublish, publishablePackages } from './publish.mjs';

/**
 * TD §9, REQ-160: `release.yml` publishes from CI, on a push to main, whatever version of the six
 * packages is not on npm yet. Re-running it publishes nothing twice, and a package is published
 * only after the packages it depends on.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

type Pkg = { name: string; version: string; dir: string; packDir: string; deps: string[] };

let scratch: string | undefined;
afterEach(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
  scratch = undefined;
});

describe('publish (TD §9)', () => {
  test('REQ-160 · the six public packages, one version, each after its @silverpoint dependencies', () => {
    const packages: Pkg[] = publishablePackages(ROOT);
    expect(packages.map((p) => p.name).sort()).toEqual(
      ['angular', 'core', 'fonts', 'grounds', 'react', 'vue'].map((p) => `@silverpoint/${p}`),
    );
    expect(new Set(packages.map((p) => p.version)).size).toBe(1);
    const position = new Map(packages.map((p, i) => [p.name, i]));
    for (const p of packages) {
      for (const dep of p.deps) expect(position.get(dep)!, `${dep} before ${p.name}`).toBeLessThan(position.get(p.name)!);
    }
  });

  test('REQ-160 · Angular is packed from its APF build (publishConfig.directory), the others from their folder', () => {
    const packages: Pkg[] = publishablePackages(ROOT);
    for (const p of packages) {
      const expected = p.name === '@silverpoint/angular' ? join(p.dir, 'dist') : p.dir;
      expect(p.packDir, p.name).toBe(expected);
    }
  });

  test('REQ-160 · only the versions npm does not have are published, so a re-run publishes nothing twice', () => {
    const packages: Pkg[] = [
      { name: '@silverpoint/core', version: '0.1.1', dir: 'a', packDir: 'a', deps: [] },
      { name: '@silverpoint/react', version: '0.1.1', dir: 'b', packDir: 'b', deps: ['@silverpoint/core'] },
    ];
    const onNpm = new Set(['@silverpoint/core@0.1.1']);
    const plan: Pkg[] = planPublish(packages, (name: string, version: string) => onNpm.has(`${name}@${version}`));
    expect(plan.map((p) => p.name)).toEqual(['@silverpoint/react']);
    expect(planPublish(packages, () => true)).toEqual([]);
  });

  test('REQ-160 · Art. 3 · release.yml publishes on a push to main, after every CI gate, with OIDC and no token', () => {
    const workflow = readFileSync(join(ROOT, '.github/workflows/release.yml'), 'utf8');
    expect(workflow).toMatch(/on:\n\s+push:\n\s+branches: \[main\]/);
    expect(workflow).toMatch(/ci:\n\s+uses: \.\/\.github\/workflows\/ci\.yml/);
    expect(workflow).toMatch(/publish:\n\s+needs: ci\n/);
    expect(workflow).toMatch(/id-token: write/);
    expect(workflow).toContain('node tools/release/publish.mjs');
    expect(workflow).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN/);
  });

  test('REQ-160 · a package whose packed folder has no README or no manifest is refused', () => {
    scratch = mkdtempSync(join(tmpdir(), 'sp-publish-'));
    const packDir = join(scratch, 'dist');
    mkdirSync(packDir);
    const pkg: Pkg = { name: '@silverpoint/angular', version: '0.1.1', dir: scratch, packDir, deps: [] };
    expect(packProblems(pkg)).toHaveLength(2);
    writeFileSync(join(packDir, 'package.json'), '{}');
    expect(packProblems(pkg)).toEqual([expect.stringMatching(/README\.md/)]);
    writeFileSync(join(packDir, 'README.md'), '# @silverpoint/angular\n');
    expect(packProblems(pkg)).toEqual([]);
  });
});
