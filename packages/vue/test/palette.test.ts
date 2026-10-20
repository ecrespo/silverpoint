import { __setDiagnosticSink, type ChartHandle, type Palette } from '@silverpoint/core';
import { paletteStyle, sanguine } from '@silverpoint/core/palettes';
import { afterEach, describe, expect, test } from 'vitest';
import { createApp, createSSRApp, h, nextTick, reactive, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { provideSilverpoint, SilverpointProvider, SpLineChart } from '../src';
import { SpDashboard, SpDashboardCell } from '../src/dashboard';
import { SpButton } from '../src/ui';

/*
 * `palette` in Vue (T-212, REQ-461, REQ-462, REQ-468): on every chart and component through the
 * shared bases, on SpDashboard through its cells, on `provideSilverpoint`; a `SilverpointProvider`
 * component scopes a section. The core resolves; Vue writes the root's `style`.
 */

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});
cleanup.push(__setDiagnosticSink(() => {}));

const parse = (markup: string) => {
  const host = document.createElement('div');
  host.innerHTML = markup;
  return host;
};
const colour = (element: Element | null, property: string) => (element as HTMLElement).style.getPropertyValue(property);
const unstyled = (markup: string) => markup.replace(/ style="--sp-[^"]*"/g, '');
/** A style's declarations: Vue's template binding ends the attribute with `;`, a render function does not. */
const declarations = (style: string | null) => (style ?? '').split(';').filter(Boolean);
const ssr = (render: () => ReturnType<typeof h>, plugin?: ReturnType<typeof provideSilverpoint>) => {
  const app = createSSRApp({ render });
  if (plugin) app.use(plugin);
  return renderToString(app);
};

const PROVIDER: Palette = { ink: '#111111', text: '#222222' };
const DASHBOARD: Palette = { ink: '#202020', grid: '#606060' };
const OWN: Palette = { ink: '#303030' };

describe('Vue palettes (T-212)', () => {
  test('REQ-461 · a chart and a component write their palette on the root, in the core\'s order', async () => {
    const host = parse(await ssr(() => h('div', [h(SpLineChart, { id: 'l', width: 320, palette: sanguine }), h(SpButton, { id: 'b', palette: sanguine }, () => 'Go')])));
    const roots = [...host.querySelectorAll('.sp-root, .sp-ui')];
    expect(roots).toHaveLength(2);
    for (const root of roots) expect(declarations(root.getAttribute('style'))).toEqual(declarations(paletteStyle(sanguine)));
  });

  test('REQ-462 · element → dashboard → provider, field by field, for charts and components alike', async () => {
    const host = parse(
      await ssr(
        () =>
          h(SpDashboard, { id: 'ops', title: 'Ops', palette: DASHBOARD }, () => [
            h(SpDashboardCell, null, () => [h(SpLineChart, { palette: OWN })]),
            h(SpDashboardCell, null, () => [h(SpButton, null, () => 'Go')]),
          ]),
        provideSilverpoint({ palette: PROVIDER }),
      ),
    );
    const chart = host.querySelector('.sp-root');
    expect([colour(chart, '--sp-ink'), colour(chart, '--sp-grid'), colour(chart, '--sp-text')]).toEqual(['#303030', '#606060', '#222222']);
    const button = host.querySelector('.sp-ui');
    expect([colour(button, '--sp-ink'), colour(button, '--sp-grid'), colour(button, '--sp-text')]).toEqual(['#202020', '#606060', '#222222']);
    const section = host.querySelector('section.sp-dashboard');
    expect([colour(section, '--sp-ink'), colour(section, '--sp-grid'), colour(section, '--sp-text')]).toEqual(['#202020', '#606060', '']);
  });

  test('REQ-462 · SilverpointProvider scopes a section: its palette over the app\'s, the app\'s ground kept, no wrapper', async () => {
    const markup = await ssr(
      () => h('div', [h(SpButton, { id: 'out' }, () => 'Out'), h(SilverpointProvider, { palette: OWN }, () => [h(SpButton, { id: 'in' }, () => 'In')])]),
      provideSilverpoint({ ground: 'cyanotype', palette: PROVIDER }),
    );
    const host = parse(markup);
    const [outer, inner] = [host.querySelector('#out'), host.querySelector('#in')];
    expect(inner!.className).toContain('sp-ground-cyanotype');
    expect([colour(outer, '--sp-ink'), colour(inner, '--sp-ink'), colour(inner, '--sp-text')]).toEqual(['#111111', '#303030', '#222222']);
    expect(host.firstElementChild!.children).toHaveLength(2);
  });

  test('REQ-462 · a section re-colours when its provider\'s palette changes', async () => {
    const palette = ref<Palette>(OWN);
    const host = document.createElement('div');
    const app = createApp({ render: () => h(SilverpointProvider, { palette: palette.value }, () => [h(SpButton, { id: 'in' }, () => 'In')]) });
    app.mount(host);
    cleanup.push(() => app.unmount());
    palette.value = { ink: '#404040' };
    await nextTick();
    expect(colour(host.querySelector('#in'), '--sp-ink')).toBe('#404040');
  });

  test('REQ-468 · I-33 · a palette changes only the root\'s style', async () => {
    const plain = await ssr(() => h('div', [h(SpLineChart, { id: 'l', width: 320 }), h(SpButton, { id: 'b' }, () => 'Go')]));
    const toned = await ssr(
      () => h('div', [h(SpLineChart, { id: 'l', width: 320, palette: sanguine }), h(SpButton, { id: 'b', palette: sanguine }, () => 'Go')]),
      provideSilverpoint({ palette: PROVIDER }),
    );
    expect(toned).not.toBe(plain);
    expect(unstyled(toned)).toBe(plain);
  });

  test('REQ-461 · toSVGString carries the palette on its <svg>', async () => {
    const chart = ref<ChartHandle>();
    const host = document.createElement('div');
    const app = createApp({ render: () => h(SpLineChart, { ref: chart, id: 'l', width: 320, palette: reactive({ ...OWN }) }) });
    app.mount(host);
    cleanup.push(() => app.unmount());
    await nextTick();
    expect(chart.value!.toSVGString()).toMatch(/^<svg [^>]*style="--sp-ink:#303030"/);
  });
});
