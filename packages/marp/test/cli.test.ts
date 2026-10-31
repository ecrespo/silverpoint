import { Marpit } from '@marp-team/marpit';
import { __setDiagnosticSink } from '@silverpoint/core';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import SilverpointMarp from '../src/cli';
import { GROUNDS_CSS } from '../src/cli/grounds-css.generated';

/* `--engine @silverpoint/marp/cli` (T-266, REQ-583): a Marpit class Marp CLI loads by module name. */

let restore: () => void;
beforeEach(() => {
  restore = __setDiagnosticSink(() => {});
});
afterEach(() => restore());

const MD = ['---', 'ground: cyanotype', '---', '', '<!-- _class: plate -->', '# One', '', '```silverpoint', '{"chart":"donut-chart","width":400,"height":240}', '```'].join('\n');

describe('the Marp CLI engine (T-266)', () => {
  test('REQ-583 · it is a class inherited from Marpit, as Marp CLI requires of a module engine', () => {
    expect(new SilverpointMarp()).toBeInstanceOf(Marpit);
  });

  test('REQ-583 · it renders the directives, the backdrops and the fences as static SVG', () => {
    const { html } = new SilverpointMarp().render(MD);
    expect(html).toContain('data-sp-ground="cyanotype" data-sp-substrate="prussian"');
    expect(html).toContain('--sp-deck-backdrop:url(');
    expect(html).toMatch(/<figure class="sp-deck-chart" data-sp-slot="s1-c1"[^>]*><div class="sp-root sp-ground-cyanotype"[^>]*><svg /);
  });

  test('REQ-583 · the silverpoint theme is its default; the charts’ stylesheet comes with the CSS', () => {
    const { css } = new SilverpointMarp().render(MD);
    expect(css).toContain('--sp-substrate: #1B3F6B');
    expect(css).toContain('font-family: var(--sp-font-display)');
    expect(css.endsWith(GROUNDS_CSS)).toBe(true);
    expect(GROUNDS_CSS).toContain(".sp-chart [part='sp-rule']{stroke:var(--sp-rule)}");
  });

  test('REQ-572 · REQ-575 · raw HTML stays off and author CSS cannot close the style element', () => {
    const { html, css } = new SilverpointMarp({ markdown: { html: true } } as never).render('<script>alert(1)</script>\n\n<style>a::after{content:"</style><script>x</script>"}</style>\n\n# A');
    expect(html).not.toContain('<script');
    expect(css).not.toMatch(/<\/style/i);
  });

  test('REQ-572 · REQ-575 · raw HTML stays off even when the host turns it on after construction (Marp CLI --html)', () => {
    const engine = new SilverpointMarp();
    (engine.markdown as unknown as { set(o: object): void }).set({ html: true });
    (engine.markdown as unknown as { options: { html: boolean } }).options.html = true;
    const { html } = engine.render('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n# A');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
  });

  test('REQ-574 · each render is a fresh deck: the same Markdown, the same output', () => {
    const engine = new SilverpointMarp();
    expect(engine.render(MD)).toEqual(engine.render(MD));
  });
});
