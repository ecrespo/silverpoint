import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { QUICKSTARTS } from '../../docs/site/src/quickstart';
import { UI_COMPONENTS } from '../../packages/core/src/ui/catalog';
import { CATALOG } from '../visual-gate/catalog';

/**
 * The npm page of each package is its README (REQ-160: what is published is what CI proved). Every
 * package carries one, it names its own install command, the adapters give the site's quickstart
 * word for word, and every `@silverpoint/*` import in a code sample is an entry point that exists.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const PACKAGES = ['angular', 'core', 'fonts', 'grounds', 'mcp', 'react', 'tailwind', 'vue'];
const ADAPTERS = { react: 'React', vue: 'Vue', angular: 'Angular' } as const;

const readme = (pkg: string) => readFileSync(join(ROOT, 'packages', pkg, 'README.md'), 'utf8');
const manifest = (pkg: string) => JSON.parse(readFileSync(join(ROOT, 'packages', pkg, 'package.json'), 'utf8'));

/** The subpaths a package resolves: its `exports`, and for Angular its APF secondary entry points. */
function entryPoints(pkg: string): Set<string> {
  const points = new Set(Object.keys(manifest(pkg).exports ?? { '.': '' }));
  if (pkg === 'angular') {
    points.add('.');
    // Secondary entry points nest (`ui/button`): every directory holding an `ng-package.json`.
    const walk = (dir: string) => {
      for (const name of readdirSync(join(ROOT, 'packages/angular', dir), { withFileTypes: true })) {
        if (!name.isDirectory() || ['node_modules', 'dist', 'src', 'test'].includes(name.name)) continue;
        const path = dir ? `${dir}/${name.name}` : name.name;
        if (existsSync(join(ROOT, 'packages/angular', path, 'ng-package.json'))) points.add(`./${path}`);
        walk(path);
      }
    };
    walk('');
  }
  return points;
}

/** `@silverpoint/<pkg>[/<subpath>]` in the README's code blocks, including CSS `@import`s. */
function imports(markdown: string): string[] {
  const code = [...markdown.matchAll(/```[\w-]*\n([\s\S]*?)```/g)].map((m) => m[1]).join('\n');
  return [...code.matchAll(/(?:from|import)\s+['"](@silverpoint\/[^'"]+)['"]/g)].map((m) => m[1] as string);
}

describe('package READMEs (the npm pages)', () => {
  test.each(PACKAGES)('REQ-160 · @silverpoint/%s has a README that names its install command', (pkg) => {
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

  test.each(PACKAGES)('REQ-107 · every @silverpoint import in the %s README is an entry point that exists', (pkg) => {
    const found = imports(readme(pkg));
    expect(found.length, `${pkg}: no code sample imports silverpoint`).toBeGreaterThan(0);
    for (const specifier of found) {
      const [, name, rest] = specifier.match(/^@silverpoint\/([\w-]+)(\/.*)?$/)!;
      expect(PACKAGES, specifier).toContain(name);
      expect([...entryPoints(name!)], specifier).toContain(rest ? `.${rest}` : '.');
    }
  });
});

describe('the charts each adapter README lists (T-179)', () => {
  const named = { react: (chart: string) => `\`${chart}\``, vue: (chart: string) => `\`Sp${chart}\``, angular: (chart: string) => `\`Sp${chart}\`` } as const;

  test.each(Object.keys(ADAPTERS) as (keyof typeof ADAPTERS)[])('REQ-160 · the %s README names every chart of the catalog, and counts them', (pkg) => {
    const text = readme(pkg);
    expect(CATALOG.filter((c) => !text.includes(named[pkg](c.chart))).map((c) => c.chart)).toEqual([]);
    expect(text).toContain(`## The ${CATALOG.length} charts`);
  });
});

describe('the UI layer, the palettes and the timeline in each adapter README (T-224)', () => {
  const adapters = Object.keys(ADAPTERS) as (keyof typeof ADAPTERS)[];

  test.each(adapters)('REQ-521 · the %s README names every UI component of the catalog, and counts them', (pkg) => {
    const text = readme(pkg);
    expect(UI_COMPONENTS.filter((c) => !text.includes(`\`${c.component}\``)).map((c) => c.component)).toEqual([]);
    expect(text).toContain(`## The ${UI_COMPONENTS.length} UI components`);
    expect(imports(text)).toContain('@silverpoint/grounds/ui.css');
  });

  test.each(adapters)('REQ-521 · the %s README shows the palettes, and the timeline with its optional peer', (pkg) => {
    const text = readme(pkg);
    expect(text).toContain('## Palettes');
    expect(imports(text)).toContain('@silverpoint/core/palettes');
    expect(text).toContain('## Timeline');
    expect(imports(text)).toContain(`@silverpoint/${pkg}/timeline`);
    expect(imports(text)).toContain('@silverpoint/grounds/timeline.css');
    expect(text).toMatch(/npm install [^\n]*@knight-lab\/timelinejs/);
  });

  test('REQ-521 · the grounds README names the UI and timeline stylesheets, and the core README the new entries', () => {
    const grounds = readme('grounds');
    for (const sheet of ['ui.css', 'timeline.css']) expect(grounds).toContain(`@silverpoint/grounds/${sheet}`);
    const core = readme('core');
    for (const entry of ['ui', 'palettes', 'timeline']) expect(core).toContain(`@silverpoint/core/${entry}`);
  });
});

describe('the root README (T-224)', () => {
  const text = readFileSync(join(ROOT, 'README.md'), 'utf8');

  test('REQ-521 · counts the charts and the UI components, and points to the palettes and the timeline', () => {
    expect(text).toContain(`${CATALOG.length} charts`);
    expect(text).not.toMatch(/\b(?!60\b)\d+ charts\b/);
    expect(text).toContain(`${UI_COMPONENTS.length} UI components`);
    expect(text).toContain('@silverpoint/core/palettes');
    expect(text).toContain('@knight-lab/timelinejs');
  });

  test('REQ-107 · every @silverpoint import in the root README is an entry point that exists', () => {
    for (const specifier of imports(text)) {
      const [, name, rest] = specifier.match(/^@silverpoint\/([\w-]+)(\/.*)?$/)!;
      expect(PACKAGES, specifier).toContain(name);
      expect([...entryPoints(name!)], specifier).toContain(rest ? `.${rest}` : '.');
    }
  });
});

describe('links in the READMEs (T-224)', () => {
  const READMES = ['README.md', ...PACKAGES.map((pkg) => `packages/${pkg}/README.md`)];
  /** GitHub's heading anchor: lower case, punctuation dropped, spaces as hyphens. */
  const slug = (heading: string) =>
    heading
      .toLowerCase()
      .replace(/[^\p{L}\p{N} _-]/gu, '')
      .replace(/ /g, '-');
  const anchors = (markdown: string) => new Set([...markdown.matchAll(/^#{1,6} (.+)$/gm)].map((m) => slug(m[1]!)));

  test.each(READMES)('REQ-521 · every relative link in %s reaches a file, and every anchor a heading', (file) => {
    const text = readFileSync(join(ROOT, file), 'utf8');
    const links = [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]!).filter((link) => !/^[a-z]+:/i.test(link));
    for (const link of links) {
      const [path, anchor] = link.split('#');
      const target = path ? join(ROOT, dirname(file), path) : join(ROOT, file);
      expect(existsSync(target), `${file}: ${link}`).toBe(true);
      if (anchor) expect([...anchors(readFileSync(target, 'utf8'))], `${file}: ${link}`).toContain(anchor);
    }
  });

  test.each(READMES)('REQ-521 · every absolute link in %s is https', (file) => {
    const text = readFileSync(join(ROOT, file), 'utf8');
    const absolute = [...text.matchAll(/\]\(([a-z]+:[^)\s]+)\)/gi)].map((m) => m[1]!);
    expect(absolute.filter((link) => !link.startsWith('https://'))).toEqual([]);
  });
});
