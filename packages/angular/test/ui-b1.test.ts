import { Component } from '@angular/core';
import { provideSilverpoint } from '@silverpoint/angular';
import { SpButton, SpCard, SpCheckbox, SpDivider, SpInput, SpSwitch } from '@silverpoint/angular/ui';
import { __setDiagnosticSink, type SpCode } from '@silverpoint/core';
import { afterEach, describe, expect, test } from 'vitest';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiMatrix } from '../../../tools/visual-gate/ui-matrix';
import { fixtureHost, ssrHost } from './ui-fixture';

const B1 = [SpButton, SpInput, SpCheckbox, SpSwitch, SpCard, SpDivider];

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});

describe('Angular B1 markup (T-146)', () => {
  test.each(uiMatrix().filter((f) => f.scope === 'pr'))('REQ-327 · $id is the canonical tree', async (fixture) => {
    expect(compareUi(await ssrHost(fixtureHost(fixture, B1)), canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  test('REQ-327 · A-03 · SpButton decorates the consumer\'s own <button>: no host element of its own', async () => {
    const Host = Component({ selector: 'app-root', imports: [SpButton], template: '<button spButton variant="primary">Save</button>' })(class {});
    const html = await ssrHost(Host);
    expect(html).toMatch(/<button[^>]*class="sp-ui sp-button sp-ground-silverpoint"[^>]*>/);
    expect(html).not.toContain('<sp-button');
  });
});

describe('Angular B1 configuration (T-143)', () => {
  test('REQ-311 · REQ-333 · provideSilverpoint grounds components; an input wins', async () => {
    const Host = Component({ selector: 'app-root', imports: [SpDivider], template: '<sp-divider id="a" /><sp-divider id="b" substrate="ochre" />' })(class {});
    const html = await ssrHost(Host, [provideSilverpoint({ ground: 'cyanotype', substrate: 'green' })]);
    expect(html).toContain('sp-ground-cyanotype');
    expect(html.match(/data-substrate="(\w+)"/g)).toEqual(['data-substrate="green"', 'data-substrate="ochre"']);
  });

  test('REQ-319 · a nameless SpButton warns SP018', async () => {
    const seen: SpCode[] = [];
    cleanup.push(__setDiagnosticSink((code) => seen.push(code)));
    const Host = Component({ selector: 'app-root', imports: [SpButton], template: '<button spButton></button>' })(class {});
    await ssrHost(Host);
    expect(seen).toContain('SP018');
  });
});
