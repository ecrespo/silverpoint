import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { CATALOG } from '../../../tools/visual-gate/catalog';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const manifest = () => JSON.parse(readFileSync(`${dist}package.json`, 'utf8')) as Record<string, any>;

describe('Angular Package Format', () => {
  test('REQ-105 · the build is an APF package: FESM2022 bundles and typings per entry point', () => {
    for (const entry of ['silverpoint-angular', 'silverpoint-angular-line-chart']) {
      expect(existsSync(`${dist}fesm2022/${entry}.mjs`), entry).toBe(true);
      expect(existsSync(`${dist}types/${entry}.d.ts`), entry).toBe(true);
    }
  });

  test('REQ-105 · the manifest exports the primary and the line-chart secondary entry point', () => {
    const { exports } = manifest();
    expect(exports['.']).toEqual({ types: './types/silverpoint-angular.d.ts', default: './fesm2022/silverpoint-angular.mjs' });
    expect(exports['./line-chart']).toEqual({
      types: './types/silverpoint-angular-line-chart.d.ts',
      default: './fesm2022/silverpoint-angular-line-chart.mjs',
    });
  });

  test('REQ-105 · the bundles carry partial declarations for the linker, not a full compilation', () => {
    const bundle = readFileSync(`${dist}fesm2022/silverpoint-angular-line-chart.mjs`, 'utf8');
    expect(bundle).toMatch(/ɵɵngDeclareComponent/);
    expect(bundle).not.toMatch(/ɵɵdefineComponent/);
  });

  test('REQ-161 · the published manifest keeps Angular as peers and is side-effect free', () => {
    const published = manifest();
    // @angular/forms: the UI components' ControlValueAccessor (REQ-323).
    expect(Object.keys(published.peerDependencies).sort()).toEqual(['@angular/common', '@angular/core', '@angular/forms']);
    expect(published.dependencies).not.toHaveProperty('@angular/core');
    expect(published.sideEffects).toBe(false);
  });
});

describe('required inputs (T-177, feature-003)', () => {
  // The partial declaration is what an application's compiler checks templates against
  // (strictTemplates): an input required here is required in every consumer's template.
  test.each(CATALOG.map((e) => [e.chart, e] as const))('REQ-101 · %s · its required inputs are the ones its type requires', (_chart, entry) => {
    const bundle = readFileSync(`${dist}fesm2022/silverpoint-angular-${entry.slug}.mjs`, 'utf8');
    const required = [...bundle.matchAll(/(\w+): \{ classPropertyName: "\w+", publicName: "\w+", isSignal: true, isRequired: true/g)].map((m) => m[1]).sort();
    expect(required).toEqual(Object.keys(entry.required ?? {}).sort());
  });
});
