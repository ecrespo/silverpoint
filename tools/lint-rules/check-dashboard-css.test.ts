import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { dashboardCssViolations } from './check-dashboard-css.mjs';

const real = readFileSync(fileURLToPath(new URL('../../packages/grounds/src/dashboard.css', import.meta.url)), 'utf8');

/**
 * REQ-203 (DD-014): the dashboard stylesheet may not reorder cells nor place them on explicit lines,
 * so the DOM order is the reading order at every breakpoint (T-110).
 */
describe('dashboard stylesheet lint', () => {
  test.each([
    ['order', '.x { order: 2; }'],
    ['dense packing', '.x { grid-auto-flow: row dense; }'],
    ['grid-row-start', '.x { grid-row-start: 2; }'],
    ['grid-column-start', '.x { grid-column-start: 1; }'],
    ['grid-area', '.x { grid-area: a; }'],
    ['line placement in grid-column', '.x { grid-column: 1 / 3; }'],
    ['line placement in grid-row', '.x { grid-row: 2; }'],
    ['grid-template-areas', '.x { grid-template-areas: "a b"; }'],
  ])('REQ-203 · a seeded %s is a violation', (_name, css) => {
    expect(dashboardCssViolations(css)).toHaveLength(1);
  });

  test('REQ-203 · spans are allowed; comments are ignored', () => {
    expect(dashboardCssViolations('/* order: 1 */ .x { grid-column: span var(--sp-cell-col-sm, 1); grid-row: span 2; grid-auto-flow: row; }')).toEqual([]);
  });

  test('REQ-203 · the shipped dashboard stylesheet is clean', () => {
    expect(dashboardCssViolations(real)).toEqual([]);
  });
});
