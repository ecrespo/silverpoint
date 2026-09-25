import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { checkManifests, readWorkspaceManifests } from './check-deps.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));

type Manifest = Record<string, unknown>;

function library(name: string, extra: Manifest = {}): Manifest {
  return {
    name,
    sideEffects: false,
    types: './dist/index.d.ts',
    exports: { '.': { types: './dist/index.d.ts', import: './dist/index.js', default: './dist/index.js' } },
    ...extra,
  };
}

function valid(): Manifest[] {
  return [
    library('@silverpoint/core', { dependencies: { 'd3-scale': '^4', 'd3-shape': '^3' } }),
    library('@silverpoint/grounds', {
      sideEffects: ['*.css'],
      dependencies: { '@silverpoint/core': 'workspace:*', roughjs: '4.6.6' },
    }),
    library('@silverpoint/react', {
      dependencies: { '@silverpoint/core': 'workspace:*', '@silverpoint/grounds': 'workspace:*' },
      peerDependencies: { react: '^19', 'react-dom': '^19' },
    }),
    library('@silverpoint/vue', {
      dependencies: { '@silverpoint/core': 'workspace:*', '@silverpoint/grounds': 'workspace:*' },
      peerDependencies: { vue: '^3.4' },
    }),
    // ng-packagr generates `exports` in dist; the source manifest links the dist directory.
    {
      name: '@silverpoint/angular',
      sideEffects: false,
      publishConfig: { directory: 'dist', linkDirectory: true },
      dependencies: { '@silverpoint/core': 'workspace:*', '@silverpoint/grounds': 'workspace:*', tslib: '^2' },
      peerDependencies: { '@angular/core': '>=21', '@angular/common': '>=21' },
    },
    { name: '@silverpoint/fonts', sideEffects: ['*.css'], exports: { '.': './fonts.css' } },
  ];
}

function replace(manifests: Manifest[], name: string, change: (m: Manifest) => Manifest): Manifest[] {
  return manifests.map((m) => (m.name === name ? change(m) : m));
}

describe('check-deps', () => {
  test('REQ-160 · the six packages of the allowlist pass', () => {
    expect(checkManifests(valid())).toEqual([]);
  });

  test('REQ-160 · a missing package is reported', () => {
    const problems = checkManifests(valid().filter((m) => m.name !== '@silverpoint/vue'));
    expect(problems.join('\n')).toMatch(/REQ-160.*@silverpoint\/vue/);
  });

  test('REQ-161 · React declared as a dependency fails', () => {
    const manifests = replace(valid(), '@silverpoint/react', (m) => ({
      ...m,
      dependencies: { ...(m.dependencies as Manifest), react: '^19' },
    }));
    expect(checkManifests(manifests).join('\n')).toMatch(/REQ-161.*@silverpoint\/react.*react/);
  });

  test('REQ-161 · Vue missing from peerDependencies fails', () => {
    const manifests = replace(valid(), '@silverpoint/vue', (m) => ({ ...m, peerDependencies: {} }));
    expect(checkManifests(manifests).join('\n')).toMatch(/REQ-161.*@silverpoint\/vue.*vue/);
  });

  test('REQ-162 · a core runtime dependency outside the allowlist fails', () => {
    const manifests = replace(valid(), '@silverpoint/core', (m) => ({
      ...m,
      dependencies: { ...(m.dependencies as Manifest), 'd3-selection': '^3' },
    }));
    expect(checkManifests(manifests).join('\n')).toMatch(/REQ-162.*d3-selection/);
  });

  test('REQ-162 · an adapter depending on the inking engine fails', () => {
    const manifests = replace(valid(), '@silverpoint/vue', (m) => ({
      ...m,
      dependencies: { ...(m.dependencies as Manifest), roughjs: '4.6.6' },
    }));
    expect(checkManifests(manifests).join('\n')).toMatch(/REQ-162.*@silverpoint\/vue.*roughjs/);
  });

  test.each(['peerDependencies', 'optionalDependencies'])('REQ-162 · a core %s entry outside the allowlist fails', (field) => {
    const manifests = replace(valid(), '@silverpoint/core', (m) => ({ ...m, [field]: { 'd3-selection': '^3' } }));
    expect(checkManifests(manifests).join('\n')).toMatch(/REQ-162.*d3-selection/);
  });

  test('REQ-163 · an export without types fails', () => {
    const manifests = replace(valid(), '@silverpoint/core', (m) => ({
      ...m,
      exports: { '.': { import: './dist/index.js', default: './dist/index.js' } },
    }));
    expect(checkManifests(manifests).join('\n')).toMatch(/REQ-163.*@silverpoint\/core.*types/);
  });

  test('REQ-163 · types listed after import fails, because TypeScript stops at the first match', () => {
    const manifests = replace(valid(), '@silverpoint/core', (m) => ({
      ...m,
      exports: { '.': { import: './dist/index.js', types: './dist/index.d.ts', default: './dist/index.js' } },
    }));
    expect(checkManifests(manifests).join('\n')).toMatch(/REQ-163.*@silverpoint\/core.*types/);
  });

  test('REQ-163 · a nested condition object is checked too: types after import inside `node` fails', () => {
    const manifests = replace(valid(), '@silverpoint/core', (m) => ({
      ...m,
      exports: { '.': { types: './dist/index.d.ts', node: { import: './dist/node.js', types: './dist/node.d.ts' }, default: './dist/index.js' } },
    }));
    expect(checkManifests(manifests).join('\n')).toMatch(/REQ-163.*@silverpoint\/core.*"\. › node".*types/);
  });

  test('REQ-163 · a nested condition object is checked too: default shadowing inside `browser` fails', () => {
    const manifests = replace(valid(), '@silverpoint/core', (m) => ({
      ...m,
      exports: { '.': { types: './dist/index.d.ts', browser: { default: './dist/b.js', import: './dist/b.js' }, default: './dist/index.js' } },
    }));
    expect(checkManifests(manifests).join('\n')).toMatch(/REQ-163.*@silverpoint\/core.*"\. › browser".*shadows "import"/);
  });

  test('REQ-163 · a library without an exports map fails', () => {
    const manifests = replace(valid(), '@silverpoint/core', ({ exports: _exports, ...rest }) => rest);
    expect(checkManifests(manifests).join('\n')).toMatch(/REQ-163.*@silverpoint\/core.*exports/);
  });

  test('REQ-163 · a condition order where default shadows import fails', () => {
    const manifests = replace(valid(), '@silverpoint/core', (m) => ({
      ...m,
      exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js', import: './dist/index.js' } },
    }));
    expect(checkManifests(manifests).join('\n')).toMatch(/REQ-163.*@silverpoint\/core.*"\."/);
  });

  test('REQ-163 · a JavaScript package that is not side-effect free fails', () => {
    const manifests = replace(valid(), '@silverpoint/react', (m) => ({ ...m, sideEffects: true }));
    expect(checkManifests(manifests).join('\n')).toMatch(/REQ-163.*@silverpoint\/react.*sideEffects/);
  });

  test('REQ-034 · removing "*.css" from the sideEffects of grounds fails', () => {
    const manifests = replace(valid(), '@silverpoint/grounds', (m) => ({ ...m, sideEffects: false }));
    expect(checkManifests(manifests).join('\n')).toMatch(/REQ-034.*@silverpoint\/grounds/);
  });

  test('REQ-161 · the manifests in this repository pass', () => {
    expect(checkManifests(readWorkspaceManifests(root))).toEqual([]);
  });

  test('REQ-162 · the checker reads the real core manifest', () => {
    const core = JSON.parse(readFileSync(`${root}packages/core/package.json`, 'utf8')) as Manifest;
    expect(readWorkspaceManifests(root).find((m) => m.name === '@silverpoint/core')).toEqual(core);
  });
});
