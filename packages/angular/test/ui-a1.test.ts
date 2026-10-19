import { Component, type Type } from '@angular/core';
import {
  SpAvatar,
  SpAvatarGroup,
  SpBreadcrumb,
  SpDescriptions,
  SpEmpty,
  SpGlyph,
  SpResult,
  SpStatistic,
  SpSurface,
  SpTable,
  SpTimelineList,
  SpCardExtra,
} from '@silverpoint/angular/ui';
import { describe, expect, test } from 'vitest';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiFixtureParts, uiMatrix, type UiFixture } from '../../../tools/visual-gate/ui-matrix';
import { fixtureHost, ssrHost } from './ui-fixture';

/*
 * Angular A1 (T-213, REQ-470, REQ-472..REQ-483): the core's view, attribute for attribute; hosts
 * are outside the parity contract (DD-017). `SpSurface` is an attribute component, `[spSurface]`:
 * the consumer's element is the root, as `SpButton`'s is (DD-024).
 */

const A1 = [SpSurface, SpGlyph, SpTable, SpBreadcrumb, SpAvatar, SpAvatarGroup, SpStatistic, SpDescriptions, SpTimelineList, SpEmpty, SpResult];

const COMMON = ['ground', 'substrate', 'mode', 'size'] as const;

/** Glyph `all` and Avatar `group` compose, as a consumer writes them (Data Model §5). */
function composedHost(fixture: UiFixture): Type<unknown> | undefined {
  const { props } = uiFixtureParts(fixture);
  const { glyphs, avatars, ...rest } = props as typeof props & { glyphs?: readonly string[]; avatars?: readonly Record<string, unknown>[] };
  const common = COMMON.map((name) => `[${name}]="props.${name}"`).join(' ');
  const template = glyphs
    ? `@for (g of glyphs; track g) {<sp-glyph ${common} [glyph]="g" />}`
    : avatars
      ? `<sp-avatar-group ${common} [id]="props.id" [label]="props.label">@for (a of avatars; track $index) {<sp-avatar ${common} [name]="a.name" [shape]="a.shape" />}</sp-avatar-group>`
      : undefined;
  if (!template) return undefined;
  return Component({ selector: 'app-root', imports: A1, template })(
    class Host {
      props = rest;
      glyphs = glyphs;
      avatars = avatars;
    },
  );
}

describe('Angular A1 markup (T-213)', () => {
  test.each(uiMatrix(['A1']).filter((f) => f.scope === 'pr'))('REQ-470 · $id is the canonical tree', async (fixture) => {
    const host = composedHost(fixture) ?? fixtureHost(fixture, A1);
    expect(compareUi(await ssrHost(host), canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  const html = async (template: string) =>
    (await ssrHost(Component({ selector: 'app-root', imports: [...A1, SpCardExtra], template })(class {}))).replace(/<!--[^>]*-->|<\/?sp-ui-tree[^>]*>/g, '');

  test('REQ-472 · [spSurface] makes the consumer\'s element the root, its class joining the core\'s', async () => {
    const out = await html('<section spSurface class="mine" name="note" frame="card">Text</section>');
    expect(out).toMatch(/<section[^>]*class="sp-ui sp-surface sp-ground-silverpoint mine sp-note"[^>]*><span part="sp-frame" data-kind="card" aria-hidden="true"><\/span>Text<\/section>/);
  });

  test('REQ-483 · sp-empty and sp-result hold their spExtra template', async () => {
    const empty = await html('<sp-empty><ng-template spExtra><button type="button">Add</button></ng-template></sp-empty>');
    expect(empty).toContain('<div class="sp-ui-empty-extra"><button type="button">Add</button></div>');
    const result = await html('<sp-result title="Done" status="success"><ng-template spExtra><a href="/">Back</a></ng-template></sp-result>');
    expect(result).toContain('<div class="sp-ui-result-extra"><a href="/">Back</a></div>');
  });
});
