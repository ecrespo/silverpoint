# REQ-124 review — the six Phase 1 charts (T-046)

> REQ-124: *No chart SHALL encode information solely by hatch style.*
> Reviewed 2026-09-24 against the recipes in `packages/core/src/charts/`. Each finding is held by
> a test in `packages/grounds/test/req-124.test.ts`, which renders the chart in `precision` —
> where no hatching is drawn at all (REQ-021) — and reads the data back from the channel named
> here. The tests were written after the recipes and mutation-checked: removing the heatmap's
> printed values, or giving every activity-grid level the same cell size, turns them red.

## Method

For every chart, every visual channel is listed with what it carries. A channel is **redundant**
when the same information is also carried by a non-hatch channel, and **decorative** when it
carries none. A chart passes when no information is carried by tone alone.

## Charts

### BulletChart (REQ-069)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Bar length on the 0–100 track | `actual` | yes |
| Marker position on the track | `target` | yes |
| Printed number at the row's end | `actual` | yes |
| Row title | `title` | yes |
| Bar tone (level 2, constant) | nothing — decorative | — |

**Pass.** The tone is the same on every bar.

### PyramidChart (REQ-070)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Tier width, centred | `width` | yes |
| Printed number at the right | `width` | yes |
| Vertical order | tier order | yes |
| Tier tone, without `toneKey` | `width`, quantised | redundant |
| Tier tone, with `toneKey` | the consumer's tone | printed as `tone N` |

**Pass.** A consumer-supplied tone is information of its own, so it is printed as well as hatched.

### HeatmapChart (REQ-084)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Cell position (row × column) | row label, column index | yes |
| Printed number in every cell | the exact value | yes |
| Cell tone (5 levels of `value / scaleMax`) | the value, quantised | redundant |

**Pass.** The tone is a quantised preview; the printed value carries it exactly. Open, cosmetic
(ledgered as a minor): hatching runs under the printed digits at the darkest levels.

### TreemapChart (REQ-085)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Tile area (`cols × rows` cells) | the consumer's layout | yes |
| Printed label and `share%` in every tile | `label`, `share` | yes |
| Tile tone, without `tone` | `share`, quantised | redundant |
| Tile tone, with `tone` | the consumer's tone | printed as `tone N` |

**Pass.** Data Model §2.5 says `share` does not size the tile, so the printed share is its only
exact channel, and it is always drawn.

### SankeyChart (REQ-086)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Band thickness | flow value | yes |
| Node height | node throughput | yes |
| Printed `name throughput` beside every node | name, throughput | yes |
| Horizontal layer | longest-path depth | yes |
| Band tone (1) and node tone (3), constant | band vs node — also told apart by shape | decorative |

**Pass.** Individual flow values are read from band thickness, from the tabular alternative
(REQ-121) and from the readout (REQ-141); they are not printed on the bands, which is a
legibility choice, not a hatch dependency.

### ActivityGrid (REQ-087)

| Channel | Carries | Non-hatch? |
|---|---|---|
| Column, row | week, day | yes |
| Cell size (0.4, 0.55, 0.7, 0.85, 1.0 of the slot) | `level` | yes |
| Cell tone (= `level`) | `level` | redundant |
| Month labels | calendar position | yes |

**Pass.** This is the chart where a hatch-only encoding was most tempting — GitHub's grid is
colour only. The level is carried by size as well, so it survives `precision`, forced colours
and a monochrome print.

## Result

All six pass REQ-124. No chart encodes information by hatch style alone; where a tone carries
information, a label, a length or a size carries the same information.
