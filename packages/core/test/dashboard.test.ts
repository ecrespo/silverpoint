import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { DASHBOARD_DEFAULTS, perBreakpoint, resolveLayout, type DashboardLayout } from '../src';

/**
 * Feature-001, Phase 5a. T-106: the layout types and their defaults (API Spec §3, Data Model §2.13).
 */
const root = fileURLToPath(new URL('..', import.meta.url));
const repo = fileURLToPath(new URL('../../..', import.meta.url));

/** Runs tsc on a snippet placed in a scratch directory inside the package; '' when it compiles. */
function typeErrors(snippet: string): string {
  const dir = mkdtempSync(join(root, 'test/.types-'));
  try {
    writeFileSync(join(dir, 'use.ts'), `import type { DashboardProps } from '../../src';\n${snippet}\n`);
    writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ extends: '../../tsconfig.json', include: ['use.ts'] }));
    try {
      execFileSync(join(repo, 'node_modules/.bin/tsc'), ['--noEmit', '-p', join(dir, 'tsconfig.json')], { encoding: 'utf8' });
      return '';
    } catch (error) {
      return String((error as { stdout?: string }).stdout ?? error);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The layout of API Spec §8's example. */
const OPS: DashboardLayout = {
  columns: { sm: 1, md: 2, lg: 4 },
  cells: [
    { id: 'revenue' },
    { id: 'users' },
    { id: 'churn' },
    { id: 'nps' },
    { id: 'traffic', colSpan: { md: 2, lg: 3 }, rowSpan: 2 },
    { id: 'errors' },
  ],
};

describe('dashboard layout defaults (T-106)', () => {
  test('REQ-208 · without a layout: 1 column at sm, 2 at md, 4 at lg; row unit 240, gap 16', () => {
    const layout = resolveLayout(undefined);
    expect(layout.columns).toEqual({ sm: 1, md: 2, lg: 4 });
    expect(layout.rowHeight).toBe(240);
    expect(layout.gap).toBe(16);
    // No layout cells: every child is placed in source order, span 1 (Data Model §2.13, rule 3).
    expect(layout.cells).toEqual([]);
    expect(resolveLayout({})).toEqual(layout);
  });

  test('REQ-208 · the documented defaults, frozen', () => {
    expect(DASHBOARD_DEFAULTS).toEqual({ columns: { sm: 1, md: 2, lg: 4 }, rowHeight: 240, gap: 16, span: 1, headingLevel: 2, ssrWidth: 1200 });
    expect(Object.isFrozen(DASHBOARD_DEFAULTS)).toBe(true);
    expect(Object.isFrozen(DASHBOARD_DEFAULTS.columns)).toBe(true);
  });

  test('REQ-201 · a bare number applies to all three breakpoints; a partial record keeps the other defaults', () => {
    expect(perBreakpoint(3, { sm: 1, md: 2, lg: 4 })).toEqual({ sm: 3, md: 3, lg: 3 });
    expect(perBreakpoint({ md: 3 }, { sm: 1, md: 2, lg: 4 })).toEqual({ sm: 1, md: 3, lg: 4 });
    expect(perBreakpoint(undefined, { sm: 1, md: 2, lg: 4 })).toEqual({ sm: 1, md: 2, lg: 4 });
    expect(resolveLayout({ columns: 3 }).columns).toEqual({ sm: 3, md: 3, lg: 3 });
    expect(resolveLayout({ columns: { lg: 6 } }).columns).toEqual({ sm: 1, md: 2, lg: 6 });
  });

  test('REQ-208 · REQ-203 · layout cells keep their order; a span is 1 unless given, a bare span applies everywhere', () => {
    const { cells } = resolveLayout(OPS);
    expect(cells.map((c) => c.id)).toEqual(['revenue', 'users', 'churn', 'nps', 'traffic', 'errors']);
    expect(cells[0]!.span).toEqual({ sm: { col: 1, row: 1 }, md: { col: 1, row: 1 }, lg: { col: 1, row: 1 } });
    expect(cells[4]!.span).toEqual({ sm: { col: 1, row: 2 }, md: { col: 2, row: 2 }, lg: { col: 3, row: 2 } });
  });

  test('REQ-201 · I-10 · the layout and its resolution are plain data: they survive JSON unchanged', () => {
    expect(JSON.parse(JSON.stringify(OPS))).toEqual(OPS);
    const resolved = resolveLayout(OPS);
    expect(JSON.parse(JSON.stringify(resolved))).toEqual(resolved);
  });

  test('REQ-201 · I-10 · resolving is pure: same layout, deep-equal result; the input is not touched', () => {
    const before = JSON.stringify(OPS);
    expect(resolveLayout(OPS)).toEqual(resolveLayout(OPS));
    expect(JSON.stringify(OPS)).toBe(before);
  });
});

describe('DashboardProps names the region (T-106)', () => {
  test('REQ-214 · a dashboard with a title, or with a label, compiles', () => {
    expect(typeErrors(`const a: DashboardProps = { id: 'ops', title: 'Operations' };\nconst b: DashboardProps = { id: 'ops', label: 'Operations' };\nvoid a; void b;`)).toBe('');
  }, 60_000);

  test('REQ-214 · a dashboard with neither title nor label is a type error', () => {
    expect(typeErrors(`const c: DashboardProps = { id: 'ops' };\nvoid c;`)).toMatch(/error TS/);
  }, 60_000);

  test('REQ-209 · a dashboard without an id is a type error', () => {
    expect(typeErrors(`const d: DashboardProps = { title: 'Operations' };\nvoid d;`)).toMatch(/error TS.*id/s);
  }, 60_000);
});
