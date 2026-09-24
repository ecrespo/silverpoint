# REQ-124 review — the fourteen Phase 2 charts (T-069)

> REQ-124: *No chart SHALL encode information solely by hatch style.*
> Reviewed 2026-09-24 against the recipes in `packages/core/src/charts/`. Each finding is held by
> a test in `packages/grounds/test/req-124.test.ts`, which renders the chart in `precision` —
> where no hatching is drawn at all (REQ-021) — and reads the data back from the channel named
> here. The tests were written after the recipes and mutation-checked: dropping the bar chart's,
> stream's or range band's dash, the candlestick's solid fill or the waterfall's and KPI's signs,
> squashing the funnel's widths or giving every bubble one radius turns each of them red.

## Method

As in the Phase 1 review: every visual channel is listed with what it carries. A channel is
**redundant** when the same information is also carried by a non-hatch channel, and
**decorative** when it carries none. A chart passes when no information is carried by tone alone.

## Line family

### StepChart (REQ-061)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Step height on the value axis | `value` | yes |
| Position along x, category labels | `x` | yes |

**Pass.** No tone at all.

### SparklineRows (REQ-062)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Row name | the series | yes |
| Sparkline shape | the series' values, relative | yes |
| Printed readout (the last value by default) | the headline value | yes |

**Pass.** No tone at all.

### KpiCard (REQ-063)

| Channel | Carries | Non-hatch? |
|---|---|---|
| The printed figure | the last value | yes |
| The delta, printed with `signDisplay: 'always'`, and a ▲/▼ mark | the change and its direction | yes |
| Area line height | the series | yes |
| Area tone (level 1, constant) | nothing — decorative | — |

**Pass.**

## Bars

### BarChart (REQ-064)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Bar length (pill) | `value`, `secondary` | yes |
| Outline: solid vs dotted, named in the legend | which series | yes |
| Tone 2 vs tone 1 | which series | redundant |

**Pass.**

### StackedBarChart (REQ-065)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Segment height | each key's value | yes |
| Stack order, bottom first, as the legend lists the keys | which key | yes |
| Segment tone, repeated on the legend swatch | which key | redundant |

**Pass, with a limit (ruled):** when a segment is zero or missing, the order alone no longer
tells which key the segments above it belong to; tone did. The keyboard readout (REQ-122) names
the key of every segment and the data table (REQ-121) lists them all, so the information is never
lost, but a *printed* precision chart with a gap is ambiguous. Recorded in the Phase 2 ledger as a
ruling; the remedy (a key name in a segment tall enough to hold one) is a layout change for a
later phase.

### ComposedChart (REQ-066)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Bar height | `barKey` | yes |
| Line height | `lineKey` | yes |
| Shape: closed bar vs open line, each named in the legend | which series | yes |
| Bar tone (level 2, constant) | nothing — decorative | — |

**Pass.**

### WaterfallChart (REQ-067)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Bar extent from the running total | each step | yes |
| Printed value: signed on steps, unsigned on totals | rise, fall or total, and the amount | yes |
| Connector rules | the running total | yes |
| Tone 1 / 2 / 3 | rise, fall, total | redundant |

**Pass.**

### FunnelChart (REQ-068)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Stage width, centred | `value` | yes |
| Printed value and share of the first stage | `value`, conversion | yes |
| Stage tone, quantised from the share | the share | redundant |

**Pass.**

### CandlestickChart (REQ-071)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Wick extent | high, low | yes |
| Body extent | open, close | yes |
| Body fill: hollow vs solid ink | rising vs falling | yes (`paint: 'fill'`, not a hatch) |

**Pass.** No tone at all.

## Areas

### AreaChart (REQ-072)

| Channel | Carries | Non-hatch? |
|---|---|---|
| The exact line on top | `value` | yes |
| Area tone (level 2, constant) | nothing — decorative | — |

**Pass.**

### RangeBandChart (REQ-073)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Upper edge (solid) and lower edge (dotted) | `high`, `low` | yes |
| Band tone (level 1, constant) | nothing — decorative | — |

**Pass.**

### StreamChart (REQ-074)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Wave edge height | each key's value (or the running sum when stacked) | yes |
| Edge: solid vs dotted, named in the legend | which key | yes |
| Tone 1 vs tone 2 | which key | redundant |

**Pass.**

## Points

### ScatterChart (REQ-082)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Position on two linear scales | `x`, `y` | yes |
| Marker area, with `sizeKey` | size | yes |

**Pass.** No tone at all.

### BubbleChart (REQ-083)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Position on two linear scales | `x`, `y` | yes |
| Circle area | size | yes |
| Tone (level 1, constant) | nothing — decorative | — |

**Pass.**

## Correction after the final review

The first version of this review read the dash from the geometry and passed `StreamChart` and
`RangeBandChart`. The final review found the dots invisible on the page: the toned area was
painted with its own outline, which ran solid along the dotted edge. The toned shapes are now
hatched only (`paint: 'none'`), and a test reads the rendered strokes in both modes — no painted
outline may share the dotted line's vertices. The two tables above hold as written since then.

## Result

Fourteen charts reviewed: every tone is decorative or redundant with a length, a position, a
printed value, a dash or a fill. One limit ruled on (StackedBarChart with a zero or missing
segment), where the key survives in the readout and the table but not on paper.
