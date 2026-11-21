/** T-306 · fonts (REQ-647): embedded faces from data, no request in either mode. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { mount } from '../../src/client/index';
import { provideEmbeddedFonts } from '../../src/client/fonts';
import { host } from './helpers';

afterEach(() => provideEmbeddedFonts(undefined));

const sheetText = () => document.adoptedStyleSheets.flatMap((s) => [...s.cssRules].map((r) => r.cssText)).join('');

describe('fonts', () => {
  test("REQ-647 · fonts: 'embedded' in a build that carries faces registers them from data URIs", () => {
    provideEmbeddedFonts("@font-face{font-family:'EB Garamond';src:url(data:font/woff2;base64,AAAA) format('woff2')}");
    const fetch = vi.spyOn(globalThis, 'fetch');
    mount(host(), { chart: 'bar-chart' });
    expect(sheetText()).toContain('@font-face');
    expect(sheetText()).toContain('data:font/woff2');
    expect(fetch).not.toHaveBeenCalled();
  });

  test("REQ-647 · the module build carries no face: the default is 'none' and no @font-face is written", () => {
    mount(host(), { chart: 'bar-chart' });
    expect(sheetText()).not.toContain('@font-face');
  });

  test("REQ-647 · fonts: 'none' writes no face even where the build carries them", () => {
    provideEmbeddedFonts('@font-face{font-family:x;src:url(data:font/woff2;base64,AA)}');
    mount(host(), { chart: 'bar-chart' }, { fonts: 'none' });
    expect(sheetText()).not.toContain('@font-face');
  });
});
