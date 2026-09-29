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
  const states = Object.entries(resolveUiTokens(ground).tone);
  return ([1, 2, 3, 4] as const).map((level) => {
    // A component names a tone by level (Tag) or by state (`primary`…); the ground's tokens map a state to its level (DD-026).
    const names = [String(level), ...states.filter(([, at]) => at === level).map(([state]) => state)];
    const selector = `.sp-ground-${ground.name} [part='sp-tone']:is(${names.map((n) => `[data-tone='${n}']`).join(', ')})`;
    if (ground.tonalMechanism === 'weight') {
      // No hatching: the tone is a heavier exact line (DD-019, DD-026).
      return rule(selector, [
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
  rule(".sp-ui [part='sp-heighten']", ['position: relative', 'background: var(--sp-heighten)', 'outline: 1px solid var(--sp-ink)']),
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
  // An exact outline, never inked, on the control or on the item whose hidden input has focus (REQ-316).
  rule('.sp-ui:focus-visible,\n.sp-ui :focus-visible:not(.sp-ui-native, .sp-ui-control),\n:is(.sp-ui, .sp-ui-item):has(> .sp-ui-native:focus-visible),\n.sp-ui-box:has(> .sp-ui-control:focus-visible)', [
    'outline: var(--sp-ui-focus-width) solid var(--sp-ui-focus-color)',
    'outline-offset: 2px',
  ]),
];

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

const MOTION = media('@media (prefers-reduced-motion: no-preference)', [
  rule(".sp-ui [part='sp-knob'],\n.sp-ui [part='sp-thumb'],\n.sp-ui [part='sp-fill']", [
    'transition: inset-inline-start 120ms ease-out, inline-size 120ms ease-out',
  ]),
]);

// REQ-123 already forces `precision`; these keep frame, tone and heightening visible in system colours.
const FORCED = media('@media (forced-colors: active)', [
  rule(".sp-ui [part='sp-frame']", [...mask('image', 'none !important'), 'background: none !important', 'border-color: CanvasText !important']),
  rule(".sp-ui [part='sp-tone']", ['forced-color-adjust: none', 'background: CanvasText']),
  rule(".sp-ui [part='sp-heighten']", ['forced-color-adjust: none', 'background: Canvas', 'outline-color: CanvasText']),
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
    ...KINDS.map(kindLayout),
    ...grounds.flatMap(inkedFrames),
    ...grounds.flatMap(tones),
    MOTION,
    FORCED,
  ].join('\n\n') + '\n';
}
