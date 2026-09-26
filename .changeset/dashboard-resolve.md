---
'@silverpoint/core': minor
---

**Dashboard resolution in the core.** `resolveDashboard(props, childCells)` matches children to
layout cells by id, keeps the reading order, clamps spans to the breakpoint's columns (`SP014`),
reports every mismatch without throwing (`SP015`), derives chart ids (`ops--traffic`), and gives
each cell its nominal box at `ssrWidth`. `cellChartBox` sizes a chart to fill its cell with its
own card chrome subtracted. New diagnostic codes `SP014`, `SP015`, `SP016`. No change to the
rendered output of any chart.
