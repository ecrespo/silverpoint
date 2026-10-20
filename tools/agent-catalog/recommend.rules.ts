/**
 * The recommender's table (Data Model §2.31, DD-046, T-234): for a data shape and an intent, the
 * charts that serve it, a base score and the reason, adjusted by row count and value fields.
 * A table, not a model: deterministic, testable with golden tables, reviewable in a PR. A pair
 * with no row falls back to the charts whose own shape and intents match (`recommend_chart`).
 */
import type { RecommendRule } from '../../packages/mcp/src/types';

type Pick = RecommendRule['charts'][number];
type Adjust = NonNullable<RecommendRule['adjust']>[number];
const c = (slug: string, score: number, reason: string): Pick => ({ slug, score, reason });
const when = (test: Adjust['when'], n: number, slug: string, delta: number, reason: string): Adjust => ({ when: test, n, slug, delta, reason });

const MANY_CATEGORIES = 'Radial layouts crowd past a dozen categories.';

export const RECOMMEND_RULES: readonly RecommendRule[] = [
  // series: x → one or more values
  {
    shape: 'series',
    intent: 'trend',
    charts: [
      c('line-chart', 0.9, 'A line is the plainest reading of a value over an ordered axis.'),
      c('area-chart', 0.8, 'An area gives one series the weight of its magnitude.'),
      c('step-chart', 0.6, 'Steps show a value that holds until it changes.'),
      c('stream-chart', 0.5, 'Several value columns overlay or stack as waves.'),
      c('polar-line-chart', 0.3, 'A cyclic axis (hours, months, degrees) closes the line around a circle.'),
    ],
    adjust: [
      when('values>', 1, 'stream-chart', 0.3, 'Several value fields read together as streams.'),
      when('values>', 1, 'area-chart', -0.2, 'An area draws one series only.'),
    ],
  },
  {
    shape: 'series',
    intent: 'change',
    charts: [
      c('line-chart', 0.8, 'The slope between points is the change.'),
      c('step-chart', 0.75, 'Steps mark when the value changed and by how much.'),
      c('area-chart', 0.6, 'An area shows the change in magnitude.'),
      c('bump-chart', 0.5, 'When the change that matters is in rank.'),
    ],
  },
  {
    shape: 'series',
    intent: 'compare',
    charts: [
      c('line-chart', 0.8, 'A second series draws as a dotted baseline against the first.'),
      c('composed-chart', 0.75, 'Columns and a line share one value scale.'),
      c('stream-chart', 0.6, 'Several series overlaid on one axis.'),
      c('sparkline-rows', 0.55, 'One small line per series, side by side with its readout.'),
      c('polar-line-chart', 0.3, 'Values around a cycle compared by angle.'),
    ],
  },
  {
    shape: 'series',
    intent: 'rank',
    charts: [c('bump-chart', 0.9, 'The rank of each series at each x, ranks joined across x.')],
  },
  {
    shape: 'series',
    intent: 'kpi',
    charts: [
      c('sparkline-rows', 0.85, 'One row per series: its name, its trend and its latest readout.'),
      c('kpi-card', 0.75, 'One metric, its delta and its trend.'),
    ],
  },
  {
    shape: 'series',
    intent: 'part-to-whole',
    charts: [c('stream-chart', 0.8, 'Stacked waves show each part of a total over x.')],
  },
  // categories: label → value
  {
    shape: 'categories',
    intent: 'compare',
    charts: [
      c('bar-chart', 0.9, 'Bars compare values against one common baseline.'),
      c('lollipop-chart', 0.75, 'A lighter mark per category, readable with many of them.'),
      c('radar-chart', 0.5, 'Spokes compare a few subjects at once.'),
      c('polar-bar-chart', 0.4, 'Bars around a circle, for a cyclic set of categories.'),
      c('coxcomb-chart', 0.35, 'Equal angles, area by value: cyclic categories such as months.'),
      c('radial-arc-group', 0.3, 'Concentric tracks, each swept by its value.'),
    ],
    adjust: [
      when('rows>', 12, 'lollipop-chart', 0.2, 'Many categories read better as lollipops.'),
      when('rows>', 12, 'radar-chart', -0.3, MANY_CATEGORIES),
      when('rows>', 12, 'polar-bar-chart', -0.3, MANY_CATEGORIES),
      when('rows>', 12, 'coxcomb-chart', -0.3, MANY_CATEGORIES),
      when('values>', 1, 'bar-chart', 0.05, 'A second value field draws as a second series of bars.'),
    ],
  },
  {
    shape: 'categories',
    intent: 'rank',
    charts: [
      c('bar-chart', 0.85, 'Sorted bars read as a ranking.'),
      c('lollipop-chart', 0.85, 'Lollipops sort themselves with `sort`.'),
      c('pyramid-chart', 0.5, 'Stacked tiers, widest at the base.'),
      c('polar-bar-chart', 0.4, 'A ranking around a circle.'),
    ],
  },
  {
    shape: 'categories',
    intent: 'part-to-whole',
    charts: [
      c('stacked-bar-chart', 0.85, 'Each bar stacks its parts, one segment per value column.'),
      c('waterfall-chart', 0.6, 'Parts that add up to a running total.'),
      c('coxcomb-chart', 0.4, 'Sectors whose area is each part.'),
    ],
  },
  {
    shape: 'categories',
    intent: 'change',
    charts: [
      c('dumbbell-chart', 0.9, 'Two values per category joined by a segment: before and after.'),
      c('slope-chart', 0.85, 'Two period axes, one segment per category: the slope is the change.'),
      c('waterfall-chart', 0.75, 'Each step a delta from the running total.'),
    ],
  },
  {
    shape: 'categories',
    intent: 'progress',
    charts: [
      c('bullet-chart', 0.9, 'Each bar against its own target.'),
      c('radial-rings', 0.75, 'Concentric rings, each swept to its percent.'),
      c('funnel-chart', 0.7, 'Stages that narrow, such as a conversion.'),
      c('radial-arc-group', 0.5, 'Tracks swept relative to the largest.'),
    ],
  },
  {
    shape: 'categories',
    intent: 'kpi',
    charts: [
      c('bullet-chart', 0.8, 'Each measure against its target, compact.'),
      c('radial-rings', 0.6, 'A few percents at a glance.'),
    ],
  },
  // parts: label → share of a whole
  {
    shape: 'parts',
    intent: 'part-to-whole',
    charts: [
      c('donut-chart', 0.9, 'A ring reads a few shares of one whole around a central figure.'),
      c('waffle-chart', 0.85, 'Unit cells make the shares countable.'),
      c('treemap-chart', 0.7, 'Tiles sized by share.'),
      c('diverging-bar-chart', 0.4, 'For ordered levels (agree… disagree) around a neutral centre.'),
      c('stacked-bar-chart', 0.35, 'One bar stacked with the shares, to set beside other wholes.'),
    ],
    adjust: [
      when('rows>', 6, 'donut-chart', -0.3, 'A ring loses its shares past six slices.'),
      when('rows>', 6, 'treemap-chart', 0.1, 'Tiles hold many shares better than a ring.'),
    ],
  },
  {
    shape: 'parts',
    intent: 'compare',
    charts: [
      c('diverging-bar-chart', 0.8, 'Likert-style levels on both sides of a neutral centre, row by row.'),
      c('waffle-chart', 0.6, 'Countable cells per part.'),
    ],
  },
  {
    shape: 'parts',
    intent: 'progress',
    charts: [c('waffle-chart', 0.8, 'A hundred cells filled to the share done.')],
  },
  // matrix: row × column → value
  {
    shape: 'matrix',
    intent: 'compare',
    charts: [
      c('heatmap-chart', 0.9, 'One toned cell per row and column.'),
      c('marimekko-chart', 0.7, 'Columns by total, segments by share.'),
      c('parallel-coordinates-chart', 0.6, 'One polyline per row across many dimensions.'),
    ],
  },
  {
    shape: 'matrix',
    intent: 'part-to-whole',
    charts: [c('marimekko-chart', 0.9, 'Each column a whole, each segment its share, column width by total.')],
  },
  {
    shape: 'matrix',
    intent: 'correlation',
    charts: [
      c('parallel-coordinates-chart', 0.9, 'Crossing lines between axes show how dimensions move together.'),
      c('heatmap-chart', 0.6, 'A grid of values, read for patterns.'),
    ],
  },
  {
    shape: 'matrix',
    intent: 'distribution',
    charts: [c('heatmap-chart', 0.8, 'Where the high values gather in the grid.')],
  },
  // hierarchy: parent/child
  {
    shape: 'hierarchy',
    intent: 'hierarchy',
    charts: [
      c('tree-chart', 0.85, 'The structure itself, node by node.'),
      c('squarified-treemap', 0.8, 'Nested rectangles, drillable.'),
      c('sunburst-chart', 0.75, 'Rings of arcs, one ring per level, drillable.'),
    ],
  },
  {
    shape: 'hierarchy',
    intent: 'part-to-whole',
    charts: [
      c('squarified-treemap', 0.9, 'Area by value, nested by level.'),
      c('sunburst-chart', 0.85, 'Each arc its share of its parent.'),
    ],
  },
  // links: source → target → value
  {
    shape: 'links',
    intent: 'flow',
    charts: [
      c('sankey-chart', 0.9, 'Bands between layered stages, width by value.'),
      c('chord-ring', 0.75, 'Flows between categories around a circle, both ways.'),
      c('network-chart', 0.5, 'When the links matter more than their volume.'),
    ],
  },
  {
    shape: 'links',
    intent: 'network',
    charts: [
      c('network-chart', 0.9, 'Nodes and links laid out by a seeded force.'),
      c('chord-ring', 0.7, 'Who connects to whom, around a circle.'),
    ],
  },
  {
    shape: 'links',
    intent: 'part-to-whole',
    charts: [c('sankey-chart', 0.8, 'How a total splits and merges across stages.')],
  },
  // points: x, y, size?
  {
    shape: 'points',
    intent: 'correlation',
    charts: [
      c('scatter-chart', 0.9, 'Points on two linear scales.'),
      c('bubble-chart', 0.75, 'A third variable as each point’s area.'),
      c('density-bin-chart', 0.6, 'Counts per bin when points overlap.'),
      c('connected-scatter-chart', 0.5, 'When the points have an order.'),
      c('polar-scatter-chart', 0.3, 'When one variable is an angle.'),
    ],
    adjust: [
      when('rows>', 500, 'density-bin-chart', 0.35, 'Hundreds of points read better as counts per bin.'),
      when('rows>', 500, 'scatter-chart', -0.2, 'Points overplot and hide their density.'),
      when('values>', 2, 'bubble-chart', 0.2, 'A third numeric field can size the points.'),
    ],
  },
  {
    shape: 'points',
    intent: 'distribution',
    charts: [
      c('density-bin-chart', 0.85, 'Points counted in hexagonal or square bins.'),
      c('contour-chart', 0.8, 'Iso-lines of the density.'),
      c('scatter-chart', 0.6, 'Every point, when there are few.'),
      c('polar-scatter-chart', 0.4, 'Points by angle and radius.'),
    ],
  },
  {
    shape: 'points',
    intent: 'change',
    charts: [c('connected-scatter-chart', 0.9, 'An ordered path through x-y points: how two values moved together.')],
  },
  {
    shape: 'points',
    intent: 'network',
    charts: [c('delaunay-chart', 0.85, 'Neighbours by triangulation, or each point’s Voronoi cell.')],
  },
  {
    shape: 'points',
    intent: 'compare',
    charts: [c('bubble-chart', 0.7, 'Positions and sizes compared at once.')],
  },
  // distribution: samples of one variable
  {
    shape: 'distribution',
    intent: 'distribution',
    charts: [
      c('histogram-chart', 0.9, 'Observations binned in the core.'),
      c('box-plot-chart', 0.8, 'Quartiles, median, whiskers and outliers.'),
      c('violin-chart', 0.75, 'The density’s shape, mirrored.'),
      c('beeswarm-chart', 0.7, 'Every observation, packed without overlap.'),
      c('ecdf-chart', 0.65, 'The cumulative share below each value.'),
      c('wind-rose', 0.3, 'When the observations carry a bearing.'),
    ],
    adjust: [
      when('rows<', 30, 'beeswarm-chart', 0.25, 'Few observations: show each one.'),
      when('rows<', 30, 'histogram-chart', -0.2, 'Few observations make coarse bins.'),
      when('rows>', 1000, 'beeswarm-chart', -0.4, 'Too many observations to draw one by one.'),
    ],
  },
  {
    shape: 'distribution',
    intent: 'compare',
    charts: [
      c('box-plot-chart', 0.9, 'Quartiles side by side, one box per group.'),
      c('violin-chart', 0.85, 'Density shapes side by side.'),
      c('ridgeline-chart', 0.8, 'Densities on overlapping baselines, one per group.'),
      c('ecdf-chart', 0.75, 'Cumulative curves of each group on one axis.'),
    ],
  },
  {
    shape: 'distribution',
    intent: 'change',
    charts: [c('ridgeline-chart', 0.85, 'A density per period, stacked in order.')],
  },
  // intervals: low/high or OHLC
  {
    shape: 'intervals',
    intent: 'uncertainty',
    charts: [
      c('error-bar-chart', 0.9, 'A point estimate with its interval per category.'),
      c('range-band-chart', 0.85, 'A band between low and high over x.'),
    ],
  },
  {
    shape: 'intervals',
    intent: 'trend',
    charts: [
      c('range-band-chart', 0.85, 'The band between low and high over time.'),
      c('candlestick-chart', 0.8, 'Open, high, low and close per period.'),
    ],
  },
  {
    shape: 'intervals',
    intent: 'change',
    charts: [c('candlestick-chart', 0.9, 'Each period’s open-to-close change and its range.')],
  },
  {
    shape: 'intervals',
    intent: 'schedule',
    charts: [c('interval-chart', 0.95, 'Floating bars from start to end on lanes.')],
  },
  // events: date → item
  {
    shape: 'events',
    intent: 'schedule',
    charts: [c('activity-grid', 0.85, 'One cell per day, a column per week.')],
  },
  {
    shape: 'events',
    intent: 'trend',
    charts: [c('activity-grid', 0.8, 'Activity per day over weeks.')],
  },
  // single: one figure
  {
    shape: 'single',
    intent: 'kpi',
    charts: [
      c('kpi-card', 0.9, 'The figure, its delta and its trend.'),
      c('gauge-arc', 0.75, 'A percent on a 240° arc.'),
      c('meter-chart', 0.7, 'A percent with a needle.'),
    ],
  },
  {
    shape: 'single',
    intent: 'progress',
    charts: [
      c('gauge-arc', 0.85, 'An arc swept to the percent done.'),
      c('meter-chart', 0.8, 'A needle at the percent done.'),
    ],
  },
  // field: a 2-D scalar or vector field
  {
    shape: 'field',
    intent: 'flow',
    charts: [c('vector-field-chart', 0.95, 'An arrow per grid point, its direction and magnitude.')],
  },
  {
    shape: 'field',
    intent: 'distribution',
    charts: [c('contour-chart', 0.85, 'Iso-lines and bands of a scalar grid (`source: \'grid\'`).')],
  },
];
