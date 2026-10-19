import { UI_COMPONENTS } from '@silverpoint/core/ui';
import { describe, expect, test } from 'vitest';
import { parseUi } from '../svg-normalizer/normalize';
import { canonicalUiMarkup } from './ui-canonical';
import { uiFixtureParts, uiMatrix, UI_VALUE_COMPONENTS } from './ui-matrix';

/*
 * The A2 batch's fixtures, ahead of the gates (T-214): Pagination, Collapse, Textarea and
 * InputNumber. The batch joined GATED_BATCHES and the harness in T-218, the goldens in T-219.
 */

const A2 = UI_COMPONENTS.filter((c) => c.batch === 'A2');
const fixture = (id: string) => uiMatrix(['A2']).find((f) => f.id === id)!;

describe('A2 fixtures (T-214)', () => {
  test('REQ-476..REQ-488 · uiMatrix(["A2"]) gives every A2 state × 5 ground substrates × 2 modes', () => {
    const states = A2.reduce((n, c) => n + c.states.length, 0);
    expect(new Set(A2.map((c) => c.slug))).toEqual(new Set(['pagination', 'collapse', 'textarea', 'input-number']));
    expect(states).toBe(8);
    expect(uiMatrix(['A2'])).toHaveLength(states * 10);
    expect(uiMatrix(['A2']).filter((f) => f.scope === 'pr')).toHaveLength(states * 4);
    expect(uiMatrix(['A2']).find((f) => f.component === 'collapse')!.width).toBe(640);
  });

  test('REQ-488 · Textarea and InputNumber bind their value; Pagination its `current`, a prop', () => {
    expect(UI_VALUE_COMPONENTS.has('textarea') && UI_VALUE_COMPONENTS.has('input-number')).toBe(true);
    expect(uiFixtureParts(fixture('input-number--value--silverpoint--cream--ink')).value).toBe(3);
    expect(uiFixtureParts(fixture('pagination--middle--silverpoint--cream--ink')).props.current).toBe(10);
  });

  test('REQ-476..REQ-485 · every A2 fixture has a canonical render rooted in its own component', () => {
    for (const f of uiMatrix(['A2']).filter((x) => x.scope === 'pr')) {
      const tree = parseUi(canonicalUiMarkup(f));
      expect(tree.attrs.find(([n]) => n === 'class')?.[1], f.id).toContain(`sp-${f.component}`);
    }
  });

  test('REQ-476 · Pagination draws the fixture\'s current page', () => {
    expect(canonicalUiMarkup(fixture('pagination--middle--silverpoint--cream--ink'))).toMatch(/aria-current="page"><span part="sp-frame"[^]*?<\/span>10<\/span>/);
  });

  test('REQ-484 · REQ-485 · Textarea and InputNumber draw the fixture\'s value', () => {
    expect(canonicalUiMarkup(fixture('textarea--count--silverpoint--cream--ink'))).toContain('>Leave it at the door.</textarea>');
    expect(canonicalUiMarkup(fixture('textarea--count--silverpoint--cream--ink'))).toContain('<span class="sp-ui-count">21 / 120</span>');
    expect(canonicalUiMarkup(fixture('input-number--at-min--silverpoint--cream--ink'))).toMatch(/<button[^>]*data-step="-1"[^>]*disabled=""/);
    expect(canonicalUiMarkup(fixture('input-number--value--silverpoint--cream--ink'))).toContain('value="3"');
  });

  test('REQ-482 · Collapse holds one <details> per item, each in the fixture\'s ground; an accordion names them by its id', () => {
    const open = canonicalUiMarkup(fixture('collapse--one-open--cyanotype--prussian--ink'));
    expect(open.match(/<details class="sp-ui sp-collapse-item sp-ground-cyanotype"/g)).toHaveLength(3);
    expect(open.match(/<details[^>]* open=""/g)).toHaveLength(1);
    expect(open).toContain('The prepared surface a metal stylus can mark');
    expect(open).not.toContain(' name="');
    const accordion = canonicalUiMarkup(fixture('collapse--accordion-disabled--silverpoint--cream--ink'));
    expect(accordion.match(/ name="collapse--accordion-disabled--accordion"/g)).toHaveLength(3);
    expect(accordion.match(/data-disabled="true"/g)).toHaveLength(1);
  });
});
