// @vitest-environment happy-dom
/**
 * REQ-670 (delta-018, #28): no rule of styles.css reaches `SpTable`, so its look does not depend on
 * the order of styles.css and ui.css. The charts' tabular alternative (`table.sp-table`, REQ-121)
 * keeps its rules.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

// happy-dom replaces the global URL, so the path is joined rather than resolved as a URL.
const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/styles.css'), 'utf8');

/** Every selector of the stylesheet, outside at-rule preludes, comments removed. */
function selectors(): string[] {
  const out: string[] = [];
  const uncommented = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of uncommented.matchAll(/([^{}@;]+)\{[^{}]*\}/g)) {
    for (const selector of (match[1] ?? '').split(',')) if (selector.trim()) out.push(selector.trim());
  }
  return out;
}

/** `SpTable`'s markup as the UI fixtures canonicalise it (fixtures/ui/table--*.canonical.txt). */
const SP_TABLE = `<div class="sp-ui sp-table sp-ground-silverpoint" data-size="md" data-substrate="cream" id="t"><span aria-hidden="true" data-kind="card" part="sp-frame"></span><div class="sp-ui-table-scroll"><table class="sp-ui-table"><caption>Returns</caption><thead><tr><th scope="col">Order</th><th scope="col" data-align="end">Total</th></tr></thead><tbody><tr><td>A-1</td><td data-align="end">12</td></tr></tbody></table></div></div>`;

describe('styles.css and SpTable (REQ-670, #28)', () => {
  test('REQ-670 · no selector of styles.css matches an element of SpTable', () => {
    document.body.innerHTML = SP_TABLE;
    const root = document.getElementById('t')!;
    const elements = [root, ...root.querySelectorAll('*')];
    const hits = selectors().filter((selector) => {
      try {
        return elements.some((element) => element.matches(selector));
      } catch {
        return false; // a selector happy-dom cannot parse (a pseudo-element) styles no element here
      }
    });
    expect(hits.filter((s) => /sp-table|th|td|caption/.test(s))).toEqual([]);
  });

  test("REQ-670 · REQ-121 · the charts' tabular alternative keeps its rules", () => {
    // As `chart-root.ts` writes it.
    document.body.innerHTML = '<div class="sp-table-box" data-visibility="hidden"><table class="sp-table" id="c" data-visibility="hidden"><caption>Hits</caption><thead><tr><th scope="col">Hour</th><th scope="col">Hits</th></tr></thead><tbody><tr><th scope="row">1</th><td>2</td></tr></tbody></table></div>';
    const cell = document.querySelector('td')!;
    expect(selectors().filter((selector) => cell.matches(selector)).length).toBeGreaterThan(0);
    expect(selectors().some((selector) => document.querySelector('caption')!.matches(selector))).toBe(true);
  });
});
