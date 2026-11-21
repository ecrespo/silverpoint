/** T-298 · nodes, not markup (REQ-637, DD-063; analyze A-02). */
import { describe, expect, test, vi } from 'vitest';
import { mount, mountAll } from '../../src/client/index';
import { renderToHTML } from '../../src/index';
import { forbidMarkup, host } from './helpers';

describe('client DOM', () => {
  test('REQ-637 · mounting builds every chart with DOM methods: no innerHTML, outerHTML, insertAdjacentHTML, DOMParser or createContextualFragment', () => {
    for (const chart of ['line-chart', 'heatmap-chart', 'sankey-chart', 'network-chart', 'gauge-arc']) {
      const target = host();
      expect(() => forbidMarkup(() => mount(target, { chart, width: 320, palette: 'sepia' }))).not.toThrow();
      expect(target.querySelector('.sp-root svg.sp-chart')).not.toBeNull();
    }
  });

  test('REQ-643 · palette declarations go through style.setProperty; no source writes a style attribute string', async () => {
    const setProperty = vi.spyOn(CSSStyleDeclaration.prototype, 'setProperty');
    mount(host(), { chart: 'bar-chart', palette: 'indigo' });
    expect(setProperty.mock.calls.some(([name]) => String(name).startsWith('--sp-'))).toBe(true);
    setProperty.mockRestore();
    const { readdirSync, readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const dir = join(process.cwd(), 'packages/embed/src/client');
    for (const file of readdirSync(dir)) {
      expect(readFileSync(join(dir, file), 'utf8'), file).not.toMatch(/setAttribute\(\s*['"]style['"]|\.style\.cssText\s*=|\.innerHTML\s*=/);
    }
  });

  test('A-02 · adopting a server-rendered root compares node trees and parses no markup', () => {
    const page = host();
    const fragment = renderToHTML({ chart: 'bar-chart', id: 'srv' }, { as: 'fragment', interactive: true, styles: 'none' });
    if (!fragment.ok) throw new Error('render');
    page.innerHTML = fragment.value.html; // the server's markup arrives as the page did
    const before = page.querySelector('.sp-root');
    const [handle] = forbidMarkup(() => mountAll(page));
    expect(handle?.element).toBe(before);
  });
});
