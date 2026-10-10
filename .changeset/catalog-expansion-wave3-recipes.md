---
'@silverpoint/core': minor
---

**Second catalog, wave 3 recipes (feature-003, T-190..T-195).** The core recipes of
`DensityBinChart` (hexagonal or square bins, toned by count, with a key of the count ranges),
`ContourChart` (iso-lines and filled bands of a point density or a regular grid), `DelaunayChart`
(the triangulation or its Voronoi cells), `VectorFieldChart` (an arrow per grid point) and
`NetworkChart` (a force layout from the seed, or the consumer's positions), on owned engines:
marching squares with saddle resolution, the Epanechnikov density splat, 2-D bins, Bowyer–Watson
with exact predicates (`BigInt` when doubles cannot settle a sign) and a fixed-iteration
Fruchterman–Reingold layout. They reach the adapters with wave 3 (`0.6.0`); no existing output
changes.
