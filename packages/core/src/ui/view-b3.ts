import { uiRequireName } from './names';
import { uiProgressArc, UI_PROGRESS_VIEWBOX } from './progress';
import { uiSteps } from './steps';
import type { AlertKind, SpAlertProps, SpBadgeProps, SpProgressProps, SpSkeletonProps, SpStepsProps, SpTagProps } from './types';
import { uiValue } from './value';
import { el, frame, glyph, root, slot, sr, text, tone, type UiGlyph } from './view-kit';
import type { UiElement, UiResolved } from './view';

/*
 * Batch B3 (API delta §4): display and feedback. Their roles are REQ-318's; nothing here takes
 * focus but the close buttons of Tag and Alert.
 */

const closeButton = (label: string) =>
  el('button', { type: 'button', class: 'sp-ui-close', 'aria-label': label }, [glyph('cross')], 'close');

/** `SpSteps`: an ordered list; the current step has `aria-current="step"` and the heightening (REQ-318, REQ-309). */
export function uiStepsView(props: SpStepsProps, r: UiResolved): UiElement {
  const steps = uiSteps(props.items, props.current);
  const titles = new Map(props.items.map((item) => [item.key, item] as const));
  return el(
    'ol',
    root('steps', props, r, { id: props.id, 'aria-label': props.label, 'data-orientation': props.orientation === 'vertical' ? 'vertical' : 'horizontal' }),
    steps.map((step, i) => {
      const item = titles.get(step.key)!;
      const mark = step.status === 'finish' ? glyph('tick') : step.status === 'error' ? glyph('cross') : text(String(i + 1));
      return el('li', { class: 'sp-ui-step', 'data-status': step.status, 'aria-current': step.current ? 'step' : undefined }, [
        el('span', { class: 'sp-ui-step-mark', part: step.current ? 'sp-heighten' : undefined, 'aria-hidden': 'true' }, [mark]),
        el('span', { class: 'sp-ui-step-text' }, [
          el('span', { class: 'sp-ui-step-title' }, [text(item.title)]),
          ...(item.description ? [el('span', { class: 'sp-ui-step-description' }, [text(item.description)])] : []),
        ]),
        // Exact, dashed while it leads to a step still waiting (C-4, DD-026).
        ...(step.connector ? [el('span', { part: 'sp-connector', 'data-status': step.connector, 'aria-hidden': 'true' })] : []),
      ]);
    }),
  );
}

/** `SpTag`: framed and toned at its level (default 1); closable, a native close button (REQ-308). */
export function uiTagView(props: SpTagProps, r: UiResolved, content: { readonly text?: string }): UiElement {
  const level = String(props.tone ?? 1);
  const label = props.closeLabel ?? (content.text ? `Remove ${content.text}` : 'Remove');
  return el('span', root('tag', props, r, { id: props.id, 'data-tone': level }), [
    frame('control'),
    tone(level, 'control'),
    el('span', { class: 'sp-ui-label sp-ui-plate' }, [slot('content')]),
    ...(props.closable ? [closeButton(label)] : []),
  ]);
}

/** `SpBadge`: its count is text beside the content, so it is in the accessible name (REQ-318). */
export function uiBadgeView(props: SpBadgeProps, r: UiResolved, content: { readonly text?: string }): UiElement {
  const max = props.max ?? 99;
  const count = props.count !== undefined && Number.isFinite(props.count) ? Math.max(Math.round(props.count), 0) : undefined;
  const shown = count === undefined ? undefined : count > max ? `${max}+` : String(count);
  const dot = props.dot === true;
  uiRequireName('SpBadge', content.text ?? (dot ? undefined : shown), props.label);
  return el('span', root('badge', props, r, { id: props.id }), [
    el('span', { class: 'sp-ui-label' }, [slot('content')]),
    ...(dot
      ? [el('span', { class: 'sp-ui-badge-dot', 'aria-hidden': 'true' })]
      : shown !== undefined
        ? [el('span', { class: 'sp-ui-badge-count' }, [frame('pill'), el('span', { class: 'sp-ui-badge-text' }, [text(shown)])])]
        : []),
    ...(props.label ? [sr(props.label)] : []),
  ]);
}

/** The circle Progress's ring width, in view-box units. */
const RING = 8;

/** `SpProgress`: a `progressbar`; without a value, indeterminate: no `aria-valuenow`, a static tone (REQ-318, REQ-320). */
export function uiProgressView(props: SpProgressProps, r: UiResolved): UiElement {
  const determinate = props.value !== undefined;
  const { value, fraction } = determinate ? uiValue(props.value!, { min: 0, max: 100 }, 'SpProgress') : { value: 0, fraction: 0 };
  const circle = props.shape === 'circle';
  const drawing = circle
    ? (() => {
        const arc = uiProgressArc(determinate ? fraction : 0.25, RING);
        return el('svg', { class: 'sp-ui-ring', viewBox: `0 0 ${UI_PROGRESS_VIEWBOX} ${UI_PROGRESS_VIEWBOX}`, 'aria-hidden': 'true' }, [
          el('path', { class: 'sp-ui-ring-track', d: arc.track.d }),
          el('path', { class: 'sp-ui-ring-fill', d: arc.fill.d }),
        ]);
      })()
    : el('span', { class: 'sp-ui-rail' }, [
        el('span', { part: 'sp-track', 'aria-hidden': 'true' }),
        el('span', { part: 'sp-fill', 'aria-hidden': 'true' }, [tone(determinate ? 'selected' : '1', 'pill')]),
      ]);
  return el(
    'div',
    root('progress', props, r, {
      id: props.id,
      role: 'progressbar',
      'aria-label': props.label,
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': determinate ? String(value) : undefined,
      'data-shape': circle ? 'circle' : 'line',
      'data-indeterminate': determinate ? undefined : 'true',
      style: determinate ? `--sp-ui-fraction: ${fraction}` : undefined,
    }),
    [drawing, ...(determinate && props.showValue !== false ? [el('span', { class: 'sp-ui-value', 'aria-hidden': 'true' }, [text(`${value}%`)])] : [])],
  );
}

const ALERT_GLYPHS: Readonly<Record<AlertKind, UiGlyph>> = { info: 'info', success: 'tick', warning: 'warning', error: 'cross' };

/**
 * `SpAlert`: `alert` for error and warning, `status` otherwise (REQ-318). Error alone takes a tone,
 * the ground's `alertError`, with its text on a plate (C-3); every kind has its exact glyph.
 */
export function uiAlertView(props: SpAlertProps, r: UiResolved, state: { readonly closable: boolean }): UiElement {
  const kind = props.kind ?? 'info';
  const error = kind === 'error';
  return el('div', root('alert', props, r, { id: props.id, role: error || kind === 'warning' ? 'alert' : 'status', 'data-kind': kind }), [
    frame('card'),
    ...(error ? [tone('alertError', 'card')] : []),
    glyph(ALERT_GLYPHS[kind]),
    el('div', { class: error ? 'sp-ui-alert-body sp-ui-plate' : 'sp-ui-alert-body' }, [
      ...(props.title ? [el('div', { class: 'sp-ui-alert-title' }, [text(props.title)])] : []),
      el('div', { class: 'sp-ui-alert-text' }, [slot('content')]),
    ]),
    ...(state.closable ? [closeButton(props.closeLabel ?? 'Close')] : []),
  ]);
}

/** `SpSkeleton`: `aria-busy`, a label for assistive technology, and hidden toned shapes (REQ-318). */
export function uiSkeletonView(props: SpSkeletonProps, r: UiResolved): UiElement {
  const lines = props.lines !== undefined && Number.isFinite(props.lines) ? Math.min(Math.max(Math.round(props.lines), 1), 8) : 3;
  return el('div', root('skeleton', props, r, { id: props.id, 'aria-busy': 'true' }), [
    sr(props.label ?? 'Loading'),
    ...(props.avatar ? [el('span', { class: 'sp-ui-skeleton-avatar', 'aria-hidden': 'true' }, [tone('1', 'round')])] : []),
    el(
      'span',
      { class: 'sp-ui-skeleton-lines', 'aria-hidden': 'true' },
      Array.from({ length: lines }, () => el('span', { class: 'sp-ui-skeleton-line' }, [tone('1', 'control')])),
    ),
  ]);
}
