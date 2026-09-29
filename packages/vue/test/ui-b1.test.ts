import { __setDiagnosticSink, type SpCode } from '@silverpoint/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createApp, createSSRApp, h, nextTick, ref, type Component } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiMatrix, type UiFixture } from '../../../tools/visual-gate/ui-matrix';
import { vueFixture as fixtureOf } from './ui-fixture';
import { provideSilverpoint } from '../src';
import { SpButton, SpCard, SpCheckbox, SpDivider, SpInput, SpSwitch } from '../src/ui';

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
  vi.unstubAllGlobals();
});

function capture(): SpCode[] {
  const seen: SpCode[] = [];
  cleanup.push(__setDiagnosticSink((code) => seen.push(code)));
  return seen;
}

function mount(render: () => ReturnType<typeof h>, plugin?: ReturnType<typeof provideSilverpoint>): HTMLElement {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp({ render });
  if (plugin) app.use(plugin);
  app.mount(host);
  cleanup.push(() => {
    app.unmount();
    host.remove();
  });
  return host;
}

const COMPONENTS: Record<string, Component> = { button: SpButton, input: SpInput, checkbox: SpCheckbox, switch: SpSwitch, card: SpCard, divider: SpDivider };

const vueFixture = (fixture: UiFixture) => fixtureOf(fixture, COMPONENTS);
const b1 = () => uiMatrix().filter((f) => f.scope === 'pr' && f.component in COMPONENTS);

describe('Vue B1 markup (T-145)', () => {
  test.each(b1())('REQ-327 · $id is the canonical tree', async (fixture) => {
    const markup = await renderToString(createSSRApp({ render: () => vueFixture(fixture) }));
    expect(compareUi(markup, canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  test('REQ-327 · a consumer `class` joins the core\'s className, and no other attribute falls through', async () => {
    const markup = await renderToString(createSSRApp({ render: () => h(SpDivider, { class: 'wide', title: 'x' }) }));
    expect(markup).toContain('class="sp-ui sp-divider sp-ground-silverpoint wide"');
    expect(markup).not.toContain('title=');
  });

  test('REQ-327 · mounting every fixture raises no Vue warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    cleanup.push(() => warn.mockRestore());
    for (const fixture of b1()) mount(() => vueFixture(fixture));
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('Vue B1 behaviour (T-145)', () => {
  test('REQ-322 · v-model on SpInput: the model follows what is typed', async () => {
    const model = ref('Car');
    const host = mount(() => h(SpInput, { label: 'City', modelValue: model.value, 'onUpdate:modelValue': (v: string) => (model.value = v) }));
    const input = host.querySelector('input')!;
    input.value = 'Caracas';
    input.dispatchEvent(new Event('input'));
    await nextTick();
    expect(model.value).toBe('Caracas');
    model.value = 'Mérida';
    await nextTick();
    expect(input.value).toBe('Mérida');
  });

  test('REQ-322 · an uncontrolled SpCheckbox holds its state and still emits it', async () => {
    const seen: boolean[] = [];
    const host = mount(() => h(SpCheckbox, { label: 'Baseline', 'onUpdate:modelValue': (v: boolean) => seen.push(v) }));
    host.querySelector('input')!.click();
    await nextTick();
    expect(host.querySelector('input')!.checked).toBe(true);
    expect(seen).toEqual([true]);
  });

  test('REQ-322 · a controlled SpSwitch shows the model, whatever the default', async () => {
    const host = mount(() => h(SpSwitch, { label: 'Precision', modelValue: true, defaultValue: false }));
    expect(host.querySelector('input')!.checked).toBe(true);
  });

  test('REQ-326 · a disabled control emits nothing; a disabled link emits no click', async () => {
    const changed = vi.fn();
    const clicked = vi.fn();
    const host = mount(() => [
      h(SpSwitch, { label: 'Precision', disabled: true, 'onUpdate:modelValue': changed }),
      h(SpButton, { href: '/docs', disabled: true, onClick: clicked }, () => 'Docs'),
    ] as never);
    host.querySelector('input')!.click();
    host.querySelector('a')!.click();
    await nextTick();
    expect(changed).not.toHaveBeenCalled();
    expect(clicked).not.toHaveBeenCalled();
  });

  test('REQ-322 · SpCheckbox sets the native indeterminate property once mounted', async () => {
    const host = mount(() => h(SpCheckbox, { label: 'All series', indeterminate: true }));
    await nextTick();
    expect(host.querySelector('input')!.indeterminate).toBe(true);
  });

  test('REQ-323 · the native inputs submit with a native form', () => {
    const host = mount(() =>
      h('form', [
        h(SpInput, { name: 'city', defaultValue: 'Caracas', label: 'City' }),
        h(SpCheckbox, { name: 'baseline', label: 'Baseline', defaultValue: true }),
        h(SpSwitch, { name: 'precision', label: 'Precision' }),
      ]),
    );
    expect(Object.fromEntries(new FormData(host.querySelector('form')!))).toEqual({ city: 'Caracas', baseline: 'on' });
  });

  test('REQ-319 · a nameless SpButton warns SP018', async () => {
    const seen = capture();
    await renderToString(createSSRApp({ render: () => h(SpButton) }));
    expect(seen).toEqual(['SP018']);
  });
});

describe('Vue B1 configuration (T-143)', () => {
  test('REQ-311 · REQ-333 · the provider grounds components; a prop wins', () => {
    const host = mount(() => [h(SpDivider, { id: 'a' }), h(SpDivider, { id: 'b', substrate: 'ochre' })] as never, provideSilverpoint({ ground: 'cyanotype', substrate: 'green' }));
    const [a, b] = [...host.querySelectorAll('.sp-ui')];
    expect(a!.className).toContain('sp-ground-cyanotype');
    expect([a, b].map((e) => e!.getAttribute('data-substrate'))).toEqual(['green', 'ochre']);
  });

  test('REQ-123 · the server renders `ink`; a forced precision applies once mounted', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }));
    expect(await renderToString(createSSRApp({ render: () => h(SpButton, null, () => 'Save') }))).toContain('data-mode="ink"');
    const host = mount(() => h(SpButton, { mode: 'ink' }, () => 'Save'));
    await nextTick();
    expect(host.querySelector('button')!.getAttribute('data-mode')).toBe('precision');
  });
});
