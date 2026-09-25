import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';

/**
 * `changeset version` over a copy of the workspace's manifests and `.changeset/`, never the real
 * tree: the release version and the shared-version rule are what TD §9 fixes.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BIN = join(ROOT, 'tools/release/node_modules/.bin/changeset');
const SIX = ['angular', 'core', 'fonts', 'grounds', 'react', 'vue'];
const WORKSPACE_DIRS = ['packages', 'examples', 'tools'];

let scratch: string | undefined;
afterEach(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
  scratch = undefined;
});

/** The workspace's manifests in a scratch directory, with the repository's `.changeset/` or `only` in it. */
function copyWorkspace(only?: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'sp-release-'));
  for (const file of ['package.json', 'pnpm-workspace.yaml']) cpSync(join(ROOT, file), join(dir, file));
  for (const parent of WORKSPACE_DIRS) {
    for (const name of readdirSync(join(ROOT, parent))) {
      const manifest = join(ROOT, parent, name, 'package.json');
      if (existsSync(manifest)) cpSync(manifest, join(dir, parent, name, 'package.json'));
    }
  }
  cpSync(join(ROOT, 'docs/site/package.json'), join(dir, 'docs/site/package.json'));
  cpSync(join(ROOT, '.changeset'), join(dir, '.changeset'), { recursive: true });
  if (only) {
    for (const file of readdirSync(join(dir, '.changeset'))) {
      if (file.endsWith('.md') && file !== 'README.md') rmSync(join(dir, '.changeset', file));
    }
    for (const [file, body] of Object.entries(only)) writeFileSync(join(dir, '.changeset', file), body);
  }
  execFileSync('git', ['init', '-q'], { cwd: dir });
  return dir;
}

const version = (dir: string, pkg: string): string =>
  JSON.parse(readFileSync(join(dir, 'packages', pkg, 'package.json'), 'utf8')).version;

describe('Changesets (TD §9)', () => {
  test('REQ-160 · `changeset version` releases the six packages as 1.0.0, with a changelog entry each', () => {
    scratch = copyWorkspace();
    execFileSync(BIN, ['version'], { cwd: scratch, stdio: 'pipe' });
    for (const pkg of SIX) {
      expect(version(scratch, pkg), pkg).toBe('1.0.0');
      expect(readFileSync(join(scratch, 'packages', pkg, 'CHANGELOG.md'), 'utf8'), pkg).toMatch(/^## 1\.0\.0$/m);
    }
    // The private workspace packages (examples, tools, the site) are not versioned.
    expect(JSON.parse(readFileSync(join(scratch, 'tools/release/package.json'), 'utf8')).version).toBe('0.0.0');
  }, 60_000);

  test('REQ-160 · TD §9 · the six packages share one version: a patch to one releases all six', () => {
    scratch = copyWorkspace({ 'one-patch.md': "---\n'@silverpoint/fonts': patch\n---\n\nA patch to the fonts alone.\n" });
    const before = version(scratch, 'core');
    execFileSync(BIN, ['version'], { cwd: scratch, stdio: 'pipe' });
    const [major, minor, patch] = before.split('.').map(Number);
    for (const pkg of SIX) expect(version(scratch, pkg), pkg).toBe(`${major}.${minor}.${patch + 1}`);
  }, 60_000);
});
