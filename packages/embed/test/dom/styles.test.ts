/** T-303 · the stylesheet through the CSSOM, once per root (REQ-643, DD-063). */
import { describe, expect, test, vi } from 'vitest';
import { mount } from '../../src/client/index';
import { host } from './helpers';

describe('styles', () => {
  test('REQ-643 · two charts in one document adopt one constructed sheet', () => {
    mount(host(), { chart: 'bar-chart' });
    mount(host(), { chart: 'line-chart' });
    expect(document.adoptedStyleSheets).toHaveLength(1);
    expect(document.querySelectorAll('style').length).toBe(0);
    const text = [...document.adoptedStyleSheets[0]!.cssRules].map((r) => r.cssText).join('');
    expect(text).toContain('sp-ground-silverpoint');
  });

  test('REQ-643 · each shadow root adopts its own sheet once', () => {
    const a = host().attachShadow({ mode: 'open' });
    const b = host().attachShadow({ mode: 'open' });
    for (const root of [a, b, a]) {
      const box = document.createElement('div');
      root.append(box);
      mount(box, { chart: 'bar-chart' });
    }
    expect(a.adoptedStyleSheets).toHaveLength(1);
    expect(b.adoptedStyleSheets).toHaveLength(1);
  });

  test('REQ-643 · without constructable sheets, one <style data-sp-embed> per root', () => {
    vi.stubGlobal('CSSStyleSheet', class {
      replaceSync(): void {
        throw new TypeError('constructable stylesheets are not supported');
      }
    });
    try {
      const shadow = host().attachShadow({ mode: 'open' });
      for (let i = 0; i < 2; i++) {
        const box = document.createElement('div');
        shadow.append(box);
        mount(box, { chart: 'bar-chart' });
      }
      expect(shadow.querySelectorAll('style[data-sp-embed]')).toHaveLength(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  test("REQ-643 · styles: 'none' adopts nothing", () => {
    mount(host(), { chart: 'bar-chart' }, { styles: 'none' });
    expect(document.adoptedStyleSheets).toHaveLength(0);
  });
});
