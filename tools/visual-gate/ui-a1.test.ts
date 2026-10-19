import { UI_COMPONENTS, UI_GLYPHS } from '@silverpoint/core/ui';
import { describe, expect, test } from 'vitest';
import { compareUi, parseUi } from '../svg-normalizer/normalize';
import { canonicalUiMarkup } from './ui-canonical';
import { GATED_BATCHES, uiMatrix } from './ui-matrix';

/*
 * The A1 batch's fixtures, ahead of the gates (T-213): each adapter compares its render with the
 * canonical one from T-213 on; the batch joins GATED_BATCHES, the goldens and the harness in T-218.
 */

const A1 = UI_COMPONENTS.filter((c) => c.batch === 'A1');

describe('A1 fixtures (T-213)', () => {
  test('REQ-470 · uiMatrix(["A1"]) gives every A1 state × 5 ground substrates × 2 modes; the gated matrix is unchanged', () => {
    const states = A1.reduce((n, c) => n + c.states.length, 0);
    expect(states).toBe(18);
    const matrix = uiMatrix(['A1']);
    expect(matrix).toHaveLength(states * 10);
    expect(matrix.filter((f) => f.scope === 'pr')).toHaveLength(states * 4);
    expect(new Set(matrix.map((f) => f.component))).toEqual(new Set(A1.map((c) => c.slug)));
    expect(GATED_BATCHES).toEqual(['B1', 'B2', 'B3']);
    expect(uiMatrix()).toHaveLength(510);
  });

  test('REQ-472..REQ-483 · every A1 fixture has a canonical render rooted in its own component', () => {
    for (const fixture of uiMatrix(['A1']).filter((f) => f.scope === 'pr')) {
      const root = fixture.component === 'avatar' && fixture.state === 'group' ? 'avatar-group' : fixture.component;
      const tree = parseUi(canonicalUiMarkup(fixture));
      // Several roots (Glyph `all`) come as one fragment: its first root names the component.
      const first = tree.tag === '#roots' ? (tree.children[0] as typeof tree) : tree;
      expect(first.attrs.find(([n]) => n === 'class')?.[1], fixture.id).toContain(`sp-${root}`);
    }
  });

  test('REQ-472 · Glyph "all" is every glyph in a row, each its own root', () => {
    const fixture = uiMatrix(['A1']).find((f) => f.id === 'glyph--all--silverpoint--cream--ink')!;
    const markup = canonicalUiMarkup(fixture);
    expect([...markup.matchAll(/data-glyph="([^"]+)"/g)].map((m) => m[1])).toEqual(Object.keys(UI_GLYPHS));
  });

  test('REQ-478 · Avatar "group" is an AvatarGroup holding its three avatars, each in the fixture\'s ground', () => {
    const fixture = uiMatrix(['A1']).find((f) => f.id === 'avatar--group--cyanotype--prussian--precision')!;
    const markup = canonicalUiMarkup(fixture);
    expect(markup.match(/class="sp-ui sp-avatar sp-ground-cyanotype"/g)).toHaveLength(3);
    expect(markup).toMatch(/^<div class="sp-ui sp-avatar-group[^>]*role="group" aria-label="Reviewers"/);
  });

  test('REQ-327 · several roots side by side are compared root by root, not only the first', () => {
    const two = (b: string) => `<svg class="sp-ui sp-glyph" data-glyph="tick"></svg><svg class="sp-ui sp-glyph" data-glyph="${b}"></svg>`;
    expect(compareUi(two('dash'), two('dash'))).toEqual({ equal: true });
    expect(compareUi(two('cross'), two('dash')).equal).toBe(false);
    expect(compareUi(two('dash'), '<svg class="sp-ui sp-glyph" data-glyph="tick"></svg>').equal).toBe(false);
  });
});
