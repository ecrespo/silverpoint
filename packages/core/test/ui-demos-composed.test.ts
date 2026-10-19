import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, type SpCode } from '../src';
import { TIMELINE_FRAMES, TIMELINE_TONES, timelineView, type SpTimelineProps } from '../src/timeline';
import {
  resolveUi,
  UI_COMPONENTS,
  UI_GLYPHS,
  uiAvatarGroupView,
  uiAvatarView,
  uiBreadcrumbView,
  uiCollapseGroup,
  uiCollapseItemView,
  uiCollapseView,
  uiDescriptionsView,
  uiDrawerView,
  uiDropdownMenuView,
  uiEmptyView,
  uiGlyphView,
  uiInputNumberView,
  uiModalView,
  uiNumberValue,
  uiPagination,
  uiPaginationView,
  uiPopoverView,
  uiResultView,
  uiSelectView,
  uiStatisticView,
  uiSurfaceView,
  uiTableView,
  uiTextareaView,
  uiTimelineListView,
  uiToastView,
  uiTooltipView,
  type UiElement,
  type UiNode,
} from '../src/ui';
import { TIMELINE_DEMO, UI_DEMOS } from '../src/ui-demos';

let restore: () => void = () => {};
afterEach(() => restore());
function capture(): Array<{ code: SpCode; message: string }> {
  const seen: Array<{ code: SpCode; message: string }> = [];
  restore = __setDiagnosticSink((code, message) => seen.push({ code, message }));
  return seen;
}

const isElement = (n: UiNode): n is UiElement => 'tag' in n;
const all = (n: UiNode): UiElement[] => (isElement(n) ? [n, ...n.children.flatMap(all)] : []);
const classes = (e: UiElement) => (typeof e.attrs.class === 'string' ? e.attrs.class.split(' ') : []);
const r = resolveUi({}, {});

type Demo = Readonly<Record<string, unknown>>;
type Parts = Readonly<Record<string, Demo>>;
/** Each new row's demo, drawn through its view function as an adapter would (T-208). */
const RENDER: Readonly<Record<string, (p: Demo) => UiElement[]>> = {
  surface: (p) => [uiSurfaceView(p as never, r)],
  glyph: (p) => (p.glyphs as string[]).map((glyph) => uiGlyphView({ glyph }, r)),
  table: (p) => [uiTableView(p as never, r)],
  pagination: (p) => [uiPaginationView(p as never, r, { current: p.current as number })],
  breadcrumb: (p) => [uiBreadcrumbView(p as never, r)],
  avatar: (p) =>
    p.avatars ? [uiAvatarGroupView(p as never, r), ...(p.avatars as Demo[]).map((a) => uiAvatarView(a as never, r))] : [uiAvatarView(p as never, r)],
  statistic: (p) => [uiStatisticView(p as never, r)],
  descriptions: (p) => [uiDescriptionsView(p as never, r)],
  'timeline-list': (p) => [uiTimelineListView(p as never, r)],
  collapse: (p) => [
    uiCollapseView(p as never, r),
    ...(p.items as Demo[]).map((item) => uiCollapseItemView(item as never, r, { open: item.open === true, group: uiCollapseGroup(p as never) })),
  ],
  empty: (p) => [uiEmptyView(p as never, r, {})],
  result: (p) => [uiResultView(p as never, r, {})],
  textarea: (p) => [uiTextareaView(p as never, r, { value: p.value as string })],
  'input-number': (p) => [uiInputNumberView(p as never, r, { value: p.value as number })],
  modal: (p) => [uiModalView(p as never, r, { open: p.open === true }, {})],
  drawer: (p) => [uiDrawerView(p as never, r, { open: p.open === true }, {})],
  popover: (p) => [uiPopoverView(p as never, r, { open: p.open === true })],
  tooltip: (p) => [uiTooltipView(p as never, r, { open: p.open === true })],
  select: (p) => [uiSelectView(p as never, r, { value: (p.value as string | null) ?? null, open: p.open === true, active: (p.active as string | null) ?? null })],
  'dropdown-menu': (p) => [uiDropdownMenuView(p as never, r, { open: p.open === true, active: (p.active as string | null) ?? null }, {})],
  toast: (p) => [uiToastView(p as never, r, { open: p.open === true }, { action: typeof p.action === 'string' })],
};

const NEW = UI_COMPONENTS.filter((c) => c.family !== 'ui');
function demo(slug: string, state: string): Demo {
  const props = (UI_DEMOS[slug] as Parts | undefined)?.[state];
  expect(props, `${slug}--${state}`).toBeDefined();
  return props!;
}

describe('UI_DEMOS, the feature-004 rows (T-208)', () => {
  test('REQ-470 · every new row has a renderer here, and each demo draws without a single diagnostic', () => {
    expect(Object.keys(RENDER)).toEqual(NEW.map((c) => c.slug));
    const seen = capture();
    for (const { slug, states } of NEW) {
      for (const state of states) {
        const trees = RENDER[slug]!(demo(slug, state));
        expect(trees.length, `${slug}--${state}`).toBeGreaterThan(0);
      }
    }
    expect(seen).toEqual([]);
  });

  test('REQ-472 · the glyph row shows every glyph of UI_GLYPHS, once, in its order', () => {
    expect(demo('glyph', 'all').glyphs).toEqual(Object.keys(UI_GLYPHS));
    expect(Object.keys(UI_GLYPHS)).toHaveLength(17);
  });

  test('REQ-472 · the surface states: a card frame, and a tone of level 2', () => {
    expect(demo('surface', 'frame-card')).toMatchObject({ frame: 'card' });
    expect(demo('surface', 'tone-2')).toMatchObject({ tone: 2 });
  });

  test('REQ-473 · REQ-474 · the sorted table is drawn sorted by the consumer (DD-040), striped; the empty one has no rows', () => {
    const sorted = demo('table', 'sorted-striped');
    expect(sorted).toMatchObject({ sortKey: 'amount', sortOrder: 'desc', striped: true });
    const amounts = (sorted.data as Demo[]).map((row) => row.amount as number);
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
    expect(new Set(amounts).size).toBe(amounts.length);
    expect(sorted.data).not.toEqual(demo('table', 'plain').data);
    expect(new Set((sorted.data as Demo[]).map((row) => row.order))).toEqual(new Set((demo('table', 'plain').data as Demo[]).map((row) => row.order)));
    expect(demo('table', 'empty').data).toEqual([]);
  });

  test('REQ-476 · pagination: `middle` draws both gaps, `total` is the first page with its total', () => {
    const tokens = (p: Demo) => all(uiPaginationView(p as never, r, { current: p.current as number })).flatMap(classes);
    const middle = demo('pagination', 'middle');
    expect(uiPagination(middle.total as number, (middle.pageSize as number) ?? 10, middle.current as number).corrected).toBe(false);
    expect(tokens(middle).filter((c) => c === 'sp-ui-page-gap')).toHaveLength(2);
    expect(demo('pagination', 'total')).toMatchObject({ current: 1, showTotal: true });
  });

  test('REQ-480 · the timeline list holds each status, with exactly one `current`', () => {
    const items = demo('timeline-list', 'mixed').items as Demo[];
    expect(new Set(items.map((i) => i.status ?? 'done'))).toEqual(new Set(['done', 'current', 'pending', 'error']));
    expect(items.filter((i) => i.status === 'current')).toHaveLength(1);
  });

  test('REQ-482 · collapse: one item open; the accordion has a disabled item and is named by its id', () => {
    expect((demo('collapse', 'one-open').items as Demo[]).filter((i) => i.open === true)).toHaveLength(1);
    const accordion = demo('collapse', 'accordion-disabled');
    expect(accordion.accordion).toBe(true);
    expect((accordion.items as Demo[]).some((i) => i.disabled === true)).toBe(true);
    expect(uiCollapseGroup(accordion as never)).toBe('collapse--accordion-disabled--accordion');
  });

  test('REQ-485 · input number: `value` is inside its range; `at-min` sits on the minimum', () => {
    const range = (p: Demo) => ({ min: p.min as number, max: p.max as number });
    const value = demo('input-number', 'value');
    expect(uiNumberValue(value.value as number, range(value))).toMatchObject({ corrected: false, atMin: false, atMax: false });
    const atMin = demo('input-number', 'at-min');
    expect(uiNumberValue(atMin.value as number, range(atMin))).toMatchObject({ corrected: false, atMin: true });
  });

  test('REQ-484 · textarea: `count` shows its counter within `maxLength`; `invalid` carries its message', () => {
    const count = demo('textarea', 'count');
    expect(count.showCount).toBe(true);
    expect((count.value as string).length).toBeLessThanOrEqual(count.maxLength as number);
    expect(demo('textarea', 'invalid')).toMatchObject({ invalid: true, message: expect.any(String) });
  });

  test('REQ-490..REQ-497 · every overlay demo is open, with a trigger text; Select and Menu name their active entry', () => {
    for (const { slug, states } of NEW.filter((c) => c.family === 'overlay')) {
      for (const state of states) {
        const p = demo(slug, state);
        if (slug === 'toast') continue;
        if (state === 'placeholder') {
          expect(p.open).not.toBe(true);
          expect(p.value).toBeNull();
          continue;
        }
        expect(p.open, `${slug}--${state}`).toBe(true);
        if (slug !== 'select') expect(typeof p.trigger, `${slug}--${state}`).toBe('string');
      }
    }
    expect(demo('drawer', 'end-open')).toMatchObject({ side: 'end' });
    const select = demo('select', 'open-selected');
    expect(select.active).toBe(select.value);
    const menu = demo('dropdown-menu', 'open');
    expect((menu.items as Demo[]).map((i) => i.key)).toContain(menu.active);
    expect((menu.items as Demo[]).some((i) => i.danger === true)).toBe(true);
    expect((menu.items as Demo[]).some((i) => i.type === 'separator')).toBe(true);
  });

  test('REQ-500 · toasts: `info` without an action, `error-action` with one; both open', () => {
    expect(demo('toast', 'info')).toMatchObject({ kind: 'info', open: true });
    expect(demo('toast', 'info').action).toBeUndefined();
    expect(demo('toast', 'error-action')).toMatchObject({ kind: 'error', open: true, action: expect.any(String) });
  });
});

describe('TIMELINE_DEMO (T-208, Data Model §4)', () => {
  const strings = (value: unknown): string[] =>
    typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];
  const keys = (value: unknown): string[] =>
    value && typeof value === 'object' ? Object.entries(value).flatMap(([k, v]) => [k, ...keys(v)]) : [];

  test('REQ-510 · the life of a silverpoint drawing: a title, eight events, two eras, no external media', () => {
    expect(TIMELINE_DEMO.title?.text?.headline).toBe('Silverpoint');
    expect(TIMELINE_DEMO.events).toHaveLength(8);
    expect(TIMELINE_DEMO.eras).toHaveLength(2);
    expect(keys(TIMELINE_DEMO)).not.toContain('media');
    expect(keys(TIMELINE_DEMO)).not.toContain('background');
    for (const s of strings(TIMELINE_DEMO)) expect(s).not.toMatch(/https?:|\/\/|<(?!\/?p>)/);
  });

  test('REQ-510 · events carry unique ids, start years in order, and lie within the eras’ span', () => {
    const ids = TIMELINE_DEMO.events.map((e) => e.unique_id);
    expect(new Set(ids).size).toBe(8);
    const years = TIMELINE_DEMO.events.map((e) => e.start_date.year);
    expect(years).toEqual([...years].sort((a, b) => a - b));
    const [first, second] = TIMELINE_DEMO.eras!;
    expect(first!.end_date.year).toBe(second!.start_date.year);
    for (const year of years) expect(year >= first!.start_date.year && year <= second!.end_date.year).toBe(true);
  });

  test('I-9 · it is plain data, deep-frozen', () => {
    const walk = (value: unknown): void => {
      if (value === null || typeof value !== 'object') return;
      expect(Object.isFrozen(value)).toBe(true);
      Object.values(value).forEach(walk);
    };
    walk(TIMELINE_DEMO);
    expect(JSON.parse(JSON.stringify(TIMELINE_DEMO))).toEqual(TIMELINE_DEMO);
  });
});

describe('timelineView (T-208, REQ-513)', () => {
  const props = (extra: Partial<SpTimelineProps> = {}): SpTimelineProps => ({ id: 'story', data: TIMELINE_DEMO, ...extra });

  test('REQ-513 · the server markup is the surface, the probes and an empty mount, and nothing of the data but its name', () => {
    const tree = timelineView(props(), r);
    expect(tree.tag).toBe('section');
    expect(tree.attrs).toEqual({
      class: 'sp-ui sp-timeline sp-ground-silverpoint',
      'data-ground': 'silverpoint',
      'data-substrate': 'cream',
      'data-mode': 'ink',
      'data-size': 'md',
      'data-frame': String(r.frame),
      id: 'story',
      'aria-label': 'Silverpoint',
      'data-kl-card': 'true',
      'data-kl-inked': 'false',
      style: 'height:600px',
    });
    const [frame, probe, mount, ...rest] = tree.children as UiElement[];
    expect(rest).toEqual([]);
    expect(frame).toEqual({ tag: 'span', attrs: { part: 'sp-frame', 'data-kind': 'card', 'aria-hidden': 'true' }, children: [] });
    expect(probe!.attrs).toEqual({ class: 'sp-kl-probe', 'aria-hidden': 'true' });
    expect(probe!.bind).toBe('probe');
    expect((probe!.children as UiElement[]).map((c) => c.attrs)).toEqual([
      ...TIMELINE_FRAMES.map((kind) => ({ part: 'sp-frame', 'data-kind': kind })),
      ...TIMELINE_TONES.map((level) => ({ part: 'sp-tone', 'data-tone': level })),
    ]);
    expect(mount).toEqual({ tag: 'div', attrs: { class: 'sp-kl-mount' }, children: [], bind: 'mount' });
    expect(JSON.stringify(tree)).not.toMatch(/Cennini|Leonardo|1400/);
  });

  test('REQ-510 · `card: false` drops the frame; `label` names the region; `height` is written as given', () => {
    const tree = timelineView(props({ card: false, label: 'History', height: '480px', className: 'wide' }), r);
    expect(tree.attrs).toMatchObject({ 'aria-label': 'History', 'data-kl-card': 'false', style: 'height:480px', class: 'sp-ui sp-timeline sp-ground-silverpoint wide' });
    expect(all(tree).filter((e) => e.attrs.part === 'sp-frame' && e.attrs['aria-hidden'] === 'true')).toEqual([]);
  });

  test('REQ-486 · a height that is not a plain length is dropped with SP017, and the default holds', () => {
    const seen = capture();
    expect(timelineView(props({ height: 'calc(100%);color:red' }), r).attrs.style).toBe('height:600px');
    expect(seen.map((d) => d.code)).toEqual(['SP017']);
  });

  test('REQ-319 · without a label or a title headline it still renders, and warns SP018', () => {
    const seen = capture();
    const tree = timelineView({ data: { events: [] } }, r);
    expect(tree.attrs['aria-label']).toBeUndefined();
    expect(tree.attrs.id).toBeUndefined();
    expect(seen.map((d) => d.code)).toEqual(['SP018']);
  });

  test('REQ-512 · the mode reaches the root, where timelineInk reads it', () => {
    expect(timelineView(props(), resolveUi({ mode: 'precision' }, {})).attrs['data-mode']).toBe('precision');
  });
});
