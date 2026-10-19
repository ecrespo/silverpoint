import { UI_COMPONENTS } from '@silverpoint/core/ui';
import { describe, expect, test } from 'vitest';
import { parseUi } from '../svg-normalizer/normalize';
import { canonicalUiMarkup } from './ui-canonical';
import { uiFixtureParts, uiMatrix, UI_VALUE_COMPONENTS } from './ui-matrix';

/*
 * The overlay batch's fixtures, ahead of the gates (T-215, T-216): the overlay's own root, rendered
 * on the server as it opens (REQ-502). A consumer's trigger beside it is not part of the component's
 * tree; each adapter's tests check its ARIA (REQ-500). The batch joins GATED_BATCHES in T-218.
 */

const B = UI_COMPONENTS.filter((c) => c.batch === 'B');
const fixture = (id: string) => uiMatrix(['B']).find((f) => f.id === id)!;
const ROOT: Record<string, string> = { modal: 'dialog', drawer: 'dialog', popover: 'div', tooltip: 'div', select: 'span', 'dropdown-menu': 'span', toast: 'li' };

describe('B fixtures (T-216)', () => {
  test('REQ-490 · uiMatrix(["B"]) gives every overlay state × 5 ground substrates × 2 modes', () => {
    const states = B.reduce((n, c) => n + c.states.length, 0);
    expect(states).toBe(9);
    expect(uiMatrix(['B'])).toHaveLength(states * 10);
    expect(uiMatrix(['B']).filter((f) => f.scope === 'pr')).toHaveLength(states * 4);
  });

  test('REQ-490 · a Select binds its value; a toast\'s action is a slot; the trigger and the active item are not props', () => {
    expect(UI_VALUE_COMPONENTS.has('select')).toBe(true);
    const select = uiFixtureParts(fixture('select--open-selected--silverpoint--cream--ink'));
    expect(select.value).toBe('packed');
    expect(select.props).not.toHaveProperty('active');
    expect(uiFixtureParts(fixture('toast--error-action--silverpoint--cream--ink')).slots.action).toBe('Retry');
    const modal = uiFixtureParts(fixture('modal--open--silverpoint--cream--ink'));
    expect(modal.props).not.toHaveProperty('trigger');
    expect(modal.trigger).toBe('Edit order');
  });

  test('REQ-502 · every B fixture is its overlay\'s root, open, with no `open` attribute', () => {
    for (const f of uiMatrix(['B']).filter((x) => x.scope === 'pr')) {
      const markup = canonicalUiMarkup(f);
      const tree = parseUi(markup);
      expect(tree.tag, f.id).toBe(ROOT[f.component]);
      expect(tree.attrs.find(([n]) => n === 'class')?.[1], f.id).toContain(`sp-${f.component}`);
      expect(markup, f.id).not.toMatch(/<(dialog|div)[^>]* open[ =>]/);
      if (f.component !== 'select' || f.state !== 'placeholder') expect(markup, f.id).toContain('data-state="open"');
    }
  });

  test('REQ-498 · an open list heightens its active item: the Select its chosen option, the menu its first enabled item, under its own button', () => {
    const select = canonicalUiMarkup(fixture('select--open-selected--silverpoint--cream--ink'));
    expect(select).toMatch(/aria-activedescendant="select--open-selected--option-packed"/);
    expect(select.match(/part="sp-heighten"/g)).toHaveLength(1);
    const menu = canonicalUiMarkup(fixture('dropdown-menu--open--silverpoint--cream--ink'));
    expect(menu).toMatch(/data-key="edit"[^>]*><span part="sp-heighten"/);
    // The menu's fixtures show its built-in button; a consumer's trigger would replace it.
    expect(menu).toContain('<button type="button" class="sp-ui-menu-trigger"');
  });

  test('REQ-497 · the error toast is an alert and holds its action', () => {
    const toast = canonicalUiMarkup(fixture('toast--error-action--silverpoint--cream--ink'));
    expect(toast).toContain('role="alert"');
    expect(toast).toContain('<div class="sp-ui-toast-action">Retry</div>');
  });
});
