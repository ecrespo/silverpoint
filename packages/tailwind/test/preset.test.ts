import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { compile } from '@tailwindcss/node';
import postcss from 'postcss';
import { describe, expect, test } from 'vitest';
import preset from '../src';

const here = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(here, path), 'utf8');
const require = createRequire(import.meta.url);
const tailwind3 = require('tailwindcss-v3') as (config: unknown) => postcss.AcceptedPlugin;

/** The utilities a consumer writes, and the declaration each must compile to (API Spec §10.4). */
const UTILITIES: readonly (readonly [string, string])[] = [
  ['bg-sp-substrate', 'background-color: var(--sp-substrate)'],
  ['text-sp-ink', 'color: var(--sp-ink)'],
  ['text-sp-ink-secondary', 'color: var(--sp-ink-secondary)'],
  ['bg-sp-heighten', 'background-color: var(--sp-heighten)'],
  ['border-sp-rule', 'border-color: var(--sp-rule)'],
  ['border-sp-grid', 'border-color: var(--sp-grid)'],
  ['text-sp-text', 'color: var(--sp-text)'],
  ['text-sp-text-muted', 'color: var(--sp-text-muted)'],
  ['font-sp-display', 'font-family: var(--sp-font-display)'],
  ['rounded-sp', 'border-radius: var(--sp-radius)'],
];

/** `--name: value` pairs of the `@theme inline` block of theme.css. */
function themeCss(): Record<string, string> {
  const block = /@theme inline\s*{([^}]*)}/.exec(read('theme.css'))?.[1] ?? '';
  return Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2]!.trim()]));
}

/** Every `var(--sp-…)` the preset names. */
const named = () => [...JSON.stringify(preset).matchAll(/var\((--sp-[\w-]+)\)/g)].map((m) => m[1]!);

describe('@silverpoint/tailwind (REQ-047, API Spec §10.4)', () => {
  test('REQ-047 · theme.css and the JS preset name the same tokens, from one mapping', () => {
    const extend = preset.theme.extend;
    const fromPreset = {
      ...Object.fromEntries(Object.entries(extend.colors.sp).map(([token, value]) => [`--color-sp-${token}`, value])),
      '--font-sp-display': extend.fontFamily['sp-display'],
      '--radius-sp': extend.borderRadius.sp,
    };
    expect(themeCss()).toEqual(fromPreset);
    expect(Object.keys(extend.colors.sp)).toEqual(['substrate', 'ink', 'ink-secondary', 'heighten', 'rule', 'grid', 'text', 'text-muted']);
  });

  test('REQ-047 · REQ-042 · every variable it names is public: declared by every built-in ground in the grounds stylesheet', () => {
    const css = readFileSync(join(here, '../grounds/src/styles.css'), 'utf8');
    for (const ground of ['silverpoint', 'cyanotype']) {
      const declared = new Set([...css.matchAll(new RegExp(`\\.sp-ground-${ground}[^{]*{([^}]*)}`, 'g'))].flatMap((m) => [...m[1]!.matchAll(/(--sp-[\w-]+)\s*:/g)].map((d) => d[1])));
      expect(named().filter((variable) => !declared.has(variable)), ground).toEqual([]);
    }
    expect(named()).toHaveLength(10);
  });

  test('REQ-047 · Tailwind 4 compiles every utility to its variable, through theme.css', async () => {
    const compiler = await compile(`@import 'tailwindcss/theme' theme(reference);\n@import 'tailwindcss/utilities';\n@import './theme.css';`, { base: here, onDependency: () => {} });
    const css = compiler.build(UTILITIES.map(([utility]) => utility));
    for (const [utility, declaration] of UTILITIES) expect(css, utility).toContain(declaration);
  });

  test('REQ-047 · Tailwind 3.4 compiles every utility to its variable, through the JS preset', async () => {
    const html = UTILITIES.map(([utility]) => `<i class="${utility}"></i>`).join('');
    const { css } = await postcss([tailwind3({ presets: [preset], content: [{ raw: html }], corePlugins: { preflight: false } })]).process('@tailwind utilities;', { from: undefined });
    for (const [utility, declaration] of UTILITIES) expect(css, utility).toContain(declaration);
  });

  test('REQ-043 · Art. 8 · it depends on nothing, not even Tailwind as a peer', () => {
    const manifest = JSON.parse(read('package.json')) as Record<string, unknown>;
    expect(manifest.dependencies).toBeUndefined();
    expect(manifest.peerDependencies).toBeUndefined();
    expect(manifest.optionalDependencies).toBeUndefined();
  });

  test('REQ-043 · Art. 8 · no other package depends on it, nor on Tailwind', () => {
    const packages = join(here, '..');
    for (const name of readdirSync(packages).filter((dir) => dir !== 'tailwind')) {
      let manifest: Record<string, Record<string, string> | undefined>;
      try {
        manifest = JSON.parse(readFileSync(join(packages, name, 'package.json'), 'utf8'));
      } catch {
        continue;
      }
      const runtime = Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies, ...manifest.optionalDependencies });
      expect(runtime.filter((dep) => dep === '@silverpoint/tailwind' || dep.startsWith('tailwindcss')), name).toEqual([]);
    }
  });

  test('REQ-160 · published with theme.css and the built preset, ESM and CommonJS', () => {
    const manifest = JSON.parse(read('package.json')) as { files: string[]; exports: Record<string, unknown> };
    expect(manifest.files).toEqual(['dist', 'theme.css']);
    expect(manifest.exports['./theme.css']).toBe('./theme.css');
    expect(manifest.exports['.']).toMatchObject({ types: './dist/index.d.ts', import: './dist/index.js', require: './dist/index.cjs' });
  });
});
