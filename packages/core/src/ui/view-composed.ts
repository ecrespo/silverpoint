import { diagnose } from '../diagnostics/diagnose';
import { uiInitials } from './initials';
import { uiItems } from './items';
import { uiRequireName } from './names';
import { uiNumberValue } from './number';
import { uiPageWindow, uiPagination } from './pages';
import type {
  SpAvatarGroupProps,
  SpAvatarProps,
  SpBreadcrumbProps,
  SpCollapseItemProps,
  SpCollapseProps,
  SpDescriptionsProps,
  SpEmptyProps,
  SpGlyphProps,
  SpInputNumberProps,
  SpPaginationProps,
  SpResultProps,
  SpStatisticProps,
  SpSurfaceProps,
  SpTableProps,
  SpTextareaProps,
  SpTimelineListProps,
} from './types';
import { baseOf, cssLength, el, frame, glyph, root, slot, sr, text, tone, UI_GLYPHS, type UiGlyph } from './view-kit';
import type { UiElement, UiNode, UiResolved } from './view';

/*
 * The composed components (API delta §4, feature-004): the 0.3.0 pieces —root contract, frame,
 * tone, heightening, exact glyphs— put together, as Reflex 0.7 composes them, but with every
 * computation in the core (Art. 2). At most one heightened element per instance (I-18).
 */

function warn(component: string, property: string, message: string): void {
  if (process.env.NODE_ENV !== 'production') diagnose('SP017', component, { property, message });
}

const heighten = () => el('span', { part: 'sp-heighten', 'aria-hidden': 'true' });
const heading = (level: number | undefined, attrs: Record<string, string | undefined>, title: string) => el(`h${level ?? 3}`, attrs, [text(title)]);
/** A text node, or none for an empty string (API delta §4: no empty text nodes). */
const maybeText = (value: string): UiNode[] => (value === '' ? [] : [text(value)]);

/** Keeps the first item of each given key; items without a key are kept as they come (REQ-325). */
function keyed<T extends { readonly key?: string }>(items: readonly T[], component: string): readonly T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (item.key === undefined) return true;
    if (!seen.has(item.key)) return seen.add(item.key), true;
    if (process.env.NODE_ENV !== 'production') diagnose('SP019', component, { property: 'items', message: `The key "${item.key}" repeats; that item is skipped.` });
    return false;
  });
}

/** A lowercase tag or ident: what a surface may be named, so a prop can never open markup of its own. */
const IDENT = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const UNSAFE_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript']);

/** `SpSurface`: the root contract on any element, with an optional frame and tone (REQ-472). */
export function uiSurfaceView(props: SpSurfaceProps, r: UiResolved): UiElement {
  let tag = props.as ?? 'div';
  if (!IDENT.test(tag) || UNSAFE_TAGS.has(tag)) {
    warn('SpSurface', 'as', `${JSON.stringify(tag)} is drawn as "div".`);
    tag = 'div';
  }
  let name = props.name;
  if (name !== undefined && !IDENT.test(name)) {
    warn('SpSurface', 'name', `${JSON.stringify(name)} adds no class.`);
    name = undefined;
  }
  const attrs = root('surface', props, r, { id: props.id });
  if (name) attrs.class = `${attrs.class as string} sp-${name}`;
  return el(tag, attrs, [
    ...(props.frame ? [frame(props.frame)] : []),
    ...(props.tone !== undefined ? [tone(String(props.tone), props.frame ?? 'box')] : []),
    slot('content'),
  ]);
}

/** `SpGlyph`: one exact mark of `UI_GLYPHS` (REQ-472). */
export function uiGlyphView(props: SpGlyphProps, r: UiResolved): UiElement {
  const known = Object.hasOwn(UI_GLYPHS, props.glyph);
  if (!known) warn('SpGlyph', 'glyph', `${JSON.stringify(props.glyph)} is not a glyph; nothing is drawn.`);
  return el(
    'svg',
    root('glyph', props, r, { id: props.id, part: 'sp-mark', 'data-glyph': props.glyph, viewBox: '0 0 16 16', 'aria-hidden': 'true' }),
    known ? [el('path', { d: UI_GLYPHS[props.glyph as UiGlyph] })] : [],
  );
}

const cell = (value: unknown): string => (value === null || value === undefined ? '' : String(value));

/** `SpTable`: a native table in a framed scroller; sortable headers are buttons that report the key (REQ-473, REQ-474). */
export function uiTableView(props: SpTableProps, r: UiResolved): UiElement {
  const columns = uiItems(props.columns, 'SpTable');
  const order = props.sortOrder ?? 'asc';
  // The consumer sorts (uiSortRows, or its server before paging): the view only marks the column (DD-040).
  const sorted = columns.find((column) => column.key === props.sortKey && column.sortable === true);
  const rows = props.data;
  const headers = columns.map((column) => {
    const width = cssLength(column.width, 'SpTable', 'columns');
    const title = column.title ?? column.key;
    const active = column === sorted;
    return el(
      'th',
      {
        scope: 'col',
        'data-align': column.align,
        'aria-sort': active ? (order === 'asc' ? 'ascending' : 'descending') : undefined,
        style: width ? `width:${width}` : undefined,
      },
      column.sortable
        ? [
            el('button', { type: 'button', class: 'sp-ui-sort', 'data-key': column.key }, [
              el('span', { class: 'sp-ui-label' }, [text(title)]),
              glyph(active ? (order === 'asc' ? 'sortUp' : 'sortDown') : 'sort'),
            ], 'sort'),
          ]
        : [text(title)],
    );
  });
  const body =
    rows.length === 0
      ? [el('tr', {}, [el('td', { class: 'sp-ui-table-empty', colspan: String(columns.length) }, [text(props.emptyText ?? 'No data')])])]
      : rows.map((row) =>
          el(
            'tr',
            { 'data-key': props.rowKey !== undefined ? cell(row[props.rowKey]) : undefined },
            columns.map((column) => el('td', { 'data-align': column.align }, maybeText(cell(row[column.key])))),
          ),
        );
  return el(
    'div',
    root('table', props, r, {
      id: props.id,
      'data-striped': props.striped ? 'true' : undefined,
      'data-hoverable': props.hoverable !== false ? 'true' : undefined,
    }),
    [
      ...(props.bordered !== false ? [frame('card')] : []),
      el('div', { class: 'sp-ui-table-scroll' }, [
        el('table', { class: 'sp-ui-table' }, [
          ...(props.caption ? [el('caption', {}, [text(props.caption)])] : []),
          el('thead', {}, [el('tr', {}, headers)]),
          el('tbody', {}, body),
        ]),
      ]),
    ],
  );
}

/** `SpPagination`: a labelled nav; pages are buttons, the current one a heightened span (REQ-476). */
export function uiPaginationView(props: SpPaginationProps, r: UiResolved, state: { readonly current: number }): UiElement {
  const { count, current, start, end } = uiPagination(props.total, props.pageSize ?? 10, state.current);
  const pageLabel = props.pageLabel ?? 'Page';
  const off = props.disabled === true;
  const button = (page: number, label: string, disabled: boolean, content: UiNode[]) =>
    el('li', {}, [
      el('button', { type: 'button', class: 'sp-ui-page', 'data-page': String(page), 'aria-label': label, disabled: off || disabled }, [frame('control'), ...content], 'page'),
    ]);
  const pages = uiPageWindow(count, current, props.siblings ?? 1).map((entry) =>
    typeof entry === 'string'
      ? el('li', { class: 'sp-ui-page-gap', 'aria-hidden': 'true' }, [glyph('ellipsis')])
      : entry === current
        ? el('li', {}, [
            el('span', { class: 'sp-ui-page', 'aria-current': 'page' }, [
              frame('control'),
              heighten(),
              el('span', { class: 'sp-ui-label sp-ui-plate' }, [sr(`${pageLabel} `), text(String(entry))]),
            ]),
          ])
        : button(entry, `${pageLabel} ${entry}`, false, [el('span', { class: 'sp-ui-label' }, [text(String(entry))])]),
  );
  const summary = (props.totalTemplate ?? '{start}–{end} of {total}')
    .split('{start}').join(String(start))
    .split('{end}').join(String(end))
    .split('{total}').join(String(Math.max(0, props.total || 0)));
  return el('nav', root('pagination', props, r, { id: props.id, 'aria-label': props.label ?? 'Pagination', 'data-disabled': off ? 'true' : undefined }), [
    ...(props.showTotal ? [el('span', { class: 'sp-ui-page-total' }, [text(summary)])] : []),
    el('ul', { class: 'sp-ui-pages' }, [
      button(current - 1, props.previousLabel ?? 'Previous page', current <= 1, [glyph('chevronLeft')]),
      ...pages,
      button(current + 1, props.nextLabel ?? 'Next page', current >= count, [glyph('chevronRight')]),
    ]),
  ]);
}

/** `SpBreadcrumb`: a labelled nav of an ordered list; the last item is the current page (REQ-477). */
export function uiBreadcrumbView(props: SpBreadcrumbProps, r: UiResolved): UiElement {
  const items = keyed(props.items, 'SpBreadcrumb');
  return el('nav', root('breadcrumb', props, r, { id: props.id, 'aria-label': props.label ?? 'Breadcrumb' }), [
    el(
      'ol',
      { class: 'sp-ui-crumbs' },
      items.map((item, i) => {
        const last = i === items.length - 1;
        const inner = last
          ? el('span', { 'aria-current': 'page' }, [text(item.label)])
          : item.href !== undefined
            ? el('a', { href: item.href }, [text(item.label)])
            : el('span', {}, [text(item.label)]);
        return el('li', { class: 'sp-ui-crumb' }, [inner]);
      }),
    ),
  ]);
}

/** `SpAvatar`: an image, or initials named as an image; a round or box frame (REQ-478). */
export function uiAvatarView(props: SpAvatarProps, r: UiResolved): UiElement {
  const name = props.alt ?? props.name ?? props.initials;
  uiRequireName('SpAvatar', name, undefined);
  let size = props.pixelSize;
  if (size !== undefined && !(Number.isFinite(size) && size > 0)) {
    warn('SpAvatar', 'pixelSize', `${size} is dropped.`);
    size = undefined;
  }
  const square = props.shape === 'square';
  const image = props.src !== undefined;
  return el(
    'span',
    root('avatar', props, r, {
      id: props.id,
      role: image ? undefined : 'img',
      'aria-label': image ? undefined : name,
      'data-shape': square ? 'square' : 'circle',
      style: size !== undefined ? `--sp-ui-avatar-size:${Math.round(size * 100) / 100}px` : undefined,
    }),
    [
      frame(square ? 'box' : 'round'),
      image
        ? el('img', { class: 'sp-ui-avatar-image', src: props.src, alt: props.alt ?? props.name ?? '' })
        : el('span', { class: 'sp-ui-avatar-initials', 'aria-hidden': 'true' }, [text(props.initials ?? uiInitials(props.name))]),
    ],
  );
}

/** `SpAvatarGroup`: a labelled group of avatars (REQ-478). */
export function uiAvatarGroupView(props: SpAvatarGroupProps, r: UiResolved): UiElement {
  return el('div', root('avatar-group', props, r, { id: props.id, role: 'group', 'aria-label': props.label }), [slot('content')]);
}

/** `SpStatistic`: the trend is carried by an exact arrow and by text, never by tone alone (REQ-479). */
export function uiStatisticView(props: SpStatisticProps, r: UiResolved): UiElement {
  const affix = (value: string) => el('span', { class: 'sp-ui-statistic-affix' }, [text(value)]);
  const up = props.trend === 'up';
  return el('div', root('statistic', props, r, { id: props.id, 'data-trend': props.trend }), [
    el('span', { class: 'sp-ui-statistic-title' }, [text(props.title)]),
    el('span', { class: 'sp-ui-statistic-value' }, [
      ...(props.prefix ? [affix(props.prefix)] : []),
      el('span', { class: 'sp-ui-statistic-number' }, [text(String(props.value))]),
      ...(props.suffix ? [affix(props.suffix)] : []),
    ]),
    ...(props.trend
      ? [
          el('span', { class: 'sp-ui-statistic-trend', 'data-trend': props.trend }, [
            glyph(up ? 'arrowUp' : 'arrowDown'),
            props.delta ? el('span', { class: 'sp-ui-statistic-delta' }, [text(props.delta)]) : sr(up ? 'Up' : 'Down'),
          ]),
        ]
      : []),
  ]);
}

/** `SpDescriptions`: a section named by its heading around a `<dl>` (REQ-480). */
export function uiDescriptionsView(props: SpDescriptionsProps, r: UiResolved): UiElement {
  let columns = props.columns ?? 3;
  const fixed = Number.isFinite(columns) ? Math.min(6, Math.max(1, Math.round(columns))) : 3;
  if (fixed !== columns) warn('SpDescriptions', 'columns', `${columns} is drawn as ${fixed}.`);
  columns = fixed;
  const titled = props.title !== undefined;
  const titleId = titled && props.id ? `${props.id}--title` : undefined;
  const bordered = props.bordered !== false;
  return el(
    'section',
    root('descriptions', props, r, {
      id: props.id,
      'aria-labelledby': titleId,
      'aria-label': titled && !titleId ? props.title : undefined,
      'data-bordered': bordered ? 'true' : undefined,
      'data-columns': String(columns),
    }),
    [
      ...(bordered ? [frame('card')] : []),
      ...(titled ? [heading(props.headingLevel, { class: 'sp-ui-descriptions-title', id: titleId }, props.title!)] : []),
      el(
        'dl',
        {},
        keyed(props.items, 'SpDescriptions').map((item) =>
          el('div', { class: 'sp-ui-description' }, [el('dt', {}, [text(item.label)]), el('dd', {}, maybeText(item.value))]),
        ),
      ),
    ],
  );
}

/** `SpTimelineList`: an ordered list; each status by its mark's shape, one current (REQ-481). */
export function uiTimelineListView(props: SpTimelineListProps, r: UiResolved): UiElement {
  let current = false;
  const items = keyed(props.items, 'SpTimelineList').map((item) => {
    let status = item.status ?? 'done';
    if (status === 'current') {
      if (current) {
        warn('SpTimelineList', 'items', `A second current item, "${item.title}", is drawn as done.`);
        status = 'done';
      }
      current = true;
    }
    const mark = status === 'done' ? [tone('selected', 'round')] : status === 'current' ? [heighten()] : status === 'error' ? [glyph('cross')] : [];
    return el('li', { class: 'sp-ui-timeline-item', 'data-status': status, 'aria-current': status === 'current' ? 'step' : undefined }, [
      el('span', { class: 'sp-ui-timeline-mark', 'aria-hidden': 'true' }, [frame('round'), ...mark]),
      el('span', { class: 'sp-ui-timeline-text' }, [
        ...(item.time ? [el('span', { class: 'sp-ui-timeline-time' }, [text(item.time)])] : []),
        el('span', { class: 'sp-ui-timeline-title' }, [text(item.title)]),
        ...(item.description ? [el('span', { class: 'sp-ui-timeline-description' }, [text(item.description)])] : []),
      ]),
    ]);
  });
  return el('ol', root('timeline-list', props, r, { id: props.id, 'aria-label': props.label }), items);
}

/** `SpCollapse`: a frame around its items; `accordion` gives them one `<details name>` (REQ-482). */
export function uiCollapseView(props: SpCollapseProps, r: UiResolved): UiElement {
  return el('div', root('collapse', props, r, { id: props.id, 'data-accordion': props.accordion ? 'true' : undefined }), [
    ...(props.bordered !== false ? [frame('card')] : []),
    slot('content'),
  ]);
}

/** The `name` an accordion's items share, `${id}--accordion`, the same in every adapter (REQ-329, DD-040). */
export function uiCollapseGroup(props: SpCollapseProps): string | undefined {
  if (!props.accordion) return undefined;
  if (props.id) return `${props.id}--accordion`;
  warn('SpCollapse', 'id', 'An accordion needs an id to name its items; they open independently.');
  return undefined;
}

/** `SpCollapseItem`: a native `<details>`; `group` is its accordion's shared name (REQ-482). */
export function uiCollapseItemView(props: SpCollapseItemProps, r: UiResolved, state: { readonly open: boolean; readonly group?: string }): UiElement {
  return el(
    'details',
    root('collapse-item', props, r, { id: props.id, name: state.group, open: state.open, 'data-disabled': props.disabled ? 'true' : undefined }),
    [
      el('summary', { class: 'sp-ui-collapse-summary', 'aria-disabled': props.disabled ? 'true' : undefined }, [
        el('span', { class: 'sp-ui-label' }, [text(props.title)]),
        glyph('chevronDown'),
      ], 'summary'),
      el('div', { class: 'sp-ui-collapse-body' }, [slot('content')]),
    ],
  );
}

/** `SpEmpty`: a toned tray and a description (REQ-483). */
export function uiEmptyView(props: SpEmptyProps, r: UiResolved, slots: { readonly extra?: boolean }): UiElement {
  return el('div', root('empty', props, r, { id: props.id }), [
    el('span', { class: 'sp-ui-empty-tray', 'aria-hidden': 'true' }, [tone('1', 'control'), frame('control')]),
    el('p', { class: 'sp-ui-empty-description' }, [text(props.description ?? 'No data')]),
    ...(slots.extra ? [el('div', { class: 'sp-ui-empty-extra' }, [slot('extra')])] : []),
  ]);
}

const RESULT_GLYPHS = { success: 'tick', info: 'info', warning: 'warning', error: 'cross' } as const;

/** `SpResult`: the status glyph in a round frame; status or alert by its kind (REQ-483). */
export function uiResultView(props: SpResultProps, r: UiResolved, slots: { readonly extra?: boolean }): UiElement {
  const status = props.status ?? 'info';
  const alert = status === 'warning' || status === 'error';
  return el('div', root('result', props, r, { id: props.id, role: alert ? 'alert' : 'status', 'data-status': status }), [
    el('span', { class: 'sp-ui-result-mark', 'aria-hidden': 'true' }, [frame('round'), glyph(RESULT_GLYPHS[status])]),
    heading(props.headingLevel, { class: 'sp-ui-result-title' }, props.title),
    ...(props.subtitle ? [el('p', { class: 'sp-ui-result-subtitle' }, [text(props.subtitle)])] : []),
    ...(slots.extra ? [el('div', { class: 'sp-ui-result-extra' }, [slot('extra')])] : []),
  ]);
}

/** The message after a field, tied by `aria-describedby` to its derived id (REQ-334). */
function message(props: { readonly id?: string; readonly name?: string; readonly message?: string }) {
  const base = baseOf(props);
  const id = props.message && base ? `${base}--message` : undefined;
  return { id, node: props.message ? [el('span', { class: 'sp-ui-message', id }, [text(props.message)])] : [] };
}

/** `SpTextarea`: a native `<textarea>` on the `SpInput` contract, with an optional counter (REQ-484). */
export function uiTextareaView(props: SpTextareaProps, r: UiResolved, state: { readonly value: string }): UiElement {
  const said = message(props);
  const max = props.maxLength !== undefined && Number.isInteger(props.maxLength) && props.maxLength >= 0 ? props.maxLength : undefined;
  return el('span', root('input sp-textarea', props, r, { 'data-invalid': props.invalid ? 'true' : undefined }), [
    el('span', { class: 'sp-ui-box' }, [
      frame('control'),
      el(
        'textarea',
        {
          class: 'sp-ui-control',
          id: props.id,
          name: props.name,
          rows: String(props.rows ?? 3),
          maxlength: max !== undefined ? String(max) : undefined,
          placeholder: props.placeholder,
          disabled: props.disabled === true,
          readonly: props.readOnly === true,
          'aria-label': props.label,
          'aria-invalid': props.invalid ? 'true' : undefined,
          'aria-describedby': said.id,
        },
        maybeText(state.value),
        'native',
      ),
      ...(props.invalid ? [glyph('warning')] : []),
    ]),
    ...(props.showCount ? [el('span', { class: 'sp-ui-count' }, [text(max !== undefined ? `${state.value.length} / ${max}` : String(state.value.length))])] : []),
    ...said.node,
  ]);
}

/** `SpInputNumber`: a native number input between exact − and + steppers (REQ-485, REQ-486). */
export function uiInputNumberView(props: SpInputNumberProps, r: UiResolved, state: { readonly value: number | null }): UiElement {
  const { value, atMin, atMax, range } = uiNumberValue(state.value, props, 'SpInputNumber');
  const said = message(props);
  const locked = props.disabled === true || props.readOnly === true;
  const stepper = (direction: '-1' | '1', label: string, disabled: boolean, mark: UiGlyph) =>
    el('button', { type: 'button', class: 'sp-ui-stepper', 'data-step': direction, 'aria-label': label, tabindex: '-1', disabled: locked || disabled }, [glyph(mark)], 'stepper');
  return el('span', root('input sp-input-number', props, r, { 'data-invalid': props.invalid ? 'true' : undefined }), [
    el('span', { class: 'sp-ui-box' }, [
      frame('control'),
      stepper('-1', props.decrementLabel ?? 'Decrease', atMin, 'dash'),
      el(
        'input',
        {
          class: 'sp-ui-control',
          type: 'number',
          inputmode: 'decimal',
          id: props.id,
          name: props.name,
          min: range.min !== undefined ? String(range.min) : undefined,
          max: range.max !== undefined ? String(range.max) : undefined,
          step: String(range.step ?? 1),
          value: value === null ? '' : String(value),
          placeholder: props.placeholder,
          disabled: props.disabled === true,
          readonly: props.readOnly === true,
          'aria-label': props.label,
          'aria-invalid': props.invalid ? 'true' : undefined,
          'aria-describedby': said.id,
        },
        [],
        'native',
      ),
      stepper('1', props.incrementLabel ?? 'Increase', atMax, 'plus'),
      ...(props.invalid ? [glyph('warning')] : []),
    ]),
    ...said.node,
  ]);
}
