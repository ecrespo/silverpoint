---
'@silverpoint/react': patch
'@silverpoint/vue': patch
---

delta-014: `SpButton` works as an overlay's `trigger`. React's and Vue's `SpButton` dropped the `aria-haspopup`, `aria-expanded`, `aria-controls` and `aria-describedby` an overlay clones onto its trigger, and its `pointerdown` handler, so a modal opened from an `SpButton` announced nothing to assistive technology and a second press on an open popover's trigger reopened it. They now forward exactly that set to their root. Angular's `spButton` was unaffected.
