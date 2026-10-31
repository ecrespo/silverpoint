import { Component, type Type } from '@angular/core';
import { provideSilverpoint } from '@silverpoint/angular/env';
import { SpDeckComponent } from '@silverpoint/angular/deck';
import { describe, expect, test } from 'vitest';
import { ssrHost } from './ui-fixture';

/* Angular `<sp-deck>` on the server (T-275; REQ-608, REQ-612, REQ-614). */

const fence = '```silverpoint\n{"chart":"donut-chart","props":{"title":"Share"}}\n```';
const MD = `# Opening\n\n${fence}\n\n---\n\n## Middle\n\n* a\n* b\n\n---\n\n# End`;

const host = (template: string, members: object = {}): Type<unknown> =>
  Component({ selector: 'app-root', imports: [SpDeckComponent], template })(
    class {
      readonly md = MD;
      constructor() {
        Object.assign(this, members);
      }
    },
  );

describe('<sp-deck> on the server (Angular)', () => {
  test('REQ-612 · renders on the server: region, current slide, static chart, scoped style, controls without fullscreen', async () => {
    const html = await ssrHost(host('<sp-deck [markdown]="md" id="d1" />'));
    expect(html).toMatch(/<div class="sp-deck sp-ground-silverpoint" part="sp-deck" role="region" aria-roledescription="slide deck" aria-label="Opening" tabindex="0"/);
    expect(html).toContain('data-sp-page="1"');
    // The scoped style is the root's first child, once.
    expect(html).toMatch(/tabindex="0"[^>]*><style>/);
    expect(html.match(/<style>/g)).toHaveLength(1);
    // The style's text is raw CSS: Marpit's child combinators survive the server (T-277).
    const css = /<style>([\s\S]*?)<\/style>/.exec(html)![1]!;
    expect(css).toContain(' > ');
    expect(css).not.toContain('&gt;');
    expect(html).toMatch(/<div class="sp-deck-slide" data-sp-slide="1" data-sp-current="">/);
    expect(html).toMatch(/<div class="sp-deck-slide" data-sp-slide="2" hidden="" inert="">/);
    expect(html).toContain('data-sp-slot="s1-c1"');
    expect(html).toContain('class="sp-root');
    expect(html).toContain('aria-label="Next slide"');
    expect(html).not.toContain('aria-label="Full screen"');
    expect(html).toContain('Slide 1 of 3');
  });

  test('REQ-608 · provider defaults reach the slides; the deck’s own inputs win', async () => {
    const providers = [provideSilverpoint({ ground: 'cyanotype' })];
    expect(await ssrHost(host('<sp-deck markdown="# A" id="d2" />'), providers)).toMatch(/class="sp-deck sp-ground-cyanotype"[\s\S]*<section[^>]*\sdata-sp-ground="cyanotype"/);
    expect(await ssrHost(host('<sp-deck markdown="# A" id="d3" ground="silverpoint" />'), providers)).toMatch(/class="sp-deck sp-ground-silverpoint"[\s\S]*<section[^>]*\sdata-sp-ground="silverpoint"/);
  });

  test('REQ-612 · a controlled page renders that page on the server', async () => {
    const html = await ssrHost(host('<sp-deck [markdown]="md" id="d4" [page]="2" />'));
    expect(html).toContain('data-sp-page="2"');
    expect(html).toMatch(/data-sp-slide="2" data-sp-current=""/);
    expect(html).toContain('Slide 2 of 3');
  });
});
