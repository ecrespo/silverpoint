import { afterEach, describe, expect, test } from 'vitest';
import { __setDiagnosticSink, type SpCode } from '../src';
import {
  resolveUi,
  UI_GLYPHS,
  uiAvatarGroupView,
  uiAvatarView,
  uiBreadcrumbView,
  uiCollapseGroup,
  uiCollapseItemView,
  uiCollapseView,
  uiDescriptionsView,
  uiEmptyView,
  uiGlyphView,
  uiInputNumberView,
  uiNumberValue,
  uiPaginationView,
  uiResultView,
  uiStatisticView,
  uiSurfaceView,
  uiTableView,
  uiTextareaView,
  uiTimelineListView,
  type TableColumn,
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
const all = (n: UiNode): UiElement[] => (isElement(n) ? [n, ...n.children.flatMap(all)] : []);
const partsOf = (e: UiElement) => (typeof e.attrs.part === 'string' ? e.attrs.part.split(' ') : []);
const withPart = (n: UiNode, part: string) => all(n).filter((e) => partsOf(e).includes(part));
const classes = (e: UiElement) => (typeof e.attrs.class === 'string' ? e.attrs.class.split(' ') : []);
const byClass = (n: UiNode, cls: string) => all(n).filter((e) => classes(e).includes(cls));
const byTag = (n: UiNode, tag: string) => all(n).filter((e) => e.tag === tag);
const one = (n: UiNode, pick: (e: UiElement) => boolean) => {
  const found = all(n).filter(pick);
  expect(found).toHaveLength(1);
  return found[0]!;
};
const texts = (n: UiNode): string[] => ('text' in n ? [n.text] : isElement(n) ? n.children.flatMap(texts) : []);
const glyphs = (n: UiNode) => withPart(n, 'sp-mark').map((e) => e.attrs['data-glyph']);
const slots = (n: UiNode): string[] => ('slot' in n ? [n.slot] : isElement(n) ? n.children.flatMap(slots) : []);
const r = (props = {}) => resolveUi(props, {});

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

/** No empty text node anywhere (API delta §4 rules). */
const noEmptyText = (view: UiElement) => expect(texts(view).filter((t) => t === '')).toEqual([]);

describe('the ten new glyphs (T-206)', () => {
  const added = {
    plus: 'M8,3.5V12.5M3.5,8H12.5',
    chevronDown: 'M4,6L8,10L12,6',
    chevronRight: 'M6,4L10,8L6,12',
    chevronLeft: 'M10,4L6,8L10,12',
    arrowUp: 'M8,12.5V3.5M4.5,7L8,3.5L11.5,7',
    arrowDown: 'M8,3.5V12.5M4.5,9L8,12.5L11.5,9',
    sortUp: 'M5,9.5L8,5.5L11,9.5Z',
    sortDown: 'M5,6.5L8,10.5L11,6.5Z',
    sort: 'M5,7L8,3.5L11,7Z M5,9L8,12.5L11,9Z',
    ellipsis: 'M3.5,8V8 M8,8V8 M12.5,8V8',
  };

  test('REQ-472 · UI_GLYPHS gains exactly these ten, after the seven of 0.3.0, as exact paths', () => {
    const names = Object.keys(UI_GLYPHS);
    expect(names).toHaveLength(17);
    expect(names.slice(7)).toEqual(Object.keys(added));
    for (const [name, d] of Object.entries(added)) expect(UI_GLYPHS[name as keyof typeof UI_GLYPHS]).toBe(d);
  });

  test('REQ-472 · every glyph stays inside its 16 × 16 box', () => {
    for (const d of Object.values(UI_GLYPHS)) {
      const coordinates = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
      expect(coordinates.length).toBeGreaterThan(0);
      for (const c of coordinates) expect(c >= 0 && c <= 16, d).toBe(true);
    }
  });
});

describe('uiSurfaceView and uiGlyphView (T-206)', () => {
  test('REQ-472 · a surface is a div on the root contract around the content', () => {
    const view = uiSurfaceView({}, r());
    expect(view.tag).toBe('div');
    expect(view.attrs).toMatchObject({ class: 'sp-ui sp-surface sp-ground-silverpoint', 'data-ground': 'silverpoint', 'data-mode': 'ink', 'data-frame': expect.any(String) });
    expect(view.children).toEqual([{ slot: 'content' }]);
  });

  test('REQ-472 · as, name, frame and tone', () => {
    const view = uiSurfaceView({ id: 's', as: 'section', name: 'order-list', frame: 'card', tone: 2 }, r());
    expect(view.tag).toBe('section');
    expect(view.attrs.id).toBe('s');
    expect(classes(view)).toEqual(['sp-ui', 'sp-surface', 'sp-ground-silverpoint', 'sp-order-list']);
    expect(view.children.map((c) => (isElement(c) ? [c.attrs.part, c.attrs['data-kind'], c.attrs['data-tone']] : c))).toEqual([
      ['sp-frame', 'card', undefined],
      ['sp-tone', 'card', '2'],
      { slot: 'content' },
    ]);
    drawnAreHidden(view);
  });

  test('REQ-472 · a tone without a frame lies on a box; a state tone is kept as named', () => {
    const view = uiSurfaceView({ tone: 'selected' }, r());
    expect(one(view, (e) => e.attrs.part === 'sp-tone').attrs).toMatchObject({ 'data-tone': 'selected', 'data-kind': 'box' });
  });

  test.each([['div onclick=x'], ['Section'], ['script'], ['iframe'], ['']])('REQ-472 · an element %j that is not a safe lowercase tag is a div, SP017', (as) => {
    const seen = capture();
    expect(uiSurfaceView({ as }, r()).tag).toBe('div');
    expect(seen.map((s) => s.code)).toEqual(['SP017']);
  });

  test('REQ-472 · a name that is not a lowercase ident adds no class, SP017', () => {
    const seen = capture();
    expect(classes(uiSurfaceView({ name: 'a b"' }, r()))).toEqual(['sp-ui', 'sp-surface', 'sp-ground-silverpoint']);
    expect(seen.map((s) => s.code)).toEqual(['SP017']);
  });

  test('REQ-472 · a glyph is the exact svg mark on the root contract', () => {
    const view = uiGlyphView({ glyph: 'sortUp', className: 'x' }, r());
    expect(view.tag).toBe('svg');
    expect(view.attrs).toMatchObject({ part: 'sp-mark', 'data-glyph': 'sortUp', viewBox: '0 0 16 16', 'aria-hidden': 'true', class: 'sp-ui sp-glyph sp-ground-silverpoint x' });
    expect(view.children).toEqual([{ tag: 'path', attrs: { d: UI_GLYPHS.sortUp }, children: [] }]);
  });

  test('REQ-472 · an unknown glyph draws nothing, SP017', () => {
    const seen = capture();
    expect(uiGlyphView({ glyph: 'heart' }, r()).children).toEqual([]);
    expect(seen.map((s) => s.code)).toEqual(['SP017']);
  });
});

describe('uiTableView (T-206)', () => {
  const columns: TableColumn[] = [
    { key: 'id', title: 'Order' },
    { key: 'amount', title: 'Amount', align: 'end', sortable: true, width: '8rem' },
    { key: 'status', sortable: true },
  ];
  const data = [
    { id: 'A-3', amount: 30, status: 'paid' },
    { id: 'A-1', amount: null, status: 'due' },
    { id: 'A-2', amount: 10, status: 'paid' },
  ];
  const headers = (view: UiElement) => byTag(view, 'th');
  const rows = (view: UiElement) => byTag(byTag(view, 'tbody')[0]!, 'tr');
  const firstCells = (view: UiElement) => rows(view).map((tr) => texts(tr.children[0]!).join(''));

  test('REQ-473 · a framed, scrolling native table with a caption and column headers', () => {
    const view = uiTableView({ columns, data, caption: 'Orders' }, r());
    expect(view.tag).toBe('div');
    expect(view.attrs).toMatchObject({ class: 'sp-ui sp-table sp-ground-silverpoint', 'data-hoverable': 'true' });
    expect(view.attrs['data-striped']).toBeUndefined();
    const [drawn, scroll] = view.children as UiElement[];
    expect(drawn!.attrs).toMatchObject({ part: 'sp-frame', 'data-kind': 'card' });
    expect(classes(scroll!)).toEqual(['sp-ui-table-scroll']);
    const table = scroll!.children[0] as UiElement;
    expect([table.tag, table.attrs.class]).toEqual(['table', 'sp-ui-table']);
    expect((table.children as UiElement[]).map((c) => c.tag)).toEqual(['caption', 'thead', 'tbody']);
    expect(texts(table.children[0]!)).toEqual(['Orders']);
    expect(headers(view).map((th) => th.attrs.scope)).toEqual(['col', 'col', 'col']);
    expect(headers(view).map((th) => texts(th).join(''))).toEqual(['Order', 'Amount', 'status']);
    expect(headers(view)[1]!.attrs).toMatchObject({ 'data-align': 'end', style: 'width:8rem' });
    drawnAreHidden(view);
    noEmptyText(view);
  });

  test('REQ-473 · cells in input order, a missing or null cell empty, aligned as its column', () => {
    const view = uiTableView({ columns, data, rowKey: 'id' }, r());
    expect(firstCells(view)).toEqual(['A-3', 'A-1', 'A-2']);
    expect(rows(view).map((tr) => tr.attrs['data-key'])).toEqual(['A-3', 'A-1', 'A-2']);
    const nullCell = rows(view)[1]!.children[1] as UiElement;
    expect(nullCell).toMatchObject({ tag: 'td', attrs: { 'data-align': 'end' }, children: [] });
    expect(texts(rows(view)[0]!)).toEqual(['A-3', '30', 'paid']);
  });

  test('REQ-475 · a cell\'s text stands on a plate of the substrate, so a toned row keeps its contrast (Data Model §3.8, T-210)', () => {
    const view = uiTableView({ columns, data, rowKey: 'id' }, r());
    expect(rows(view)[0]!.children[0]).toEqual({ tag: 'td', attrs: {}, children: [{ tag: 'span', attrs: { class: 'sp-ui-plate' }, children: [{ text: 'A-3' }] }] });
    expect((rows(view)[1]!.children[1] as UiElement).children).toEqual([]);
  });

  test('REQ-474 · sortable headers hold a native sort button with the neutral sort glyph', () => {
    const view = uiTableView({ columns, data }, r());
    const buttons = all(view).filter((e) => e.bind === 'sort');
    expect(buttons.map((b) => [b.tag, b.attrs.type, b.attrs.class, b.attrs['data-key']])).toEqual([
      ['button', 'button', 'sp-ui-sort', 'amount'],
      ['button', 'button', 'sp-ui-sort', 'status'],
    ]);
    expect(glyphs(view)).toEqual(['sort', 'sort']);
    expect(headers(view).map((th) => th.attrs['aria-sort'])).toEqual([undefined, undefined, undefined]);
  });

  test('REQ-474 · sortKey and sortOrder: aria-sort and the glyph on that header', () => {
    const desc = uiTableView({ columns, data, sortKey: 'amount', sortOrder: 'desc' }, r());
    expect(headers(desc).map((th) => th.attrs['aria-sort'])).toEqual([undefined, 'descending', undefined]);
    expect(glyphs(desc)).toEqual(['sortDown', 'sort']);
    const asc = uiTableView({ columns, data, sortKey: 'status' }, r());
    expect(headers(asc)[2]!.attrs['aria-sort']).toBe('ascending');
    expect(glyphs(asc)).toEqual(['sort', 'sortUp']);
  });

  test('DD-040 · the table does not sort by itself: the rows are drawn in the order given', () => {
    // The consumer sorts (with uiSortRows, or on its server before paging) and passes the rows.
    const view = uiTableView({ columns, data, sortKey: 'amount', sortOrder: 'desc' }, r());
    expect(firstCells(view)).toEqual(['A-3', 'A-1', 'A-2']);
  });

  test('Data Model §2.27 · an unknown or unsortable sortKey sorts nothing, silently', () => {
    const seen = capture();
    for (const sortKey of ['nope', 'id']) {
      const view = uiTableView({ columns, data, sortKey }, r());
      expect(firstCells(view)).toEqual(['A-3', 'A-1', 'A-2']);
      expect(headers(view).every((th) => th.attrs['aria-sort'] === undefined)).toBe(true);
    }
    expect(seen).toEqual([]);
  });

  test('REQ-473 · striped, not hoverable, not bordered', () => {
    const view = uiTableView({ columns, data, striped: true, hoverable: false, bordered: false }, r());
    expect(view.attrs['data-striped']).toBe('true');
    expect(view.attrs['data-hoverable']).toBeUndefined();
    expect(withPart(view, 'sp-frame')).toEqual([]);
  });

  test('REQ-473 · no rows: one cell across every column with the empty text', () => {
    const view = uiTableView({ columns, data: [] }, r());
    expect(rows(view)).toHaveLength(1);
    expect(rows(view)[0]!.children[0]).toEqual({ tag: 'td', attrs: { class: 'sp-ui-table-empty', colspan: '3' }, children: [{ text: 'No data' }] });
    expect(texts(uiTableView({ columns, data: [], emptyText: 'Nothing yet' }, r()))).toContain('Nothing yet');
  });

  test('REQ-325 · REQ-487 · a repeated column key is skipped with SP019', () => {
    const seen = capture();
    const view = uiTableView({ columns: [...columns, { key: 'id', title: 'Again' }], data }, r());
    expect(headers(view)).toHaveLength(3);
    expect(seen.map((s) => s.code)).toEqual(['SP019']);
  });

  test('REQ-473 · a width that is not a plain CSS length is dropped, SP017', () => {
    const seen = capture();
    const view = uiTableView({ columns: [{ key: 'a', width: '1px;color:red' }, { key: 'b', width: '12.5%' }], data: [] }, r());
    expect(headers(view).map((th) => th.attrs.style)).toEqual([undefined, 'width:12.5%']);
    expect(seen.map((s) => s.code)).toEqual(['SP017']);
  });
});

describe('uiPaginationView (T-206)', () => {
  const lis = (view: UiElement) => (one(view, (e) => classes(e).includes('sp-ui-pages')).children as UiElement[]);

  test('REQ-476 · a labelled nav of pages, gaps on both sides, the current page heightened', () => {
    const view = uiPaginationView({ id: 'p', total: 200 }, r(), { current: 10 });
    expect(view.tag).toBe('nav');
    expect(view.attrs).toMatchObject({ id: 'p', class: 'sp-ui sp-pagination sp-ground-silverpoint', 'aria-label': 'Pagination' });
    const items = lis(view);
    expect(items.map((li) => li.tag)).toEqual(Array(9).fill('li'));
    expect(items.map((li) => texts(li).join(''))).toEqual(['', '1', '', '9', 'Page 10', '11', '', '20', '']);
    const pages = all(view).filter((e) => e.bind === 'page');
    expect(pages.map((b) => [b.attrs['data-page'], b.attrs['aria-label']])).toEqual([
      ['9', 'Previous page'],
      ['1', 'Page 1'],
      ['9', 'Page 9'],
      ['11', 'Page 11'],
      ['20', 'Page 20'],
      ['11', 'Next page'],
    ]);
    expect(pages.every((b) => b.tag === 'button' && b.attrs.type === 'button' && classes(b).includes('sp-ui-page'))).toBe(true);
    const current = one(view, (e) => e.attrs['aria-current'] === 'page');
    expect([current.tag, classes(current)]).toEqual(['span', ['sp-ui-page']]);
    expect(withPart(view, 'sp-heighten')).toHaveLength(1);
    expect(withPart(current, 'sp-heighten')).toHaveLength(1);
    expect(byClass(view, 'sp-ui-page-gap').map((li) => li.attrs['aria-hidden'])).toEqual(['true', 'true']);
    expect(glyphs(view)).toEqual(['chevronLeft', 'ellipsis', 'ellipsis', 'chevronRight']);
    expect(withPart(view, 'sp-frame')).toHaveLength(7);
    drawnAreHidden(view);
    noEmptyText(view);
  });

  test('REQ-476 · the first page: previous disabled, the total summary from the template', () => {
    const view = uiPaginationView({ total: 95, showTotal: true }, r(), { current: 1 });
    expect(texts(one(view, (e) => classes(e).includes('sp-ui-page-total')))).toEqual(['1–10 of 95']);
    const [previous] = all(view).filter((e) => e.bind === 'page');
    expect(previous!.attrs.disabled).toBe(true);
    const custom = uiPaginationView({ total: 95, showTotal: true, totalTemplate: '{total} rows, {start} to {end}' }, r(), { current: 10 });
    expect(texts(custom)).toContain('95 rows, 91 to 95');
  });

  test('REQ-476 · the last page disables next; disabled disables every button', () => {
    const last = all(uiPaginationView({ total: 30 }, r(), { current: 3 })).filter((e) => e.bind === 'page');
    expect(last.map((b) => b.attrs.disabled === true)).toEqual([false, false, false, true]);
    const off = uiPaginationView({ total: 30, disabled: true }, r(), { current: 2 });
    expect(off.attrs['data-disabled']).toBe('true');
    expect(all(off).filter((e) => e.bind === 'page').every((b) => b.attrs.disabled === true)).toBe(true);
  });

  test('REQ-486 · a current page out of range is drawn clamped, SP017', () => {
    const seen = capture();
    const view = uiPaginationView({ total: 30, pageLabel: 'Página' }, r(), { current: 7 });
    expect(texts(one(view, (e) => e.attrs['aria-current'] === 'page')).join('')).toBe('Página 3');
    expect(seen.map((s) => s.code)).toEqual(['SP017']);
  });
});

describe('uiBreadcrumbView (T-206)', () => {
  const items = [{ label: 'Home', href: '/' }, { label: 'Charts', href: '/charts' }, { label: 'Line', href: '/charts/line' }];

  test('REQ-477 · a labelled nav of an ordered list; links, the last the current page', () => {
    const view = uiBreadcrumbView({ items }, r());
    expect(view.tag).toBe('nav');
    expect(view.attrs['aria-label']).toBe('Breadcrumb');
    const list = view.children[0] as UiElement;
    expect([list.tag, list.attrs.class]).toEqual(['ol', 'sp-ui-crumbs']);
    const inner = (list.children as UiElement[]).map((li) => li.children[0] as UiElement);
    expect(inner.map((e) => [e.tag, e.attrs.href, e.attrs['aria-current']])).toEqual([
      ['a', '/', undefined],
      ['a', '/charts', undefined],
      ['span', undefined, 'page'],
    ]);
    expect((list.children as UiElement[]).every((li) => classes(li).includes('sp-ui-crumb'))).toBe(true);
  });

  test('REQ-477 · REQ-487 · an item without href is plain text; a repeated key is skipped, SP019', () => {
    const seen = capture();
    const view = uiBreadcrumbView({ items: [{ key: 'a', label: 'Home' }, { key: 'a', label: 'Twice' }, { label: 'Now' }], label: 'You are here' }, r());
    expect(view.attrs['aria-label']).toBe('You are here');
    expect(byTag(view, 'li').map((li) => (li.children[0] as UiElement).tag)).toEqual(['span', 'span']);
    expect(byTag(view, 'a')).toEqual([]);
    expect(seen.map((s) => s.code)).toEqual(['SP019']);
  });
});

describe('uiAvatarView and uiAvatarGroupView (T-206)', () => {
  test('REQ-478 · initials: an img role named by the name, a round frame, the initials hidden', () => {
    const view = uiAvatarView({ name: 'Ada Lovelace' }, r());
    expect(view.tag).toBe('span');
    expect(view.attrs).toMatchObject({ class: 'sp-ui sp-avatar sp-ground-silverpoint', role: 'img', 'aria-label': 'Ada Lovelace', 'data-shape': 'circle' });
    expect(view.children).toEqual([
      { tag: 'span', attrs: { part: 'sp-frame', 'data-kind': 'round', 'aria-hidden': 'true' }, children: [] },
      { tag: 'span', attrs: { class: 'sp-ui-avatar-initials', 'aria-hidden': 'true' }, children: [{ text: 'AL' }] },
    ]);
  });

  test('REQ-478 · square with an image: a box frame and the img, alt from alt, else the name', () => {
    const view = uiAvatarView({ src: '/ada.png', name: 'Ada Lovelace', shape: 'square' }, r());
    expect(view.attrs.role).toBeUndefined();
    expect(view.attrs['aria-label']).toBeUndefined();
    expect(view.attrs['data-shape']).toBe('square');
    expect(one(view, (e) => e.attrs.part === 'sp-frame').attrs['data-kind']).toBe('box');
    expect(one(view, (e) => e.tag === 'img').attrs).toEqual({ class: 'sp-ui-avatar-image', src: '/ada.png', alt: 'Ada Lovelace' });
    expect(one(uiAvatarView({ src: '/a.png', alt: 'Portrait', name: 'Ada' }, r()), (e) => e.tag === 'img').attrs.alt).toBe('Portrait');
  });

  test('REQ-478 · initials override the derived ones; pixelSize is a computed style', () => {
    const view = uiAvatarView({ name: 'Ada Lovelace', initials: 'AD', pixelSize: 40 }, r());
    expect(texts(view)).toEqual(['AD']);
    expect(view.attrs.style).toBe('--sp-ui-avatar-size:40px');
  });

  test('REQ-486 · an invalid pixelSize is dropped, SP017; no name at all warns SP018', () => {
    const seen = capture();
    expect(uiAvatarView({ name: 'Ada', pixelSize: -3 }, r()).attrs.style).toBeUndefined();
    const nameless = uiAvatarView({}, r());
    expect(texts(nameless)).toEqual(['?']);
    expect(seen.map((s) => s.code)).toEqual(['SP017', 'SP018']);
  });

  test('REQ-478 · a group is a labelled group around the avatars', () => {
    const view = uiAvatarGroupView({ label: 'Reviewers' }, r());
    expect(view.attrs).toMatchObject({ class: 'sp-ui sp-avatar-group sp-ground-silverpoint', role: 'group', 'aria-label': 'Reviewers' });
    expect(view.children).toEqual([{ slot: 'content' }]);
  });
});

describe('uiStatisticView (T-206)', () => {
  test('REQ-479 · title, value as given between its affixes, the trend by glyph and text', () => {
    const view = uiStatisticView({ title: 'Revenue', value: '1,204.50', prefix: '$', suffix: 'USD', trend: 'down', delta: '−4%' }, r());
    expect(view.attrs).toMatchObject({ class: 'sp-ui sp-statistic sp-ground-silverpoint', 'data-trend': 'down' });
    expect(texts(one(view, (e) => classes(e).includes('sp-ui-statistic-title')))).toEqual(['Revenue']);
    const value = one(view, (e) => classes(e).includes('sp-ui-statistic-value'));
    expect((value.children as UiElement[]).map((c) => [c.attrs.class, texts(c).join('')])).toEqual([
      ['sp-ui-statistic-affix', '$'],
      ['sp-ui-statistic-number', '1,204.50'],
      ['sp-ui-statistic-affix', 'USD'],
    ]);
    const trend = one(view, (e) => classes(e).includes('sp-ui-statistic-trend'));
    expect(glyphs(trend)).toEqual(['arrowDown']);
    expect(texts(trend)).toEqual(['−4%']);
    drawnAreHidden(view);
  });

  test('REQ-479 · a number is printed as given; a trend without delta still says its direction', () => {
    const view = uiStatisticView({ title: 'Orders', value: 1234, trend: 'up' }, r());
    expect(texts(view)).toEqual(['Orders', '1234', 'Up']);
    expect(byClass(view, 'sp-ui-sr')).toHaveLength(1);
    expect(glyphs(view)).toEqual(['arrowUp']);
    expect(uiStatisticView({ title: 'Plain', value: 3 }, r()).attrs['data-trend']).toBeUndefined();
    expect(glyphs(uiStatisticView({ title: 'Plain', value: 3 }, r()))).toEqual([]);
  });
});

describe('uiDescriptionsView (T-206)', () => {
  const items = [{ label: 'Order', value: 'A-1' }, { label: 'Status', value: 'Paid' }];

  test('REQ-480 · a framed section named by its heading around a list of terms', () => {
    const view = uiDescriptionsView({ id: 'd', title: 'Order A-1', items }, r());
    expect(view.tag).toBe('section');
    expect(view.attrs).toMatchObject({ 'aria-labelledby': 'd--title', 'data-bordered': 'true', 'data-columns': '3' });
    const [drawn, heading, list] = view.children as UiElement[];
    expect(drawn!.attrs).toMatchObject({ part: 'sp-frame', 'data-kind': 'card' });
    expect(heading).toEqual({ tag: 'h3', attrs: { class: 'sp-ui-descriptions-title', id: 'd--title' }, children: [{ text: 'Order A-1' }] });
    expect(list!.tag).toBe('dl');
    expect((list!.children as UiElement[]).map((d) => [d.tag, d.attrs.class, (d.children as UiElement[]).map((c) => c.tag), texts(d)])).toEqual([
      ['div', 'sp-ui-description', ['dt', 'dd'], ['Order', 'A-1']],
      ['div', 'sp-ui-description', ['dt', 'dd'], ['Status', 'Paid']],
    ]);
  });

  test('REQ-480 · plain, a heading level, a title without an id named by aria-label', () => {
    const view = uiDescriptionsView({ title: 'Order', items, bordered: false, headingLevel: 2, columns: 2 }, r());
    expect(withPart(view, 'sp-frame')).toEqual([]);
    expect(view.attrs['data-bordered']).toBeUndefined();
    expect(view.attrs).toMatchObject({ 'aria-label': 'Order', 'data-columns': '2' });
    expect(byTag(view, 'h2')).toHaveLength(1);
    const untitled = uiDescriptionsView({ items }, r());
    expect(byTag(untitled, 'h3')).toEqual([]);
    expect([untitled.attrs['aria-label'], untitled.attrs['aria-labelledby']]).toEqual([undefined, undefined]);
  });

  test('Data Model §2.27 · columns outside 1..6 or fractional are clamped and rounded, SP017', () => {
    const seen = capture();
    expect(uiDescriptionsView({ items, columns: 9 }, r()).attrs['data-columns']).toBe('6');
    expect(uiDescriptionsView({ items, columns: 0 }, r()).attrs['data-columns']).toBe('1');
    expect(uiDescriptionsView({ items, columns: 2.4 }, r()).attrs['data-columns']).toBe('2');
    expect(seen.map((s) => s.code)).toEqual(['SP017', 'SP017', 'SP017']);
  });
});

describe('uiTimelineListView (T-206)', () => {
  const items = [
    { title: 'Prepared', time: '09:00' },
    { title: 'Drawn', status: 'current' as const, description: 'Silverpoint on bone' },
    { title: 'Heightened', status: 'pending' as const },
    { title: 'Fixed', status: 'error' as const },
  ];
  const marks = (view: UiElement) => byClass(view, 'sp-ui-timeline-mark');

  test('REQ-481 · an ordered list; each status by its mark shape, the current one heightened and aria-current', () => {
    const view = uiTimelineListView({ items, label: 'History' }, r());
    expect(view.tag).toBe('ol');
    expect(view.attrs).toMatchObject({ class: 'sp-ui sp-timeline-list sp-ground-silverpoint', 'aria-label': 'History' });
    const lis = view.children as UiElement[];
    expect(lis.map((li) => [li.attrs.class, li.attrs['data-status'], li.attrs['aria-current']])).toEqual([
      ['sp-ui-timeline-item', 'done', undefined],
      ['sp-ui-timeline-item', 'current', 'step'],
      ['sp-ui-timeline-item', 'pending', undefined],
      ['sp-ui-timeline-item', 'error', undefined],
    ]);
    expect(marks(view).map((m) => m.children.map((c) => (c as UiElement).attrs.part))).toEqual([
      ['sp-frame', 'sp-tone'],
      ['sp-frame', 'sp-heighten'],
      ['sp-frame'],
      ['sp-frame', 'sp-mark'],
    ]);
    expect(marks(view).every((m) => m.attrs['aria-hidden'] === 'true')).toBe(true);
    expect(one(view, (e) => e.attrs.part === 'sp-tone').attrs['data-tone']).toBe('selected');
    expect(glyphs(view)).toEqual(['cross']);
    expect(withPart(view, 'sp-heighten')).toHaveLength(1);
    drawnAreHidden(view);
  });

  test('REQ-481 · time, title and description as text, in reading order', () => {
    const view = uiTimelineListView({ items }, r());
    expect(texts(view.children[0]!)).toEqual(['09:00', 'Prepared']);
    expect(texts(view.children[1]!)).toEqual(['Drawn', 'Silverpoint on bone']);
    expect(byClass(view, 'sp-ui-timeline-time')).toHaveLength(1);
  });

  test('REQ-487 · items sharing a key keep the first, skip the later ones and warn SP019', () => {
    const seen = capture();
    const view = uiTimelineListView({ items: [{ key: 'a', title: 'Prepared' }, { key: 'a', title: 'Again' }, { title: 'Drawn' }] }, r());
    expect((view.children as UiElement[]).map((li) => texts(li))).toEqual([['Prepared'], ['Drawn']]);
    expect(seen.map((s) => s.code)).toEqual(['SP019']);
  });

  test('Data Model §2.27 · a second current is drawn done, SP017', () => {
    const seen = capture();
    const view = uiTimelineListView({ items: [{ title: 'a', status: 'current' }, { title: 'b', status: 'current' }] }, r());
    expect((view.children as UiElement[]).map((li) => li.attrs['data-status'])).toEqual(['current', 'done']);
    expect(withPart(view, 'sp-heighten')).toHaveLength(1);
    expect(seen.map((s) => s.code)).toEqual(['SP017']);
  });
});

describe('uiCollapseView and uiCollapseItemView (T-206)', () => {
  test('REQ-482 · a collapse frames its items', () => {
    const view = uiCollapseView({ id: 'faq', accordion: true }, r());
    expect(view.attrs).toMatchObject({ id: 'faq', class: 'sp-ui sp-collapse sp-ground-silverpoint', 'data-accordion': 'true' });
    expect(view.children.map((c) => (isElement(c) ? c.attrs['data-kind'] : c))).toEqual(['card', { slot: 'content' }]);
    const plain = uiCollapseView({ bordered: false }, r());
    expect(plain.children).toEqual([{ slot: 'content' }]);
    expect(plain.attrs['data-accordion']).toBeUndefined();
  });

  test('REQ-482 · an item is a native details; its group name makes the accordion exclusive', () => {
    const view = uiCollapseItemView({ id: 'q1', title: 'What is silverpoint?' }, r(), { open: true, group: 'faq--accordion' });
    expect(view.tag).toBe('details');
    expect(view.attrs).toMatchObject({ id: 'q1', class: 'sp-ui sp-collapse-item sp-ground-silverpoint', name: 'faq--accordion', open: true });
    const [summary, body] = view.children as UiElement[];
    expect([summary!.tag, summary!.attrs.class, summary!.bind]).toEqual(['summary', 'sp-ui-collapse-summary', 'summary']);
    expect(texts(summary!)).toEqual(['What is silverpoint?']);
    expect(glyphs(summary!)).toEqual(['chevronDown']);
    expect(body).toEqual({ tag: 'div', attrs: { class: 'sp-ui-collapse-body' }, children: [{ slot: 'content' }] });
    drawnAreHidden(view);
  });

  test('REQ-329 · an accordion names its items ${id}--accordion; without an id it cannot, SP017', () => {
    expect(uiCollapseGroup({ id: 'faq', accordion: true })).toBe('faq--accordion');
    expect(uiCollapseGroup({ id: 'faq' })).toBeUndefined();
    const seen = capture();
    expect(uiCollapseGroup({ accordion: true })).toBeUndefined();
    expect(seen.map((s) => s.code)).toEqual(['SP017']);
  });

  test('REQ-482 · closed has no open attribute; disabled marks the summary', () => {
    const view = uiCollapseItemView({ title: 'Q', disabled: true }, r(), { open: false });
    expect(view.attrs.open).toBeUndefined();
    expect(view.attrs.name).toBeUndefined();
    expect(view.attrs['data-disabled']).toBe('true');
    expect((view.children[0] as UiElement).attrs['aria-disabled']).toBe('true');
  });

  test('REQ-522 · REQ-326 · a disabled item\'s summary leaves the Tab order; an enabled one stays in it (T-223)', () => {
    const disabled = uiCollapseItemView({ title: 'Q', disabled: true }, r(), { open: false }).children[0] as UiElement;
    expect(disabled.attrs.tabindex).toBe('-1');
    const enabled = uiCollapseItemView({ title: 'Q' }, r(), { open: false }).children[0] as UiElement;
    expect(enabled.attrs).not.toHaveProperty('tabindex');
  });
});

describe('uiEmptyView and uiResultView (T-206)', () => {
  test('REQ-483 · empty: a toned tray and the description, actions in extra', () => {
    const view = uiEmptyView({}, r(), { extra: true });
    const [tray, description, extra] = view.children as UiElement[];
    expect(tray).toEqual({
      tag: 'span',
      attrs: { class: 'sp-ui-empty-tray', 'aria-hidden': 'true' },
      children: [
        { tag: 'span', attrs: { part: 'sp-tone', 'data-tone': '1', 'data-kind': 'control', 'aria-hidden': 'true' }, children: [] },
        { tag: 'span', attrs: { part: 'sp-frame', 'data-kind': 'control', 'aria-hidden': 'true' }, children: [] },
      ],
    });
    expect(description).toEqual({ tag: 'p', attrs: { class: 'sp-ui-empty-description' }, children: [{ text: 'No data' }] });
    expect(extra).toEqual({ tag: 'div', attrs: { class: 'sp-ui-empty-extra' }, children: [{ slot: 'extra' }] });
    expect(texts(uiEmptyView({ description: 'No orders' }, r(), {}))).toEqual(['No orders']);
    expect(slots(uiEmptyView({}, r(), {}))).toEqual([]);
  });

  test.each([
    ['success', 'status', 'tick'],
    ['info', 'status', 'info'],
    ['warning', 'alert', 'warning'],
    ['error', 'alert', 'cross'],
  ] as const)('REQ-483 · result %s: role %s and the %s glyph in a round frame', (status, role, mark) => {
    const view = uiResultView({ status, title: 'Done', subtitle: 'Saved' }, r(), {});
    expect(view.attrs).toMatchObject({ role, 'data-status': status });
    const drawn = one(view, (e) => classes(e).includes('sp-ui-result-mark'));
    expect(drawn.attrs['aria-hidden']).toBe('true');
    expect(drawn.children.map((c) => (c as UiElement).attrs.part)).toEqual(['sp-frame', 'sp-mark']);
    expect(glyphs(view)).toEqual([mark]);
  });

  test('REQ-483 · result: info by default, the heading at its level, subtitle and extra', () => {
    const view = uiResultView({ title: 'Nothing to show' }, r(), {});
    expect(view.attrs['data-status']).toBe('info');
    expect(byTag(view, 'h3').map((h) => [h.attrs.class, texts(h)])).toEqual([['sp-ui-result-title', ['Nothing to show']]]);
    const full = uiResultView({ title: 'Saved', subtitle: 'All good', headingLevel: 2 }, r(), { extra: true });
    expect(byTag(full, 'h2')).toHaveLength(1);
    expect(one(full, (e) => e.tag === 'p').attrs.class).toBe('sp-ui-result-subtitle');
    expect(slots(full)).toEqual(['extra']);
  });
});

describe('uiTextareaView (T-206)', () => {
  test('REQ-484 · a native textarea on the SpInput contract, its value as text', () => {
    const view = uiTextareaView({ id: 'note', name: 'note', label: 'Note', placeholder: 'Write' }, r(), { value: 'Hello' });
    expect(view.tag).toBe('span');
    expect(classes(view).slice(0, 3)).toEqual(['sp-ui', 'sp-input', 'sp-textarea']);
    const box = view.children[0] as UiElement;
    expect(box.attrs.class).toBe('sp-ui-box');
    expect((box.children[0] as UiElement).attrs).toMatchObject({ part: 'sp-frame', 'data-kind': 'control' });
    const area = one(view, (e) => e.tag === 'textarea');
    expect(area).toEqual({
      tag: 'textarea',
      attrs: { class: 'sp-ui-control', id: 'note', name: 'note', rows: '3', placeholder: 'Write', 'aria-label': 'Note' },
      children: [{ text: 'Hello' }],
      bind: 'native',
    });
    expect(one(uiTextareaView({}, r(), { value: '' }), (e) => e.tag === 'textarea').children).toEqual([]);
  });

  test('REQ-484 · rows, maxLength, disabled, readOnly and the counter', () => {
    const view = uiTextareaView({ rows: 5, maxLength: 200, showCount: true, disabled: true, readOnly: true }, r(), { value: 'Hello' });
    expect(one(view, (e) => e.tag === 'textarea').attrs).toMatchObject({ rows: '5', maxlength: '200', disabled: true, readonly: true });
    expect(one(view, (e) => classes(e).includes('sp-ui-count')).children).toEqual([{ text: '5 / 200' }]);
    expect(texts(one(uiTextareaView({ showCount: true }, r(), { value: 'abc' }), (e) => classes(e).includes('sp-ui-count')))).toEqual(['3']);
  });

  test('REQ-334 · invalid: aria-invalid, the warning glyph; the message described by its derived id', () => {
    const view = uiTextareaView({ id: 'note', invalid: true, message: 'Too short' }, r(), { value: '' });
    expect(view.attrs['data-invalid']).toBe('true');
    expect(one(view, (e) => e.tag === 'textarea').attrs).toMatchObject({ 'aria-invalid': 'true', 'aria-describedby': 'note--message' });
    expect(glyphs(view)).toEqual(['warning']);
    expect(one(view, (e) => classes(e).includes('sp-ui-message'))).toEqual({ tag: 'span', attrs: { class: 'sp-ui-message', id: 'note--message' }, children: [{ text: 'Too short' }] });
    drawnAreHidden(view);
  });
});

describe('uiInputNumberView (T-206)', () => {
  const steppers = (view: UiElement) => all(view).filter((e) => e.bind === 'stepper');
  const input = (view: UiElement) => one(view, (e) => e.tag === 'input');

  test('REQ-485 · a native number input between two exact steppers', () => {
    const view = uiInputNumberView({ id: 'qty', name: 'qty', min: 0, max: 10, label: 'Quantity' }, r(), { value: 4 });
    expect(classes(view).slice(0, 3)).toEqual(['sp-ui', 'sp-input', 'sp-input-number']);
    const box = view.children[0] as UiElement;
    expect(box.children.map((c) => (c as UiElement).tag)).toEqual(['span', 'button', 'input', 'button']);
    expect(input(view)).toEqual({
      tag: 'input',
      attrs: { class: 'sp-ui-control', type: 'number', inputmode: 'decimal', id: 'qty', name: 'qty', min: '0', max: '10', step: '1', value: '4', 'aria-label': 'Quantity' },
      children: [],
      bind: 'native',
    });
    expect(steppers(view).map((b) => [b.attrs.type, b.attrs.class, b.attrs['data-step'], b.attrs['aria-label'], b.attrs.tabindex, b.attrs.disabled])).toEqual([
      ['button', 'sp-ui-stepper', '-1', 'Decrease', '-1', undefined],
      ['button', 'sp-ui-stepper', '1', 'Increase', '-1', undefined],
    ]);
    expect(glyphs(view)).toEqual(['dash', 'plus']);
    drawnAreHidden(view);
  });

  test('REQ-485 · at a bound that stepper is disabled; null is an empty field', () => {
    expect(steppers(uiInputNumberView({ min: 0 }, r(), { value: 0 })).map((b) => b.attrs.disabled)).toEqual([true, undefined]);
    expect(steppers(uiInputNumberView({ max: 5 }, r(), { value: 5 })).map((b) => b.attrs.disabled)).toEqual([undefined, true]);
    const empty = uiInputNumberView({ placeholder: '—', step: 0.5, decrementLabel: 'Menos', incrementLabel: 'Más' }, r(), { value: null });
    expect(input(empty).attrs).toMatchObject({ value: '', placeholder: '—', step: '0.5' });
    expect(steppers(empty).map((b) => b.attrs['aria-label'])).toEqual(['Menos', 'Más']);
  });

  test('REQ-485 · disabled or readOnly disables both steppers', () => {
    for (const props of [{ disabled: true }, { readOnly: true }]) {
      const view = uiInputNumberView(props, r(), { value: 1 });
      expect(steppers(view).map((b) => b.attrs.disabled)).toEqual([true, true]);
    }
    expect(input(uiInputNumberView({ readOnly: true }, r(), { value: 1 })).attrs.readonly).toBe(true);
  });

  test('REQ-486 · an out-of-range value is drawn clamped and invalid bounds are left out, SP017', () => {
    const seen = capture();
    expect(input(uiInputNumberView({ min: 0, max: 10 }, r(), { value: 14 })).attrs.value).toBe('10');
    const loose = input(uiInputNumberView({ min: 9, max: 1 }, r(), { value: 3 }));
    expect([loose.attrs.min, loose.attrs.max]).toEqual([undefined, undefined]);
    expect(seen.map((s) => s.code)).toEqual(['SP017', 'SP017']);
  });

  test('REQ-334 · invalid with a message, as SpInput', () => {
    const view = uiInputNumberView({ id: 'qty', invalid: true, message: 'Too many' }, r(), { value: 1 });
    expect(input(view).attrs).toMatchObject({ 'aria-invalid': 'true', 'aria-describedby': 'qty--message' });
    expect(glyphs(view)).toEqual(['dash', 'plus', 'warning']);
  });

  test('REQ-485 · uiNumberValue reports the range as drawn', () => {
    expect(uiNumberValue(3, { min: 9, max: 1, step: 2 }).range).toEqual({ min: undefined, max: undefined, step: 2, precision: undefined });
  });
});

describe('every composed root (T-206)', () => {
  test('REQ-470 · the 0.3.0 root contract on each', () => {
    const views = [
      uiSurfaceView({}, r()),
      uiGlyphView({ glyph: 'tick' }, r()),
      uiTableView({ columns: [{ key: 'a' }], data: [] }, r()),
      uiPaginationView({ total: 1 }, r(), { current: 1 }),
      uiBreadcrumbView({ items: [{ label: 'a' }] }, r()),
      uiAvatarView({ name: 'a' }, r()),
      uiAvatarGroupView({}, r()),
      uiStatisticView({ title: 'a', value: 1 }, r()),
      uiDescriptionsView({ items: [] }, r()),
      uiTimelineListView({ items: [] }, r()),
      uiCollapseView({}, r()),
      uiCollapseItemView({ title: 'a' }, r(), { open: false }),
      uiEmptyView({}, r(), {}),
      uiResultView({ title: 'a' }, r(), {}),
      uiTextareaView({}, r(), { value: '' }),
      uiInputNumberView({}, r(), { value: null }),
    ];
    for (const view of views) {
      expect(classes(view)[0]).toBe('sp-ui');
      expect(classes(view)).toContain('sp-ground-silverpoint');
      expect(Object.keys(view.attrs)).toEqual(expect.arrayContaining(['data-ground', 'data-substrate', 'data-mode', 'data-size', 'data-frame']));
      expect(withPart(view, 'sp-heighten').length).toBeLessThanOrEqual(1);
    }
  });
});
