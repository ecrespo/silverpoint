import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { breakpointOf } from '@silverpoint/core';
import { describe, expect, test } from 'vitest';

const src = (file: string) => readFileSync(fileURLToPath(new URL(`../${file}`, import.meta.url)), 'utf8');
const css = src('src/dashboard.css').replace(/\/\*[\s\S]*?\*\//g, '');

/** The declarations of the first rule whose selector is exactly `selector`, at any nesting. */
function block(selector: string): Record<string, string> {
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if ((match[1] ?? '').trim() !== selector) continue;
    return Object.fromEntries(
      (match[2] ?? '')
        .split(';')
        .map((d) => d.split(':'))
        .filter(([name, ...value]) => name?.trim() && value.length > 0)
        .map(([name, ...value]) => [name!.trim(), value.join(':').trim()]),
    );
  }
  throw new Error(`No rule for ${selector}`);
}

/** T-110: the dashboard's stylesheet (API Spec §10, TD DD-014). */
describe('dashboard.css', () => {
  test('REQ-202 · the wrapper is a named inline-size container; its grid reads columns and row unit from the model', () => {
    expect(block('.sp-dashboard')).toMatchObject({ 'container-type': 'inline-size', 'container-name': 'sp-dashboard' });
    expect(block('.sp-dashboard-grid')).toMatchObject({
      display: 'grid',
      'grid-auto-flow': 'row',
      'grid-template-columns': 'repeat(var(--sp-dashboard-columns-sm, 1), minmax(0, 1fr))',
      'grid-auto-rows': 'var(--sp-dashboard-row-height, 240px)',
      gap: 'var(--sp-dashboard-gap, var(--sp-dashboard-layout-gap, 16px))',
    });
    expect(block('.sp-dashboard-cell')).toMatchObject({ 'grid-column': 'span var(--sp-cell-col-sm, 1)', 'grid-row': 'span var(--sp-cell-row-sm, 1)' });
  });

  test('REQ-202 · DD-014 · the container breakpoints are the core’s: md from 640 px, lg from 1024 px', () => {
    expect([breakpointOf(639), breakpointOf(640), breakpointOf(1023), breakpointOf(1024)]).toEqual(['sm', 'md', 'md', 'lg']);
    const queries = [...css.matchAll(/@container\s+sp-dashboard\s+\(min-width:\s*(\d+)px\)\s*\{([\s\S]*?)\}\s*\}/g)].map((m) => [m[1], m[2]]);
    expect(queries.map(([width]) => width)).toEqual(['640', '1024']);
    expect(queries[0]![1]).toContain('--sp-dashboard-columns-md');
    expect(queries[0]![1]).toContain('--sp-cell-col-md');
    expect(queries[0]![1]).toContain('--sp-cell-row-md');
    expect(queries[1]![1]).toContain('--sp-dashboard-columns-lg');
    expect(queries[1]![1]).toContain('--sp-cell-col-lg');
    expect(queries[1]![1]).toContain('--sp-cell-row-lg');
  });

  test('REQ-213 · title and description paint from the ground’s text tokens on its substrate, the pairs the contrast gate proves', () => {
    expect(block('.sp-dashboard')).toMatchObject({ background: 'var(--sp-substrate)', color: 'var(--sp-text)', 'font-family': 'var(--sp-font-display)' });
    expect(block('.sp-dashboard-title').color).toBe('var(--sp-text)');
    expect(block('.sp-dashboard-description').color).toBe('var(--sp-text-muted)');
  });

  test('REQ-213 · no colour, face or framework of its own: every colour is a --sp- variable', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\b(rgb|hsl)a?\(/i);
    expect(css).not.toMatch(/font-family:\s*(?![\s]|var\()/);
    for (const [, value] of css.matchAll(/(?:^|[;{\s])(?:color|background|border-color|outline-color|outline):\s*([^;]+);/g)) expect(value).toMatch(/var\(--sp-/);
  });

  test('REQ-213 · the published stylesheet carries the dashboard rules: one import per app', () => {
    const built = src('dist/styles.css');
    expect(built.startsWith(src('src/styles.css'))).toBe(true);
    expect(built).toContain(src('src/dashboard.css'));
  });
});
