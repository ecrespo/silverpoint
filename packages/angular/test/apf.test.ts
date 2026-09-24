import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

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
    expect(Object.keys(published.peerDependencies).sort()).toEqual(['@angular/common', '@angular/core']);
    expect(published.dependencies).not.toHaveProperty('@angular/core');
    expect(published.sideEffects).toBe(false);
  });
});
