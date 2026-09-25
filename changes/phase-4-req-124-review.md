# REQ-124 review — the whole catalog in one pass (T-095)

> REQ-124: *No chart SHALL encode information solely by hatch style.*
> Reviewed 2026-09-24 over the 33 charts of `tools/visual-gate/catalog.ts`, after the three
> per-phase reviews (`phase-1-`, `phase-2-`, `phase-3-req-124-review.md`). Those read each chart
> alone; this pass compares like channels **across** the catalog, so that one convention means one
> thing everywhere, and adds a catalog-driven guard so a chart cannot drift out of it.

## Method

`precision` mode draws no hatching (REQ-021), so it is the paper test: whatever a chart says there
is said without hatch. Two questions were put to every chart at once:

1. **Magnitude.** Which non-hatch channel carries each item's value?
2. **Identity.** When a chart tells items apart by tone, which non-hatch channel tells them apart
   too?

Both are held by tests in `packages/grounds/test/req-124.test.ts`: a test per chart for the first
(Phases 1-3, mutation-checked), and — new in this pass — **one catalog test for the second**: a
chart whose ink demo tones its items with more than one tone must declare its identity channel,
and the channel is checked in precision. A chart that starts toning items without declaring one
fails. It was mutation-checked twice: polar bars given varying tones (the undeclared chart is
caught), and the bar chart's secondary series drawn solid (its channel is caught). The test that
precision draws no hatching now covers all 33, the line chart included.

## Magnitude: one channel family per kind of value

| Channel | Charts | Consistent? |
|---|---|---|
| Position on a linear scale | line, step, sparkline rows, KPI series, area, range band, stream, scatter, candlestick, composed (line) | yes — every value axis is linear and printed |
| Length from a zero base | bullet, pyramid, bar, stacked bar, composed (bars), waterfall, funnel, polar bar (from the hole), radar (along a spoke) | yes — bars start at zero; a flat zero domain now grows upward only (T-090, M6) |
| Angle or sweep | donut, radial arc group, radial rings, gauge, meter (needle), chord ends | yes — clockwise from 12 o'clock everywhere; a sweep near a full turn is drawn (Phase 3, I-1) |
| **Area** | bubble, coxcomb, orbit markers, activity grid cells | yes — all four scale area, not radius, with the value (radius ∝ √value) |
| Thickness | sankey bands, chord ribbon ends | yes — proportional to the flow |
| Printed value | heatmap cells, treemap share, KPI delta, waterfall steps, funnel share, donut share, track values, gauge and meter readout, wind rose calms, volvelle readout | yes — printed with the chart's locale and `numberFormat` |

No magnitude is carried by tone anywhere. The heatmap's tone is a quantised preview of a value that
is printed, or carried by cell size where the value does not fit (Phase 1 final review).

## Identity: tone is never alone

Fourteen charts tone their items; the other nineteen use one tone or none. The catalog test pins
the list.

| Chart | What tells items apart on paper |
|---|---|
| PyramidChart, TreemapChart, FunnelChart | every item named, with its value |
| HeatmapChart | every value printed in its cell, or carried by cell size |
| SankeyChart, ChordRing | every node or category named; flows read by thickness and by where they end |
| ActivityGrid | the level carried by cell size |
| CoxcombChart | every sector named at the rim |
| BarChart | the secondary series is **dotted** |
| StreamChart | the second wave is **dotted**, both named |
| WaterfallChart | rises and falls printed with their sign |
| StackedBarChart, WindRose | every key or bin named, in stack order |
| DonutChart | every sector named with its share in the legend |

**Cross-catalog conventions confirmed:**

- **Dotted means the other series.** The line chart's baseline, the bar chart's previous period,
  the stream's second wave and the range band's low edge are the only dotted encodings, and in each
  the dotted one is the secondary or the lower. The composed chart tells its two series apart by
  shape (bars against a line) instead, and never dots either.
- **A consumer's tone is printed.** Where a consumer supplies a tone (pyramid, treemap), its value is
  printed as well, since it is information of its own.
- **Neighbours never share a tone** on a closed ring (donut, coxcomb, chord), counted over the drawn
  items only since T-090 (M-2).

## Limits carried forward (ruled, not violations)

In three places the identity channel is order, and order fails on paper when an item is missing.
Tone then carries identity in ink mode, and precision shows nothing. The tabular alternative
(REQ-121) and the keyboard readout (REQ-122) still name every item, so no information is lost, only
its printed form.

| Chart | When | Ruled in |
|---|---|---|
| StackedBarChart | a zero or missing segment inside a stack | Phase 2 ledger |
| WindRose | a bin missing inside a sector | Phase 3 review |
| DonutChart, RadialArcGroup, RadialRings | no room for the legend (a square donut card; tracks under 220 px) | T-073, T-076..T-078 rulings |

The Phase 2 ledger proposed a later remedy for the first: a key name inside any segment tall
enough to hold one. It remains the remedy for all three. It is a layout change that reaches every
golden of those charts, and the API Spec has no prop to turn it off, so it is left for a minor
release after `1.0.0` rather than made at close-out.

## Result

All 33 charts pass REQ-124. No magnitude and no identity is carried by hatch or tone alone:
magnitudes by position, length, angle, area, thickness or print; identity by names, dash, sign,
size or order. The three order-based limits above are the only places where paper is weaker than
the screen. They are ruled, and the table and keyboard carry what paper does not.
