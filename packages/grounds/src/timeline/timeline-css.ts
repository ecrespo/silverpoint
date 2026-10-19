import { mask, media, rule } from '../ui/ui-css';

/**
 * `@silverpoint/grounds/timeline.css`: TimelineJS drawn in silverpoint (REQ-511, REQ-512, DD-042).
 *
 * Phase 1, the skin: TimelineJS's colours, type and rules replaced by the ground's `--sp-`
 * properties, so substrates, palettes, cyanotype and precision apply. Phase 2, the hand: when
 * `timelineInk` republishes the ground's frame masks and tone tiles as `--sp-kl-*` (and says so
 * with `data-kl-inked` / `data-kl-toned`), markers and menubar buttons are framed and eras hatched
 * with the very pieces the Sp components use. Without them every frame is an exact rule and every
 * era a rule of the ramp's weight. No opacity, gradient or colour mix (I-24); the only literal
 * colours are system colours under forced colours (I-19). Opt-in, like `ui.css`.
 */

const ROOT = '.sp-ui.sp-timeline';
const TL = `${ROOT} .tl-timeline`;
const MARKER = `${ROOT} .tl-timemarker`;
const BOX = `${MARKER} .tl-timemarker-content-container`;
const HEADLINE = '.tl-timemarker-content-container .tl-timemarker-content .tl-timemarker-text h2.tl-headline';
const ERA = `${ROOT} .tl-timeera`;
const ERA_HEADLINE = `${ERA} .tl-timeera-content-container .tl-timeera-content .tl-timeera-text h2.tl-headline`;
const BUTTON = `${ROOT} .tl-menubar-button`;
const INKED = `${ROOT}[data-kl-inked='true']`;
const TONED = `${ROOT}[data-kl-toned='true']`;
const DISPLAY = 'font-family: var(--sp-font-display)';

/** TimelineJS's six era colours folded onto the ramp's four levels: lightest for 0 and 4. */
const ERA_LEVELS: readonly (readonly [string, number])[] = [
  [':is(.tl-timeera-color0, .tl-timeera-color4)', 1],
  [':is(.tl-timeera-color1, .tl-timeera-color5)', 2],
  ['.tl-timeera-color2', 3],
  ['.tl-timeera-color3', 4],
];

/** A mask laid from one of the `--sp-kl-mask-*` triples `timelineInk` writes. */
const frameMask = (kind: string) => [
  ...mask('image', `var(--sp-kl-mask-${kind})`),
  ...mask('position', `var(--sp-kl-mask-position-${kind})`),
  ...mask('size', `var(--sp-kl-mask-size-${kind})`),
];
const toneMask = (level: number) => [...mask('image', `var(--sp-kl-tone-${level})`), ...mask('size', `var(--sp-kl-tone-size-${level})`)];

const base = [
  rule(ROOT, ['position: relative', 'display: block', 'inline-size: 100%', 'overflow: hidden']),
  rule(`${ROOT} .sp-kl-probe`, [
    'position: absolute',
    'inline-size: 0',
    'block-size: 0',
    'overflow: hidden',
    'visibility: hidden',
    'pointer-events: none',
  ]),
  rule(`${ROOT} .sp-kl-probe > span`, ['position: absolute', 'inline-size: 24px', 'block-size: 24px']),
  rule(`${ROOT} > [part='sp-frame']`, ['z-index: 3']),
  rule(`${ROOT} .sp-kl-mount`, ['position: relative', 'inline-size: 100%', 'block-size: 100%']),
  rule(`${ROOT}[data-kl-card='true']`, ['padding: 6px']),
];

const type = [
  rule(TL, ['background-color: var(--sp-substrate)', 'color: var(--sp-text)', DISPLAY]),
  rule(`${TL} :is(h1, h2, h3, h4, h5, h6)`, ['color: var(--sp-text)', DISPLAY, 'font-weight: 500', 'letter-spacing: 0.01em', 'text-transform: none']),
  rule(`${TL} h2.tl-headline-title`, ['font-size: 40px', 'line-height: 1.1']),
  rule(`${TL} :is(p, .tl-text, .tl-caption, .tl-credit, blockquote, blockquote p)`, ['color: var(--sp-text)', DISPLAY]),
  rule(`${TL} :is(.tl-caption, .tl-credit, blockquote cite)`, ['color: var(--sp-text-muted)', 'font-style: italic']),
  rule(`${TL} :is(.tl-headline-date, .tl-text-date, .tl-headline-date small)`, [
    'color: var(--sp-text-muted)',
    DISPLAY,
    'font-size: 13px',
    'letter-spacing: 0.08em',
    'text-transform: uppercase',
    'font-variant-numeric: tabular-nums',
  ]),
  rule(`${TL} :is(a, .vcard a)`, ['color: var(--sp-ink)', 'text-decoration-color: var(--sp-rule)']),
  rule(`${TL} :is(a:hover, a:focus, .tl-caption a, .tl-credit a, .tl-slidenav-next a, .tl-slidenav-previous a)`, ['color: var(--sp-text)']),
  rule(`${TL}:is(.tl-timeline-embed, .tl-timeline-full-embed)`, ['border-color: var(--sp-rule)']),
  rule(`${TL} .tl-note`, ['background: var(--sp-substrate)', 'color: var(--sp-text)', 'border-color: var(--sp-rule)', DISPLAY]),
  rule(`${TL} .tl-button-calltoaction .tl-button-calltoaction-text`, ['background: var(--sp-heighten)', 'color: var(--sp-text)', 'outline: 1px solid var(--sp-ink)']),
];

const slider = [
  rule(`${ROOT} :is(.tl-storyslider, .tl-slider-background, .tl-slider-container-mask)`, ['background-color: var(--sp-substrate)']),
  rule(`${ROOT} .tl-slide`, ['background-color: transparent']),
  rule(`${ROOT} :is(.tl-slidenav-previous, .tl-slidenav-next) .tl-slidenav-content-container :is(.tl-slidenav-icon, .tl-slidenav-title, .tl-slidenav-description)`, [
    'color: var(--sp-text)',
    'text-shadow: none',
    DISPLAY,
  ]),
  rule(`${ROOT} .tl-slidenav-content-container .tl-slidenav-description`, ['color: var(--sp-text-muted)']),
  rule(`${ROOT} :is(.tl-media-content-container-text, .tl-skinny .tl-slide-content .tl-media)`, ['border-color: var(--sp-rule)']),
  rule(`${ROOT} .tl-media-shadow`, ['box-shadow: none', 'outline: 1px solid var(--sp-rule)']),
  rule(`${ROOT} .tl-layout-portrait .tl-storyslider`, ['box-shadow: none', 'border-block-end: 1px solid var(--sp-rule)']),
];

const navigator = [
  rule(`${ROOT} .tl-timenav`, ['background-color: var(--sp-substrate)', 'border-block-start: 1px solid var(--sp-rule)']),
  rule(`${ROOT} .tl-timenav .tl-timenav-line`, ['background-color: var(--sp-ink)', 'inline-size: 1px']),
  rule(`${ROOT} .tl-timenav .tl-timenav-line::before, ${ROOT} .tl-timenav .tl-timenav-line::after`, ['color: var(--sp-ink)']),
  rule(`${ROOT} .tl-timegroup`, ['background-color: transparent', 'border-block-start: 1px dashed var(--sp-grid)']),
  rule(`${ROOT} .tl-timegroup .tl-timegroup-message`, ['color: var(--sp-text-muted)', 'text-shadow: none', DISPLAY, 'font-style: italic']),
  rule(`${ROOT} .tl-timeaxis-background`, ['background-color: var(--sp-substrate)', 'border-block-start: 1px solid var(--sp-rule)']),
  rule(`${ROOT} .tl-timeaxis :is(.tl-timeaxis-major, .tl-timeaxis-minor)`, ['background-color: transparent']),
  rule(`${ROOT} .tl-timeaxis .tl-timeaxis-major .tl-timeaxis-tick`, ['color: var(--sp-text)', DISPLAY, 'font-variant-numeric: tabular-nums']),
  rule(`${ROOT} .tl-timeaxis .tl-timeaxis-minor .tl-timeaxis-tick, ${ROOT} .tl-timeaxis .tl-timeaxis-minor .tl-timeaxis-tick-text span`, [
    'color: var(--sp-text-muted)',
    DISPLAY,
  ]),
  rule(`${ROOT} .tl-timeaxis :is(.tl-timeaxis-major, .tl-timeaxis-minor) .tl-timeaxis-tick::before`, ['border-color: var(--sp-rule)']),
];

/* Markers: exact geometry, a drawn frame; the current one heightened and outlined in ink (Art. 6). */
const markers = [
  rule(BOX, ['background-color: var(--sp-substrate)', 'border: 1px solid var(--sp-ink)', 'border-radius: var(--sp-ui-radius, 2px)', 'box-shadow: none']),
  rule(`${MARKER} ${HEADLINE}, ${MARKER} ${HEADLINE} p`, ['color: var(--sp-text)', DISPLAY, 'font-size: 12px', 'text-transform: none']),
  // TimelineJS fades a long headline out with a gradient; here it is simply cut (I-24).
  rule(`${MARKER} ${HEADLINE}.tl-headline-fadeout::after, ${ERA_HEADLINE}.tl-headline-fadeout::after`, ['background: none']),
  rule(`${BOX} .tl-timemarker-media-container [class^='tl-icon-']`, ['color: var(--sp-ink)']),
  rule(`${MARKER} :is(.tl-timemarker-line-left, .tl-timemarker-line-right)`, ['border-color: var(--sp-rule)', 'box-shadow: none']),
  rule(`${MARKER} :is(.tl-timemarker-line-left, .tl-timemarker-line-right)::after`, ['background-color: var(--sp-ink)']),
  rule(`${MARKER} .tl-timemarker-timespan, ${MARKER}.tl-timemarker-with-end .tl-timemarker-timespan::after`, ['background-color: transparent']),
  rule(`${MARKER} .tl-timemarker-timespan .tl-timemarker-timespan-content`, ['background-color: var(--sp-ink-secondary)']),
  rule(`${MARKER}:is(:hover, :focus) .tl-timemarker-content-container`, ['background-color: var(--sp-substrate)', 'border-color: var(--sp-ink)']),
  rule(`${MARKER}:is(:hover, :focus, .tl-timemarker-active) ${HEADLINE}`, ['color: var(--sp-text)']),
  rule(`${MARKER}.tl-timemarker-active .tl-timemarker-content-container`, [
    'background-color: var(--sp-heighten)',
    'color: var(--sp-text)',
    'border-color: var(--sp-ink)',
    'outline: 1px solid var(--sp-ink)',
    'box-shadow: none',
  ]),
  rule(`${MARKER}.tl-timemarker-active :is(.tl-timemarker-line-left, .tl-timemarker-line-right)`, ['border-color: var(--sp-ink)', 'box-shadow: none']),
  rule(`${MARKER}.tl-timemarker-active :is(.tl-timemarker-line-left, .tl-timemarker-line-right)::after`, ['background-color: var(--sp-ink) !important']),
  rule(`${MARKER}.tl-timemarker-active .tl-timemarker-timespan .tl-timemarker-timespan-content`, ['background-color: var(--sp-ink)']),
];

/*
 * Eras: tone by hatching or line weight, never a flat fill (Art. 6, DD-019). Untoned — a weight
 * ground, or before the probes are read — an era is a rule along its top whose width is the ramp's
 * weight for its level; a ground with no ramp draws it at the stroke width.
 */
const eras = [
  rule(`${ERA} .tl-timeera-background`, [
    'background: none',
    'border-block-start: 0 solid var(--sp-ink-secondary)',
    'border-block-start-width: calc(var(--sp-stroke-width) * var(--sp-kl-era-weight, 1) * 1px)',
  ]),
  ...ERA_LEVELS.map(([colour, level]) => rule(`${ERA}${colour}`, [`--sp-kl-era-weight: var(--sp-weight-${level})`])),
  rule(`${ERA} .tl-timeera-content-container`, ['border-color: var(--sp-rule)']),
  rule(ERA_HEADLINE, ['color: var(--sp-text)', DISPLAY, 'text-transform: none', 'background: none']),
];

const menubar = [
  rule(`${ROOT} .tl-menubar`, ['color: var(--sp-text)']),
  rule(BUTTON, [
    'position: relative',
    'background-color: var(--sp-substrate)',
    'color: var(--sp-text)',
    'border: 1px solid var(--sp-ink)',
    'border-radius: var(--sp-ui-radius, 2px)',
    'margin: 2px',
  ]),
  rule(`${BUTTON}:is(:hover, :focus-visible)`, ['background: var(--sp-heighten)', 'color: var(--sp-text)', 'outline: 1px solid var(--sp-ink)']),
  rule(`${BUTTON}:disabled`, ['background-color: var(--sp-substrate)', 'color: var(--sp-text-muted)', 'outline: none']),
];

const chrome = [
  rule(`${TL} .tl-attribution`, ['background-color: transparent', `${DISPLAY} !important`]),
  rule(`${TL} .tl-attribution a`, ['color: var(--sp-text-muted)']),
  rule(`${TL} .tl-attribution .tl-knightlab-logo`, ['background-color: var(--sp-text-muted)']),
  rule(`${ROOT} :is(.tl-message, .tl-message-full) .tl-message-container .tl-message-content`, ['color: var(--sp-text)', 'text-shadow: none', DISPLAY]),
  rule(`${ROOT} .tl-message .tl-message-container .tl-loading-icon`, ['background-color: var(--sp-ink)', 'box-shadow: none']),
];

/* Phase 2: the ground's own pieces, laid only once `timelineInk` has published them. */
const hand = [
  rule(`${INKED} :is(.tl-timemarker-content-container, .tl-menubar-button)`, ['border-color: transparent']),
  rule(`${INKED} .tl-timemarker.tl-timemarker-active .tl-timemarker-content-container`, ['outline: 0']),
  rule(`${INKED} :is(.tl-timemarker-content-container, .tl-menubar-button)::before`, [
    "content: ''",
    'position: absolute',
    'inset: 0',
    'z-index: 2',
    'pointer-events: none',
    'background: var(--sp-ink)',
    ...mask('repeat', 'no-repeat'),
  ]),
  rule(`${INKED} .tl-timemarker-content-container::before`, frameMask('control')),
  rule(`${INKED} .tl-menubar-button::before`, frameMask('box')),
  rule(`${INKED} .tl-timemarker-content-container .tl-timemarker-content`, ['position: relative', 'z-index: 1']),
  // Tone is value (C-7): the tiles are read in every mode, so they are not keyed to `ink`.
  rule(`${TONED} .tl-timeera .tl-timeera-background`, ['border-block-start: 0', 'background: var(--sp-ink-secondary)', ...mask('repeat', 'repeat')]),
  ...ERA_LEVELS.map(([colour, level]) => rule(`${TONED} .tl-timeera${colour} .tl-timeera-background`, toneMask(level))),
  rule(`${TONED} .tl-timemarker:not(.tl-timemarker-active):is(:hover, :focus) .tl-timemarker-content-container::after`, [
    "content: ''",
    'position: absolute',
    'inset: 0',
    'pointer-events: none',
    'background: var(--sp-ink-secondary)',
    ...toneMask(1),
  ]),
];

const forced = media('@media (forced-colors: active)', [
  rule(`${ROOT} :is(.tl-timemarker-content-container, .tl-menubar-button)`, ['border-color: CanvasText !important']),
  rule(`${ROOT} :is(.tl-timemarker-content-container, .tl-menubar-button)::before, ${ROOT} .tl-timemarker-content-container::after`, [
    'display: none',
  ]),
  rule(`${ROOT} .tl-timeera .tl-timeera-background`, [...mask('image', 'none'), 'border-block-start: 1px solid CanvasText']),
]);

/** The stylesheet, the same bytes on every build. */
export function buildTimelineCss(): string {
  return [...base, ...type, ...slider, ...navigator, ...markers, ...eras, ...menubar, ...chrome, ...hand, forced].join('\n\n') + '\n';
}
