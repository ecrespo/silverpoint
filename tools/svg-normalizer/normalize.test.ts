import { describe, expect, test } from 'vitest';
import { compareDashboard, compareDeck, compareSvg, normalizeDashboard, normalizeDeck, normalizeSvg } from './normalize';

const svg = (inner: string, attrs = 'viewBox="0 0 10 10" class="sp-chart"') => `<svg ${attrs}>${inner}</svg>`;

describe('svg-normalizer', () => {
  test('REQ-180 · attribute order is outside the contract', () => {
    const a = svg('<path d="M0,0H10" part="sp-ink" data-role="encoding"></path>');
    const b = svg('<path data-role="encoding" part="sp-ink" d="M0,0H10"></path>');
    expect(compareSvg(a, b)).toEqual({ equal: true });
  });

  test('REQ-180 · self-closing and explicit closing tags compare equal', () => {
    expect(compareSvg(svg('<path d="M0,0"/>'), svg('<path d="M0,0"></path>')).equal).toBe(true);
  });

  test('REQ-180 · entities are resolved before comparing', () => {
    const a = svg('<text x="1" y="2">Throughput &amp; &quot;hatching&quot; &lt;1&gt;</text>');
    const b = svg('<text y="2" x="1">Throughput &#38; "hatching" &lt;1></text>');
    expect(compareSvg(a, b).equal).toBe(true);
  });

  test('REQ-002 · numbers are compared at 2 decimals', () => {
    expect(compareSvg(svg('<path d="M1.50,2.254L3,4"></path>'), svg('<path d="M1.5,2.25L3,4"></path>')).equal).toBe(true);
    expect(compareSvg(svg('<path d="M1.5,2.26L3,4"></path>'), svg('<path d="M1.5,2.25L3,4"></path>')).equal).toBe(false);
  });

  test('DD-004 · a differing id is not ignored and fails, naming the attribute', () => {
    const result = compareSvg(svg('<title id="chart-a-title">A</title>'), svg('<title id="chart-b-title">A</title>'));
    expect(result.equal).toBe(false);
    expect(result.difference).toMatch(/id/);
  });

  test('DD-004 · the attributes Angular injects are filtered by an explicit list', () => {
    const angular =
      '<sp-line-chart ng-version="21.2.0" _nghost-ng-c123="" ngh="0"><!--container-->' +
      svg('<path _ngcontent-ng-c123="" ng-reflect-d="M0" d="M0,0"></path><!--ngh-->', '_ngcontent-ng-c123="" viewBox="0 0 10 10" class="sp-chart"') +
      '</sp-line-chart>';
    expect(compareSvg(angular, svg('<path d="M0,0"></path>')).equal).toBe(true);
  });

  test('DD-004 · an attribute not on the list is a difference, until someone adds it deliberately', () => {
    expect(compareSvg(svg('<path ng-new-marker="" d="M0,0"></path>'), svg('<path d="M0,0"></path>')).equal).toBe(false);
  });

  test('DD-004 · framework-generated id tokens normalise to a stable counter, references included', () => {
    const react = svg('<title id="sp-c-_r_0_-title">T</title><path fill="url(#sp-c-_r_0_-tone-2)"></path>', 'aria-labelledby="sp-c-_r_0_-title"');
    const vue = svg('<title id="sp-c-v-3-title">T</title><path fill="url(#sp-c-v-3-tone-2)"></path>', 'aria-labelledby="sp-c-v-3-title"');
    const angular = svg('<title id="sp-c-ng7-title">T</title><path fill="url(#sp-c-ng7-tone-2)"></path>', 'aria-labelledby="sp-c-ng7-title"');
    expect(compareSvg(react, vue).equal).toBe(true);
    expect(compareSvg(vue, angular).equal).toBe(true);
  });

  test('REQ-180 · whitespace between elements and comments are not content', () => {
    const spaced = `<svg viewBox="0 0 10 10" class="sp-chart">\n  <!-- a comment -->\n  <path d="M0,0"></path>\n  <text>  two   words </text>\n</svg>`;
    expect(compareSvg(spaced, svg('<path d="M0,0"></path><text>two words</text>')).equal).toBe(true);
  });

  test('REQ-180 · the chart svg is found inside surrounding markup', () => {
    const page = `<div class="sp-root"><svg class="sp-marker"></svg>${svg('<path d="M0,0"></path>')}<table></table></div>`;
    expect(compareSvg(page, svg('<path d="M0,0"></path>')).equal).toBe(true);
  });

  test('REQ-180 · a differing path is reported with the location of the first difference', () => {
    const result = compareSvg(svg('<path d="M0,0"></path><path d="M1,1"></path>'), svg('<path d="M0,0"></path><path d="M2,2"></path>'));
    expect(result.equal).toBe(false);
    expect(result.difference).toMatch(/svg > path\[1\].*d/);
  });

  test('REQ-182 · the normalised form is a stable, line-per-node text for committing as a canonical render', () => {
    const text = normalizeSvg(svg('<path part="sp-ink" d="M0,0"></path><text x="1">A &amp; B</text>'));
    expect(text).toBe(
      [
        '<svg class="sp-chart" viewBox="0 0 10 10">',
        '  <path d="M0,0" part="sp-ink">',
        '  <text x="1">',
        '    "A & B"',
      ].join('\n'),
    );
    expect(normalizeSvg(text.length > 0 ? svg('<text x="1">A &amp; B</text><path d="M0,0" part="sp-ink"/>') : '')).not.toBe(text);
  });
});

/** A dashboard wrapper around one cell, as React writes it. */
const wrapper = (cellStyle = '--sp-cell-col-sm:1;--sp-cell-col-md:1', extra = '') =>
  `<section class="sp-dashboard sp-ground-silverpoint" part="dashboard" data-substrate="cream" aria-labelledby="d-title" style="--sp-dashboard-columns-sm:1;--sp-dashboard-row-height:240px"><h2 class="sp-dashboard-title" part="dashboard-title" id="d-title">D</h2><div class="sp-dashboard-grid" part="dashboard-grid"><article class="sp-dashboard-cell" part="dashboard-cell" aria-labelledby="d--0-title" style="${cellStyle}">${extra}<div class="sp-root" data-substrate="cream">${svg('<path d="M0,0"></path>')}</div></article></div></section>`;

describe('dashboard tree comparison (DD-017, T-116)', () => {
  test('REQ-210 · the whole wrapper is compared, from the section down, charts included', () => {
    expect(compareDashboard(wrapper(), wrapper())).toEqual({ equal: true });
    expect(normalizeDashboard(wrapper())).toMatch(/^<section /);
  });

  test('REQ-210 · a wrapper attribute changed by one adapter fails, naming it', () => {
    const changed = wrapper().replace('part="dashboard-grid"', 'part="grid"');
    const result = compareDashboard(changed, wrapper());
    expect(result.equal).toBe(false);
    expect(result.difference).toMatch(/part/);
  });

  test('REQ-210 · a chart inside the wrapper that differs fails', () => {
    expect(compareDashboard(wrapper().replace('M0,0', 'M0,1'), wrapper()).equal).toBe(false);
  });

  test('DD-017 · an extra comment node in the wrapper fails', () => {
    const result = compareDashboard(wrapper(undefined, '<!-- note -->'), wrapper());
    expect(result.equal).toBe(false);
  });

  test('DD-017 · Vue’s and Angular’s hydration markers are the only comments stripped', () => {
    for (const marker of ['<!--[-->', '<!--]-->', '<!--v-if-->', '<!---->', '<!--container-->', '<!--ng-container-->', '<!--ngh-->']) {
      expect(compareDashboard(wrapper(undefined, marker), wrapper()), marker).toEqual({ equal: true });
    }
  });

  test('DD-017 · style is compared as declarations: a trailing semicolon is serialisation, not content', () => {
    expect(compareDashboard(wrapper('--sp-cell-col-sm:1;--sp-cell-col-md:1;'), wrapper()).equal).toBe(true);
    expect(compareDashboard(wrapper('--sp-cell-col-sm: 1; --sp-cell-col-md: 1'), wrapper()).equal).toBe(true);
    expect(compareDashboard(wrapper('--sp-cell-col-sm:1;--sp-cell-col-md:2'), wrapper()).equal).toBe(false);
    expect(compareDashboard(wrapper('--sp-cell-col-md:1;--sp-cell-col-sm:1'), wrapper()).equal).toBe(false);
  });

  test('DD-017 · REQ-002 · numbers in style are compared at 2 decimals', () => {
    const at = (w: string) => wrapper(`--sp-cell-col-sm:1;--sp-cell-col-md:1;--w:${w}`);
    expect(compareDashboard(at('288.004px'), at('288px')).equal).toBe(true);
    expect(compareDashboard(at('288.01px'), at('288px')).equal).toBe(false);
  });

  test('DD-017 · REQ-468 · a hex colour in style is a colour, not numbers: kept as written, one digit apart is a difference', () => {
    const at = (ink: string) => wrapper(`--sp-cell-col-sm:1;--sp-cell-col-md:1;--sp-ink:${ink}`);
    // `5E7` and `123E45` read as exponents would be rewritten, and two colours could normalise alike.
    expect(normalizeDashboard(at('#5A5E7A'))).toContain('--sp-ink:#5A5E7A');
    expect(normalizeDashboard(at('#123E45'))).toContain('--sp-ink:#123E45');
    expect(compareDashboard(at('#5A5E7A'), at('#5A5E7B')).equal).toBe(false);
    expect(compareDashboard(at('#123E45'), at('#123E46')).equal).toBe(false);
  });

  test('DD-017 · Angular’s component hosts are transparent: React and Vue never write an sp- element', () => {
    const angular = wrapper().replace(/<div class="sp-root"/, '<sp-line-chart><sp-chart-frame><div class="sp-root"').replace(/<\/div><\/article>/, '</div></sp-chart-frame></sp-line-chart></article>');
    expect(angular).toContain('<sp-line-chart>');
    expect(compareDashboard(angular, wrapper())).toEqual({ equal: true });
  });
});

describe('deck tree comparison (DD-017, T-278)', () => {
  const css = 'div.sp-deck-d > div.sp-deck-slide{display:block}';
  const deck = (opts: { style?: 'first' | 'last'; css?: string; slide?: string; host?: boolean } = {}) => {
    const style = `<style>${opts.css ?? css}</style>`;
    const body = `<div class="sp-deck-viewport"><div class="sp-deck-d"><div class="sp-deck-slide" data-sp-slide="1" data-sp-current="">${opts.slide ?? '<section id="1"><h1>A</h1></section>'}</div></div></div><p class="sp-deck-status">Slide 1 of 1</p>`;
    const root = `<div class="sp-deck sp-ground-silverpoint" role="region">${opts.style === 'last' ? body + style : style + body}</div>`;
    return opts.host ? `<sp-deck>${root}</sp-deck>` : root;
  };

  test('REQ-623 · the deck is compared from its root, slides included', () => {
    expect(compareDeck(deck(), deck())).toEqual({ equal: true });
    expect(normalizeDeck(deck())).toMatch(/^<div /);
    expect(compareDeck(deck({ slide: '<section id="1"><h1>B</h1></section>' }), deck()).equal).toBe(false);
  });

  test('REQ-623 · the scoped style is compared by its text, wherever the adapter writes it in the root', () => {
    expect(compareDeck(deck({ style: 'last' }), deck())).toEqual({ equal: true });
    const changed = compareDeck(deck({ css: 'div.sp-deck-d > div.sp-deck-slide{display:none}' }), deck());
    expect(changed.equal).toBe(false);
    expect(changed.difference).toMatch(/style/);
    // Escaped, the CSS is different CSS: the T-277 bug is a difference.
    expect(compareDeck(deck({ css: css.replace('>', '&gt;') }), deck()).equal).toBe(false);
  });

  test('DD-017 · the Angular host around the deck is outside the comparison', () => {
    expect(compareDeck(deck({ host: true }), deck())).toEqual({ equal: true });
  });
});
