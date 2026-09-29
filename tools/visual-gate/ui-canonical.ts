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
  uiBadgeView,
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
    default:
      throw new Error(`No view for ${fixture.component}`);
  }
}

export function canonicalUiMarkup(fixture: UiFixture): string {
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
