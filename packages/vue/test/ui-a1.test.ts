import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { __setDiagnosticSink } from '@silverpoint/core';
import { UI_COMPONENTS } from '@silverpoint/core/ui';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createApp, createSSRApp, h, nextTick, type Component, type VNode } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiFixtureParts, uiMatrix, type UiFixture } from '../../../tools/visual-gate/ui-matrix';
import * as Ui from '../src/ui';

/*
 * Vue A1 (T-213, REQ-470, REQ-472..REQ-483): Surface, Glyph, Table, Breadcrumb, Avatar(Group),
 * Statistic, Descriptions, TimelineList, Empty and Result. Each is the core's view, written
 * attribute for attribute; Table emits `sort` from its sortable headers.
 */

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});
cleanup.push(__setDiagnosticSink(() => {}));

const NAMES: Record<string, string> = {
  surface: 'SpSurface',
  glyph: 'SpGlyph',
  table: 'SpTable',
  breadcrumb: 'SpBreadcrumb',
  avatar: 'SpAvatar',
  statistic: 'SpStatistic',
  descriptions: 'SpDescriptions',
  'timeline-list': 'SpTimelineList',
  empty: 'SpEmpty',
  result: 'SpResult',
};
const set = Ui as unknown as Record<string, Component>;
const A1 = UI_COMPONENTS.filter((c) => c.batch === 'A1');

/** A fixture as a Vue consumer writes it; Glyph `all` and Avatar `group` compose (Data Model §5). */
function element(fixture: UiFixture): VNode {
  const { props, slots } = uiFixtureParts(fixture);
  const { glyphs, avatars, ...rest } = props as typeof props & { glyphs?: readonly string[]; avatars?: readonly Record<string, unknown>[] };
  const common = { ground: rest.ground, substrate: rest.substrate, mode: rest.mode, size: rest.size };
  if (glyphs) return h('div', glyphs.map((glyph) => h(set.SpGlyph!, { ...common, glyph })));
  if (avatars) return h(set.SpAvatarGroup!, rest, () => avatars.map((avatar) => h(set.SpAvatar!, { ...common, ...avatar })));
  const children = {
    ...(slots.content !== undefined ? { default: () => slots.content } : {}),
    ...(slots.extra !== undefined ? { extra: () => slots.extra } : {}),
  };
  return h(set[NAMES[fixture.component]!]!, rest, children);
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

/** Server markup without Vue's fragment markers. */
const ssr = async (render: () => VNode) => (await renderToString(createSSRApp({ render }))).replace(/<!--[[\]]-->/g, '');

const pr = uiMatrix(['A1']).filter((f) => f.scope === 'pr');

describe('Vue A1 markup (T-213)', () => {
  test.each(pr)('REQ-470 · $id is the canonical tree', async (fixture) => {
    const markup = await renderToString(createSSRApp({ render: () => element(fixture) }));
    expect(compareUi(markup, canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  test('REQ-470 · mounting every fixture raises no Vue warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    cleanup.push(() => warn.mockRestore());
    for (const fixture of pr) mount(() => element(fixture));
    expect(warn).not.toHaveBeenCalled();
  });

  test('REQ-470 · every A1 component and SpAvatarGroup has its subpath and is on the barrel', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as { exports: Record<string, unknown> };
    for (const { slug } of A1) expect(pkg.exports[`./ui/${slug}`], slug).toBeDefined();
    for (const name of [...Object.values(NAMES), 'SpAvatarGroup']) expect(Ui, name).toHaveProperty(name);
  });
});

describe('Vue A1 behaviour (T-213)', () => {
  const columns = [
    { key: 'order', title: 'Order' },
    { key: 'amount', title: 'Amount', sortable: true },
  ];

  test('REQ-474 · a sortable header emits `sort` with its key; the consumer sorts', async () => {
    const onSort = vi.fn();
    const host = mount(() => h(set.SpTable!, { caption: 'Orders', columns, data: [{ order: 'A', amount: 2 }], onSort }));
    const buttons = host.querySelectorAll('button.sp-ui-sort');
    expect(buttons).toHaveLength(1);
    (buttons[0] as HTMLButtonElement).click();
    await nextTick();
    expect(onSort).toHaveBeenCalledWith('amount');
  });

  test('REQ-472 · a Surface is the element it is asked to be, holding its default slot', async () => {
    const html = await ssr(() => h(set.SpSurface!, { as: 'section', name: 'note', frame: 'card' }, () => 'Text'));
    expect(html).toMatch(/^<section class="sp-ui sp-surface sp-ground-silverpoint sp-note"/);
    expect(html).toContain('Text</section>');
  });

  test('REQ-483 · Empty and Result hold their `extra` slot', async () => {
    const empty = await ssr(() => h(set.SpEmpty!, null, { extra: () => h('button', { type: 'button' }, 'Add') }));
    expect(empty).toContain('<div class="sp-ui-empty-extra"><button type="button">Add</button></div>');
    const result = await ssr(() => h(set.SpResult!, { title: 'Done', status: 'success' }, { extra: () => h('a', { href: '/' }, 'Back') }));
    expect(result).toContain('<div class="sp-ui-result-extra"><a href="/">Back</a></div>');
  });
});
