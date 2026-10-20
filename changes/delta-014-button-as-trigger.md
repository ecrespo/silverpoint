# delta-014 — `SpButton` as an overlay's trigger

| Field | Value |
|---|---|
| **Status** | `DRAFT` — drafted 2026-10-20 |
| **Found by** | aligning `reflex-silverpoint-react` to 0.7.0 (feature-005 research §3) |
| **Amends** | PRD REQ-500 (test added, no text change); API Spec §8.1 (React: `SpButton` forwards the trigger contract) |
| **SemVer** | `patch` for `@silverpoint/react` — no change to the normalised SVG or to any fixture (`0.7.1`) |

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
