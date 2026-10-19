import { uiRequireName } from '../ui/names';
import type { UiElement, UiResolved } from '../ui/view';
import { cssLength, el, frame, root, slot } from '../ui/view-kit';
import { TIMELINE_FRAMES, TIMELINE_TONES } from './ink';
import type { SpTimelineProps } from './types';

/**
 * `SpTimeline`'s server markup (REQ-513, DD-042): the surface, the hidden probes `timelineInk`
 * reads, and an empty mount TimelineJS fills on the client. Nothing of `data` is drawn here but the
 * region's name; TimelineJS's DOM is third-party markup, outside the tree gate (Art. 3 as amended).
 */
export function timelineView(props: SpTimelineProps, r: UiResolved, state: { readonly failed?: boolean } = {}): UiElement {
  const card = props.card !== false;
  const label = props.label ?? props.data.title?.text?.headline;
  uiRequireName('SpTimeline', undefined, label);
  const height = cssLength(props.height, 'SpTimeline', 'height') ?? '600px';
  return el(
    'section',
    root('timeline', props, r, {
      id: props.id,
      'aria-label': label,
      'data-kl-card': String(card),
      // timelineInk sets it on the client, once a probe resolves a mask.
      'data-kl-inked': 'false',
      style: `height:${height}`,
    }),
    [
      ...(card ? [frame('card')] : []),
      el(
        'span',
        { class: 'sp-kl-probe', 'aria-hidden': 'true' },
        [
          ...TIMELINE_FRAMES.map((kind) => el('span', { part: 'sp-frame', 'data-kind': kind })),
          ...TIMELINE_TONES.map((level) => el('span', { part: 'sp-tone', 'data-tone': level })),
        ],
        'probe',
      ),
      // Once the load has failed, the consumer's fallback fills the mount (REQ-515); never on the server.
      el('div', { class: 'sp-kl-mount' }, state.failed ? [slot('fallback')] : [], 'mount'),
    ],
  );
}
