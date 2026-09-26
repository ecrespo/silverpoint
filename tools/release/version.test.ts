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
/** The documented release step (`.changeset/README.md`), pointed at the scratch copy. */
const VERSION = join(ROOT, 'tools/release/version.mjs');
const runVersion = (dir: string) => execFileSync(process.execPath, [VERSION, dir], { cwd: join(ROOT, 'tools/release'), stdio: 'pipe' });
const SEVEN = ['angular', 'core', 'fonts', 'grounds', 'react', 'tailwind', 'vue'];
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
  test('REQ-160 · `changeset version` releases the seven packages together, with a changelog entry each', () => {
    scratch = copyWorkspace({ 'one-major.md': "---\n'@silverpoint/core': major\n---\n\nA major release.\n" });
    const next = `${Number(version(scratch, 'core').split('.')[0]) + 1}.0.0`;
    runVersion(scratch);
    for (const pkg of SEVEN) {
      expect(version(scratch, pkg), pkg).toBe(next);
      expect(readFileSync(join(scratch, 'packages', pkg, 'CHANGELOG.md'), 'utf8'), pkg).toContain(`## ${next}`);
    }
    // The private workspace packages (examples, tools, the site) are not versioned.
    expect(JSON.parse(readFileSync(join(scratch, 'tools/release/package.json'), 'utf8')).version).toBe('0.0.0');
  }, 60_000);

  test('REQ-160 · TD §9 · the seven packages share one version: a patch to one releases all seven', () => {
    scratch = copyWorkspace({ 'one-patch.md': "---\n'@silverpoint/fonts': patch\n---\n\nA patch to the fonts alone.\n" });
    const before = version(scratch, 'core');
    runVersion(scratch);
    const [major, minor, patch] = before.split('.').map(Number);
    for (const pkg of SEVEN) expect(version(scratch, pkg), pkg).toBe(`${major}.${minor}.${patch + 1}`);
  }, 60_000);

  test('REQ-160 · TD §9 · the README documents the release step as the script this suite runs', () => {
    const readme = readFileSync(join(ROOT, '.changeset/README.md'), 'utf8');
    expect(readme).toContain('pnpm --filter @silverpoint/release run version-packages');
    expect(readme).not.toMatch(/exec changeset version/);
    const manifest = JSON.parse(readFileSync(join(ROOT, 'tools/release/package.json'), 'utf8'));
    expect(manifest.scripts?.['version-packages']).toBe('node version.mjs');
  });
});
