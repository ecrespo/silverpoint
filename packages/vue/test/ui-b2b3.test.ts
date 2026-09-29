import { afterEach, describe, expect, test, vi } from 'vitest';
import { createApp, createSSRApp, h, nextTick, ref, type Component } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiMatrix } from '../../../tools/visual-gate/ui-matrix';
import {
  SpAlert,
  SpBadge,
  SpProgress,
  SpRadioGroup,
  SpRate,
  SpSegmented,
  SpSkeleton,
  SpSlider,
  SpSteps,
  SpTabPanel,
  SpTabs,
  SpTag,
  type UiItem,
} from '../src/ui';
import { vueFixture } from './ui-fixture';

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});

function mount(render: () => ReturnType<typeof h>): HTMLElement {
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

const COMPONENTS: Record<string, Component> = {
  'radio-group': SpRadioGroup,
  segmented: SpSegmented,
  tabs: SpTabs,
  slider: SpSlider,
  rate: SpRate,
  steps: SpSteps,
  tag: SpTag,
  badge: SpBadge,
  progress: SpProgress,
  alert: SpAlert,
  skeleton: SpSkeleton,
};
const pr = uiMatrix().filter((f) => f.scope === 'pr' && f.component in COMPONENTS);

describe('Vue B2 and B3 markup (T-148, T-151)', () => {
  test.each(pr)('REQ-327 · $id is the canonical tree', async (fixture) => {
    const markup = await renderToString(createSSRApp({ render: () => vueFixture(fixture, COMPONENTS) }));
    expect(compareUi(markup, canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  test('REQ-327 · mounting every fixture raises no Vue warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    cleanup.push(() => warn.mockRestore());
    for (const fixture of pr) mount(() => vueFixture(fixture, COMPONENTS));
    expect(warn).not.toHaveBeenCalled();
  });
});

const grounds: UiItem[] = [
  { key: 'silverpoint', label: 'silverpoint' },
  { key: 'cyanotype', label: 'cyanotype', disabled: true },
  { key: 'burin', label: 'burin' },
];
const radios = (host: HTMLElement) => [...host.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
const key = (target: Element, name: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));

describe('Vue B2 behaviour (T-148)', () => {
  test('REQ-322 · v-model on SpRadioGroup follows the click; `change` reports the key', async () => {
    const model = ref<string | null>(null);
    const change = vi.fn();
    const host = mount(() =>
      h(SpRadioGroup, { items: grounds, name: 'g', label: 'Ground', modelValue: model.value, 'onUpdate:modelValue': (v: string) => (model.value = v), onChange: change }),
    );
    radios(host)[2]!.click();
    await nextTick();
    expect(model.value).toBe('burin');
    expect(change).toHaveBeenCalledWith('burin');
    expect(radios(host).map((r) => r.checked)).toEqual([false, false, true]);
  });

  test('REQ-322 · a bound SpSegmented keeps showing its model until the parent changes it', async () => {
    const update = vi.fn();
    const items = grounds.map((g) => ({ ...g, disabled: false }));
    const host = mount(() => h(SpSegmented, { items, label: 'Ground', modelValue: 'silverpoint', 'onUpdate:modelValue': update }));
    radios(host)[1]!.click();
    await nextTick();
    expect(update).toHaveBeenCalledWith('cyanotype');
    expect(radios(host).map((r) => r.checked)).toEqual([true, false, false]);
  });

  test('REQ-315 · REQ-326 · arrows move and select through the core, skipping a disabled item', async () => {
    const update = vi.fn();
    const host = mount(() => h(SpRadioGroup, { items: grounds, name: 'g', label: 'Ground', defaultValue: 'silverpoint', 'onUpdate:modelValue': update }));
    radios(host)[0]!.focus();
    key(radios(host)[0]!, 'ArrowDown');
    await nextTick();
    expect(document.activeElement).toBe(radios(host)[2]);
    expect(update).toHaveBeenCalledWith('burin');
    expect(update).not.toHaveBeenCalledWith('cyanotype');
  });

  test('REQ-315 · SpTabs: automatic activation selects on arrow; panels follow', async () => {
    const update = vi.fn();
    const items = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }];
    const host = mount(() =>
      h(SpTabs, { id: 't', items, 'onUpdate:modelValue': update }, () => [h(SpTabPanel, { value: 'a' }, () => 'first'), h(SpTabPanel, { value: 'b' }, () => 'second')]),
    );
    const tabs = () => [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = () => [...host.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    expect(panels().map((p) => p.hidden)).toEqual([false, true]);
    expect(panels()[1]!.getAttribute('aria-labelledby')).toBe('t--tab-b');
    tabs()[0]!.focus();
    key(tabs()[0]!, 'ArrowRight');
    await nextTick();
    expect(update).toHaveBeenCalledWith('b');
    expect(tabs().map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'true']);
    expect(panels().map((p) => p.hidden)).toEqual([true, false]);
  });

  test('REQ-315 · SpTabs manual activation moves focus only; a click selects', async () => {
    const update = vi.fn();
    const items = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }];
    const host = mount(() => h(SpTabs, { items, activation: 'manual', 'onUpdate:modelValue': update }));
    const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    tabs[0]!.focus();
    key(tabs[0]!, 'ArrowRight');
    expect(document.activeElement).toBe(tabs[1]);
    expect(update).not.toHaveBeenCalled();
    tabs[1]!.click();
    expect(update).toHaveBeenCalledWith('b');
  });

  test('REQ-322 · SpSlider: the model follows input as a number; `change` fires on commit', async () => {
    const model = ref(30);
    const change = vi.fn();
    const host = mount(() => h(SpSlider, { label: 'Volume', modelValue: model.value, 'onUpdate:modelValue': (v: number) => (model.value = v), onChange: change }));
    const input = host.querySelector<HTMLInputElement>('input[type="range"]')!;
    input.value = '55';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    expect(model.value).toBe(55);
    expect(change).not.toHaveBeenCalled();
    input.dispatchEvent(new Event('change'));
    expect(change).toHaveBeenCalledWith(55);
    expect(host.querySelector<HTMLElement>('.sp-slider')!.style.getPropertyValue('--sp-ui-fraction')).toBe('0.55');
  });

  test('REQ-322 · SpRate reports the number clicked; read-only emits nothing and keeps its value', async () => {
    const update = vi.fn();
    const host = mount(() => h(SpRate, { label: 'Quality', defaultValue: 2, 'onUpdate:modelValue': update }));
    radios(host)[3]!.click();
    await nextTick();
    expect(update).toHaveBeenCalledWith(4);
    expect(host.querySelectorAll('[data-filled="true"]')).toHaveLength(4);
    const frozen = vi.fn();
    const readOnly = mount(() => h(SpRate, { label: 'Quality', modelValue: 3, readOnly: true, 'onUpdate:modelValue': frozen }));
    radios(readOnly)[0]!.click();
    await nextTick();
    expect(frozen).not.toHaveBeenCalled();
    expect(radios(readOnly).map((r) => r.checked)).toEqual([false, false, true, false, false]);
  });

  test('REQ-323 · the radios and the range submit with a native form', () => {
    const host = mount(() =>
      h('form', [
        h(SpRadioGroup, { items: grounds, name: 'ground', label: 'Ground', defaultValue: 'burin' }),
        h(SpSegmented, { items: grounds, name: 'period', label: 'Period', defaultValue: 'silverpoint' }),
        h(SpSlider, { label: 'Volume', name: 'volume', defaultValue: 30 }),
        h(SpRate, { label: 'Quality', name: 'quality', defaultValue: 3 }),
      ]),
    );
    expect(Object.fromEntries(new FormData(host.querySelector('form')!))).toEqual({ ground: 'burin', period: 'silverpoint', volume: '30', quality: '3' });
  });
});

describe('Vue B3 behaviour (T-151)', () => {
  test('a closable SpTag and SpAlert emit `close` from their close button', () => {
    const close = vi.fn();
    const host = mount(() => h('div', [h(SpTag, { closable: true, onClose: close }, () => 'review'), h(SpAlert, { closable: true, onClose: close }, () => 'done')]));
    for (const button of host.querySelectorAll<HTMLButtonElement>('.sp-ui-close')) button.click();
    expect(close).toHaveBeenCalledTimes(2);
    expect(host.querySelector('.sp-ui-close')!.getAttribute('aria-label')).toBe('Remove review');
  });

  test('REQ-318 · SpSteps, SpProgress and SpSkeleton carry their roles', () => {
    const host = mount(() =>
      h('div', [
        h(SpSteps, { items: [{ key: 'a', title: 'A' }, { key: 'b', title: 'B' }], current: 1 }),
        h(SpProgress, { label: 'Upload', value: 40 }),
        h(SpSkeleton),
      ]),
    );
    expect(host.querySelector('[aria-current="step"]')!.textContent).toContain('B');
    expect(host.querySelector('[role="progressbar"]')!.getAttribute('aria-valuenow')).toBe('40');
    expect(host.querySelector('[aria-busy="true"]')).not.toBeNull();
  });
});
