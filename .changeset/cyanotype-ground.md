---
'@silverpoint/core': minor
'@silverpoint/grounds': minor
'@silverpoint/react': minor
'@silverpoint/vue': minor
'@silverpoint/angular': minor
---

**A second ground: `cyanotype`, where tone is line weight.** `ground="cyanotype"` prints any chart
as a white line on Prussian blue (REQ-028). It hatches nothing. A toned shape, such as a bar, a cell
or a band, is drawn as its own outline, and its tone is how thick that outline is. No chart code
changed to add it.

- **New exports.** `cyanotype` and `WeightInker` from `@silverpoint/grounds`, both registered by
  default. From `@silverpoint/core`: `ToneSpec` becomes a union, `HatchToneSpec | WeightToneSpec`.
- **One substrate,** `prussian`. The ground ignores `substrate`, so it needs none.
- **Heightening inverts.** The heightened element is the deepest blue, outlined in the white ink.
- **Rendered output.** A weighted path carries `data-weight="1"`–`"4"`. The stylesheet turns it
  into a stroke width with `--sp-weight-1..4`, so a consumer re-weights with CSS. `silverpoint`
  output is unchanged: no path of it carries a weight.
