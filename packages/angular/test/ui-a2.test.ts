import { Component, type Type } from '@angular/core';
import { SpCollapse, SpCollapseItem, SpInputNumber, SpPagination, SpTextarea } from '@silverpoint/angular/ui';
import { describe, expect, test } from 'vitest';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiFixtureParts, uiMatrix, type UiFixture } from '../../../tools/visual-gate/ui-matrix';
import { fixtureHost, ssrHost } from './ui-fixture';

/*
 * Angular A2 (T-214, REQ-476, REQ-482, REQ-484, REQ-485, REQ-488): the core's view, attribute for
 * attribute; hosts are outside the parity contract (DD-017).
 */

const A2 = [SpPagination, SpCollapse, SpCollapseItem, SpTextarea, SpInputNumber];
const COMMON = ['ground', 'substrate', 'mode', 'size'] as const;

/** A Collapse holds its items, as a consumer writes them (Data Model §5). */
function collapseHost(fixture: UiFixture): Type<unknown> {
  const { props } = uiFixtureParts(fixture);
  const { items, ...rest } = props as typeof props & { items: readonly Record<string, unknown>[] };
  const common = COMMON.map((name) => `[${name}]="props.${name}"`).join(' ');
  const template =
    `<sp-collapse ${common} [id]="props.id" [accordion]="props.accordion">` +
    `@for (i of items; track i['key']) {<sp-collapse-item ${common} [title]="i['title']" [disabled]="i['disabled']" [defaultOpen]="i['open']">{{ i['content'] }}</sp-collapse-item>}` +
    `</sp-collapse>`;
  return Component({ selector: 'app-root', imports: A2, template })(
    class Host {
      props = rest;
      items = items;
    },
  );
}

describe('Angular A2 markup (T-214)', () => {
  test.each(uiMatrix(['A2']).filter((f) => f.scope === 'pr'))('REQ-327 · $id is the canonical tree', async (fixture) => {
    const host = fixture.component === 'collapse' ? collapseHost(fixture) : fixtureHost(fixture, A2);
    expect(compareUi(await ssrHost(host), canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });
});
