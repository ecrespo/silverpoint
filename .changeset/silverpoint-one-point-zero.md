---
'@silverpoint/core': major
'@silverpoint/grounds': major
'@silverpoint/react': major
'@silverpoint/angular': major
'@silverpoint/vue': major
'@silverpoint/fonts': major
---

**1.0.0 — the API Spec comes into force.** From this release the public surface of the six
packages follows semantic versioning, and a change to the normalised SVG output is never a patch.

- The full catalog: 33 charts in React, Vue and Angular, each drawn from one geometry in
  `@silverpoint/core`, with the geometry of the data exact and a `precision` mode without inking.
- Parity: every adapter matches the canonical render of every fixture, as parsed trees and as
  pixels, over the 1,584-fixture matrix.
- Accessibility: WCAG 2.1 AA across the four example apps and the documentation site. A readout
  shown by the pointer is now dismissed by Escape anywhere on the page, and the hidden data table
  no longer causes horizontal scrolling on narrow pages (it is clipped by a `.sp-table-box`
  wrapper).
- `@silverpoint/angular` supports Angular 21 and 22 (peer range `>=21.0.0 <23.0.0`).
- Budgets: every one-chart bundle under 45 kB in every adapter; 2 ms geometry and 16 ms render.
