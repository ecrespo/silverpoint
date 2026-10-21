# Overlays

Modal, Drawer, Popover, Tooltip, Select, DropdownMenu and Toast are built on the platform's
`<dialog>` and Popover API. They are client components only.

## The trigger is a native button

Give every overlay a native `<button type="button">` as its trigger:

- **React:** the `trigger` prop, `trigger={<button type="button">Edit</button>}`. The overlay
  clones it with its ARIA and its toggle. Do not pass `SpButton`: it drops the ARIA it is given.
- **Vue:** the `trigger` slot, `<template #trigger><button type="button">Edit</button></template>`.
  Its first element is cloned.
- **Angular:** project the button with the `spTrigger` directive,
  `<button type="button" spTrigger>Edit</button>`, and import `SpTrigger` from the overlay's own
  subpath.

## Open state

| | Controlled | Uncontrolled | Change |
|---|---|---|---|
| React | `open` | `defaultOpen` | `onOpenChange(open)` |
| Vue | `v-model:open` | `default-open` | `update:open` |
| Angular | `[(open)]` | `[defaultOpen]` | `(openChange)` |

`onOpenChange` also fires when the platform closes it: Escape, or a click outside. A Modal with
`dismissible={false}` ignores both.

## Toasts

Put one `SpToaster` near the root and render `SpToast` children inside it. A toast closes after the
toaster's `duration` (5000 ms) unless its own `duration` says otherwise. It pauses while hovered or
focused, and F8 moves focus to the toaster.

## Sides

Sides are logical, `start` and `end`, so they mirror in right-to-left pages. Reflex's `left` and
`right` become `start` and `end`.

<!-- generated:overlays -->
