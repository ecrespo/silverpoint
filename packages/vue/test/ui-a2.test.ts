import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { __setDiagnosticSink } from '@silverpoint/core';
import { UI_COMPONENTS } from '@silverpoint/core/ui';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createApp, createSSRApp, h, nextTick, ref, type Component, type VNode } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiFixtureParts, uiMatrix, type UiFixture } from '../../../tools/visual-gate/ui-matrix';
import * as Ui from '../src/ui';

/*
 * Vue A2 (T-214, REQ-476, REQ-482, REQ-484, REQ-485, REQ-488): Pagination (`v-model:current`),
 * Collapse(Item) (`v-model:open`), Textarea and InputNumber (`v-model`). Each is the core's view,
 * written attribute for attribute; values are reported as values, never as events.
 */

let cleanup: (() => void)[] = [];
beforeEach(() => {
  cleanup.push(__setDiagnosticSink(() => {}));
});
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});

const set = Ui as unknown as Record<string, Component>;
const A2 = UI_COMPONENTS.filter((c) => c.batch === 'A2');

interface Item {
  readonly key?: string;
  readonly title: string;
  readonly content: string;
  readonly open?: boolean;
  readonly disabled?: boolean;
}

/** A fixture as a Vue consumer writes it: values as `default-value`; a Collapse holds its items (Data Model §5). */
function element(fixture: UiFixture): VNode {
  const { props, value } = uiFixtureParts(fixture);
  const common = { ground: props.ground, substrate: props.substrate, mode: props.mode, size: props.size };
  switch (fixture.component) {
    case 'collapse': {
      const { items, ...rest } = props as typeof props & { items: readonly Item[] };
      return h(set.SpCollapse!, rest, () => items.map(({ key, content, open, ...item }) => h(set.SpCollapseItem!, { key, ...common, ...item, defaultOpen: open }, () => content)));
    }
    case 'pagination':
      return h(set.SpPagination!, props);
    case 'textarea':
      return h(set.SpTextarea!, { ...props, defaultValue: value });
    default:
      return h(set.SpInputNumber!, { ...props, defaultValue: value });
  }
}

function mount(render: () => VNode): HTMLElement {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp({ render });
  app.mount(host);
  cleanup.push(() => {
    app.unmount();
    host.remove();
  });
  return host;
}

/** Types into a native field as a user does: the value, then `input`. */
function type(field: HTMLInputElement | HTMLTextAreaElement, text: string) {
  field.value = text;
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

const pr = uiMatrix(['A2']).filter((f) => f.scope === 'pr');

describe('Vue A2 markup (T-214)', () => {
  test.each(pr)('REQ-327 · $id is the canonical tree', async (fixture) => {
    const markup = await renderToString(createSSRApp({ render: () => element(fixture) }));
    expect(compareUi(markup, canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  test('REQ-327 · mounting every fixture raises no Vue warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    cleanup.push(() => warn.mockRestore());
    for (const fixture of pr) mount(() => element(fixture));
    expect(warn).not.toHaveBeenCalled();
  });

  test('REQ-476 · every A2 component has its subpath and is on the barrel', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as { exports: Record<string, unknown> };
    for (const { slug } of A2) expect(pkg.exports[`./ui/${slug}`], slug).toBeDefined();
    for (const name of ['SpPagination', 'SpCollapse', 'SpCollapseItem', 'SpTextarea', 'SpInputNumber']) expect(Ui, name).toHaveProperty(name);
  });
});

describe('Vue A2 behaviour (T-214)', () => {
  const current = (host: HTMLElement) => host.querySelector('[aria-current="page"]')!.textContent;
  const page = (host: HTMLElement, n: number) => host.querySelector<HTMLButtonElement>(`button[data-page="${n}"][aria-label="Page ${n}"]`)!;

  test('REQ-476 · REQ-322 · v-model:current follows the clicked page, and the parent can set it', async () => {
    const model = ref(2);
    const host = mount(() => h(set.SpPagination!, { total: 50, current: model.value, 'onUpdate:current': (v: number) => (model.value = v) }));
    page(host, 3).click();
    await nextTick();
    expect(model.value).toBe(3);
    expect(current(host)).toBe('Page 3');
    model.value = 1;
    await nextTick();
    expect(current(host)).toBe('Page 1');
  });

  test('REQ-322 · an uncontrolled Pagination holds the page and reports it', async () => {
    const changed = vi.fn();
    const host = mount(() => h(set.SpPagination!, { total: 50, defaultCurrent: 2, 'onUpdate:current': changed }));
    page(host, 3).click();
    await nextTick();
    expect(changed).toHaveBeenCalledWith(3);
    expect(current(host)).toBe('Page 3');
  });

  test('REQ-482 · an accordion hands its items one name; an item reports its toggle', async () => {
    const toggled = vi.fn();
    const host = mount(() =>
      h(set.SpCollapse!, { id: 'faq', accordion: true }, () => [h(set.SpCollapseItem!, { title: 'One', onToggle: toggled }, () => 'a'), h(set.SpCollapseItem!, { title: 'Two' }, () => 'b')]),
    );
    const details = [...host.querySelectorAll('details')];
    expect(details.map((d) => d.getAttribute('name'))).toEqual(['faq--accordion', 'faq--accordion']);
    details[0]!.open = true;
    details[0]!.dispatchEvent(new Event('toggle'));
    await nextTick();
    expect(toggled).toHaveBeenCalledWith(true);
  });

  test('REQ-482 · a disabled item does not toggle: its summary\'s activation is cancelled', () => {
    const host = mount(() => h(set.SpCollapseItem!, { title: 'Locked', disabled: true }, () => 'a'));
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    host.querySelector('summary')!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    const free = mount(() => h(set.SpCollapseItem!, { title: 'Open' }, () => 'a'));
    const other = new MouseEvent('click', { bubbles: true, cancelable: true });
    free.querySelector('summary')!.dispatchEvent(other);
    expect(other.defaultPrevented).toBe(false);
  });

  test('REQ-482 · v-model:open is open as given', async () => {
    const html = (open: boolean) => renderToString(createSSRApp({ render: () => h(set.SpCollapseItem!, { title: 'T', open, defaultOpen: !open }, () => 'a') }));
    expect(await html(true)).toMatch(/^<details[^>]* open/);
    expect(await html(false)).not.toMatch(/ open/);
  });

  test('REQ-484 · REQ-488 · a Textarea\'s v-model follows what is typed, and the counter with it', async () => {
    const model = ref('Hi');
    const host = mount(() => h(set.SpTextarea!, { label: 'Notes', showCount: true, maxLength: 10, modelValue: model.value, 'onUpdate:modelValue': (v: string) => (model.value = v) }));
    const textarea = host.querySelector('textarea')!;
    expect(textarea.value).toBe('Hi');
    type(textarea, 'Hello');
    await nextTick();
    expect(model.value).toBe('Hello');
    expect(host.querySelector('.sp-ui-count')!.textContent).toBe('5 / 10');
    model.value = 'Bye';
    await nextTick();
    expect(textarea.value).toBe('Bye');
  });

  test('REQ-485 · REQ-488 · the steppers report the core\'s next value and stop at the bound', async () => {
    const changed = vi.fn();
    const host = mount(() => h(set.SpInputNumber!, { label: 'Qty', defaultValue: 9, min: 1, max: 10, 'onUpdate:modelValue': changed }));
    const plus = host.querySelector<HTMLButtonElement>('button[data-step="1"]')!;
    plus.click();
    await nextTick();
    expect(changed).toHaveBeenCalledWith(10);
    expect(host.querySelector('input')!.value).toBe('10');
    expect(plus.disabled).toBe(true);    host.querySelector<HTMLButtonElement>('button[data-step="-1"]')!.click();
    await nextTick();
    expect(changed).toHaveBeenLastCalledWith(9);
  });

  test('REQ-485 · typing is held until committed; the committed value is clamped, an emptied one is null', async () => {
    const changed = vi.fn();
    const host = mount(() => h(set.SpInputNumber!, { label: 'Qty', defaultValue: 3, min: 5, max: 20, 'onUpdate:modelValue': changed }));
    const input = host.querySelector('input')!;
    type(input, '1');
    await nextTick();
    expect(input.value).toBe('1');
    expect(changed).not.toHaveBeenCalled();
    type(input, '99');
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await nextTick();
    expect(changed).toHaveBeenLastCalledWith(20);
    expect(input.value).toBe('20');
    type(input, '99');
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await nextTick();
    expect(input.value).toBe('20');
    type(input, '');
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await nextTick();
    expect(changed).toHaveBeenLastCalledWith(null);
    expect(input.value).toBe('');
  });
});
