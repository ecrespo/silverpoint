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
    for (const kind of KINDS) {
      const { pieces } = uiFramePieces(ground, kind, v)!;
      const urls = WHOLE.has(kind) ? [pieces.all!] : SLICED.map((name) => pieces[name]!);
      variants.push(
        rule(`.sp-ui.sp-ground-${ground.name}[data-frame='${v}'] [part='sp-frame'][data-kind='${kind}']`, [
          `--sp-ui-mask: ${urls.map(svgDataUri).join(', ')}`,
        ]),
      );
    }
  }
  return [paint, ...variants];
}

function tones(ground: Ground): string[] {
  return ([1, 2, 3, 4] as const).map((level) => {
    const selector = `.sp-ground-${ground.name} [part='sp-tone'][data-tone='${level}']`;
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
  rule('.sp-ui:focus-visible,\n.sp-ui :focus-visible:not(.sp-ui-native),\n:is(.sp-ui, .sp-ui-item):has(> .sp-ui-native:focus-visible)', [
    'outline: var(--sp-ui-focus-width) solid var(--sp-ui-focus-color)',
    'outline-offset: 2px',
  ]),
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
    ...KINDS.map(kindLayout),
    ...grounds.flatMap(inkedFrames),
    ...grounds.flatMap(tones),
    MOTION,
    FORCED,
  ].join('\n\n') + '\n';
}
