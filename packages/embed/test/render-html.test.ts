/** T-295 · `renderToHTML` (REQ-633): structure first (API delta §3, §5), goldens after review. */
import { readdirSync, readFileSync } from 'node:fs';
import { toChartRootString } from '@silverpoint/grounds';
import { describe, expect, test } from 'vitest';
import { renderSpec, renderToHTML } from '../src/index';
import { escapeJsonForScript } from '../src/render/escape';

const html = (spec: Parameters<typeof renderToHTML>[0], options?: Parameters<typeof renderToHTML>[1]) => {
  const result = renderToHTML(spec, options);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value.html;
};
const spec = { chart: 'bar-chart', id: 'orders', props: { title: 'Orders' } } as const;
const root = () => {
  const r = renderSpec(spec);
  if (!r.ok) throw new Error('render');
  return toChartRootString(r.value);
};

describe('renderToHTML', () => {
  test('REQ-633 · a static document: doctype, lang, title, the stylesheet, the chart root, no script', () => {
    const doc = html(spec);
    expect(doc.startsWith('<!doctype html><html lang="en"><head><meta charset="utf-8">')).toBe(true);
    expect(doc).toContain('<title>Orders</title>');
    expect(doc).toMatch(/<style>[^<]+<\/style>/);
    expect(doc).toContain(root());
    expect(doc).not.toContain('<script');
  });

  test('REQ-633 · a static fragment is one <div> holding the stylesheet and the root', () => {
    const fragment = html(spec, { as: 'fragment' });
    expect(fragment.startsWith('<div class="sp-embed">')).toBe(true);
    expect(fragment.endsWith('</div>')).toBe(true);
    expect(fragment).toContain(root());
    expect(fragment).not.toContain('<!doctype');
  });

  test('REQ-633 · styles: none writes no stylesheet', () => {
    expect(html(spec, { as: 'fragment', styles: 'none' })).not.toContain('<style');
  });

  test('REQ-633 · interactive: the spec as JSON in a data-sp-embed box, before the server root', () => {
    const fragment = html(spec, { as: 'fragment', interactive: true });
    expect(fragment.startsWith('<div data-sp-embed><script type="application/json">')).toBe(true);
    const json = /<script type="application\/json">([^<]*)<\/script>/.exec(fragment)![1]!;
    expect(JSON.parse(json)).toEqual(spec);
    expect(fragment).toContain(root());
  });

  test('REQ-633 · interactive document: script none / src with integrity / inline', () => {
    expect(html(spec, { interactive: true })).not.toMatch(/<script(?! type="application\/json")/);
    const withSrc = html(spec, { interactive: true, script: { src: '/static/silverpoint-embed.full.js', integrity: 'sha384-abc' } });
    expect(withSrc).toContain('<script src="/static/silverpoint-embed.full.js" integrity="sha384-abc" crossorigin="anonymous"></script>');
    const inline = html(spec, { interactive: true, script: { inline: 'window.x = "</script>";' } });
    expect(inline).toContain('<script>window.x = "<\\/script>";</script>');
  });

  test('REQ-633 · title and lang options', () => {
    expect(html(spec, { title: 'Report <1>', lang: 'es' })).toContain('<html lang="es">');
    expect(html(spec, { title: 'Report <1>' })).toContain('<title>Report &lt;1&gt;</title>');
  });

  test('REQ-633 · embedFonts adds the face to the inline stylesheet', () => {
    expect(html(spec, { embedFonts: true })).toContain('@font-face');
  });

  test('REQ-633 · an invalid spec returns no markup', () => {
    expect(renderToHTML({ chart: 'nope' })).toMatchObject({ ok: false });
  });

  test('REQ-633 · JSON for a script context escapes <, >, &, U+2028 and U+2029 and round-trips', () => {
    const value = { a: '</script><!-- & \u2028 \u2029 >' };
    const text = escapeJsonForScript(value);
    expect(text).not.toMatch(/[<>&\u2028\u2029]/);
    expect(JSON.parse(text)).toEqual(value);
  });

  test('REQ-633 · the hostile corpus: every hostile spec yields exactly one closing tag per script and parses back', () => {
    const dir = new URL('../../../fixtures/embed/hostile/', import.meta.url);
    const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
    expect(files.length).toBeGreaterThanOrEqual(6);
    for (const file of files) {
      const hostile = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
      const result = renderToHTML(hostile, { interactive: true });
      if (!result.ok) continue; // rejected input is safe by construction
      const out = result.value.html;
      expect(out.match(/<\/script>/g)?.length, file).toBe(out.match(/<script\b/g)?.length);
      expect(out, file).not.toMatch(/<(img|iframe|svg onload|a href=)[^>]*(onerror|onload|javascript:)/i);
      const json = /<script type="application\/json">([^<]*)<\/script>/.exec(out)![1]!;
      expect(JSON.parse(json), file).toEqual(hostile);
    }
  });

  test('REQ-633 · goldens: the committed documents are what renderToHTML writes', () => {
    const dir = new URL('../../../fixtures/embed/html/', import.meta.url);
    const cases = JSON.parse(readFileSync(new URL('cases.json', dir), 'utf8')) as { file: string; spec: object; options: object }[];
    expect(cases.length).toBeGreaterThanOrEqual(9);
    for (const c of cases) expect(html(c.spec as never, c.options as never), c.file).toBe(readFileSync(new URL(c.file, dir), 'utf8'));
  });
});
