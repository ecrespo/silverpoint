import { describe, expect, test } from 'vitest';
import { compareSvg, normalizeSvg } from './normalize';

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
