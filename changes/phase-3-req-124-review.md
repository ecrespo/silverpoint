# REQ-124 review — the twelve Phase 3 charts (T-088)

> REQ-124: *No chart SHALL encode information solely by hatch style.*
> Reviewed 2026-09-24 against the recipes in `packages/core/src/charts/`. Each finding is held by
> a test in `packages/grounds/test/req-124.test.ts`, which renders the chart in `precision` —
> where no hatching is drawn at all (REQ-021) — and reads the data back from the channel named
> here. The tests were written after the recipes and mutation-checked in two batches: equal
> donut sweeps, a square-root polar bar, a linear coxcomb radius or orbit marker, a bent radar
> radius, unit chord flows, and the removal of the tracks' values, the meters' readout, the wind
> rose's calms and the volvelle's readout each turn their test red.

## Method

As in the Phase 1 and 2 reviews: every visual channel is listed with what it carries. A channel is
**redundant** when the same information is also carried by a non-hatch channel, and
**decorative** when it carries none. A chart passes when no information is carried by tone alone.

## Arc engine

### DonutChart (REQ-075)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Sector sweep, clockwise from 12 | `value` as a share of the total | yes |
| Legend: name and printed share, in clockwise order | which sector, its share | yes |
| Centre readout | the total, or `centerValue` | yes |
| Sector tone, never shared by neighbours | which sector | redundant |

**Pass, with the stacked-bar limit:** in a square area the legend is left out (T-073 ruling), and
the sectors are then told apart on paper by order only; the table and readout name each one.

### RadarChart (REQ-076)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Distance along a spoke | `value` on the domain | yes |
| Spoke name at the rim | the subject | yes |
| Rings with their printed values | the scale | yes |
| Polygon tone (level 1, constant) | nothing — decorative | — |

**Pass.**

### PolarBarChart (REQ-077)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Bar length out from the hole | `value` | yes |
| Name at the rim | the category | yes |
| Bar tone (level 2, constant) | nothing — decorative | — |

**Pass.**

### RadialArcGroup (REQ-078) and RadialRings (REQ-079)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Sweep of the value band | `value` / the largest (group), percent (rings) | yes |
| Legend: name and printed value, outermost first | which track, its value | yes |
| Track tone (level 2, constant) | nothing — decorative | — |

**Pass, with the same limit:** without room for the legend (a plot under 220 px wide) the tracks
are told apart on paper by order only (T-076..T-078 ruling).

### GaugeArc (REQ-080) and MeterChart (REQ-081)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Sweep of the band (gauge), needle angle (meter) | the percent | yes |
| Printed readout | the percent, or `readout` | yes |
| Band tone (gauge, constant) | nothing — decorative | — |

**Pass.**

### CoxcombChart (REQ-088)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Sector radius, ∝ √value (area ∝ value) | `value` | yes |
| Name at the rim | the category | yes |
| Sector tone, never shared by neighbours | which sector | redundant |

**Pass.**

### WindRose (REQ-089)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Sector length | the share of observations from that bearing | yes |
| Compass name at the rim | the bearing | yes |
| Band order, calmest innermost; legend of bins in the same order with each bin's share | the speed bin | yes |
| Printed "calm N%" | the calms, which have no bearing | yes |
| Band tone per bin | the speed bin | redundant |

**Pass, with the stacked-bar limit:** on paper, a bin inside one sector is known by its place in the
stack, so a sector missing a middle bin is ambiguous; the table gives every sector's share per bin.

### VolvelleChart (REQ-090)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Segment position in its ring | the category's place | yes |
| Printed names (inside where they fit, the outermost ring at the rim) | the category | yes |
| Printed combined readout | what every ring shows under the index | yes |
| Tone of the segments under the index | the alignment | redundant |

**Pass.**

## Own geometry

### ChordRing (REQ-091)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Arc length of a category | its throughput (sent + received) | yes |
| Name at the rim | the category | yes |
| Span of a ribbon's end on its arc | the flow's value | yes |
| Where a ribbon's ends sit | its source and target | yes |
| Tone of arcs and ribbons (the source's) | which category | redundant |

**Pass.** At the md size the ribbons are dense in monochrome; the table lists every flow.

### OrbitChart (REQ-092)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Position along the ellipse | the marker's period | yes |
| Marker area | the marker's value | yes |
| Orbit name | the series | yes |

**Pass.** No tone at all.

## Result

Twelve charts reviewed: every tone is decorative or redundant with a length, an angle, a position,
an area or printed text. Three carry the stacked-bar limit on paper (the donut without its legend,
the concentric tracks without theirs, and the wind rose's bins inside a sector), where the table
and the keyboard readout still name every item.
