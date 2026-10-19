import { act, createElement, createRef, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { __setDiagnosticSink } from '@silverpoint/core';
import { UI_COMPONENTS } from '@silverpoint/core/ui';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiFixtureParts, uiMatrix, type UiFixture } from '../../../tools/visual-gate/ui-matrix';
import * as Client from '../src/ui';

/*
 * React A2 (T-214, REQ-476, REQ-482, REQ-484, REQ-485, REQ-488): Pagination, Collapse(Item),
 * Textarea and InputNumber, client components. Each is the core's view, written attribute for
 * attribute; values are controlled or held (REQ-322), and reported as values, never as events.
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cleanup: (() => void)[] = [];
beforeEach(() => {
  cleanup.push(__setDiagnosticSink(() => {}));
});
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});

const { SpPagination, SpCollapse, SpCollapseItem, SpTextarea, SpInputNumber } = Client;
/** The fixtures' props are untyped demo data. */
const loose = <P,>(component: P) => component as unknown as (props: Record<string, unknown>) => ReactElement;
const A2 = UI_COMPONENTS.filter((c) => c.batch === 'A2');

interface Item {
  readonly key?: string;
  readonly title: string;
  readonly content: string;
  readonly open?: boolean;
  readonly disabled?: boolean;
}

/** A fixture as a React consumer writes it: values as defaults; a Collapse holds its items (Data Model §5). */
function element(fixture: UiFixture): ReactElement {
  const { props, value } = uiFixtureParts(fixture);
  const common = { ground: props.ground, substrate: props.substrate, mode: props.mode, size: props.size };
  switch (fixture.component) {
    case 'collapse': {
      const { items, ...rest } = props as typeof props & { items: readonly Item[] };
      return createElement(
        loose(SpCollapse),
        rest,
        ...items.map(({ key, content, open, ...item }) => createElement(loose(SpCollapseItem), { key, ...common, ...item, defaultOpen: open }, content)),
      );
    }
    case 'pagination':
      return createElement(loose(SpPagination), props);
    case 'textarea':
      return createElement(loose(SpTextarea), { ...props, defaultValue: value });
    default:
      return createElement(loose(SpInputNumber), { ...props, defaultValue: value });
  }
}

function mount(node: ReactElement): HTMLElement {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(node));
  cleanup.push(() => {
    act(() => root.unmount());
    host.remove();
  });
  return host;
}

/** Types into a native field as a user does: the value, then `input`. */
function type(field: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(field, text);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

const pr = uiMatrix(['A2']).filter((f) => f.scope === 'pr');

describe('React A2 markup (T-214)', () => {
  test.each(pr)('REQ-327 · $id is the canonical tree', (fixture) => {
    expect(compareUi(renderToStaticMarkup(element(fixture)), canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  test('REQ-327 · mounting every fixture raises no React warning (`maxlength`, `inputmode`, a textarea\'s value)', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    cleanup.push(() => error.mockRestore());
    for (const fixture of pr) mount(element(fixture));
    expect(error).not.toHaveBeenCalled();
  });

  test('REQ-476 · every A2 component has a client subpath and is on the barrel', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as { exports: Record<string, unknown> };
    for (const { slug } of A2) expect(pkg.exports[`./ui/${slug}`], slug).toBeDefined();
    for (const name of ['SpPagination', 'SpCollapse', 'SpCollapseItem', 'SpTextarea', 'SpInputNumber']) expect(Client, name).toHaveProperty(name);
  });
});

describe('React A2 behaviour (T-214)', () => {
  const current = (host: HTMLElement) => host.querySelector('[aria-current="page"]')!.textContent;
  const page = (host: HTMLElement, n: number) => host.querySelector<HTMLButtonElement>(`button[data-page="${n}"][aria-label="Page ${n}"]`)!;

  test('REQ-476 · REQ-322 · an uncontrolled Pagination moves to the clicked page and reports it', () => {
    const onChange = vi.fn();
    const host = mount(<SpPagination total={50} defaultCurrent={2} onChange={onChange} />);
    expect(current(host)).toBe('Page 2');
    act(() => page(host, 3).click());
    expect(onChange).toHaveBeenCalledWith(3);
    expect(current(host)).toBe('Page 3');
    act(() => host.querySelector<HTMLButtonElement>('button[aria-label="Previous page"]')!.click());
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  test('REQ-322 · a controlled Pagination reports the page and shows the given one', () => {
    const onChange = vi.fn();
    const host = mount(<SpPagination total={50} current={1} onChange={onChange} />);
    act(() => page(host, 2).click());
    expect(onChange).toHaveBeenCalledWith(2);
    expect(current(host)).toBe('Page 1');
  });

  test('REQ-482 · an accordion hands its items one name; a held item reports its toggle', () => {
    const onToggle = vi.fn();
    const host = mount(
      <SpCollapse id="faq" accordion>
        <SpCollapseItem title="One" onToggle={onToggle}>a</SpCollapseItem>
        <SpCollapseItem title="Two">b</SpCollapseItem>
      </SpCollapse>,
    );
    const details = [...host.querySelectorAll('details')];
    expect(details.map((d) => d.getAttribute('name'))).toEqual(['faq--accordion', 'faq--accordion']);
    act(() => {
      details[0]!.open = true;
      details[0]!.dispatchEvent(new Event('toggle'));
    });
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  test('REQ-482 · a disabled item does not toggle: its summary\'s activation is cancelled', () => {
    const host = mount(<SpCollapseItem title="Locked" disabled>a</SpCollapseItem>);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    act(() => host.querySelector('summary')!.dispatchEvent(click));
    expect(click.defaultPrevented).toBe(true);
    const open = mount(<SpCollapseItem title="Open">a</SpCollapseItem>);
    const free = new MouseEvent('click', { bubbles: true, cancelable: true });
    act(() => open.querySelector('summary')!.dispatchEvent(free));
    expect(free.defaultPrevented).toBe(false);
  });

  test('REQ-482 · a controlled item is open as given', () => {
    expect(renderToStaticMarkup(<SpCollapseItem title="T" open>a</SpCollapseItem>)).toMatch(/^<details[^>]* open=""/);
    expect(renderToStaticMarkup(<SpCollapseItem title="T" open={false} defaultOpen>a</SpCollapseItem>)).not.toMatch(/ open=""/);
  });

  test('REQ-484 · REQ-488 · a Textarea holds what is typed, reports the value and refs its <textarea>', () => {
    const onChange = vi.fn();
    const ref = createRef<HTMLTextAreaElement>();
    const host = mount(<SpTextarea ref={ref} label="Notes" defaultValue="Hi" showCount maxLength={10} onChange={onChange} />);
    expect(ref.current).toBe(host.querySelector('textarea'));
    type(ref.current!, 'Hello');
    expect(onChange).toHaveBeenCalledWith('Hello');
    expect(host.querySelector('.sp-ui-count')!.textContent).toBe('5 / 10');
  });

  test('REQ-485 · REQ-488 · the steppers report the core\'s next value and stop at the bound', () => {
    const onChange = vi.fn();
    const host = mount(<SpInputNumber label="Qty" defaultValue={9} min={1} max={10} onChange={onChange} />);
    const plus = host.querySelector<HTMLButtonElement>('button[data-step="1"]')!;
    act(() => plus.click());
    expect(onChange).toHaveBeenCalledWith(10);
    expect(host.querySelector('input')!.value).toBe('10');
    expect(plus.disabled).toBe(true);    act(() => host.querySelector<HTMLButtonElement>('button[data-step="-1"]')!.click());
    expect(onChange).toHaveBeenLastCalledWith(9);
  });

  test('REQ-485 · typing is held until committed; the committed value is clamped, an emptied one is null', () => {
    const onChange = vi.fn();
    const ref = createRef<HTMLInputElement>();
    const host = mount(<SpInputNumber ref={ref} label="Qty" defaultValue={3} min={5} max={20} onChange={onChange} />);
    const input = ref.current!;
    expect(input).toBe(host.querySelector('input'));
    type(input, '1');
    expect(input.value).toBe('1');
    type(input, '12');
    expect(onChange).not.toHaveBeenCalled();
    act(() => input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })));
    expect(onChange).toHaveBeenLastCalledWith(12);
    type(input, '99');
    act(() => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(onChange).toHaveBeenLastCalledWith(20);
    expect(input.value).toBe('20');
    type(input, '');
    act(() => input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })));
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(input.value).toBe('');
  });
});
