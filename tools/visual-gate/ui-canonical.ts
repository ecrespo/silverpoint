/**
 * The canonical render of a UI fixture (REQ-327, DD-027): the core's view tree, serialised here by
 * a reference writer, never by an adapter — every adapter is compared with it, none with another.
 *
 * Usage: pnpm --filter @silverpoint/visual-gate ui-canonical   (writes fixtures/ui)
 *
 * Regenerating a canonical file changes the normalised output, which is never a patch
 * (API Spec §13): commit it deliberately, with a changeset that says so.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  resolveUi,
  uiAlertView,
  uiAvatarGroupView,
  uiAvatarView,
  uiBadgeView,
  uiBreadcrumbView,
  uiDescriptionsView,
  uiEmptyView,
  uiGlyphView,
  uiResultView,
  uiStatisticView,
  uiSurfaceView,
  uiTableView,
  uiTimelineListView,
  uiButtonView,
  uiCardView,
  uiCheckboxView,
  uiDividerView,
  uiInputView,
  uiProgressView,
  uiRadioGroupView,
  uiRateView,
  uiSegmentedView,
  uiSkeletonView,
  uiSliderView,
  uiStepsView,
  uiSwitchView,
  uiTabsView,
  uiTagView,
  type UiElement,
  type UiNode,
} from '@silverpoint/core/ui';
import { normalizeUi } from '../svg-normalizer/normalize';
import { uiFixtureParts, uiMatrix, type UiFixture, type UiSlotText } from './ui-matrix';

const VOID = new Set(['input', 'br', 'img', 'hr', 'meta', 'link']);
const escapeText = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** HTML for a view tree, its slots filled with the given text. */
export function serializeUi(node: UiNode, slots: Readonly<Record<string, string | undefined>>): string {
  if ('text' in node) return escapeText(node.text);
  if ('slot' in node) return escapeText(slots[node.slot] ?? '');
  const attrs = Object.entries(node.attrs)
    .map(([name, value]) => ` ${name}="${value === true ? '' : escapeAttr(value)}"`)
    .join('');
  if (VOID.has(node.tag)) return `<${node.tag}${attrs}>`;
  return `<${node.tag}${attrs}>${node.children.map((c) => serializeUi(c, slots)).join('')}</${node.tag}>`;
}

/** The core's view of a fixture: the tree every adapter must write. */
export function uiFixtureView(fixture: UiFixture): { view: UiElement; slots: UiSlotText } {
  const { props, value, slots } = uiFixtureParts(fixture);
  const r = resolveUi(props, {});
  const p = props as never;
  switch (fixture.component) {
    case 'button':
      return { view: uiButtonView(p, r, { text: slots.content }), slots };
    case 'input':
      return { view: uiInputView(p, r, { value: (value as string | undefined) ?? '' }), slots };
    case 'checkbox':
      return { view: uiCheckboxView(p, r, { checked: Boolean(value) }), slots };
    case 'switch':
      return { view: uiSwitchView(p, r, { checked: Boolean(value) }), slots };
    case 'card':
      return { view: uiCardView(p, r, { extra: slots.extra !== undefined, footer: slots.footer !== undefined }), slots };
    case 'divider':
      return { view: uiDividerView(p, r), slots };
    case 'radio-group':
      return { view: uiRadioGroupView(p, r, { value: (value as string | undefined) ?? null }), slots };
    case 'segmented':
      return { view: uiSegmentedView(p, r, { value: (value as string | undefined) ?? null }), slots };
    case 'tabs':
      return { view: uiTabsView(p, r, { value: (value as string | undefined) ?? null }), slots };
    case 'slider':
      return { view: uiSliderView(p, r, { value: (value as number | undefined) ?? 0 }), slots };
    case 'rate':
      return { view: uiRateView(p, r, { value: (value as number | undefined) ?? 0 }), slots };
    case 'steps':
      return { view: uiStepsView(p, r), slots };
    case 'tag':
      return { view: uiTagView(p, r, { text: slots.content }), slots };
    case 'badge':
      return { view: uiBadgeView(p, r, { text: slots.content }), slots };
    case 'progress':
      return { view: uiProgressView(p, r), slots };
    case 'alert':
      return { view: uiAlertView(p, r, { closable: (props as { closable?: boolean }).closable === true }), slots };
    case 'skeleton':
      return { view: uiSkeletonView(p, r), slots };
    case 'surface':
      return { view: uiSurfaceView(p, r), slots };
    case 'table':
      return { view: uiTableView(p, r), slots };
    case 'breadcrumb':
      return { view: uiBreadcrumbView(p, r), slots };
    case 'avatar':
      return { view: uiAvatarView(p, r), slots };
    case 'statistic':
      return { view: uiStatisticView(p, r), slots };
    case 'descriptions':
      return { view: uiDescriptionsView(p, r), slots };
    case 'timeline-list':
      return { view: uiTimelineListView(p, r), slots };
    case 'empty':
      return { view: uiEmptyView(p, r, { extra: slots.extra !== undefined }), slots };
    case 'result':
      return { view: uiResultView(p, r, { extra: slots.extra !== undefined }), slots };
    default:
      throw new Error(`No view for ${fixture.component}`);
  }
}

/**
 * The demos that compose (Data Model §5): Glyph `all` is every glyph in a row, each a root of its
 * own; Avatar `group` is an AvatarGroup holding its avatars. Each piece takes the fixture's ground,
 * substrate, mode and size.
 */
function composedMarkup(fixture: UiFixture): string | undefined {
  const { props } = uiFixtureParts(fixture);
  const { glyphs, avatars, ...rest } = props as typeof props & { glyphs?: readonly string[]; avatars?: readonly Record<string, unknown>[] };
  const common = { ground: rest.ground, substrate: rest.substrate, mode: rest.mode, size: rest.size };
  if (glyphs) return glyphs.map((glyph) => serializeUi(uiGlyphView({ ...common, glyph } as never, resolveUi(common, {})), {})).join('');
  if (avatars) {
    const inner = avatars.map((avatar) => serializeUi(uiAvatarView({ ...common, ...avatar } as never, resolveUi(common, {})), {})).join('');
    return serializeUi(uiAvatarGroupView(rest as never, resolveUi(rest, {})), { content: '\u0000' }).replace('\u0000', inner);
  }
  return undefined;
}

export function canonicalUiMarkup(fixture: UiFixture): string {
  const composed = composedMarkup(fixture);
  if (composed !== undefined) return composed;
  const { view, slots } = uiFixtureView(fixture);
  return serializeUi(view, slots);
}

/** The committed form: the normalised tree, one node per line. */
export const canonicalUiFor = (fixture: UiFixture): string => normalizeUi(canonicalUiMarkup(fixture));

if (process.argv[1]?.endsWith('ui-canonical.ts')) {
  const { FIXTURES_DIR } = await import('./fixtures');
  const dir = join(FIXTURES_DIR, 'ui');
  mkdirSync(dir, { recursive: true });
  const matrix = uiMatrix();
  for (const fixture of matrix) {
    writeFileSync(join(dir, `${fixture.id}.ui.json`), `${JSON.stringify(fixture, null, 2)}\n`);
    writeFileSync(join(FIXTURES_DIR, fixture.canonical), canonicalUiFor(fixture));
  }
  console.log(`ui-canonical · wrote ${matrix.length} fixtures`);
}
