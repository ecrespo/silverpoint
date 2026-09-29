import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, type SpCode } from '../src';
import {
  resolveUi,
  UI_COMPONENTS,
  uiButtonView,
  uiCardView,
  uiCheckboxView,
  uiDividerView,
  uiFrameVariant,
  uiInputView,
  uiSwitchView,
  type UiElement,
  type UiNode,
} from '../src/ui';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): Array<{ code: SpCode; message: string }> {
  const seen: Array<{ code: SpCode; message: string }> = [];
  restore = __setDiagnosticSink((code, message) => seen.push({ code, message }));
  return seen;
}

const isElement = (n: UiNode): n is UiElement => 'tag' in n;
/** Every element of a tree, depth first. */
const all = (n: UiNode): UiElement[] => (isElement(n) ? [n, ...n.children.flatMap(all)] : []);
const parts = (n: UiNode) => all(n).map((e) => e.attrs.part).filter(Boolean);
const one = (n: UiNode, where: (e: UiElement) => boolean) => {
  const found = all(n).filter(where);
  expect(found).toHaveLength(1);
  return found[0]!;
};
const env = {};
const resolved = (props = {}) => resolveUi(props, env);

describe('resolveUi (T-143)', () => {
  test('REQ-311 · precedence is prop, then dashboard, then provider, then the library default', () => {
    const provider = { ground: 'cyanotype', substrate: 'green', mode: 'precision' } as const;
    const cell = { substrate: 'blue' } as const;
    expect(resolveUi({}, {})).toMatchObject({ ground: 'silverpoint', substrate: 'cream', mode: 'ink', size: 'md' });
    expect(resolveUi({}, { provider })).toMatchObject({ ground: 'cyanotype', substrate: 'green', mode: 'precision' });
    expect(resolveUi({}, { provider, cell })).toMatchObject({ ground: 'cyanotype', substrate: 'blue' });
    expect(resolveUi({ substrate: 'ochre', mode: 'ink' }, { provider, cell })).toMatchObject({ substrate: 'ochre', mode: 'ink' });
  });

  test('REQ-311 · REQ-123 · a forced precision applies after resolution and no prop overrides it', () => {
    expect(resolveUi({ mode: 'ink' }, { forcedPrecision: true }).mode).toBe('precision');
  });

  test('REQ-307 · the frame variant is uiFrameVariant over the six a ground may draw; ui.css folds it', () => {
    expect(resolveUi({ id: 'save' }, {}).frame).toBe(uiFrameVariant(undefined, 'save', 6));
    expect(resolveUi({ id: 'save', seed: 3 }, {}).frame).toBe(3);
    expect(resolveUi({}, {}).frame).toBe(0);
  });

  test('REQ-312 · a ground object resolves to its name; the runtime needs no ground tokens', () => {
    expect(resolveUi({ ground: { name: 'burin' } as never }, {}).ground).toBe('burin');
  });
});

describe('root contract (T-143)', () => {
  test('REQ-327 · every B1 root carries the class, ground, substrate, mode, size and frame', () => {
    const views = [
      uiButtonView({}, resolved(), { text: 'Save' }),
      uiInputView({}, resolved(), { value: '' }),
      uiCheckboxView({ label: 'A' }, resolved(), { checked: false }),
      uiSwitchView({ label: 'A' }, resolved(), { checked: false }),
      uiCardView({}, resolved(), {}),
      uiDividerView({}, resolved()),
    ];
    const slugs = ['button', 'input', 'checkbox', 'switch', 'card', 'divider'];
    views.forEach((view, i) => {
      expect(view.attrs.class).toBe(`sp-ui sp-${slugs[i]} sp-ground-silverpoint`);
      expect(view.attrs).toMatchObject({ 'data-ground': 'silverpoint', 'data-substrate': 'cream', 'data-mode': 'ink', 'data-size': 'md', 'data-frame': '0' });
    });
    expect(uiCardView({ className: 'wide' }, resolved(), {}).attrs.class).toBe('sp-ui sp-card sp-ground-silverpoint wide');
  });

  test('REQ-306 · ink and precision emit the same elements; only data-mode differs', () => {
    const ink = uiButtonView({ variant: 'danger' }, resolveUi({ mode: 'ink' }, {}), { text: 'Delete' });
    const precision = uiButtonView({ variant: 'danger' }, resolveUi({ mode: 'precision' }, {}), { text: 'Delete' });
    const strip = (n: UiNode): unknown => (isElement(n) ? { ...n, attrs: { ...n.attrs, 'data-mode': '' }, children: n.children.map(strip) } : n);
    expect(strip(precision)).toEqual(strip(ink));
  });

  test('REQ-314 · every drawn part is aria-hidden', () => {
    for (const view of [uiButtonView({ variant: 'danger' }, resolved(), { text: 'x' }), uiSwitchView({ label: 'A' }, resolved(), { checked: true })]) {
      for (const e of all(view).filter((e) => e.attrs.part)) expect(e.attrs['aria-hidden'] ?? findHiddenAncestor(view, e)).toBeTruthy();
    }
  });
});

function findHiddenAncestor(root: UiNode, target: UiElement): string | undefined {
  const walk = (n: UiNode, hidden: boolean): boolean | undefined => {
    if (!isElement(n)) return undefined;
    const h = hidden || n.attrs['aria-hidden'] === 'true';
    if (n === target) return h;
    for (const c of n.children) {
      const r = walk(c, h);
      if (r !== undefined) return r;
    }
    return undefined;
  };
  return walk(root, false) ? 'true' : undefined;
}

describe('SpButton view (T-144)', () => {
  test('REQ-314 · a native <button type="button"> by default, with its frame and a label slot', () => {
    const view = uiButtonView({}, resolved(), { text: 'Default' });
    expect(view.tag).toBe('button');
    expect(view.attrs.type).toBe('button');
    expect(parts(view)).toEqual(['sp-frame']);
    expect(one(view, (e) => e.attrs.class?.includes('sp-ui-label') ?? false).children).toEqual([{ slot: 'content' }]);
  });

  test('REQ-308 · REQ-310 · primary and danger take a tone; danger also its exact ✕ glyph; the label sits on a plate', () => {
    const primary = uiButtonView({ variant: 'primary' }, resolved(), { text: 'Primary' });
    expect(one(primary, (e) => e.attrs.part === 'sp-tone').attrs).toMatchObject({ 'data-tone': 'primary', 'data-kind': 'control' });
    expect(one(primary, (e) => e.attrs.class === 'sp-ui-label sp-ui-plate')).toBeTruthy();
    const danger = uiButtonView({ variant: 'danger' }, resolved(), { text: 'Delete' });
    expect(one(danger, (e) => e.attrs.part === 'sp-tone').attrs['data-tone']).toBe('danger');
    const mark = one(danger, (e) => e.attrs.part === 'sp-mark');
    expect(mark.attrs).toMatchObject({ 'data-glyph': 'cross', viewBox: '0 0 16 16', 'aria-hidden': 'true' });
    expect(danger.attrs['data-variant']).toBe('danger');
  });

  test('REQ-326 · REQ-310 · disabled is the native attribute, with the disabled tone', () => {
    const view = uiButtonView({ disabled: true }, resolved(), { text: 'Disabled' });
    expect(view.attrs.disabled).toBe(true);
    expect(one(view, (e) => e.attrs.part === 'sp-tone').attrs['data-tone']).toBe('disabled');
  });

  test('a link button is an <a>; disabled, it loses its href and says so', () => {
    expect(uiButtonView({ href: '/docs' }, resolved(), { text: 'Docs' })).toMatchObject({ tag: 'a', attrs: { href: '/docs' } });
    const off = uiButtonView({ href: '/docs', disabled: true }, resolved(), { text: 'Docs' });
    expect(off.attrs.href).toBeUndefined();
    expect(off.attrs['aria-disabled']).toBe('true');
    expect(off.attrs.type).toBeUndefined();
  });

  test('REQ-319 · no text and no label warns SP018; a label is the accessible name', () => {
    const seen = capture();
    uiButtonView({}, resolved(), {});
    expect(seen.map((s) => s.code)).toEqual(['SP018']);
    expect(uiButtonView({ label: 'Close' }, resolved(), {}).attrs['aria-label']).toBe('Close');
  });
});

describe('SpInput view (T-144)', () => {
  test('REQ-314 · a native <input> inside a framed box; its id is the consumer\'s, for <label for>', () => {
    const view = uiInputView({ id: 'city', name: 'city', placeholder: 'City', label: 'City' }, resolved({ id: 'city' }), { value: 'Caracas' });
    expect(view.tag).toBe('span');
    const input = one(view, (e) => e.tag === 'input');
    expect(input.attrs).toMatchObject({ id: 'city', name: 'city', type: 'text', value: 'Caracas', placeholder: 'City', 'aria-label': 'City', class: 'sp-ui-control' });
    expect(input.bind).toBe('native');
    expect(view.attrs.id).toBeUndefined();
  });

  test('REQ-334 · C-1 · invalid sets aria-invalid and the ⚠ glyph; the message is described by its derived id', () => {
    const view = uiInputView({ id: 'city', invalid: true, message: 'Required: pick a city' }, resolved({ id: 'city' }), { value: '' });
    const input = one(view, (e) => e.tag === 'input');
    expect(input.attrs['aria-invalid']).toBe('true');
    expect(input.attrs['aria-describedby']).toBe('city--message');
    expect(one(view, (e) => e.attrs.part === 'sp-mark').attrs['data-glyph']).toBe('warning');
    const message = one(view, (e) => e.attrs.id === 'city--message');
    expect(message.children).toEqual([{ text: 'Required: pick a city' }]);
    expect(view.attrs['data-invalid']).toBe('true');
  });

  test('REQ-329 · without an id, the message derives its id from `name`; with neither, it is shown but not related', () => {
    const named = uiInputView({ name: 'q', message: 'Help' }, resolved(), { value: '' });
    expect(one(named, (e) => e.tag === 'input').attrs['aria-describedby']).toBe('q--message');
    const anonymous = uiInputView({ message: 'Help' }, resolved(), { value: '' });
    expect(one(anonymous, (e) => e.tag === 'input').attrs['aria-describedby']).toBeUndefined();
    expect(all(anonymous).some((e) => e.attrs.class === 'sp-ui-message')).toBe(true);
  });

  test('REQ-326 · disabled and readOnly are native attributes', () => {
    const input = one(uiInputView({ disabled: true, readOnly: true }, resolved(), { value: 'x' }), (e) => e.tag === 'input');
    expect(input.attrs).toMatchObject({ disabled: true, readonly: true });
  });

  test('prefix and suffix slots appear only when the adapter has content for them', () => {
    const view = uiInputView({}, resolved(), { value: '', prefix: true });
    expect(all(view).filter((e) => e.children.some((c) => 'slot' in c)).map((e) => e.attrs['data-slot'])).toEqual(['prefix']);
  });
});

describe('SpCheckbox and SpSwitch views (T-144)', () => {
  test('REQ-314 · a visually hidden native checkbox inside its <label>, then the drawn box and the text', () => {
    const view = uiCheckboxView({ label: 'Baseline', name: 'baseline', id: 'b' }, resolved(), { checked: true });
    expect(view.tag).toBe('label');
    const [input, box, text] = view.children as UiElement[];
    expect(input).toMatchObject({ tag: 'input', bind: 'native', attrs: { type: 'checkbox', class: 'sp-ui-native', name: 'baseline', id: 'b', checked: true } });
    expect(box!.attrs).toMatchObject({ class: 'sp-ui-box', 'aria-hidden': 'true' });
    expect(parts(box!)).toEqual(['sp-frame', 'sp-tone', 'sp-mark', 'sp-mark']);
    expect(all(box!).filter((e) => e.attrs.part === 'sp-mark').map((e) => e.attrs['data-glyph'])).toEqual(['tick', 'dash']);
    expect(text).toMatchObject({ attrs: { class: 'sp-ui-label' }, children: [{ text: 'Baseline' }] });
  });

  test('REQ-310 · the checked state is the native one; the markup shows it only through `checked` and `data-indeterminate`', () => {
    const off = uiCheckboxView({ label: 'A' }, resolved(), { checked: false });
    expect(one(off, (e) => e.tag === 'input').attrs.checked).toBeUndefined();
    expect(uiCheckboxView({ label: 'A', indeterminate: true }, resolved(), { checked: false }).attrs['data-indeterminate']).toBe('true');
  });

  test('REQ-314 · a switch is a native checkbox with role="switch", a pill track and an exact knob', () => {
    const view = uiSwitchView({ label: 'Precision', disabled: true }, resolved(), { checked: true });
    const input = one(view, (e) => e.tag === 'input');
    expect(input.attrs).toMatchObject({ type: 'checkbox', role: 'switch', checked: true, disabled: true });
    expect(parts(view)).toEqual(['sp-frame', 'sp-tone', 'sp-knob']);
    expect(one(view, (e) => e.attrs.part === 'sp-frame').attrs['data-kind']).toBe('pill');
  });
});

describe('SpCard and SpDivider views (T-144)', () => {
  test('REQ-318 · a titled card is an <article> labelled by its heading; its body is the content slot', () => {
    const view = uiCardView({ id: 'rev', title: 'Revenue', headingLevel: 2 }, resolved({ id: 'rev' }), { extra: true });
    expect(view.tag).toBe('article');
    expect(view.attrs['aria-labelledby']).toBe('rev--title');
    expect(one(view, (e) => e.tag === 'h2').attrs).toMatchObject({ id: 'rev--title', class: 'sp-ui-card-title' });
    expect(parts(view)).toEqual(['sp-frame', 'sp-rule']);
    expect(all(view).filter((e) => e.children.some((c) => 'slot' in c)).map((e) => e.attrs.class)).toEqual(['sp-ui-card-extra', 'sp-ui-card-body']);
  });

  test('REQ-318 · without a title it is a <section>; without an id a titled card is named by aria-label', () => {
    expect(uiCardView({}, resolved(), {}).tag).toBe('section');
    const anonymous = uiCardView({ title: 'Revenue' }, resolved(), { footer: true });
    expect(anonymous.attrs['aria-label']).toBe('Revenue');
    expect(one(anonymous, (e) => e.tag === 'h3').attrs.id).toBeUndefined();
    expect(all(anonymous).some((e) => e.attrs.class === 'sp-ui-card-footer')).toBe(true);
  });

  test('REQ-318 · a divider is a separator; with text, the text sits between two rules', () => {
    const plain = uiDividerView({}, resolved());
    expect(plain.attrs.role).toBe('separator');
    expect(parts(plain)).toEqual(['sp-rule']);
    const text = uiDividerView({ text: 'or', orientation: 'vertical', align: 'start' }, resolved());
    expect(text.attrs).toMatchObject({ 'aria-orientation': 'vertical', 'data-orientation': 'vertical', 'data-align': 'start' });
    expect(parts(text)).toEqual(['sp-rule', 'sp-rule']);
    expect(one(text, (e) => e.attrs.class === 'sp-ui-divider-text').children).toEqual([{ text: 'or' }]);
  });
});

describe('catalog batches', () => {
  test('REQ-300 · every catalog row names its batch of step 6c; B1 is the six of this phase', () => {
    expect(UI_COMPONENTS.filter((c) => c.batch === 'B1').map((c) => c.slug)).toEqual(['button', 'input', 'checkbox', 'switch', 'card', 'divider']);
    expect(UI_COMPONENTS.filter((c) => c.batch === 'B2').map((c) => c.slug)).toEqual(['radio-group', 'slider', 'rate', 'segmented', 'tabs']);
    expect(UI_COMPONENTS.filter((c) => c.batch === 'B3')).toHaveLength(6);
  });
});
