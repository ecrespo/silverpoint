import { UI_DEMOS } from '@silverpoint/core/ui-demos';
import { describe, expect, test } from 'vitest';
import { compareUi, normalizeUi, parseUi } from '../svg-normalizer/normalize';
import { canonicalUiMarkup, serializeUi } from './ui-canonical';
import { readFileSync } from 'node:fs';
import { FIXTURES_DIR } from './fixtures';
import { canonicalUiFor } from './ui-canonical';
import { GATED_UI, loadUiFixtures, uiFixtureParts, uiMatrix } from './ui-fixtures';
import { committedUi, runUiGate } from './ui-gate';

describe('UI fixture matrix (T-153)', () => {
  test('REQ-327 · REQ-182 · the gated batch B1: every state × 5 ground substrates × 2 modes, plus sm and lg of Button and Input', () => {
    expect(GATED_UI.map((c) => c.slug)).toEqual(['button', 'input', 'checkbox', 'switch', 'card', 'divider']);
    const states = GATED_UI.reduce((n, c) => n + c.states.length, 0);
    expect(states).toBe(19);
    const matrix = uiMatrix();
    expect(matrix).toHaveLength(states * 10 + 2 * 2 * 10);
    expect(new Set(matrix.map((f) => f.id)).size).toBe(matrix.length);
    // On every PR: every state × 2 modes × silverpoint/cream and cyanotype/prussian (Data Model §5).
    expect(matrix.filter((f) => f.scope === 'pr')).toHaveLength(states * 2 * 2);
  });

  test('REQ-329 · a fixture carries its component, state, ground and harness width; Card is laid out at 640', () => {
    const [first] = uiMatrix();
    expect(first).toMatchObject({ component: 'button', state: 'default', req: 'REQ-327', width: 320, size: 'md' });
    expect(first!.id).toBe('button--default--silverpoint--cream--ink');
    expect(uiMatrix().find((f) => f.component === 'card')?.width).toBe(640);
    expect(uiMatrix().some((f) => f.id === 'input--empty--cyanotype--prussian--precision--lg')).toBe(true);
  });

  test('REQ-327 · a fixture\'s props are the demo\'s, with the fixture\'s ground, substrate, mode and size; value and slot text apart', () => {
    const fixture = uiMatrix().find((f) => f.id === 'card--titled--silverpoint--blue--precision')!;
    const parts = uiFixtureParts(fixture);
    expect(parts.props).toMatchObject({ id: 'card--titled', title: 'Revenue', ground: 'silverpoint', substrate: 'blue', mode: 'precision', size: 'md' });
    expect(parts.props).not.toHaveProperty('extra');
    expect(parts.props).not.toHaveProperty('content');
    expect(parts.slots).toEqual({ content: UI_DEMOS.card!.titled!.content, extra: 'Q3' });
    const input = uiFixtureParts(uiMatrix().find((f) => f.id === 'input--filled--silverpoint--cream--ink')!);
    expect(input.value).toBe('Caracas');
    expect(input.props).not.toHaveProperty('value');
  });
});

describe('the reference writer (T-153)', () => {
  test('REQ-327 · serializes a view tree as HTML: boolean attributes empty, void elements unclosed, text escaped', () => {
    const html = serializeUi({ tag: 'label', attrs: { class: 'x' }, children: [{ tag: 'input', attrs: { checked: true, value: 'a"b' }, children: [] }, { text: '1 < 2 & 3' }] }, {});
    expect(html).toBe('<label class="x"><input checked="" value="a&quot;b">1 &lt; 2 &amp; 3</label>');
  });

  test('REQ-327 · slots take the fixture\'s text; a slot without text is left empty', () => {
    expect(serializeUi({ tag: 'span', attrs: {}, children: [{ slot: 'content' }, { slot: 'footer' }] }, { content: 'Save' })).toBe('<span>Save</span>');
  });

  test('REQ-327 · every B1 fixture has a canonical markup whose root is the component', () => {
    for (const fixture of uiMatrix()) {
      const markup = canonicalUiMarkup(fixture);
      expect(parseUi(markup).attrs.find(([n]) => n === 'class')?.[1]).toContain(`sp-${fixture.component}`);
    }
  });
});

describe('parseUi (T-154)', () => {
  test('REQ-327 · finds the component root, unwraps Angular hosts, sorts attributes and reads style as declarations', () => {
    const angular = '<sp-card ngh="0"><section class="sp-ui sp-card" data-mode="ink" style="--a: 1.005 ;"><!--container--><sp-x><div class="b"></div></sp-x></section></sp-card>';
    const react = '<section data-mode="ink" class="sp-ui sp-card" style="--a:1"><div class="b"></div></section>';
    expect(compareUi(angular, react)).toEqual({ equal: true });
    expect(normalizeUi(react)).toContain('section');
  });

  test('REQ-327 · a different attribute value is a difference', () => {
    const a = '<button class="sp-ui sp-button" type="button"></button>';
    const b = '<button class="sp-ui sp-button" type="submit"></button>';
    expect(compareUi(a, b).equal).toBe(false);
  });

  test('REQ-327 · A-03 · DD-024 · the selector attribute of an Angular attribute component is the consumer\'s markup, outside the contract', () => {
    const angular = '<button spbutton="" class="sp-ui sp-button" type="button"></button>';
    const react = '<button class="sp-ui sp-button" type="button"></button>';
    expect(compareUi(angular, react)).toEqual({ equal: true });
  });
});

describe('committed UI fixtures (T-153, T-154)', () => {
  test('REQ-327 · REQ-182 · the committed fixtures are the matrix, and every canonical render is current: the core alone draws it', () => {
    const committed = loadUiFixtures();
    expect(committed.map((f) => f.id)).toEqual(uiMatrix().map((f) => f.id).sort());
    for (const fixture of committed) expect(readFileSync(`${FIXTURES_DIR}/${fixture.canonical}`, 'utf8'), fixture.id).toBe(canonicalUiFor(fixture));
    expect(loadUiFixtures('pr')).toHaveLength(76);
  });

  test('REQ-327 · the gate compares with the committed file, and an adapter that moves one attribute fails', async () => {
    const [fixture] = loadUiFixtures('pr');
    const faithful = async () => committedUi(fixture!);
    const drifting = async () => committedUi(fixture!).replace('data-size="md"', 'data-size="lg"');
    const results = await runUiGate([fixture!], { react: faithful, vue: faithful, angular: drifting });
    expect(results.map((r) => r.equal)).toEqual([true, true, false]);
    expect(results[2]!.equal === false && results[2]!.difference).toMatch(/data-size/);
  });
});
