import type { Ground } from '@silverpoint/core';
import { resolveUiTokens, UI_FRAME_KINDS, type UiFrameKind } from '@silverpoint/core/ui';
import { svgDataUri, uiFramePieces, uiTonePieces, type UiPieceName } from './pieces';

/**
 * `@silverpoint/grounds/ui.css`, written by the build from the grounds' tokens (DD-022, DD-026).
 *
 * Contract with the component markup (API delta §4): a component root is
 * `.sp-ui.sp-<name>.sp-ground-<ground>` with `data-substrate`, `data-mode`, `data-size` and, when
 * inked, `data-frame`; its drawing is made of `aria-hidden` elements laid over its box —
 * `[part='sp-frame'][data-kind]`, `[part='sp-tone'][data-tone]`— that take no layout space in
 * either mode (I-17). Colours are `--sp-` properties from `styles.css`; the only colours written
 * here are system colours in the forced-colors block (I-19). Opt-in: an application that uses no
 * component never loads it (REQ-301).
 */

const KINDS = Object.keys(UI_FRAME_KINDS) as UiFrameKind[];
/** Mask layer order: corners, then edges — the position and size lists below follow it. */
const SLICED: readonly Exclude<UiPieceName, 'all'>[] = ['tl', 'tr', 'bl', 'br', 't', 'b', 'l', 'r'];
const WHOLE: ReadonlySet<UiFrameKind> = new Set(['box', 'round']);

const rule = (selector: string, declarations: readonly string[]) => `${selector} {\n${declarations.map((d) => `  ${d};`).join('\n')}\n}`;
const media = (query: string, body: readonly string[]) => `${query} {\n${body.map((b) => b.replace(/^/gm, '  ')).join('\n\n')}\n}`;

/** Both spellings of a mask property: WebKit still wants the prefix on some; the value is one variable. */
const mask = (property: string, value: string) => [`-webkit-mask-${property}: ${value}`, `mask-${property}: ${value}`];

function tokens(ground: Ground): string {
  const ui = resolveUiTokens(ground);
  return rule(`:where(.sp-ground-${ground.name})`, [
    `--sp-ui-height-sm: ${ui.controlHeight.sm}px`,
    `--sp-ui-height-md: ${ui.controlHeight.md}px`,
    `--sp-ui-height-lg: ${ui.controlHeight.lg}px`,
    `--sp-ui-radius: ${ui.radius}px`,
    `--sp-ui-focus-width: ${ui.focusWidth}px`,
    '--sp-ui-focus-color: var(--sp-ink)',
    '--sp-ui-gap: 8px',
  ]);
}

/** Where each kind's pieces sit and how large they are: ground-independent geometry. */
function kindLayout(kind: UiFrameKind): string {
  const { slice: s } = UI_FRAME_KINDS[kind];
  const selector = `.sp-ui [part='sp-frame'][data-kind='${kind}']`;
  if (WHOLE.has(kind)) return rule(selector, ['--sp-ui-mask-position: center', '--sp-ui-mask-size: 100% 100%']);
  const corner = `${s}px ${s}px`;
  const across = `calc(100% - ${2 * s}px)`;
  return rule(selector, [
    `--sp-ui-mask-position: top left, top right, bottom left, bottom right, ${s}px top, ${s}px bottom, left ${s}px, right ${s}px`,
    `--sp-ui-mask-size: ${corner}, ${corner}, ${corner}, ${corner}, ${across} ${s}px, ${across} ${s}px, ${s}px ${across}, ${s}px ${across}`,
  ]);
}

function inkedFrames(ground: Ground): string[] {
  const ui = resolveUiTokens(ground);
  if (ui.frame !== 'inked') return [];
  const paint = rule(`.sp-ui.sp-ground-${ground.name}[data-mode='ink'] [part='sp-frame']`, [
    'border-color: transparent',
    'background: var(--sp-ink)',
    ...mask('image', 'var(--sp-ui-mask)'),
    ...mask('repeat', 'no-repeat'),
    ...mask('position', 'var(--sp-ui-mask-position)'),
    ...mask('size', 'var(--sp-ui-mask-size)'),
  ]);
  const variants: string[] = [];
  for (let v = 0; v < ui.frameVariants; v++) {
    // The runtime writes a frame slot 0..5 without knowing the ground; each slot folds onto a variant.
    const slots = [0, 1, 2, 3, 4, 5].filter((slot) => slot % ui.frameVariants === v).map((slot) => `[data-frame='${slot}']`);
    for (const kind of KINDS) {
      const { pieces } = uiFramePieces(ground, kind, v)!;
      const urls = WHOLE.has(kind) ? [pieces.all!] : SLICED.map((name) => pieces[name]!);
      variants.push(
        rule(`.sp-ui.sp-ground-${ground.name}:is(${slots.join(', ')}) [part='sp-frame'][data-kind='${kind}']`, [
          `--sp-ui-mask: ${urls.map(svgDataUri).join(', ')}`,
        ]),
      );
    }
  }
  return [paint, ...variants];
}

function tones(ground: Ground): string[] {
  const ui = resolveUiTokens(ground);
  const states = Object.entries(ui.tone);
  return ([1, 2, 3, 4] as const).map((level) => {
    // A component names a tone by level (Tag) or by state (`primary`…); the ground's tokens map a state to its level (DD-026).
    const names = [String(level), ...states.filter(([, at]) => at === level).map(([state]) => state)];
    const part = `.sp-ground-${ground.name} [part='sp-tone']:is(${names.map((n) => `[data-tone='${n}']`).join(', ')})`;
    // A table's toned rows and a modal's backdrop borrow their level's tile (DD-040, REQ-499): one copy of it.
    const borrowers = [
      ...(level === ui.rowTone ? [`.sp-ground-${ground.name} .sp-ui-table`] : []),
      ...(level === ui.backdrop ? [`.sp-ground-${ground.name}:is(.sp-modal, .sp-drawer)::backdrop`] : []),
    ];
    const selector = [part, ...borrowers].join(',\n');
    if (ground.tonalMechanism === 'weight') {
      // No hatching: the tone is a heavier exact line (DD-019, DD-026).
      return rule(part, [
        'background: none',
        ...mask('image', 'none'),
        'border: solid var(--sp-ink)',
        `border-width: calc(var(--sp-stroke-width) * var(--sp-weight-${level}) * 1px)`,
      ]);
    }
    const layers = uiTonePieces(ground, level);
    return rule(selector, [
      `--sp-ui-tone: ${layers.map((l) => svgDataUri(l.svg)).join(', ')}`,
      `--sp-ui-tone-size: ${layers.map((l) => `${l.width}px ${l.height}px`).join(', ')}`,
    ]);
  });
}

const BASE = [
  rule('.sp-ui', [
    'position: relative',
    'box-sizing: border-box',
    'color: var(--sp-text)',
    'font-family: var(--sp-font-display)',
    '--sp-ui-height: var(--sp-ui-height-md)',
  ]),
  rule(".sp-ui[data-size='sm']", ['--sp-ui-height: var(--sp-ui-height-sm)']),
  rule(".sp-ui[data-size='lg']", ['--sp-ui-height: var(--sp-ui-height-lg)']),
  // Frame and tone are laid over the box and never take layout space, in either mode (I-17).
  rule(".sp-ui [part='sp-frame']", [
    'position: absolute',
    'inset: 0',
    'box-sizing: border-box',
    'pointer-events: none',
    'border: 1px solid var(--sp-ink)',
    'border-radius: var(--sp-ui-radius)',
  ]),
  rule(".sp-ui [part='sp-tone']", [
    'position: absolute',
    'inset: 0',
    'box-sizing: border-box',
    'pointer-events: none',
    'border-radius: var(--sp-ui-radius)',
    'background: var(--sp-ink-secondary)',
    ...mask('image', 'var(--sp-ui-tone)'),
    ...mask('size', 'var(--sp-ui-tone-size)'),
    ...mask('repeat', 'repeat'),
  ]),
  rule(".sp-ui [data-kind='pill'],\n.sp-ui [data-kind='round']", ['border-radius: 999px']),
  // `precision`: the exact frame. The tone is unchanged, as it is a value, not ornament (C-7).
  rule(".sp-ui[data-mode='precision'] [part='sp-frame']", ['border-color: var(--sp-rule)']),
  // Text over a tone sits on a plate of the substrate, as chart labels sit on their halo.
  rule('.sp-ui-plate', ['position: relative', 'padding-inline: 4px', 'border-radius: 1px', 'background: var(--sp-substrate)']),
  // The one heightened item of a component, always outlined in ink (REQ-309, REQ-031).
  // Matched as one of the element's parts (`~=`): a slider thumb is also the heightening.
  rule(".sp-ui [part~='sp-heighten']", ['position: relative', 'background: var(--sp-heighten)', 'outline: 1px solid var(--sp-ink)']),
  // Hidden for sight, present for assistive technology and forms: never display:none (REQ-314).
  rule('.sp-ui-native', [
    'position: absolute',
    'inline-size: 1px',
    'block-size: 1px',
    'margin: -1px',
    'padding: 0',
    'border: 0',
    'overflow: hidden',
    'clip-path: inset(50%)',
    'white-space: nowrap',
  ]),
  // Text for assistive technology only: a legend, a skeleton's label.
  rule('.sp-ui-sr', [
    'position: absolute',
    'inline-size: 1px',
    'block-size: 1px',
    'margin: -1px',
    'padding: 0',
    'border: 0',
    'overflow: hidden',
    'clip-path: inset(50%)',
    'white-space: nowrap',
  ]),
  // An exact outline, never inked, on the control or on the item whose hidden input has focus (REQ-316).
  rule('.sp-ui:focus-visible,\n.sp-ui :focus-visible:not(.sp-ui-native, .sp-ui-control, .sp-ui-range),\n:is(.sp-ui, .sp-ui-item):has(> .sp-ui-native:focus-visible),\n.sp-ui-box:has(> .sp-ui-control:focus-visible)', [
    'outline: var(--sp-ui-focus-width) solid var(--sp-ui-focus-color)',
    'outline-offset: 2px',
  ]),
  // Their ring is the box's, the item's or the thumb's: the browser draws none of its own.
  rule(':is(.sp-ui-native, .sp-ui-control, .sp-ui-range)', ['outline: none']),
];

/**
 * Where a ground does not hatch, a toned table row is a weighted rule under its cells, and a modal's
 * backdrop the opaque substrate: a see-through flat backdrop would be opacity as tone (DD-038, DD-040).
 */
function unhatched(ground: Ground): string[] {
  if (ground.tonalMechanism !== 'weight') return [];
  const g = `.sp-ground-${ground.name}`;
  return [
    rule(rowTone(g), [
      'background: none',
      ...mask('image', 'none'),
      'border-block-end: 0 solid var(--sp-ink)',
      `border-block-end-width: calc(var(--sp-stroke-width) * var(--sp-weight-${resolveUiTokens(ground).rowTone}) * 1px)`,
    ]),
    rule(`${g}:is(.sp-modal, .sp-drawer)::backdrop`, ['background: var(--sp-substrate)', ...mask('image', 'none')]),
  ];
}

/** Batch B1 (T-144..T-146): Button, Input, Checkbox, Switch, Card, Divider (API delta §4). */
const B1 = [
  rule('.sp-ui [part=\'sp-mark\']', [
    'position: relative',
    'flex: none',
    'inline-size: 14px',
    'block-size: 14px',
    'fill: none',
    'stroke: currentColor',
    'stroke-width: 1.5',
    'stroke-linecap: round',
    'stroke-linejoin: round',
  ]),
  rule('.sp-ui-label,\n.sp-ui-affix,\n.sp-ui-control', ['position: relative']),
  // Button
  rule('.sp-button', [
    'display: inline-flex',
    'align-items: center',
    'justify-content: center',
    'gap: 6px',
    'min-block-size: var(--sp-ui-height)',
    'padding: 0 16px',
    'margin: 0',
    'border: 0',
    'background: transparent',
    'color: var(--sp-text)',
    'font: inherit',
    'font-size: 15px',
    'line-height: 1.2',
    'text-decoration: none',
    'cursor: pointer',
  ]),
  rule(".sp-button[data-block='true']", ['display: flex', 'inline-size: 100%']),
  rule(".sp-button:disabled,\n.sp-button[aria-disabled='true']", ['font-style: italic', 'cursor: not-allowed']),
  // Input
  rule('.sp-input', ['display: inline-flex', 'flex-direction: column', 'gap: 4px', 'font-size: 15px']),
  rule('.sp-ui-box', ['position: relative', 'display: inline-flex', 'align-items: center', 'gap: 6px']),
  rule('.sp-input .sp-ui-box', ['min-block-size: var(--sp-ui-height)', 'padding: 0 10px 0 12px']),
  rule('.sp-ui-control', [
    'flex: 1',
    'min-inline-size: 0',
    'margin: 0',
    'padding: 0',
    'border: 0',
    'background: transparent',
    'color: var(--sp-text)',
    'font: inherit',
  ]),
  rule('.sp-ui-control::placeholder', ['color: var(--sp-text-muted)', 'font-style: italic']),
  rule('.sp-ui-control:disabled', ['font-style: italic', 'cursor: not-allowed']),
  rule('.sp-ui-message', ['color: var(--sp-text-muted)', 'font-size: 13px', 'font-style: italic']),
  rule(".sp-input[data-invalid='true'] .sp-ui-message", ['color: var(--sp-text)']),
  // Checkbox and Switch: the whole label is the target, so it is 24 px tall at least (REQ-317).
  rule('.sp-checkbox,\n.sp-switch', [
    'display: inline-flex',
    'align-items: center',
    'gap: 8px',
    'min-block-size: 24px',
    'font-size: 15px',
    'cursor: pointer',
  ]),
  rule('.sp-checkbox .sp-ui-box', ['inline-size: 16px', 'block-size: 16px', 'flex: none']),
  rule(".sp-checkbox [part='sp-mark']", ['position: absolute', 'inset: 1px', 'inline-size: auto', 'block-size: auto']),
  // Drawn state follows the native state: tone and tick on :checked, dash when indeterminate (REQ-310).
  rule(".sp-checkbox [part='sp-mark'],\n.sp-checkbox [part='sp-tone'],\n.sp-switch [part='sp-tone']", ['visibility: hidden']),
  rule(
    ".sp-ui-native:checked + .sp-ui-box [data-glyph='tick'],\n.sp-ui-native:checked + .sp-ui-box [part='sp-tone'],\n.sp-checkbox[data-indeterminate] [part='sp-tone'],\n.sp-ui-native:checked + .sp-ui-track [part='sp-tone']",
    ['visibility: visible'],
  ),
  rule(".sp-checkbox[data-indeterminate] [data-glyph='tick']", ['visibility: hidden']),
  rule(".sp-checkbox[data-indeterminate] [data-glyph='dash']", ['visibility: visible']),
  rule('.sp-ui-track', ['position: relative', 'flex: none', 'inline-size: 44px', 'block-size: 24px']),
  rule(".sp-switch [part='sp-knob']", [
    'position: absolute',
    'inset-block: 4px',
    'inset-inline-start: 4px',
    'inline-size: 16px',
    'border-radius: 50%',
    'background: var(--sp-substrate)',
    'box-shadow: inset 0 0 0 1px var(--sp-ink)',
  ]),
  // On, the knob is the switch's one heightened item, outlined in ink (REQ-309).
  rule(".sp-ui-native:checked + .sp-ui-track [part='sp-knob']", ['inset-inline-start: 24px', 'background: var(--sp-heighten)']),
  rule('.sp-checkbox:has(> .sp-ui-native:disabled),\n.sp-switch:has(> .sp-ui-native:disabled)', ['font-style: italic', 'cursor: not-allowed']),
  // Card
  rule('.sp-card', ['display: flex', 'flex-direction: column', 'gap: 10px', 'padding: 14px 20px 18px', 'color: var(--sp-text)']),
  rule('.sp-ui-card-header', ['position: relative', 'display: flex', 'align-items: baseline', 'justify-content: space-between', 'gap: 12px']),
  rule('.sp-ui-card-title', ['margin: 0', 'font-size: 18px', 'font-weight: 500', 'line-height: 1.25']),
  rule(".sp-card > [part='sp-rule']", ['position: relative', 'display: block', 'border-top: 1px solid var(--sp-rule)']),
  rule('.sp-ui-card-extra,\n.sp-ui-card-body,\n.sp-ui-card-footer', ['position: relative']),
  rule('.sp-ui-card-footer', ['color: var(--sp-text-muted)', 'font-size: 13px']),
  // Divider: exact rules, as a chart's axis is exact.
  rule('.sp-divider', ['display: flex', 'align-items: center', 'gap: 12px', 'margin-block: 8px', 'color: var(--sp-text-muted)', 'font-style: italic']),
  rule(".sp-divider [part='sp-rule']", ['flex: 1', 'border-top: 1px solid var(--sp-rule)']),
  rule(".sp-divider[data-align='start'] [part='sp-rule']:first-child,\n.sp-divider[data-align='end'] [part='sp-rule']:last-child", ['flex: 0 0 24px']),
  rule(".sp-divider[data-orientation='vertical']", ['flex-direction: column', 'align-self: stretch', 'margin-block: 0', 'margin-inline: 8px']),
  rule(".sp-divider[data-orientation='vertical'] [part='sp-rule']", ['border-top: 0', 'border-inline-start: 1px solid var(--sp-rule)']),
];

/** A drawn bar at an exact fraction: Slider and Progress (DD-025); logical properties, so rtl mirrors it (REQ-321). */
const bar = (component: string, height: number) => [
  rule(`.${component} [part='sp-track']`, [
    'position: absolute',
    'inset-inline: 0',
    'inset-block-start: 50%',
    `block-size: ${height}px`,
    `margin-block-start: -${height / 2}px`,
    'border-radius: 999px',
    'box-shadow: inset 0 0 0 1px var(--sp-ink)',
  ]),
  rule(`.${component} [part='sp-fill']`, [
    'position: absolute',
    'inset-inline-start: 0',
    'inset-block-start: 50%',
    `block-size: ${height}px`,
    `margin-block-start: -${height / 2}px`,
    'inline-size: calc(var(--sp-ui-fraction) * 100%)',
    'border-radius: 999px',
    'overflow: hidden',
  ]),
];

/** Batch B2 (T-147..T-149): RadioGroup, Segmented, Tabs, Slider, Rate. */
const B2 = [
  rule('.sp-radio-group,\n.sp-segmented,\n.sp-rate', ['min-inline-size: 0', 'margin: 0', 'padding: 0', 'border: 0', 'font-size: 15px']),
  rule('.sp-ui-legend', ['padding: 0', 'margin-block-end: 6px', 'color: var(--sp-text-muted)', 'font-size: 13px', 'font-style: italic']),
  rule(".sp-ui-item[data-disabled='true']", ['font-style: italic', 'cursor: not-allowed']),
  // RadioGroup: the whole label is the target (REQ-317); the dot and tone follow :checked (REQ-310).
  rule('.sp-radio-group', ['display: inline-flex', 'flex-direction: column', 'gap: 6px 24px']),
  rule(".sp-radio-group[data-orientation='horizontal']", ['flex-direction: row', 'flex-wrap: wrap', 'align-items: center']),
  rule('.sp-radio-group .sp-ui-item', ['position: relative', 'display: inline-flex', 'align-items: center', 'gap: 8px', 'min-block-size: 24px', 'cursor: pointer']),
  rule('.sp-radio-group .sp-ui-box', ['inline-size: 16px', 'block-size: 16px', 'flex: none']),
  rule(".sp-radio-group [part='sp-mark'],\n.sp-radio-group [part='sp-tone']", ['visibility: hidden']),
  rule(".sp-radio-group [part='sp-mark']", ['position: absolute', 'inset: 1px', 'inline-size: auto', 'block-size: auto']),
  rule(".sp-ui [data-glyph='dot']", ['fill: currentColor', 'stroke: none']),
  rule(".sp-ui-native:checked + .sp-ui-box [data-glyph='dot']", ['visibility: visible']),
  // Segmented: one frame, exact separators; the selected segment toned, its label on the heightening.
  rule('.sp-segmented', ['display: inline-flex']),
  rule(".sp-segmented[data-block='true']", ['display: flex']),
  rule('.sp-ui-segments', ['position: relative', 'display: inline-flex', 'flex: 1']),
  rule('.sp-segmented .sp-ui-item', ['position: relative', 'display: flex', 'flex: 1']),
  rule('.sp-segmented .sp-ui-item + .sp-ui-item::before', [
    "content: ''",
    'position: absolute',
    'inset-block: 6px',
    'inset-inline-start: 0',
    'border-inline-start: 1px solid var(--sp-rule)',
  ]),
  rule('.sp-ui-segment', [
    'position: relative',
    'flex: 1',
    'display: inline-flex',
    'align-items: center',
    'justify-content: center',
    'min-block-size: var(--sp-ui-height)',
    'padding: 0 18px',
    'cursor: pointer',
  ]),
  rule(".sp-ui-segment [part~='sp-heighten']", ['position: absolute', 'inset: 5px 10px']),
  rule('.sp-ui-segment .sp-ui-plate', ['background: none']),
  // Tabs: native buttons on an exact rule; the active tab's heightening is a bar on it.
  rule('.sp-tabs', ['display: flex', 'flex-direction: column', 'font-size: 15px']),
  rule(".sp-tabs[data-orientation='vertical']", ['flex-direction: row']),
  rule('.sp-ui-tablist', ['position: relative', 'display: flex', 'gap: 4px']),
  rule(".sp-tabs[data-orientation='vertical'] .sp-ui-tablist", ['flex-direction: column']),
  rule('.sp-ui-tab', [
    'position: relative',
    'display: inline-flex',
    'align-items: center',
    'justify-content: center',
    'min-block-size: var(--sp-ui-height)',
    'min-inline-size: 24px',
    'padding: 0 16px',
    'margin: 0',
    'border: 0',
    'background: transparent',
    'color: var(--sp-text)',
    'font: inherit',
    'cursor: pointer',
  ]),
  rule('.sp-ui-tab:disabled', ['color: var(--sp-text-muted)', 'font-style: italic', 'cursor: not-allowed']),
  rule(".sp-ui-tablist > [part='sp-rule']", ['position: absolute', 'inset-inline: 0', 'inset-block-end: 0', 'border-top: 1px solid var(--sp-rule)']),
  rule(".sp-tabs[data-orientation='vertical'] .sp-ui-tablist > [part='sp-rule']", [
    'inset-block: 0',
    'inset-inline: auto 0',
    'border-top: 0',
    'border-inline-end: 1px solid var(--sp-rule)',
  ]),
  rule(".sp-ui-tab [part~='sp-heighten']", ['position: absolute', 'inset-inline: 8px', 'inset-block-end: -2px', 'block-size: 5px', 'border-radius: 3px']),
  rule(".sp-tabs[data-orientation='vertical'] .sp-ui-tab [part~='sp-heighten']", [
    'inset-block: 6px',
    'inset-inline: auto -2px',
    'inline-size: 5px',
    'block-size: auto',
  ]),
  rule('.sp-ui-tabpanels', ['position: relative', 'padding-block-start: 12px']),
  rule(".sp-tabs[data-orientation='vertical'] .sp-ui-tabpanels", ['padding-block-start: 0', 'padding-inline-start: 16px']),
  // Slider: a transparent native range over the exact drawing; the thumb is the heightening.
  rule('.sp-slider', ['display: flex', 'flex-direction: column', 'gap: 6px', 'font-size: 15px']),
  rule('.sp-slider .sp-ui-rail', ['position: relative', 'display: block', 'block-size: 24px']),
  ...bar('sp-slider', 8),
  rule(".sp-slider [part~='sp-thumb']", [
    'position: absolute',
    'inset-block-start: 50%',
    'inset-inline-start: calc(var(--sp-ui-fraction) * 100%)',
    'inline-size: 20px',
    'block-size: 20px',
    'margin-block-start: -10px',
    'margin-inline-start: -10px',
    'border-radius: 50%',
    'pointer-events: none',
  ]),
  rule('.sp-ui-range', [
    'position: absolute',
    'inset: 0',
    'inline-size: 100%',
    'block-size: 100%',
    'margin: 0',
    'padding: 0',
    'background: transparent',
    '-webkit-appearance: none',
    'appearance: none',
    'cursor: pointer',
  ]),
  rule('.sp-ui-range::-webkit-slider-runnable-track', ['background: transparent', 'border: 0']),
  rule('.sp-ui-range::-webkit-slider-thumb', ['-webkit-appearance: none', 'appearance: none', 'inline-size: 24px', 'block-size: 24px', 'background: transparent', 'border: 0']),
  rule('.sp-ui-range::-moz-range-track', ['background: transparent', 'border: 0']),
  rule('.sp-ui-range::-moz-range-progress', ['background: transparent']),
  rule('.sp-ui-range::-moz-range-thumb', ['inline-size: 24px', 'block-size: 24px', 'background: transparent', 'border: 0']),
  rule('.sp-slider:has(.sp-ui-range:focus-visible) [part~=\'sp-thumb\']', [
    'outline: var(--sp-ui-focus-width) solid var(--sp-ui-focus-color)',
    'outline-offset: 2px',
  ]),
  rule(".sp-slider[data-disabled='true']", ['font-style: italic']),
  rule('.sp-ui-range:disabled', ['cursor: not-allowed']),
  rule('.sp-ui-scale', ['position: relative', 'display: block', 'block-size: 22px', 'color: var(--sp-text-muted)', 'font-size: 12px']),
  rule('.sp-ui-scale-mark', [
    'position: absolute',
    'inset-inline-start: calc(var(--sp-ui-at) * 100%)',
    'inline-size: 4ch',
    'margin-inline-start: -2ch',
    'padding-block-start: 8px',
    'text-align: center',
  ]),
  rule('.sp-ui-scale-mark::before', [
    "content: ''",
    'position: absolute',
    'inset-block-start: 0',
    'inset-inline-start: 50%',
    'block-size: 5px',
    'border-inline-start: 1px solid var(--sp-rule)',
  ]),
  // Rate: exact lozenges; filled ones take the tone, clipped to the lozenge, and a heavier line.
  rule('.sp-rate', ['display: inline-flex', 'gap: 4px']),
  rule('.sp-rate .sp-ui-item', [
    'position: relative',
    'display: inline-flex',
    'align-items: center',
    'justify-content: center',
    'min-inline-size: 24px',
    'min-block-size: 24px',
    'cursor: pointer',
  ]),
  rule('.sp-rate .sp-ui-box', ['inline-size: 20px', 'block-size: 20px']),
  rule(".sp-rate [part='sp-mark']", ['position: absolute', 'inset: 0', 'inline-size: auto', 'block-size: auto']),
  rule(".sp-rate [part='sp-tone']", ['border-radius: 0', 'clip-path: polygon(50% 9%, 91% 50%, 50% 91%, 9% 50%)']),
  rule(".sp-rate [data-filled='true'] [part='sp-mark']", ['stroke-width: 2.25']),
  rule(".sp-rate[data-readonly='true'] .sp-ui-item,\n.sp-rate .sp-ui-item:has(> .sp-ui-native:disabled)", ['cursor: default']),
];

/** Batch B3 (T-150..T-152): Steps, Tag, Badge, Progress, Alert, Skeleton. */
const B3 = [
  // Steps: exact marks and connectors; the current mark is the heightening (REQ-309).
  rule('.sp-steps', ['display: flex', 'margin: 0', 'padding: 0', 'list-style: none', 'font-size: 15px']),
  rule(".sp-steps[data-orientation='vertical']", ['flex-direction: column']),
  rule('.sp-ui-step', ['position: relative', 'flex: 1', 'display: flex', 'flex-direction: column', 'align-items: flex-start', 'gap: 6px', 'min-inline-size: 0']),
  rule(".sp-steps[data-orientation='vertical'] .sp-ui-step", ['flex-direction: row', 'gap: 12px', 'padding-block-end: 20px']),
  rule(".sp-ui-step[data-status='wait']", ['color: var(--sp-text-muted)']),
  rule('.sp-ui-step-mark', [
    'position: relative',
    'display: inline-flex',
    'align-items: center',
    'justify-content: center',
    'flex: none',
    'inline-size: 28px',
    'block-size: 28px',
    'border-radius: 50%',
    'box-shadow: inset 0 0 0 1px var(--sp-ink)',
    'font-size: 14px',
  ]),
  rule(".sp-ui-step[data-status='wait'] .sp-ui-step-mark", ['box-shadow: inset 0 0 0 1px var(--sp-rule)']),
  rule(".sp-ui-step-mark [part='sp-mark']", ['inline-size: 16px', 'block-size: 16px']),
  rule('.sp-ui-step-text', ['display: flex', 'flex-direction: column']),
  rule(".sp-ui-step[aria-current='step'] .sp-ui-step-title", ['font-weight: 500']),
  rule('.sp-ui-step-description', ['color: var(--sp-text-muted)', 'font-size: 13px', 'font-style: italic']),
  rule(".sp-steps [part='sp-connector']", [
    'position: absolute',
    'inset-block-start: 14px',
    'inset-inline: 36px 8px',
    // Only the one edge has a width, so a dashed style dashes that line and draws no other.
    'border: 0 solid var(--sp-ink)',
    'border-top-width: 1px',
  ]),
  rule(".sp-steps[data-orientation='vertical'] [part='sp-connector']", [
    'inset-block: 36px 4px',
    'inset-inline: 14px auto',
    'border-top-width: 0',
    'border-inline-start-width: 1px',
  ]),
  rule(".sp-steps [part='sp-connector'][data-status='wait']", ['border-style: dashed', 'border-color: var(--sp-rule)']),
  // Tag and the close buttons of Tag and Alert.
  rule('.sp-tag', ['display: inline-flex', 'align-items: center', 'gap: 2px', 'min-block-size: 24px', 'padding: 0 6px', 'font-size: 14px', 'font-style: italic']),
  rule('.sp-ui-close', [
    'position: relative',
    'display: inline-flex',
    'align-items: center',
    'justify-content: center',
    'flex: none',
    'min-inline-size: 24px',
    'min-block-size: 24px',
    'padding: 0',
    'margin: 0',
    'border: 0',
    'background: transparent',
    'color: var(--sp-text)',
    'cursor: pointer',
  ]),
  rule(".sp-ui-close [part='sp-mark']", ['inline-size: 12px', 'block-size: 12px']),
  // Badge: its count is text, in a pill; a dot is exact.
  rule('.sp-badge', ['display: inline-flex', 'align-items: flex-start', 'gap: 6px', 'font-size: 15px']),
  rule('.sp-ui-badge-count', [
    'position: relative',
    'display: inline-flex',
    'align-items: center',
    'justify-content: center',
    'min-inline-size: 22px',
    'block-size: 20px',
    'margin-block-start: -8px',
    'padding: 0 7px',
    'font-size: 12px',
  ]),
  rule('.sp-ui-badge-text', ['position: relative']),
  rule('.sp-ui-badge-dot', ['position: relative', 'inline-size: 8px', 'block-size: 8px', 'margin-block-start: -2px', 'border-radius: 50%', 'background: var(--sp-ink)']),
  // Progress: an exact bar or the core's exact arc; indeterminate is a static tone (REQ-320).
  rule('.sp-progress', ['display: flex', 'align-items: center', 'gap: 12px', 'font-size: 15px']),
  rule(".sp-progress[data-shape='line'] .sp-ui-rail", ['position: relative', 'flex: 1', 'display: block', 'block-size: 12px']),
  ...bar('sp-progress', 12),
  rule(".sp-progress[data-indeterminate='true'] [part='sp-fill']", ['inline-size: 100%']),
  rule('.sp-ui-value', ['position: relative', 'min-inline-size: 3ch', 'font-variant-numeric: tabular-nums']),
  rule(".sp-progress[data-shape='circle']", ['position: relative', 'display: inline-flex', 'justify-content: center', 'inline-size: 88px', 'block-size: 88px']),
  rule('.sp-ui-ring', ['position: absolute', 'inset: 0', 'inline-size: 100%', 'block-size: 100%', 'fill: none']),
  rule('.sp-ui-ring-track', ['stroke: var(--sp-rule)', 'stroke-width: 8']),
  rule('.sp-ui-ring-fill', ['stroke: var(--sp-ink)', 'stroke-width: 8']),
  rule(".sp-progress[data-shape='circle'] .sp-ui-value", ['font-size: 18px']),
  // Alert: framed; error alone toned (C-3), its text on a plate.
  rule('.sp-alert', ['display: flex', 'align-items: flex-start', 'gap: 12px', 'padding: 12px 16px', 'font-size: 15px']),
  rule(".sp-alert > [part='sp-mark']", ['inline-size: 18px', 'block-size: 18px', 'margin-block-start: 2px']),
  rule('.sp-ui-alert-body', ['position: relative', 'flex: 1', 'display: flex', 'flex-direction: column', 'gap: 2px']),
  rule('.sp-ui-alert-body.sp-ui-plate', ['flex: 0 1 auto', 'padding: 2px 6px']),
  rule('.sp-ui-alert-title', ['font-weight: 500']),
  rule('.sp-alert > .sp-ui-close', ['margin-inline-start: auto']),
  // Skeleton: hidden toned shapes.
  rule('.sp-skeleton', ['display: flex', 'align-items: flex-start', 'gap: 16px']),
  rule('.sp-ui-skeleton-avatar', ['position: relative', 'flex: none', 'inline-size: 48px', 'block-size: 48px', 'border-radius: 50%']),
  rule('.sp-ui-skeleton-lines', ['flex: 1', 'display: flex', 'flex-direction: column', 'gap: 8px', 'padding-block-start: 4px']),
  rule('.sp-ui-skeleton-line', ['position: relative', 'display: block', 'block-size: 12px']),
  rule('.sp-ui-skeleton-line:last-child:not(:first-child)', ['inline-size: 60%']),
];

/** The tone layer of a table's toned rows: striped even rows and the hovered row (REQ-475); `root` narrows the table. */
const rowTone = (root = '') =>
  `${root}.sp-table[data-striped='true'] tbody tr:nth-child(even) td::before,\n${root}.sp-table[data-hoverable='true'] tbody tr:hover td::before`;

/** A native button with no chrome of its own: the frame or the glyph is its drawing. */
const plainButton = [
  'position: relative',
  'display: inline-flex',
  'align-items: center',
  'justify-content: center',
  'gap: 6px',
  'margin: 0',
  'padding: 0',
  'border: 0',
  'background: transparent',
  'color: inherit',
  'font: inherit',
  'cursor: pointer',
];

const caps = ['color: var(--sp-text-muted)', 'font-size: 12px', 'letter-spacing: 0.08em', 'text-transform: uppercase'];

/** feature-004, the composed components (API delta §4): Reflex 0.7's layout on the root contract. */
const COMPOSED = [
  rule('.sp-surface', ['display: block']),
  rule('.sp-glyph', ['display: inline-block', 'vertical-align: middle']),
  rule(".sp-ui :is([data-glyph='sort'], [data-glyph='sortUp'], [data-glyph='sortDown'])", ['fill: currentColor', 'stroke: none']),
  rule('.sp-ui-icon-button', [...plainButton, 'min-inline-size: 24px', 'min-block-size: 24px', 'color: var(--sp-text)']),
  // Table
  rule('.sp-table', ['display: block', 'padding: 6px 0 8px', 'font-size: 15px']),
  rule('.sp-ui-table-scroll', ['position: relative', 'overflow-x: auto']),
  rule('.sp-ui-table', ['inline-size: 100%', 'border-collapse: collapse', 'font-variant-numeric: tabular-nums', 'color: var(--sp-text)']),
  rule('.sp-ui-table caption', ['padding: 6px 16px 8px', 'caption-side: top', 'text-align: start', 'font-size: 17px', 'font-weight: 500']),
  rule('.sp-ui-table th', [
    'padding: 8px 14px',
    'border-block-end: 1px solid var(--sp-ink)',
    'color: var(--sp-text-muted)',
    'font-weight: 500',
    'text-align: start',
    'white-space: nowrap',
  ]),
  // A cell is a stacking context, so its tone layer stays under its own text (REQ-475).
  rule('.sp-ui-table td', ['position: relative', 'z-index: 0', 'padding: 8px 14px', 'border-block-end: 1px solid var(--sp-grid)', 'vertical-align: top']),
  rule('.sp-ui-table td .sp-ui-plate', ['padding-inline: 2px']),
  rule('.sp-ui-table tbody tr:last-child td', ['border-block-end: 0']),
  rule(".sp-ui-table [data-align='end']", ['text-align: end']),
  rule(".sp-ui-table [data-align='center']", ['text-align: center']),
  rule(".sp-table[data-size='sm'] .sp-ui-table :is(th, td)", ['padding: 4px 10px']),
  rule(".sp-table[data-size='lg'] .sp-ui-table :is(th, td)", ['padding: 12px 18px']),
  rule(rowTone(), [
    "content: ''",
    'position: absolute',
    'inset: 0',
    'z-index: -1',
    'pointer-events: none',
    'background: var(--sp-ink-secondary)',
    ...mask('image', 'var(--sp-ui-tone)'),
    ...mask('size', 'var(--sp-ui-tone-size)'),
    ...mask('repeat', 'repeat'),
  ]),
  rule('.sp-ui-sort', [...plainButton, 'min-block-size: 24px', 'color: inherit', 'font-weight: inherit']),
  rule(".sp-ui-sort [part='sp-mark']", ['inline-size: 12px', 'block-size: 12px', 'color: var(--sp-rule)']),
  rule(".sp-ui-table th[aria-sort]", ['color: var(--sp-text)']),
  rule(".sp-ui-table th[aria-sort] .sp-ui-sort [part='sp-mark']", ['color: var(--sp-ink)']),
  rule('.sp-ui-table-empty', ['padding: 18px', 'color: var(--sp-text-muted)', 'font-style: italic', 'text-align: center']),
  // Pagination
  rule('.sp-pagination', ['display: inline-flex', 'flex-wrap: wrap', 'align-items: center', 'gap: 12px', 'font-size: 15px']),
  rule('.sp-ui-pages', ['display: flex', 'flex-wrap: wrap', 'align-items: center', 'gap: 6px', 'margin: 0', 'padding: 0', 'list-style: none']),
  rule('.sp-ui-page', [...plainButton, 'min-inline-size: var(--sp-ui-height)', 'min-block-size: var(--sp-ui-height)', 'padding: 0 6px', 'font-variant-numeric: tabular-nums']),
  rule('.sp-ui-page:disabled', ['color: var(--sp-text-muted)', 'font-style: italic', 'cursor: not-allowed']),
  rule('span.sp-ui-page', ['cursor: default']),
  rule(".sp-ui-page [part~='sp-heighten']", ['position: absolute', 'inset: 4px', 'border-radius: 1px']),
  rule('.sp-ui-page-gap', ['display: inline-flex', 'padding: 0 2px', 'color: var(--sp-text-muted)']),
  rule('.sp-ui-page-total', ['color: var(--sp-text-muted)', 'font-size: 14px']),
  rule(":dir(rtl) .sp-pagination [data-glyph^='chevron']", ['scale: -1 1']),
  // Breadcrumb: the separators are exact rules in --sp-rule (Data Model §3.8, ui.crumb-separator).
  rule('.sp-breadcrumb', ['font-size: 15px']),
  rule('.sp-ui-crumbs', ['display: flex', 'flex-wrap: wrap', 'align-items: center', 'gap: 4px 0', 'margin: 0', 'padding: 0', 'list-style: none']),
  rule('.sp-ui-crumb', ['display: inline-flex', 'align-items: center']),
  rule('.sp-ui-crumb + .sp-ui-crumb::before', ["content: '/'", 'padding: 0 10px', 'color: var(--sp-rule)']),
  rule('.sp-ui-crumb a', ['color: var(--sp-text-muted)', 'text-decoration: underline', 'text-decoration-color: var(--sp-rule)', 'text-underline-offset: 3px']),
  rule('.sp-ui-crumb a:hover', ['color: var(--sp-text)', 'text-decoration-color: currentColor']),
  rule(".sp-ui-crumb [aria-current='page']", ['color: var(--sp-text)', 'font-weight: 500']),
  // Avatar and its group
  rule('.sp-avatar', [
    'display: inline-flex',
    'align-items: center',
    'justify-content: center',
    'flex: none',
    'inline-size: var(--sp-ui-avatar-size, var(--sp-ui-height))',
    'block-size: var(--sp-ui-avatar-size, var(--sp-ui-height))',
    'border-radius: 50%',
    'background: var(--sp-substrate)',
    'font-size: 13px',
    'letter-spacing: 0.04em',
  ]),
  rule(".sp-avatar[data-shape='square']", ['border-radius: var(--sp-ui-radius)']),
  rule('.sp-ui-avatar-image', ['position: absolute', 'inset: 3px', 'inline-size: calc(100% - 6px)', 'block-size: calc(100% - 6px)', 'object-fit: cover', 'border-radius: inherit']),
  rule('.sp-ui-avatar-initials', ['position: relative']),
  rule('.sp-avatar-group', ['display: inline-flex']),
  rule('.sp-avatar-group > .sp-avatar + .sp-avatar', ['margin-inline-start: -8px']),
  // Statistic: the trend is an exact arrow and text (REQ-479).
  rule('.sp-statistic', ['display: inline-flex', 'flex-direction: column', 'gap: 4px']),
  rule('.sp-ui-statistic-title', caps),
  rule('.sp-ui-statistic-value', ['display: inline-flex', 'align-items: baseline', 'gap: 4px', 'font-size: 32px', 'font-variant-numeric: tabular-nums', 'line-height: 1.1']),
  rule(".sp-statistic[data-size='sm'] .sp-ui-statistic-value", ['font-size: 22px']),
  rule(".sp-statistic[data-size='lg'] .sp-ui-statistic-value", ['font-size: 44px']),
  rule('.sp-ui-statistic-affix', ['color: var(--sp-text-muted)', 'font-size: 0.55em']),
  rule('.sp-ui-statistic-trend', ['display: inline-flex', 'align-items: center', 'gap: 4px', 'color: var(--sp-text-muted)', 'font-size: 14px', 'font-variant-numeric: tabular-nums']),
  // Descriptions
  rule('.sp-descriptions', ['display: block', 'container-type: inline-size']),
  rule(".sp-descriptions[data-bordered='true']", ['padding: 14px 20px 18px']),
  rule('.sp-ui-descriptions-title', ['position: relative', 'margin: 0 0 10px', 'font-size: 18px', 'font-weight: 500']),
  rule('.sp-descriptions dl', ['position: relative', 'display: grid', 'grid-template-columns: repeat(var(--sp-ui-columns, 3), minmax(0, 1fr))', 'gap: 12px 24px', 'margin: 0']),
  ...[1, 2, 3, 4, 5, 6].map((n) => rule(`.sp-descriptions[data-columns='${n}']`, [`--sp-ui-columns: ${n}`])),
  rule('.sp-ui-description', ['display: flex', 'flex-direction: column', 'gap: 2px', 'min-inline-size: 0']),
  rule('.sp-ui-description dt', caps),
  rule('.sp-ui-description dd', ['margin: 0', 'font-size: 15px', 'overflow-wrap: anywhere']),
  media('@container (max-width: 520px)', [rule('.sp-descriptions dl', ['grid-template-columns: minmax(0, 1fr)'])]),
  // TimelineList: connectors are exact rules, dashed toward a pending item (C-4).
  rule('.sp-timeline-list', ['display: block', 'margin: 0', 'padding: 0', 'list-style: none', 'font-size: 15px']),
  rule('.sp-ui-timeline-item', ['position: relative', 'display: grid', 'grid-template-columns: 22px 1fr', 'gap: 0 12px', 'padding-block-end: 18px']),
  rule('.sp-ui-timeline-item:last-child', ['padding-block-end: 0']),
  rule('.sp-ui-timeline-item:not(:last-child)::before', [
    "content: ''",
    'position: absolute',
    'inset-block: 24px 2px',
    'inset-inline-start: 10px',
    'border-inline-start: 1px solid var(--sp-ink)',
  ]),
  rule(".sp-ui-timeline-item[data-status='pending']:not(:last-child)::before", ['border-inline-start-style: dashed', 'border-inline-start-color: var(--sp-rule)']),
  rule('.sp-ui-timeline-mark', ['position: relative', 'display: inline-flex', 'align-items: center', 'justify-content: center', 'inline-size: 22px', 'block-size: 22px']),
  rule(".sp-ui-timeline-mark [part='sp-mark']", ['inline-size: 12px', 'block-size: 12px']),
  rule(".sp-ui-timeline-mark [part~='sp-heighten']", ['inline-size: 10px', 'block-size: 10px', 'border-radius: 50%']),
  rule('.sp-ui-timeline-text', ['display: flex', 'flex-direction: column', 'gap: 2px', 'min-inline-size: 0']),
  rule('.sp-ui-timeline-time', ['color: var(--sp-text-muted)', 'font-size: 13px', 'font-variant-numeric: tabular-nums']),
  rule('.sp-ui-timeline-title', ['font-weight: 500']),
  rule(".sp-ui-timeline-item[data-status='pending'] .sp-ui-timeline-title", ['color: var(--sp-text-muted)', 'font-style: italic', 'font-weight: 400']),
  rule('.sp-ui-timeline-description', ['color: var(--sp-text-muted)']),
  // Collapse: native details; the chevron is exact and the browser's marker is gone.
  rule('.sp-collapse', ['display: block', 'padding: 4px 0']),
  rule('.sp-collapse-item', ['display: block']),
  rule('.sp-collapse-item + .sp-collapse-item', ['border-block-start: 1px solid var(--sp-rule)']),
  rule('.sp-ui-collapse-summary', [
    'position: relative',
    'display: flex',
    'align-items: center',
    'justify-content: space-between',
    'gap: 12px',
    'min-block-size: var(--sp-ui-height)',
    'padding: 6px 18px',
    'list-style: none',
    'font-size: 15px',
    'cursor: pointer',
  ]),
  rule('.sp-ui-collapse-summary::-webkit-details-marker', ['display: none']),
  rule("[open] > .sp-ui-collapse-summary [data-glyph='chevronDown']", ['rotate: 180deg']),
  rule(".sp-collapse-item[data-disabled='true'] > .sp-ui-collapse-summary", ['color: var(--sp-text-muted)', 'font-style: italic', 'cursor: not-allowed']),
  rule('.sp-ui-collapse-body', ['position: relative', 'padding: 0 18px 14px', 'font-size: 15px']),
  // Empty and Result
  rule('.sp-empty,\n.sp-result', ['display: flex', 'flex-direction: column', 'align-items: center', 'gap: 8px', 'padding: 18px 12px', 'text-align: center']),
  rule('.sp-ui-empty-tray', ['position: relative', 'display: block', 'inline-size: 64px', 'block-size: 40px', 'margin-block-end: 4px']),
  rule('.sp-ui-empty-description', ['margin: 0', 'color: var(--sp-text-muted)', 'font-style: italic']),
  rule('.sp-ui-result-mark', ['position: relative', 'display: inline-flex', 'align-items: center', 'justify-content: center', 'inline-size: 64px', 'block-size: 64px']),
  rule(".sp-ui-result-mark [part='sp-mark']", ['inline-size: 30px', 'block-size: 30px', 'stroke-width: 1.2']),
  rule('.sp-ui-result-title', ['margin: 6px 0 0', 'font-size: 22px', 'font-weight: 500']),
  rule('.sp-ui-result-subtitle', ['margin: 0', 'color: var(--sp-text-muted)']),
  rule('.sp-ui-result-extra,\n.sp-ui-empty-extra', ['display: flex', 'flex-wrap: wrap', 'justify-content: center', 'gap: 8px', 'margin-block-start: 8px']),
  // Textarea and InputNumber, on the SpInput contract.
  rule('.sp-textarea', ['display: inline-flex']),
  rule('.sp-textarea .sp-ui-box', ['align-items: flex-start', 'padding: 8px 10px 8px 12px']),
  rule('.sp-textarea .sp-ui-control', ['min-block-size: 4.5em', 'line-height: 1.5', 'resize: vertical']),
  rule('.sp-ui-count', ['align-self: flex-end', 'color: var(--sp-text-muted)', 'font-size: 12px', 'font-variant-numeric: tabular-nums']),
  rule('.sp-input-number', ['display: inline-flex']),
  rule('.sp-input-number .sp-ui-box', ['min-block-size: var(--sp-ui-height)', 'padding: 0 4px']),
  rule('.sp-input-number .sp-ui-control', ['min-inline-size: 4ch', 'text-align: center', 'font-variant-numeric: tabular-nums', '-moz-appearance: textfield', 'appearance: textfield']),
  rule('.sp-input-number .sp-ui-control::-webkit-inner-spin-button,\n.sp-input-number .sp-ui-control::-webkit-outer-spin-button', ['-webkit-appearance: none', 'margin: 0']),
  rule('.sp-ui-stepper', [...plainButton, 'flex: none', 'min-inline-size: 24px', 'min-block-size: 24px', 'color: var(--sp-text)']),
  rule('.sp-ui-stepper:disabled', ['color: var(--sp-text-muted)', 'cursor: not-allowed']),
];

/** An overlay's paper: the substrate, the text, no chrome of the browser's (Popover API, `<dialog>`). */
const paper = ['margin: 0', 'padding: 0', 'border: 0', 'background: var(--sp-substrate)', 'color: var(--sp-text)', 'overflow: visible'];

/** feature-004, the overlays (DD-038): native `<dialog>` and the Popover API, placed by `uiAnchor`. */
const OVERLAYS = [
  rule('.sp-modal,\n.sp-drawer', [...paper, 'max-inline-size: calc(100vw - 32px)', 'max-block-size: calc(100vh - 32px)']),
  rule('.sp-modal', [
    'inline-size: var(--sp-ui-overlay-width, 520px)',
    'margin: auto',
    'padding: 18px 22px 20px',
  ]),
  rule('.sp-modal[open],\n.sp-drawer[open]', ['display: flex', 'flex-direction: column', 'gap: 10px']),
  rule('.sp-drawer', ['position: fixed', 'padding: 18px 22px 20px', 'max-inline-size: 100vw', 'max-block-size: 100vh']),
  rule(".sp-drawer:is([data-side='start'], [data-side='end'])", ['inset-block: 0', 'block-size: 100%', 'inline-size: min(var(--sp-ui-drawer-extent, 380px), 100vw)']),
  rule(".sp-drawer[data-side='end']", ['inset-inline: auto 0']),
  rule(".sp-drawer[data-side='start']", ['inset-inline: 0 auto']),
  rule(".sp-drawer:is([data-side='top'], [data-side='bottom'])", ['inset-inline: 0', 'inline-size: 100%', 'block-size: min(var(--sp-ui-drawer-extent, 320px), 100vh)']),
  rule(".sp-drawer[data-side='top']", ['inset-block: 0 auto']),
  rule(".sp-drawer[data-side='bottom']", ['inset-block: auto 0']),
  // The backdrop: the ground's tone tile over the page, never opacity (REQ-499); its level is set per ground.
  rule(':is(.sp-modal, .sp-drawer)::backdrop', [
    'background: var(--sp-ink-secondary)',
    ...mask('image', 'var(--sp-ui-tone)'),
    ...mask('size', 'var(--sp-ui-tone-size)'),
    ...mask('repeat', 'repeat'),
  ]),
  rule(":is(.sp-modal, .sp-drawer)[data-mode='precision']::backdrop", ['background: var(--sp-substrate)', ...mask('image', 'none')]),
  rule('.sp-ui-overlay-header', ['position: relative', 'display: flex', 'align-items: baseline', 'justify-content: space-between', 'gap: 12px']),
  rule('.sp-ui-overlay-title', ['margin: 0', 'font-size: 20px', 'font-weight: 500']),
  rule(".sp-popover .sp-ui-overlay-title", ['font-size: 16px']),
  rule(":is(.sp-modal, .sp-drawer) > [part='sp-rule']", ['position: relative', 'display: block', 'border-block-start: 1px solid var(--sp-rule)']),
  rule('.sp-ui-overlay-description', ['position: relative', 'margin: 0', 'color: var(--sp-text-muted)', 'font-size: 15px']),
  rule('.sp-ui-overlay-body', ['position: relative', 'font-size: 15px']),
  rule('.sp-ui-overlay-footer', ['position: relative', 'display: flex', 'flex-wrap: wrap', 'justify-content: flex-end', 'gap: 8px', 'margin-block-start: 6px']),
  // Anchored overlays: uiAnchor writes --sp-ui-x and --sp-ui-y after open (REQ-493, REQ-502).
  rule(':is(.sp-popover, .sp-tooltip, .sp-ui-select-content, .sp-ui-menu)', [
    ...paper,
    'position: fixed',
    'inset: 0 auto auto 0',
    'translate: var(--sp-ui-x, 0) var(--sp-ui-y, 0)',
  ]),
  rule('.sp-popover', [
    'inline-size: max-content',
    'max-inline-size: min(var(--sp-ui-overlay-width, 320px), calc(100vw - 24px))',
    'padding: 12px 16px 14px',
    'font-size: 15px',
  ]),
  rule('.sp-popover:popover-open', ['display: flex', 'flex-direction: column', 'gap: 6px']),
  rule('.sp-tooltip', ['max-inline-size: 260px', 'padding: 4px 10px 5px', 'font-size: 13px', 'line-height: 1.35']),
  rule('.sp-ui-tooltip-text', ['position: relative']),
  rule('.sp-ui-trigger', ['display: inline-flex']),
  // Select and DropdownMenu: triggers on the control frame, a list of options or items.
  rule('.sp-select,\n.sp-dropdown-menu', ['display: inline-flex', 'font-size: 15px']),
  rule('.sp-ui-select-trigger,\n.sp-ui-menu-trigger', [...plainButton, 'min-block-size: var(--sp-ui-height)', 'padding: 0 10px 0 12px', 'color: var(--sp-text)']),
  rule('.sp-ui-select-trigger', ['justify-content: space-between', 'min-inline-size: var(--sp-ui-select-width, 180px)']),
  rule(".sp-ui-select-value[data-placeholder='true']", ['color: var(--sp-text-muted)', 'font-style: italic']),
  rule(':is(.sp-ui-select-trigger, .sp-ui-menu-trigger):disabled', ['font-style: italic', 'cursor: not-allowed']),
  rule('.sp-ui-select-content,\n.sp-ui-menu', ['min-inline-size: 160px', 'max-block-size: 320px', 'padding: 6px 0', 'font-size: 15px', 'overflow: auto']),
  rule('.sp-ui-option,\n.sp-ui-menuitem', [
    'position: relative',
    'display: flex',
    'align-items: center',
    'gap: 10px',
    'min-block-size: 24px',
    'padding: 5px 14px',
    'cursor: pointer',
  ]),
  // The active option or item: the one heightening of the list (REQ-498, I-28).
  rule(":is(.sp-ui-option, .sp-ui-menuitem) [part~='sp-heighten']", ['position: absolute', 'inset: 1px 4px']),
  rule(":is(.sp-ui-option, .sp-ui-menuitem)[aria-disabled='true']", ['color: var(--sp-text-muted)', 'font-style: italic', 'cursor: not-allowed']),
  rule(".sp-ui-option [data-glyph='tick']", ['margin-inline-start: auto']),
  rule(".sp-ui-menuitem[data-danger='true']", ['font-style: italic']),
  rule('.sp-ui-menu-label', ['padding: 6px 14px 2px', ...caps]),
  rule('.sp-ui-menu-separator', ['position: relative', 'block-size: 0', 'margin: 5px 10px', 'border-block-start: 1px solid var(--sp-rule)']),
  rule('.sp-ui-menu-shortcut', ['position: relative', 'margin-inline-start: auto', 'padding-inline-start: 16px', 'color: var(--sp-text-muted)', 'font-size: 13px']),
  // Toaster and Toast: a corner region, a list of framed notes.
  rule('.sp-toaster', ['position: fixed', 'z-index: 2147483000', 'inline-size: min(380px, calc(100vw - 32px))', 'pointer-events: none']),
  rule(".sp-toaster[data-position^='bottom']", ['inset-block-end: 16px']),
  rule(".sp-toaster[data-position^='top']", ['inset-block-start: 16px']),
  rule(".sp-toaster[data-position$='end']", ['inset-inline-end: 16px']),
  rule(".sp-toaster[data-position$='start']", ['inset-inline-start: 16px']),
  rule('.sp-ui-toaster-list', ['display: flex', 'flex-direction: column', 'gap: 8px', 'margin: 0', 'padding: 0', 'list-style: none']),
  rule('.sp-toast', [
    'display: grid',
    'grid-template-columns: 1fr auto',
    'align-items: start',
    'gap: 4px 8px',
    'padding: 12px 10px 14px 14px',
    'background: var(--sp-substrate)',
    'font-size: 15px',
    'pointer-events: auto',
  ]),
  rule(".sp-toast[data-state='closed']", ['display: none']),
  rule('.sp-ui-toast-body', ['position: relative', 'display: flex', 'align-items: flex-start', 'gap: 12px']),
  rule(".sp-ui-toast-body > [part='sp-mark']", ['inline-size: 18px', 'block-size: 18px', 'margin-block-start: 2px']),
  rule('.sp-ui-toast-text', ['display: flex', 'flex-direction: column', 'gap: 2px']),
  rule('.sp-ui-toast-title', ['font-weight: 500']),
  rule('.sp-ui-toast-description', ['color: var(--sp-text-muted)', 'font-size: 14px']),
  rule('.sp-ui-toast-action', ['position: relative', 'grid-column: 1', 'margin-inline-start: 30px']),
  rule('.sp-toast > .sp-ui-icon-button', ['grid-column: 2', 'grid-row: 1']),
];

const MOTION = media('@media (prefers-reduced-motion: no-preference)', [
  rule(".sp-ui [part='sp-knob'],\n.sp-ui [part='sp-thumb'],\n.sp-ui [part='sp-fill']", [
    'transition: inset-inline-start 120ms ease-out, inline-size 120ms ease-out',
  ]),
  // An indeterminate progress moves only when motion is welcome; otherwise it is a static tone (REQ-320).
  rule(".sp-progress[data-indeterminate='true'][data-shape='line'] [part='sp-fill']", ['inline-size: 30%', 'animation: sp-ui-sweep 1.6s ease-in-out infinite alternate']),
  rule(".sp-progress[data-indeterminate='true'][data-shape='circle'] .sp-ui-ring", ['animation: sp-ui-spin 1.2s linear infinite']),
  rule(".sp-ui-collapse-summary [data-glyph='chevronDown']", ['transition: rotate 120ms ease-out']),
  media('@keyframes sp-ui-sweep', [rule('from', ['inset-inline-start: 0']), rule('to', ['inset-inline-start: 70%'])]),
  media('@keyframes sp-ui-spin', [rule('to', ['rotate: 1turn'])]),
]);

// REQ-123 already forces `precision`; these keep frame, tone and heightening visible in system colours.
const FORCED = media('@media (forced-colors: active)', [
  rule(".sp-ui [part='sp-frame']", [...mask('image', 'none !important'), 'background: none !important', 'border-color: CanvasText !important']),
  rule(".sp-ui [part='sp-tone']", ['forced-color-adjust: none', 'background: CanvasText']),
  rule(".sp-ui [part~='sp-heighten']", ['forced-color-adjust: none', 'background: Canvas', 'outline-color: CanvasText']),
  rule(':is(.sp-modal, .sp-drawer)::backdrop', [...mask('image', 'none !important'), 'background: Canvas !important']),
]);

const HEADER = `/*
 * @silverpoint/grounds — ui.css (generated; edit packages/grounds/src/ui/ui-css.ts)
 *
 * The interface components' stylesheet. Opt-in, beside styles.css:
 *   import '@silverpoint/grounds/styles.css';
 *   import '@silverpoint/grounds/ui.css';
 *
 * Frames and tones are hand-drawn once, at build time, by each ground's own inker, and laid as
 * CSS masks painted with --sp- properties (DD-022): no script, no measurement, no colour baked in.
 */`;

/** The whole stylesheet for the given grounds. Deterministic: the same bytes on every build (Art. 4). */
export function buildUiCss(grounds: readonly Ground[]): string {
  return [
    HEADER,
    ...grounds.map(tokens),
    ...BASE,
    ...B1,
    ...B2,
    ...B3,
    ...COMPOSED,
    ...OVERLAYS,
    ...KINDS.map(kindLayout),
    ...grounds.flatMap(inkedFrames),
    ...grounds.flatMap(tones),
    ...grounds.flatMap(unhatched),
    MOTION,
    FORCED,
  ].join('\n\n') + '\n';
}
