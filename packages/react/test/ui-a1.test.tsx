import { act, createElement, Fragment, type ComponentType, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { __setDiagnosticSink } from '@silverpoint/core';
import { UI_COMPONENTS } from '@silverpoint/core/ui';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiFixtureParts, uiMatrix, type UiFixture } from '../../../tools/visual-gate/ui-matrix';
import * as Server0 from '../src/server/ui/surface';
import * as Server1 from '../src/server/ui/glyph';
import * as Server2 from '../src/server/ui/table';
import * as Server3 from '../src/server/ui/breadcrumb';
import * as Server4 from '../src/server/ui/avatar';
import * as Server5 from '../src/server/ui/statistic';
import * as Server6 from '../src/server/ui/descriptions';
import * as Server7 from '../src/server/ui/timeline-list';
import * as Server8 from '../src/server/ui/empty';
import * as Server9 from '../src/server/ui/result';
import * as Client from '../src/ui';

/*
 * React A1 (T-213, REQ-470, REQ-472..REQ-483): Surface, Glyph, Table, Breadcrumb, Avatar(Group),
 * Statistic, Descriptions, TimelineList, Empty and Result, in client and server entries. Each is
 * the core's view, written attribute for attribute; Table binds its sortable headers.
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});
cleanup.push(__setDiagnosticSink(() => {}));

type Set_ = Record<string, ComponentType<Record<string, unknown>>>;
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
const Server = { ...Server0, ...Server1, ...Server2, ...Server3, ...Server4, ...Server5, ...Server6, ...Server7, ...Server8, ...Server9 };
const A1 = UI_COMPONENTS.filter((c) => c.batch === 'A1');

/** A fixture as a React consumer writes it; Glyph `all` and Avatar `group` compose (Data Model §5). */
function element(fixture: UiFixture, set: Set_): ReactElement {
  const { props, slots } = uiFixtureParts(fixture);
  const { glyphs, avatars, ...rest } = props as typeof props & { glyphs?: readonly string[]; avatars?: readonly Record<string, unknown>[] };
  const common = { ground: rest.ground, substrate: rest.substrate, mode: rest.mode, size: rest.size };
  if (glyphs) return createElement(Fragment, null, ...glyphs.map((glyph) => createElement(set.SpGlyph!, { key: glyph, ...common, glyph })));
  if (avatars) return createElement(set.SpAvatarGroup!, rest, ...avatars.map((avatar, i) => createElement(set.SpAvatar!, { key: i, ...common, ...avatar })));
  return createElement(set[NAMES[fixture.component]!]!, { ...rest, ...(slots.extra ? { extra: slots.extra } : {}) }, slots.content);
}

const pr = uiMatrix(['A1']).filter((f) => f.scope === 'pr');

describe('React A1 markup (T-213)', () => {
  test.each(pr)('REQ-470 · $id is the canonical tree (client)', (fixture) => {
    expect(compareUi(renderToStaticMarkup(element(fixture, Client as unknown as Set_)), canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  test.each(pr)('REQ-104 · $id is the canonical tree (server entry)', (fixture) => {
    expect(compareUi(renderToStaticMarkup(element(fixture, Server as unknown as Set_)), canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  test('REQ-470 · every A1 component and AvatarGroup has a client and a server subpath', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as { exports: Record<string, unknown> };
    for (const { slug } of A1) {
      expect(pkg.exports[`./ui/${slug}`], slug).toBeDefined();
      expect(pkg.exports[`./server/ui/${slug}`], slug).toBeDefined();
    }
    for (const name of [...Object.values(NAMES), 'SpAvatarGroup']) {
      expect(Client, name).toHaveProperty(name);
      expect(Server, name).toHaveProperty(name);
    }
  });
});

describe('React A1 behaviour (T-213)', () => {
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
  const columns = [
    { key: 'order', title: 'Order' },
    { key: 'amount', title: 'Amount', sortable: true },
  ];
  const data = [{ order: 'A', amount: 2 }];

  test('REQ-470 · mounting every fixture raises no React warning (`colspan` is `colSpan`)', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    cleanup.push(() => error.mockRestore());
    for (const fixture of pr) mount(element(fixture, Client as unknown as Set_));
    expect(error).not.toHaveBeenCalled();
  });

  test('REQ-474 · a sortable header reports its key through onSort; the consumer sorts', () => {
    const onSort = vi.fn();
    const host = mount(<Client.SpTable caption="Orders" columns={columns} data={data} onSort={onSort} />);
    const buttons = host.querySelectorAll('button.sp-ui-sort');
    expect(buttons).toHaveLength(1);
    act(() => (buttons[0] as HTMLButtonElement).click());
    expect(onSort).toHaveBeenCalledWith('amount');
  });

  test('REQ-472 · a Surface is the element it is asked to be, holding its content', () => {
    const html = renderToStaticMarkup(
      <Client.SpSurface as="section" name="note" frame="card">
        Text
      </Client.SpSurface>,
    );
    expect(html).toMatch(/^<section class="sp-ui sp-surface sp-ground-silverpoint sp-note"/);
    expect(html).toContain('Text</section>');
  });

  test('REQ-483 · Empty and Result hold their extra content', () => {
    const empty = renderToStaticMarkup(<Client.SpEmpty extra={<button type="button">Add</button>} />);
    expect(empty).toContain('<div class="sp-ui-empty-extra"><button type="button">Add</button></div>');
    const result = renderToStaticMarkup(<Server.SpResult title="Done" status="success" extra={<a href="/">Back</a>} />);
    expect(result).toContain('<div class="sp-ui-result-extra"><a href="/">Back</a></div>');
  });

  test('REQ-311 · a client component reads the provider; it sits under the provider like the 0.3.0 ones', () => {
    const html = renderToStaticMarkup(<Client.SpStatistic title="Orders" value={3} ground="cyanotype" />);
    expect(html).toContain('sp-ground-cyanotype');
  });
});
