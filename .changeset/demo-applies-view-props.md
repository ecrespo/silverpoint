---
'@silverpoint/core': minor
---

**The demo applies view props; `VolvelleChart`'s index turns it.** Without `data`, a chart
renders its demo dataset (REQ-093). It now follows one written rule (REQ-098): accessor props
(`…Key`, `keys`, `names`) are ignored, because they point into your rows, and every other prop
applies exactly as it would to your data.

- **Behaviour change.** `<VolvelleChart indexRing={1} indexValue="Night" />` without `data` now
  turns the demo so `Night` faces the pointer, and the readout becomes `Day Sat · Shift Night ·
  Team Eridanus`. Before, the demo kept its own index and a development-only `SP002` said so; that
  warning is gone. An out-of-range `indexRing` or an absent `indexValue` warns `SP002` and falls
  back, as it does with your rings.
- **Rendered output.** The normalised SVG changes only for a `VolvelleChart` given `indexRing` or
  `indexValue` without `data`. With no index, and in every canonical fixture, it is unchanged.
- **Props reference (REQ-099).** Every accessor prop's documentation ends "Ignored without
  `data`."; `data` states the rule; `indexRing` and `indexValue` name the demo's rings.
