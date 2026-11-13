import { lineChart } from '@silverpoint/core';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import pkg from '../package.json';
import { stylesTextModule } from '../scripts/styles-text';
import { renderChart, standaloneSVG, toSVGString } from '../src';

const src = (file: string) => readFileSync(fileURLToPath(new URL(`../${file}`, import.meta.url)), 'utf8');
/** What `dist/styles.css` holds: the charts' rules, then the dashboard's. */
const css = src('src/styles.css') + src('src/dashboard.css');
const svg = toSVGString(renderChart(lineChart, { width: 320, height: 160 }, { id: 'sp-standalone' }));

/*
 * #14, #19: `toSVGString()` is the canonical markup, painted by the page's stylesheet; opened on
 * its own it has no colours. `standaloneSVG` puts a stylesheet inside it, and the stylesheet ships
 * as a string every bundler can import.
 */
describe('standaloneSVG (#14)', () => {
  test('API §8.1 · #14 · the stylesheet is the first child of the root <svg>, in CDATA; the markup is otherwise the canonical one', () => {
    const out = standaloneSVG(svg, css);
    const open = svg.slice(0, svg.indexOf('>') + 1);
    expect(out.startsWith(`${open}<style><![CDATA[`)).toBe(true);
    expect(out.replace(`<style><![CDATA[${css}]]></style>`, '')).toBe(svg);
  });

  test('API §8.1 · #14 · the ground stylesheet names <svg> in a comment: CDATA keeps the file well-formed XML', () => {
    expect(css).toMatch(/<svg>/);
    const out = standaloneSVG(svg, css);
    // Outside the CDATA section there is no markup the chart did not write.
    expect(out.replace(/<style><!\[CDATA\[[\s\S]*?\]\]><\/style>/, '')).toBe(svg);
  });

  test('API §8.1 · #14 · a stylesheet holding the CDATA terminator cannot close the section early', () => {
    const out = standaloneSVG(svg, 'a::after { content: "]]>"; }');
    expect(out).toContain('<![CDATA[a::after { content: "]]]]><![CDATA[>"; }]]></style>');
  });

  test('API §8.1 · #14 · a ">" inside a quoted attribute of the root does not end its tag early', () => {
    expect(standaloneSVG('<svg aria-label="a > b"><g/></svg>', 'x{}')).toBe('<svg aria-label="a > b"><style><![CDATA[x{}]]></style><g/></svg>');
  });

  test('API §8.1 · #14 · what is not an <svg> root is returned as it came', () => {
    expect(standaloneSVG('<div></div>', css)).toBe('<div></div>');
    expect(standaloneSVG('', css)).toBe('');
  });
});

describe('@silverpoint/grounds/styles-text (#19)', () => {
  test('#19 · the stylesheet as a module: its default export is the stylesheet, byte for byte', async () => {
    const { js, dts } = stylesTextModule(css);
    const module = (await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)) as { default: string };
    expect(module.default).toBe(css);
    expect(dts).toMatch(/declare const \w+: string;\s*export default \w+;/);
  });

  test('#19 · the package exports it with its types, and the build writes it', () => {
    expect((pkg.exports as Record<string, unknown>)['./styles-text']).toEqual({
      types: './dist/styles-text.d.ts',
      import: './dist/styles-text.js',
      default: './dist/styles-text.js',
    });
    expect(pkg.scripts.build).toContain('scripts/build-styles-text.ts');
  });
});
