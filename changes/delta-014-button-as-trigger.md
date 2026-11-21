# delta-014 — `SpButton` as an overlay's trigger

| Field | Value |
|---|---|
| **Status** | `APPROVED` 2026-11-21 (user decision) and **implemented** on `feat/silverpoint-0.11`; folded into `specs/` with feature-007, released in `0.11.0` |
| **Found by** | aligning `reflex-silverpoint-react` to 0.7.0 (feature-005 research §3) |
| **Amends** | PRD REQ-500 (test added, no text change); API Spec §8.1 (React: `SpButton` forwards the trigger contract) |
| **SemVer** | `patch` for `@silverpoint/react` and `@silverpoint/vue` — no change to the normalised SVG or to any fixture; it rides in `0.11.0` (the `fixed` group's minor), since `0.7.1` was never cut |

## Problem

An overlay clones its `trigger` element (`useTrigger`, `packages/react/src/ui/overlay.ts`) with
`aria-haspopup`, `aria-expanded`, `aria-controls`, `onPointerDown` and `onClick`. `SpButton`
destructures `onClick` and hands every other prop to `uiButtonView`, which reads only its own
props, so the ARIA and `onPointerDown` are dropped. The API Spec's own example,
`<SpModal trigger={<SpButton>Edit</SpButton>}>`, therefore opens the modal but announces nothing to
assistive technology (REQ-500), and a press on the trigger of an open popover reopens it instead of
closing it. The example apps and the e2e suite use a native `<button>` as trigger, so no gate saw it.

Vue (a `trigger` slot's first element, attribute fallthrough) and Angular (the `spTrigger`
directive on the consumer's element) are to be verified by the same test; the defect is known only
in React.

## Change

- **REQ-500, test added:** for each overlay with a trigger, in each adapter, with `SpButton` as the
  trigger: the rendered `<button>` carries `aria-haspopup`, `aria-expanded` (toggling) and
  `aria-controls` (with an `id`), and a second press on an open popover's trigger closes it.
- **React `SpButton`:** forwards `aria-haspopup`, `aria-expanded`, `aria-controls` and
  `onPointerDown` to its root (the props `uiTriggerAria` and `useTrigger` add), beside `onClick`.
  Nothing else is forwarded: `SpButton`'s attributes stay the core's (Art. 3).
- No new fixture: a trigger's ARIA depends on the overlay's state; the e2e APG checks cover it.

## Follow-ups

- `reflex-silverpoint-react` can then make `sp_button` a valid trigger and keep `sp_trigger` as an
  alias.
- feature-005 REQ-547 lifts its restriction once this ships.

## As implemented (2026-11-21)

- **Vue had the defect too.** Its `SpButton` declares `inheritAttrs: false`, so the ARIA and
  `onPointerdown` its `trigger` slot is cloned with were dropped, exactly as in React. It now
  forwards the same set to its root (`TRIGGER_ATTRS`, `packages/vue/src/ui/button.ts`).
- **Angular never had it.** `spButton` and `spTrigger` are both directives on the consumer's own
  `<button>`, so the overlay's ARIA lands on the element `SpButton` styles. The test was added and
  passed with no code change.
- **`aria-describedby` added to the set.** A tooltip clones it onto its trigger
  (`uiTriggerAria('tooltip', …)`), and an `SpButton` described by a tooltip is the common case. The
  forwarded set is `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-describedby` and
  `onPointerDown`; nothing else (a test proves an unknown attribute stays off the root).
- **Tests, red first in React and Vue:** `packages/react/test/ui-overlays.test.tsx`,
  `packages/vue/test/ui-overlays.test.ts`, `packages/angular/test/ui-overlays-client.test.ts` —
  `describe('… SpButton as an overlay's trigger (delta-014)')`: modal, drawer and popover ARIA and
  toggling, the server markup, the second press on an open popover, the tooltip's description.
- **REQ-547** loses its example: an `SpButton` trigger is now a valid pattern. `generate_code` keeps
  emitting a native `<button>` trigger until an example app runs the `SpButton` one (REQ-547's rule
  itself is unchanged).
