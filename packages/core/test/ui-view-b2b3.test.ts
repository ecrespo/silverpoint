import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, type SpCode } from '../src';
import {
  resolveUi,
  UI_GLYPHS,
  uiAlertView,
  uiBadgeView,
  uiIsRovingKey,
  uiProgressArc,
  uiProgressView,
  uiRadioGroupView,
  uiRateView,
  uiSegmentedView,
  uiSelectedKey,
  uiSkeletonView,
  uiSliderView,
  uiStepsView,
  uiTabPanelView,
  uiTabsView,
  uiTagView,
  type UiElement,
  type UiItem,
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
const all = (n: UiNode): UiElement[] => (isElement(n) ? [n, ...n.children.flatMap(all)] : []);
const partsOf = (e: UiElement) => (typeof e.attrs.part === 'string' ? e.attrs.part.split(' ') : []);
const withPart = (n: UiNode, part: string) => all(n).filter((e) => partsOf(e).includes(part));
const byClass = (n: UiNode, cls: string) => all(n).filter((e) => typeof e.attrs.class === 'string' && e.attrs.class.split(' ').includes(cls));
const texts = (n: UiNode): string[] => ('text' in n ? [n.text] : isElement(n) ? n.children.flatMap(texts) : []);
const r = (props = {}) => resolveUi(props, {});
const heightened = (n: UiNode) => withPart(n, 'sp-heighten');

/** Every drawn element sits under `aria-hidden="true"` (REQ-314). */
function drawnAreHidden(view: UiElement): void {
  const walk = (n: UiNode, hidden: boolean) => {
    if (!isElement(n)) return;
    const h = hidden || n.attrs['aria-hidden'] === 'true';
    if (partsOf(n).length > 0) expect(h, `${n.tag}[part=${n.attrs.part}]`).toBe(true);
    for (const c of n.children) walk(c, h);
  };
  walk(view, false);
}

const grounds: UiItem[] = [
  { key: 'silverpoint', label: 'silverpoint' },
  { key: 'cyanotype', label: 'cyanotype', disabled: true },
  { key: 'burin', label: 'burin' },
];
const periods: UiItem[] = ['day', 'week', 'month'].map((key) => ({ key, label: key[0]!.toUpperCase() + key.slice(1) }));

describe('uiSelectedKey (T-147)', () => {
  test('REQ-322 · Data Model §2.14 · an existing, enabled key is kept', () => {
    expect(uiSelectedKey(grounds, 'burin', 'none')).toBe('burin');
    expect(uiSelectedKey(grounds, 'burin', 'first')).toBe('burin');
  });

  test('A-06 · an unknown or disabled key falls back silently: none for RadioGroup, the first enabled for Segmented and Tabs', () => {
    const seen = capture();
    expect(uiSelectedKey(grounds, 'gone', 'none')).toBeNull();
    expect(uiSelectedKey(grounds, 'cyanotype', 'none')).toBeNull();
    expect(uiSelectedKey(grounds, null, 'none')).toBeNull();
    expect(uiSelectedKey(grounds.slice(1), 'gone', 'first')).toBe('burin');
    expect(uiSelectedKey(grounds, undefined, 'first')).toBe('silverpoint');
    expect(uiSelectedKey([], 'x', 'first')).toBeNull();
    expect(seen).toEqual([]);
  });
});

describe('uiIsRovingKey (T-147)', () => {
  test('REQ-315 · only the arrows, Home and End move a roving focus', () => {
    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']) expect(uiIsRovingKey(key)).toBe(true);
    for (const key of ['Tab', 'Enter', ' ', 'a', 'PageDown']) expect(uiIsRovingKey(key)).toBe(false);
  });
});

describe('B2 and B3 roots (T-147, T-150)', () => {
  const views = (): Array<[string, UiElement]> => [
    ['radio-group', uiRadioGroupView({ items: grounds, name: 'g', label: 'Ground' }, r(), { value: null })],
    ['segmented', uiSegmentedView({ items: periods, label: 'Period' }, r(), { value: 'day' })],
    ['tabs', uiTabsView({ items: periods }, r(), { value: 'day' })],
    ['slider', uiSliderView({ label: 'Volume' }, r(), { value: 30 })],
    ['rate', uiRateView({ label: 'Quality' }, r(), { value: 3 })],
    ['steps', uiStepsView({ items: [{ key: 'a', title: 'A' }], current: 0 }, r())],
    ['tag', uiTagView({}, r(), { text: 'draft' })],
    ['badge', uiBadgeView({ count: 3 }, r(), { text: 'Inbox' })],
    ['progress', uiProgressView({ label: 'Upload', value: 40 }, r())],
    ['alert', uiAlertView({}, r(), { closable: false })],
    ['skeleton', uiSkeletonView({}, r())],
  ];

  test('REQ-327 · every root carries the class, ground, substrate, mode, size and frame slot', () => {
    for (const [slug, view] of views()) {
      expect(view.attrs.class).toBe(`sp-ui sp-${slug} sp-ground-silverpoint`);
      expect(view.attrs).toMatchObject({ 'data-ground': 'silverpoint', 'data-substrate': 'cream', 'data-mode': 'ink', 'data-size': 'md', 'data-frame': '0' });
    }
  });

  test('REQ-314 · every drawn part is aria-hidden', () => {
    for (const [, view] of views()) drawnAreHidden(view);
  });

  test('REQ-309 · I-18 · at most one heightened element per instance', () => {
    for (const [, view] of views()) expect(heightened(view).length).toBeLessThanOrEqual(1);
  });

  test('REQ-306 · ink and precision emit the same elements; only data-mode differs', () => {
    const strip = (n: UiNode): unknown => (isElement(n) ? { ...n, attrs: { ...n.attrs, 'data-mode': '' }, children: n.children.map(strip) } : n);
    const ink = uiSliderView({ label: 'V', marks: [0, 50, 100] }, resolveUi({ mode: 'ink' }, {}), { value: 30 });
    const precision = uiSliderView({ label: 'V', marks: [0, 50, 100] }, resolveUi({ mode: 'precision' }, {}), { value: 30 });
    expect(strip(precision)).toEqual(strip(ink));
  });
});

describe('SpRadioGroup view (T-147)', () => {
  const view = (value: string | null, extra = {}) =>
    uiRadioGroupView({ id: 'g', items: grounds, name: 'ground', label: 'Ground', ...extra }, r({ id: 'g' }), { value });

  test('REQ-314 · a <fieldset> named by its <legend>, one native radio per item, all under `name`', () => {
    const v = view('silverpoint');
    expect(v.tag).toBe('fieldset');
    expect(v.children[0]).toMatchObject({ tag: 'legend', children: [{ text: 'Ground' }] });
    const radios = all(v).filter((e) => e.tag === 'input');
    expect(radios.map((e) => e.attrs.value)).toEqual(['silverpoint', 'cyanotype', 'burin']);
    for (const radio of radios) expect(radio).toMatchObject({ bind: 'native', attrs: { type: 'radio', name: 'ground', class: 'sp-ui-native' } });
    expect(radios.map((e) => e.attrs.id)).toEqual(['g--silverpoint', 'g--cyanotype', 'g--burin']);
  });

  test('REQ-322 · the value checks its radio, and only it; null checks none', () => {
    expect(all(view('burin')).filter((e) => e.attrs.checked === true).map((e) => e.attrs.value)).toEqual(['burin']);
    expect(all(view(null)).filter((e) => e.attrs.checked === true)).toEqual([]);
  });

  test('REQ-326 · a disabled item is the native attribute on its radio, and its label says so', () => {
    const items = byClass(view(null), 'sp-ui-item');
    expect(items[1]!.attrs['data-disabled']).toBe('true');
    expect(all(items[1]!).find((e) => e.tag === 'input')!.attrs.disabled).toBe(true);
    expect(all(items[0]!).find((e) => e.tag === 'input')!.attrs.disabled).toBeUndefined();
  });

  test('REQ-310 · each item draws a round frame, a selected tone and an exact dot, which ui.css shows on :checked', () => {
    const box = byClass(byClass(view(null), 'sp-ui-item')[0]!, 'sp-ui-box')[0]!;
    expect(box.attrs['aria-hidden']).toBe('true');
    expect(box.children.map((c) => (c as UiElement).attrs.part)).toEqual(['sp-frame', 'sp-tone', 'sp-mark']);
    expect((box.children[2] as UiElement).attrs['data-glyph']).toBe('dot');
  });

  test('orientation defaults to vertical', () => {
    expect(view(null).attrs['data-orientation']).toBe('vertical');
    expect(view(null, { orientation: 'horizontal' }).attrs['data-orientation']).toBe('horizontal');
  });

  test('REQ-325 · items sharing a key keep the first and warn SP019', () => {
    const seen = capture();
    const v = uiRadioGroupView({ items: [...grounds, { key: 'burin', label: 'again' }], name: 'g', label: 'G' }, r(), { value: null });
    expect(all(v).filter((e) => e.tag === 'input')).toHaveLength(3);
    expect(seen.map((s) => s.code)).toEqual(['SP019']);
  });
});

describe('SpSegmented view (T-147)', () => {
  const view = (value: string, extra = {}) => uiSegmentedView({ id: 'p', items: periods, label: 'Period', name: 'period', ...extra }, r({ id: 'p' }), { value });

  test('REQ-314 · a <fieldset> with a legend for assistive technology only, and native radios', () => {
    const v = view('week');
    expect(v.tag).toBe('fieldset');
    expect(v.children[0]).toMatchObject({ tag: 'legend', attrs: { class: 'sp-ui-legend sp-ui-sr' }, children: [{ text: 'Period' }] });
    const radios = all(v).filter((e) => e.tag === 'input');
    expect(radios.map((e) => [e.attrs.value, e.attrs.checked ?? false])).toEqual([['day', false], ['week', true], ['month', false]]);
    for (const radio of radios) expect(radio.attrs.name).toBe('period');
  });

  test('REQ-322 · without `name`, the radios are grouped under `${id}--value`; without either, they carry none', () => {
    const named = uiSegmentedView({ id: 'p', items: periods, label: 'P' }, r(), { value: 'day' });
    expect(all(named).find((e) => e.tag === 'input')!.attrs.name).toBe('p--value');
    const anonymous = uiSegmentedView({ items: periods, label: 'P' }, r(), { value: 'day' });
    expect(all(anonymous).find((e) => e.tag === 'input')!.attrs.name).toBeUndefined();
  });

  test('REQ-308 · REQ-309 · the selected segment alone takes the tone and the heightening, its label on a plate', () => {
    const v = view('week');
    const segments = byClass(v, 'sp-ui-item');
    expect(segments.map((s) => withPart(s, 'sp-tone').length)).toEqual([0, 1, 0]);
    expect(segments.map((s) => heightened(s).length)).toEqual([0, 1, 0]);
    expect(withPart(segments[1]!, 'sp-tone')[0]!.attrs['data-tone']).toBe('selected');
    expect(byClass(segments[1]!, 'sp-ui-plate')).toHaveLength(1);
    expect(withPart(v, 'sp-frame')).toHaveLength(1);
  });

  test('A-06 · an unknown key selects the first enabled segment, silently', () => {
    const seen = capture();
    expect(all(view('decade')).filter((e) => e.attrs.checked === true).map((e) => e.attrs.value)).toEqual(['day']);
    expect(seen).toEqual([]);
  });

  test('block stretches the control', () => {
    expect(view('day', { block: true }).attrs['data-block']).toBe('true');
    expect(view('day').attrs['data-block']).toBeUndefined();
  });
});

describe('SpTabs view (T-147)', () => {
  const items = periods.map((p) => (p.key === 'month' ? { ...p, disabled: true } : p));
  const view = (value: string, extra = {}) => uiTabsView({ id: 'v', items, label: 'Views', ...extra }, r({ id: 'v' }), { value });

  test('REQ-314 · REQ-315 · a tablist of native buttons with role tab; the selected one is the single tab stop', () => {
    const v = view('week');
    const list = all(v).find((e) => e.attrs.role === 'tablist')!;
    expect(list.attrs['aria-label']).toBe('Views');
    const tabs = all(v).filter((e) => e.attrs.role === 'tab');
    expect(tabs.map((t) => t.tag)).toEqual(['button', 'button', 'button']);
    expect(tabs.map((t) => t.attrs['aria-selected'])).toEqual(['false', 'true', 'false']);
    expect(tabs.map((t) => t.attrs.tabindex)).toEqual(['-1', '0', '-1']);
    for (const t of tabs) expect(t).toMatchObject({ bind: 'native', attrs: { type: 'button' } });
    expect(tabs.map((t) => t.attrs['data-key'])).toEqual(['day', 'week', 'month']);
  });

  test('REQ-329 · tabs and panels are related by ids derived from the id', () => {
    const tab = all(view('day')).find((e) => e.attrs.role === 'tab')!;
    expect(tab.attrs).toMatchObject({ id: 'v--tab-day', 'aria-controls': 'v--panel-day' });
    const anonymous = uiTabsView({ items }, r(), { value: 'day' });
    const bare = all(anonymous).find((e) => e.attrs.role === 'tab')!;
    expect(bare.attrs.id).toBeUndefined();
    expect(bare.attrs['aria-controls']).toBeUndefined();
  });

  test('REQ-326 · a disabled tab is natively disabled', () => {
    const tabs = all(view('day')).filter((e) => e.attrs.role === 'tab');
    expect(tabs.map((t) => t.attrs.disabled ?? false)).toEqual([false, false, true]);
  });

  test('REQ-309 · the active tab alone is heightened; the rule under the list is exact', () => {
    const v = view('week');
    const tabs = all(v).filter((e) => e.attrs.role === 'tab');
    expect(tabs.map((t) => heightened(t).length)).toEqual([0, 1, 0]);
    expect(withPart(v, 'sp-rule')).toHaveLength(1);
  });

  test('the panels are the content slot; vertical tabs say so', () => {
    expect(all(view('day')).some((e) => e.children.some((c) => 'slot' in c && c.slot === 'content'))).toBe(true);
    const vertical = view('day', { orientation: 'vertical' });
    expect(all(vertical).find((e) => e.attrs.role === 'tablist')!.attrs['aria-orientation']).toBe('vertical');
    expect(vertical.attrs['data-orientation']).toBe('vertical');
  });

  test('REQ-314 · a panel is a tabpanel labelled by its tab, focusable, hidden unless active', () => {
    const active = uiTabPanelView({ value: 'day' }, { id: 'v', value: 'day' });
    expect(active).toMatchObject({ tag: 'div', attrs: { role: 'tabpanel', id: 'v--panel-day', 'aria-labelledby': 'v--tab-day', tabindex: '0', class: 'sp-ui-tabpanel' } });
    expect(active.attrs.hidden).toBeUndefined();
    expect(active.children).toEqual([{ slot: 'content' }]);
    expect(uiTabPanelView({ value: 'week' }, { id: 'v', value: 'day' }).attrs.hidden).toBe(true);
    expect(uiTabPanelView({ value: 'week' }, { value: 'week' }).attrs.id).toBeUndefined();
  });
});

describe('SpSlider view (T-147)', () => {
  test('REQ-314 · a <label> holding the text and a native range input bound to the value', () => {
    const v = uiSliderView({ id: 's', label: 'Volume', name: 'volume', min: 0, max: 100, step: 5 }, r({ id: 's' }), { value: 30 });
    expect(v.tag).toBe('label');
    expect(texts(byClass(v, 'sp-ui-label')[0]!)).toEqual(['Volume']);
    const input = all(v).find((e) => e.tag === 'input')!;
    expect(input).toMatchObject({ bind: 'native', attrs: { type: 'range', min: '0', max: '100', step: '5', value: '30', name: 'volume', id: 's', class: 'sp-ui-range' } });
  });

  test('DD-025 · REQ-304 · the fraction is a custom property; track, fill and thumb are drawn, the thumb heightened', () => {
    const v = uiSliderView({ label: 'V' }, r(), { value: 30 });
    expect(v.attrs.style).toBe('--sp-ui-fraction: 0.3');
    for (const part of ['sp-track', 'sp-fill', 'sp-thumb']) expect(withPart(v, part)).toHaveLength(1);
    expect(heightened(v)).toEqual(withPart(v, 'sp-thumb'));
  });

  test('REQ-324 · a value off its range or step is drawn corrected, with SP017', () => {
    const seen = capture();
    const v = uiSliderView({ label: 'V', step: 10 }, r(), { value: 34 });
    expect(all(v).find((e) => e.tag === 'input')!.attrs.value).toBe('30');
    expect(v.attrs.style).toBe('--sp-ui-fraction: 0.3');
    expect(seen.map((s) => s.code)).toEqual(['SP017']);
  });

  test('marks: each at its exact fraction, labelled, and hidden from assistive technology; out-of-range marks dropped', () => {
    const v = uiSliderView({ label: 'V', marks: [0, 25, 100, 140] }, r(), { value: 30 });
    const marks = byClass(v, 'sp-ui-scale-mark');
    expect(marks.map((m) => m.attrs.style)).toEqual(['--sp-ui-at: 0', '--sp-ui-at: 0.25', '--sp-ui-at: 1']);
    expect(marks.map((m) => texts(m).join(''))).toEqual(['0', '25', '100']);
    expect(byClass(v, 'sp-ui-scale')[0]!.attrs['aria-hidden']).toBe('true');
    expect(byClass(uiSliderView({ label: 'V' }, r(), { value: 0 }), 'sp-ui-scale')).toEqual([]);
  });

  test('REQ-326 · disabled is native', () => {
    const v = uiSliderView({ label: 'V', disabled: true }, r(), { value: 30 });
    expect(all(v).find((e) => e.tag === 'input')!.attrs.disabled).toBe(true);
  });
});

describe('SpRate view (T-147)', () => {
  test('REQ-314 · a fieldset of `count` native radios, valued 1..count, each with its number as name', () => {
    const v = uiRateView({ id: 'q', label: 'Quality', name: 'quality' }, r({ id: 'q' }), { value: 3 });
    expect(v.tag).toBe('fieldset');
    expect(v.children[0]).toMatchObject({ tag: 'legend', children: [{ text: 'Quality' }] });
    const radios = all(v).filter((e) => e.tag === 'input');
    expect(radios.map((e) => e.attrs.value)).toEqual(['1', '2', '3', '4', '5']);
    expect(radios.map((e) => e.attrs['aria-label'])).toEqual(['1', '2', '3', '4', '5']);
    expect(radios.filter((e) => e.attrs.checked === true).map((e) => e.attrs.value)).toEqual(['3']);
    for (const radio of radios) expect(radio.attrs.name).toBe('quality');
  });

  test('C-2 · REQ-308 · each mark is an exact lozenge; the filled ones, up to the value, take the tone', () => {
    const v = uiRateView({ label: 'Q' }, r(), { value: 3 });
    const items = byClass(v, 'sp-ui-item');
    expect(items.map((i) => withPart(i, 'sp-mark')[0]!.attrs['data-glyph'])).toEqual(Array(5).fill('lozenge'));
    expect(items.map((i) => withPart(i, 'sp-tone').length)).toEqual([1, 1, 1, 0, 0]);
    expect(items.map((i) => i.attrs['data-filled'] ?? 'false')).toEqual(['true', 'true', 'true', 'false', 'false']);
  });

  test('REQ-324 · count and value are corrected in the core, with SP017', () => {
    const seen = capture();
    const v = uiRateView({ label: 'Q', count: 12 }, r(), { value: 2.6 });
    expect(all(v).filter((e) => e.tag === 'input')).toHaveLength(10);
    expect(all(v).find((e) => e.attrs.checked === true)!.attrs.value).toBe('3');
    expect(seen.map((s) => s.code)).toEqual(['SP017', 'SP017']);
  });

  test('read-only is a radiogroup that says so; disabled is native on every radio', () => {
    const readOnly = uiRateView({ label: 'Q', readOnly: true }, r(), { value: 3 });
    expect(readOnly.attrs).toMatchObject({ role: 'radiogroup', 'aria-readonly': 'true', 'data-readonly': 'true' });
    const disabled = uiRateView({ label: 'Q', disabled: true }, r(), { value: 3 });
    expect(all(disabled).filter((e) => e.tag === 'input').every((e) => e.attrs.disabled === true)).toBe(true);
    expect(disabled.attrs.role).toBeUndefined();
  });

  test('value 0 checks nothing', () => {
    expect(all(uiRateView({ label: 'Q' }, r(), { value: 0 })).filter((e) => e.attrs.checked === true)).toEqual([]);
  });
});

describe('SpSteps view (T-150)', () => {
  const items = ['install', 'import', 'configure', 'publish'].map((key) => ({ key, title: key[0]!.toUpperCase() + key.slice(1) }));

  test('REQ-318 · an ordered list; the current step carries aria-current="step" and the one heightening', () => {
    const v = uiStepsView({ id: 'rel', items, current: 2, label: 'Release' }, r({ id: 'rel' }));
    expect(v.tag).toBe('ol');
    expect(v.attrs['aria-label']).toBe('Release');
    const steps = v.children as UiElement[];
    expect(steps.map((s) => s.tag)).toEqual(['li', 'li', 'li', 'li']);
    expect(steps.map((s) => s.attrs['aria-current'] ?? null)).toEqual([null, null, 'step', null]);
    expect(steps.map((s) => heightened(s).length)).toEqual([0, 0, 1, 0]);
    expect(steps.map((s) => s.attrs['data-status'])).toEqual(['finish', 'finish', 'process', 'wait']);
  });

  test('C-4 · DD-026 · connectors carry the status of the step they lead to; none after the last', () => {
    const v = uiStepsView({ items, current: 2 }, r());
    expect(withPart(v, 'sp-connector').map((c) => c.attrs['data-status'])).toEqual(['finish', 'process', 'wait']);
  });

  test('REQ-310 · finished steps show an exact tick, an error its ✕, the others their number', () => {
    const withError = items.map((s, i) => (i === 2 ? { ...s, status: 'error' as const } : s));
    const marks = byClass(uiStepsView({ items: withError, current: 2 }, r()), 'sp-ui-step-mark');
    expect(marks.map((m) => (m.children[0] as UiElement).attrs?.['data-glyph'] ?? texts(m).join(''))).toEqual(['tick', 'tick', 'cross', '4']);
    for (const m of marks) expect(m.attrs['aria-hidden']).toBe('true');
  });

  test('titles and descriptions are text; the orientation defaults to horizontal', () => {
    const v = uiStepsView({ items: [{ key: 'a', title: 'A', description: 'first' }], current: 0 }, r());
    expect(texts(v)).toEqual(['1', 'A', 'first']);
    expect(v.attrs['data-orientation']).toBe('horizontal');
  });

  test('REQ-324 · a current out of range is clamped with SP017', () => {
    const seen = capture();
    const v = uiStepsView({ items, current: 9 }, r());
    expect((v.children as UiElement[]).map((s) => s.attrs['aria-current'] ?? null)).toEqual([null, null, null, 'step']);
    expect(seen.map((s) => s.code)).toEqual(['SP017']);
  });
});

describe('SpTag view (T-150)', () => {
  test('REQ-308 · a span framed and toned at its level (1 by default), its text on a plate', () => {
    const v = uiTagView({}, r(), { text: 'draft' });
    expect(v.tag).toBe('span');
    expect(withPart(v, 'sp-frame')).toHaveLength(1);
    expect(withPart(v, 'sp-tone')[0]!.attrs['data-tone']).toBe('1');
    expect(byClass(v, 'sp-ui-plate')[0]!.children).toEqual([{ slot: 'content' }]);
    expect(withPart(uiTagView({ tone: 3 }, r(), { text: 'x' }), 'sp-tone')[0]!.attrs['data-tone']).toBe('3');
  });

  test('closable adds a native close button named by closeLabel and the text, bound to `close`', () => {
    const v = uiTagView({ closable: true }, r(), { text: 'review' });
    const close = all(v).find((e) => e.tag === 'button')!;
    expect(close).toMatchObject({ bind: 'close', attrs: { type: 'button', class: 'sp-ui-close', 'aria-label': 'Remove review' } });
    expect(withPart(close, 'sp-mark')[0]!.attrs['data-glyph']).toBe('cross');
    const custom = all(uiTagView({ closable: true, closeLabel: 'Quitar' }, r(), {})).find((e) => e.tag === 'button')!;
    expect(custom.attrs['aria-label']).toBe('Quitar');
    expect(all(uiTagView({}, r(), { text: 'x' })).some((e) => e.tag === 'button')).toBe(false);
  });
});

describe('SpBadge view (T-150)', () => {
  test('REQ-318 · the count is text beside the content, so it is in the accessible name', () => {
    const v = uiBadgeView({ count: 12 }, r(), { text: 'Inbox' });
    expect(v.tag).toBe('span');
    expect(byClass(v, 'sp-ui-label')[0]!.children).toEqual([{ slot: 'content' }]);
    const count = byClass(v, 'sp-ui-badge-count')[0]!;
    expect(count.attrs['aria-hidden']).toBeUndefined();
    expect(texts(count)).toEqual(['12']);
    expect(withPart(count, 'sp-frame')[0]!.attrs['data-kind']).toBe('pill');
  });

  test('over max it reads max+; max defaults to 99', () => {
    expect(texts(uiBadgeView({ count: 120 }, r(), { text: 'M' }))).toEqual(['99+']);
    expect(texts(uiBadgeView({ count: 12, max: 9 }, r(), { text: 'M' }))).toEqual(['9+']);
  });

  test('a dot is drawn and hidden; its meaning is the label, for assistive technology', () => {
    const v = uiBadgeView({ dot: true, label: 'new' }, r(), { text: 'Alerts' });
    expect(byClass(v, 'sp-ui-badge-dot')[0]!.attrs['aria-hidden']).toBe('true');
    expect(byClass(v, 'sp-ui-sr')[0]!.children).toEqual([{ text: 'new' }]);
    expect(byClass(v, 'sp-ui-badge-count')).toEqual([]);
  });

  test('REQ-319 · with no content, no count and no label it warns SP018', () => {
    const seen = capture();
    uiBadgeView({ dot: true }, r(), {});
    expect(seen.map((s) => s.code)).toEqual(['SP018']);
  });
});

describe('SpProgress view (T-150)', () => {
  test('REQ-318 · a progressbar with its name, min, max and now; the fraction as a custom property', () => {
    const v = uiProgressView({ label: 'Upload', value: 40 }, r());
    expect(v).toMatchObject({
      tag: 'div',
      attrs: { role: 'progressbar', 'aria-label': 'Upload', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '40', 'data-shape': 'line', style: '--sp-ui-fraction: 0.4' },
    });
    expect(withPart(v, 'sp-track')).toHaveLength(1);
    expect(withPart(v, 'sp-fill')).toHaveLength(1);
    expect(texts(byClass(v, 'sp-ui-value')[0]!)).toEqual(['40%']);
  });

  test('REQ-318 · REQ-320 · indeterminate has no aria-valuenow, no value text and a static tone', () => {
    const v = uiProgressView({ label: 'Loading' }, r());
    expect(v.attrs['aria-valuenow']).toBeUndefined();
    expect(v.attrs.style).toBeUndefined();
    expect(v.attrs['data-indeterminate']).toBe('true');
    expect(byClass(v, 'sp-ui-value')).toEqual([]);
  });

  test('DD-025 · the circle is the core\'s exact arc, in its fixed view box', () => {
    const v = uiProgressView({ label: 'Coverage', value: 72, shape: 'circle' }, r());
    const svg = all(v).find((e) => e.tag === 'svg')!;
    expect(svg.attrs).toMatchObject({ viewBox: '0 0 100 100', 'aria-hidden': 'true' });
    const arc = uiProgressArc(0.72, 8);
    expect((svg.children as UiElement[]).map((p) => p.attrs.d)).toEqual([arc.track.d, arc.fill.d]);
  });

  test('REQ-324 · a value out of 0..100 is clamped with SP017; showValue false hides the text', () => {
    const seen = capture();
    expect(uiProgressView({ label: 'U', value: 140 }, r()).attrs['aria-valuenow']).toBe('100');
    expect(seen.map((s) => s.code)).toEqual(['SP017']);
    expect(byClass(uiProgressView({ label: 'U', value: 4, showValue: false }, r()), 'sp-ui-value')).toEqual([]);
  });
});

describe('SpAlert view (T-150)', () => {
  test('REQ-318 · error and warning are alerts, info and success status', () => {
    const role = (kind: 'info' | 'success' | 'warning' | 'error') => uiAlertView({ kind }, r(), { closable: false }).attrs.role;
    expect([role('info'), role('success'), role('warning'), role('error')]).toEqual(['status', 'status', 'alert', 'alert']);
    expect(uiAlertView({}, r(), { closable: false }).attrs['data-kind']).toBe('info');
  });

  test('REQ-310 · each kind has its exact glyph; error alone takes the alertError tone, its text on a plate (C-3)', () => {
    const glyph = (kind: 'info' | 'success' | 'warning' | 'error') => withPart(uiAlertView({ kind }, r(), { closable: false }), 'sp-mark')[0]!.attrs['data-glyph'];
    expect([glyph('info'), glyph('success'), glyph('warning'), glyph('error')]).toEqual(['info', 'tick', 'warning', 'cross']);
    const error = uiAlertView({ kind: 'error', title: 'Build failed' }, r(), { closable: false });
    expect(withPart(error, 'sp-tone').map((t) => t.attrs['data-tone'])).toEqual(['alertError']);
    expect(byClass(error, 'sp-ui-plate')).toHaveLength(1);
    expect(withPart(uiAlertView({ kind: 'warning' }, r(), { closable: false }), 'sp-tone')).toEqual([]);
  });

  test('the title is text, the body the content slot; closable adds a close button', () => {
    const v = uiAlertView({ title: 'Published', closable: true }, r(), { closable: true });
    expect(texts(byClass(v, 'sp-ui-alert-title')[0]!)).toEqual(['Published']);
    expect(byClass(v, 'sp-ui-alert-text')[0]!.children).toEqual([{ slot: 'content' }]);
    expect(all(v).find((e) => e.tag === 'button')).toMatchObject({ bind: 'close', attrs: { 'aria-label': 'Close' } });
  });
});

describe('SpSkeleton view (T-150)', () => {
  test('REQ-318 · aria-busy, a label for assistive technology, and hidden toned shapes', () => {
    const v = uiSkeletonView({}, r());
    expect(v.attrs['aria-busy']).toBe('true');
    expect(byClass(v, 'sp-ui-sr')[0]!.children).toEqual([{ text: 'Loading' }]);
    expect(byClass(v, 'sp-ui-skeleton-line')).toHaveLength(3);
    expect(byClass(v, 'sp-ui-skeleton-avatar')).toEqual([]);
    expect(withPart(v, 'sp-tone').every((t) => t.attrs['data-tone'] === '1')).toBe(true);
  });

  test('lines are held to 1..8; avatar adds a round shape', () => {
    expect(byClass(uiSkeletonView({ lines: 12 }, r()), 'sp-ui-skeleton-line')).toHaveLength(8);
    expect(byClass(uiSkeletonView({ lines: 0 }, r()), 'sp-ui-skeleton-line')).toHaveLength(1);
    const avatar = uiSkeletonView({ avatar: true, label: 'Cargando' }, r());
    expect(withPart(byClass(avatar, 'sp-ui-skeleton-avatar')[0]!, 'sp-tone')[0]!.attrs['data-kind']).toBe('round');
    expect(texts(avatar)).toEqual(['Cargando']);
  });
});

describe('glyphs (T-147, T-150)', () => {
  test('REQ-310 · the dot, the lozenge and the info mark are exact paths in the 16 × 16 box', () => {
    for (const name of ['dot', 'lozenge', 'info'] as const) expect(UI_GLYPHS[name]).toMatch(/^M/);
  });
});
