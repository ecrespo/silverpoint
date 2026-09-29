import { round2 } from '../render/round';
import { uiItems, uiSelectedKey } from './items';
import type { SpRadioGroupProps, SpRateProps, SpSegmentedProps, SpSliderProps, SpTabsProps } from './types';
import { uiRange, uiRateCount, uiValue } from './value';
import { el, frame, glyph, nativeInput, root, slot, text, tone } from './view-kit';
import type { UiElement, UiResolved } from './view';

/*
 * Batch B2 (API delta §4): the composites and the ranges. Every composite of radios keeps one tab
 * stop natively; the adapters move focus with `uiRovingKey` (REQ-315). The one heightened element
 * of an instance (REQ-309, I-18) is an `aria-hidden` plate behind the current item's label.
 */

const heighten = () => el('span', { part: 'sp-heighten', 'aria-hidden': 'true' });
const legend = (label: string, forSight: boolean) => el('legend', { class: forSight ? 'sp-ui-legend' : 'sp-ui-legend sp-ui-sr' }, [text(label)]);
/** Radios without a `name` group under `${id}--value`, so two anonymous instances never share one. */
const groupName = (props: { readonly id?: string; readonly name?: string }) => props.name ?? (props.id ? `${props.id}--value` : undefined);

/** `SpRadioGroup`: a `<fieldset>` of native radios; the value `null` checks none (REQ-314, REQ-322). */
export function uiRadioGroupView(props: SpRadioGroupProps, r: UiResolved, state: { readonly value: string | null }): UiElement {
  const items = uiItems(props.items, 'SpRadioGroup');
  const value = uiSelectedKey(items, state.value, 'none');
  return el('fieldset', root('radio-group', props, r, { id: props.id, 'data-orientation': props.orientation ?? 'vertical' }), [
    legend(props.label, true),
    ...items.map((item) =>
      el('label', { class: 'sp-ui-item', 'data-key': item.key, 'data-disabled': item.disabled ? 'true' : undefined }, [
        nativeInput('radio', {
          id: props.id ? `${props.id}--${item.key}` : undefined,
          name: props.name,
          value: item.key,
          checked: item.key === value,
          disabled: item.disabled === true,
        }),
        el('span', { class: 'sp-ui-box', 'aria-hidden': 'true' }, [frame('round'), tone('selected', 'round'), glyph('dot')]),
        el('span', { class: 'sp-ui-label' }, [text(item.label)]),
      ]),
    ),
  ]);
}

/** `SpSegmented`: native radios in one frame; the selected segment toned and heightened (REQ-308, REQ-309). */
export function uiSegmentedView(props: SpSegmentedProps, r: UiResolved, state: { readonly value: string | null }): UiElement {
  const items = uiItems(props.items, 'SpSegmented');
  const value = uiSelectedKey(items, state.value, 'first');
  const name = groupName(props);
  return el('fieldset', root('segmented', props, r, { id: props.id, 'data-block': props.block ? 'true' : undefined }), [
    legend(props.label, false),
    el('span', { class: 'sp-ui-segments' }, [
      frame('control'),
      ...items.map((item) => {
        const selected = item.key === value;
        return el('label', { class: 'sp-ui-item', 'data-key': item.key, 'data-disabled': item.disabled ? 'true' : undefined }, [
          nativeInput('radio', { name, value: item.key, checked: selected, disabled: item.disabled === true }),
          el('span', { class: 'sp-ui-segment' }, [
            ...(selected ? [tone('selected', 'control'), heighten()] : []),
            el('span', { class: selected ? 'sp-ui-label sp-ui-plate' : 'sp-ui-label' }, [text(item.label)]),
          ]),
        ]);
      }),
    ]),
  ]);
}

/** `SpTabs`: a tablist of native buttons, one tab stop on the selected; panels are the content (REQ-314, REQ-315). */
export function uiTabsView(props: SpTabsProps, r: UiResolved, state: { readonly value: string | null }): UiElement {
  const items = uiItems(props.items, 'SpTabs');
  const value = uiSelectedKey(items, state.value, 'first');
  const vertical = props.orientation === 'vertical';
  const id = props.id;
  return el('div', root('tabs', props, r, { id, 'data-orientation': vertical ? 'vertical' : 'horizontal' }), [
    el('div', { class: 'sp-ui-tablist', role: 'tablist', 'aria-label': props.label, 'aria-orientation': vertical ? 'vertical' : undefined }, [
      ...items.map((item) => {
        const selected = item.key === value;
        return el(
          'button',
          {
            type: 'button',
            class: 'sp-ui-tab',
            role: 'tab',
            id: id ? `${id}--tab-${item.key}` : undefined,
            'aria-selected': selected ? 'true' : 'false',
            'aria-controls': id ? `${id}--panel-${item.key}` : undefined,
            tabindex: selected ? '0' : '-1',
            disabled: item.disabled === true,
            'data-key': item.key,
          },
          [...(selected ? [heighten()] : []), el('span', { class: 'sp-ui-label' }, [text(item.label)])],
          'native',
        );
      }),
      el('span', { part: 'sp-rule', 'aria-hidden': 'true' }),
    ]),
    el('div', { class: 'sp-ui-tabpanels' }, [slot('content')]),
  ]);
}

/**
 * `SpTabPanel`: a `tabpanel` labelled by its tab, focusable, hidden unless its tab is selected.
 * `tabs` is what the enclosing `SpTabs` shares: its `id` and the selected key.
 */
export function uiTabPanelView(props: { readonly value: string }, tabs: { readonly id?: string; readonly value: string | null }): UiElement {
  const { id } = tabs;
  return el(
    'div',
    {
      class: 'sp-ui-tabpanel',
      role: 'tabpanel',
      id: id ? `${id}--panel-${props.value}` : undefined,
      'aria-labelledby': id ? `${id}--tab-${props.value}` : undefined,
      tabindex: '0',
      hidden: props.value !== tabs.value,
    },
    [slot('content')],
  );
}

/**
 * `SpSlider`: a native range over the drawing. Its fraction is a custom property (DD-025): fill
 * and thumb sit at it exactly; the thumb is the one heightening (REQ-309).
 */
export function uiSliderView(props: SpSliderProps, r: UiResolved, state: { readonly value: number }): UiElement {
  // An invalid range falls back to its defaults once, and the native input carries the same.
  const valid = uiRange({ min: props.min ?? 0, max: props.max ?? 100, step: props.step ?? 1 }, 'SpSlider');
  const { value, fraction } = uiValue(state.value, valid, 'SpSlider');
  const span = valid.max - valid.min;
  const marks = (props.marks ?? []).filter((m) => Number.isFinite(m) && m >= valid.min && m <= valid.max);
  return el('label', root('slider', props, r, { style: `--sp-ui-fraction: ${fraction}`, 'data-disabled': props.disabled ? 'true' : undefined }), [
    el('span', { class: 'sp-ui-label' }, [text(props.label)]),
    el('span', { class: 'sp-ui-rail' }, [
      el('span', { part: 'sp-track', 'aria-hidden': 'true' }),
      el('span', { part: 'sp-fill', 'aria-hidden': 'true' }, [tone('selected', 'pill')]),
      el('span', { part: 'sp-thumb sp-heighten', 'aria-hidden': 'true' }),
      el(
        'input',
        {
          type: 'range',
          class: 'sp-ui-range',
          id: props.id,
          name: props.name,
          min: String(valid.min),
          max: String(valid.max),
          step: String(valid.step ?? 1),
          value: String(value),
          disabled: props.disabled === true,
        },
        [],
        'native',
      ),
    ]),
    ...(marks.length
      ? [
          el(
            'span',
            { class: 'sp-ui-scale', 'aria-hidden': 'true' },
            marks.map((m) => el('span', { class: 'sp-ui-scale-mark', style: `--sp-ui-at: ${round2((m - valid.min) / span)}` }, [text(String(m))])),
          ),
        ]
      : []),
  ]);
}

/** `SpRate`: `count` native radios valued 1..count, drawn as exact lozenges; filled up to the value (C-2). */
export function uiRateView(props: SpRateProps, r: UiResolved, state: { readonly value: number }): UiElement {
  const count = uiRateCount(props.count);
  const { value } = uiValue(state.value, { min: 0, max: count, step: 1 }, 'SpRate');
  const name = groupName(props);
  const readOnly = props.readOnly === true;
  return el(
    'fieldset',
    root('rate', props, r, {
      id: props.id,
      role: readOnly ? 'radiogroup' : undefined,
      'aria-readonly': readOnly ? 'true' : undefined,
      'data-readonly': readOnly ? 'true' : undefined,
    }),
    [
      legend(props.label, false),
      ...Array.from({ length: count }, (_, i) => {
        const n = i + 1;
        const filled = n <= value;
        return el('label', { class: 'sp-ui-item', 'data-filled': filled ? 'true' : undefined }, [
          nativeInput('radio', { name, value: String(n), checked: n === value, disabled: props.disabled === true, 'aria-label': String(n) }),
          el('span', { class: 'sp-ui-box', 'aria-hidden': 'true' }, [...(filled ? [tone('selected', 'round')] : []), glyph('lozenge')]),
        ]);
      }),
    ],
  );
}
