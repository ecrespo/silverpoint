// @vitest-environment happy-dom
/**
 * Step 11d's outer test (tdd-plan §2), over the built files (REQ-649, REQ-651, I-57 in its own
 * rule's test, I-60 on the shipped files): the module build in plain Node with DOM globals that
 * throw; the script build in a DOM, defining `Silverpoint` and the element and mounting the page.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const ROOT = join(process.cwd(), process.cwd().endsWith('tools') ? '..' : '.');
const DIST = join(ROOT, 'packages/embed/dist');
const FILES = ['silverpoint-embed.js', 'silverpoint-embed.mjs', 'silverpoint-embed.full.js', 'silverpoint-embed.full.mjs'];
const version = JSON.parse(readFileSync(join(ROOT, 'packages/embed/package.json'), 'utf8')).version as string;

describe('standalone files', () => {
  test('REQ-649 · the four files, the two JSON files and integrity.json are built', () => {
    for (const file of [...FILES, 'host-catalog.json', 'conformance.json', 'integrity.json']) expect(existsSync(join(DIST, file)), file).toBe(true);
  });

  test('REQ-651 · a banner with the version on line 1, and integrity.json’s SHA-384 matches each file', () => {
    const integrity = JSON.parse(readFileSync(join(DIST, 'integrity.json'), 'utf8')) as Record<string, string>;
    for (const file of FILES) {
      const text = readFileSync(join(DIST, file), 'utf8');
      expect(text.split('\n')[0], file).toContain(`@silverpoint/embed ${version}`);
      expect(integrity[file], file).toBe(`sha384-${createHash('sha384').update(text, 'utf8').digest('base64')}`);
    }
  });

  test.each(['silverpoint-embed.mjs', 'silverpoint-embed.full.mjs'])('REQ-649 · %s in plain Node, with DOM globals that throw: renderToSVG, specFromTable and conformance (I-60)', (file) => {
    const script = `
      for (const name of ['document', 'window', 'customElements', 'HTMLElement', 'matchMedia', 'ResizeObserver']) {
        Object.defineProperty(globalThis, name, { configurable: true, get() { throw new Error('DOM global ' + name + ' touched'); } });
      }
      const m = await import(${JSON.stringify(join(DIST, file))});
      const svg = m.renderToSVG({ chart: 'bar-chart' });
      const bound = m.specFromTable({ chart: 'bar-chart', table: { rows: [{ a: 'x', b: 1 }] }, roles: { x: 'a', value: 'b' } });
      const kit = await m.conformance((spec) => m.renderToSVG(spec).value.svg);
      process.stdout.write(JSON.stringify({ svg: svg.ok, bound: bound.ok, passed: kit.passed, failed: kit.failed.length, version: m.version }));
    `;
    const out = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' }));
    expect(out).toMatchObject({ svg: true, bound: true, failed: 0, version });
    expect(out.passed).toBeGreaterThan(60);
  });

  test.each(['silverpoint-embed.js', 'silverpoint-embed.full.js'])('REQ-649 · %s in a DOM: Silverpoint global, the element defined, the page mounted', async (file) => {
    document.body.innerHTML = '<div data-sp-embed><script type="application/json">{"chart":"bar-chart"}</script></div><silverpoint-chart><script type="application/json">{"chart":"donut-chart"}</script></silverpoint-chart>';
    document.adoptedStyleSheets = [];
    (0, eval)(readFileSync(join(DIST, file), 'utf8'));
    await new Promise((resolve) => setTimeout(resolve, 20));
    const silverpoint = (globalThis as unknown as { Silverpoint: { version: string; mount: unknown; HOST_CATALOG?: unknown } }).Silverpoint;
    expect(silverpoint.version).toBe(version);
    expect(typeof silverpoint.mount).toBe('function');
    expect(silverpoint.HOST_CATALOG).toBeUndefined();
    expect(customElements.get('silverpoint-chart')).toBeDefined();
    expect(document.querySelectorAll('.sp-root')).toHaveLength(2);
    const fonts = [...document.adoptedStyleSheets].flatMap((s) => [...s.cssRules].map((r) => r.cssText)).join('');
    expect(fonts.includes('@font-face'), 'faces only in the full file').toBe(file.includes('full'));
  });
});
