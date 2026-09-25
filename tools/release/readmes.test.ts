import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { QUICKSTARTS } from '../../docs/site/src/quickstart';

/**
 * The npm page of each package is its README (REQ-160: what is published is what CI proved). Every
 * package carries one, it names its own install command, the adapters give the site's quickstart
 * word for word, and every `@silverpoint/*` import in a code sample is an entry point that exists.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SIX = ['angular', 'core', 'fonts', 'grounds', 'react', 'vue'];
const ADAPTERS = { react: 'React', vue: 'Vue', angular: 'Angular' } as const;

const readme = (pkg: string) => readFileSync(join(ROOT, 'packages', pkg, 'README.md'), 'utf8');
const manifest = (pkg: string) => JSON.parse(readFileSync(join(ROOT, 'packages', pkg, 'package.json'), 'utf8'));

/** The subpaths a package resolves: its `exports`, and for Angular its APF secondary entry points. */
function entryPoints(pkg: string): Set<string> {
  const points = new Set(Object.keys(manifest(pkg).exports ?? { '.': '' }));
  if (pkg === 'angular') {
    points.add('.');
    for (const name of readdirSync(join(ROOT, 'packages/angular'))) {
      if (existsSync(join(ROOT, 'packages/angular', name, 'ng-package.json'))) points.add(`./${name}`);
    }
  }
  return points;
}

/** `@silverpoint/<pkg>[/<subpath>]` in the README's code blocks, including CSS `@import`s. */
function imports(markdown: string): string[] {
  const code = [...markdown.matchAll(/```[\w-]*\n([\s\S]*?)```/g)].map((m) => m[1]).join('\n');
  return [...code.matchAll(/(?:from|import)\s+['"](@silverpoint\/[^'"]+)['"]/g)].map((m) => m[1] as string);
}

describe('package READMEs (the npm pages)', () => {
  test.each(SIX)('REQ-160 · @silverpoint/%s has a README that names its install command', (pkg) => {
    expect(existsSync(join(ROOT, 'packages', pkg, 'README.md')), pkg).toBe(true);
    const text = readme(pkg);
    expect(text).toMatch(new RegExp(`^# @silverpoint/${pkg}$`, 'm'));
    expect(text).toMatch(new RegExp(`npm install [^\\n]*@silverpoint/${pkg}\\b`));
  });

  test.each(Object.entries(ADAPTERS))('PRD §4.2 · the %s README gives the site quickstart exactly', (pkg, framework) => {
    const quickstart = QUICKSTARTS.find((q) => q.framework === framework)!;
    const text = readme(pkg);
    expect(text).toContain(quickstart.create);
    expect(text).toContain(quickstart.install);
    for (const file of quickstart.files) {
      expect(text).toContain(file.path);
      expect(text).toContain(file.code);
    }
  });

  test.each(SIX)('REQ-107 · every @silverpoint import in the %s README is an entry point that exists', (pkg) => {
    const found = imports(readme(pkg));
    expect(found.length, `${pkg}: no code sample imports silverpoint`).toBeGreaterThan(0);
    for (const specifier of found) {
      const [, name, rest] = specifier.match(/^@silverpoint\/([\w-]+)(\/.*)?$/)!;
      expect(SIX, specifier).toContain(name);
      expect([...entryPoints(name!)], specifier).toContain(rest ? `.${rest}` : '.');
    }
  });
});
