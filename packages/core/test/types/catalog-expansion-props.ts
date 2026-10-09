/**
 * Compiled by `catalog-expansion-contracts.test.ts`, never run. Every `@ts-expect-error` must be
 * consumed: an unused one is itself an error, so relaxing a required prop, or widening the drawing
 * vocabulary, turns the test red (T-164, REQ-450).
 */
import type {
  BeeswarmChartProps,
  BoxPlotChartProps,
  BumpChartProps,
  ConnectedScatterChartProps,
  ContourChartProps,
  DelaunayChartProps,
  DensityBinChartProps,
  DivergingBarChartProps,
  DumbbellChartProps,
  EcdfChartProps,
  ErrorBarChartProps,
  HistogramChartProps,
  IntervalChartProps,
  LabelKind,
  LollipopChartProps,
  MarimekkoChartProps,
  NetworkChartProps,
  ParallelCoordinatesChartProps,
  PolarLineChartProps,
  PolarScatterChartProps,
  RidgelineChartProps,
  SlopeChartProps,
  SquarifiedTreemapProps,
  StrokePaint,
  StrokePart,
  StrokeRole,
  SunburstChartProps,
  TreeChartProps,
  VectorFieldChartProps,
  ViolinChartProps,
  WaffleChartProps,
} from '../../src';

export const valid = [
  { bins: 12, cumulative: true, orientation: 'rows' } satisfies HistogramChartProps,
  { bins: [0, 5, 10, 20] } satisfies HistogramChartProps,
  { markers: [0.25, 0.5, 0.75], groupKey: 'g' } satisfies EcdfChartProps,
  { whisker: 3, outliers: false } satisfies BoxPlotChartProps,
  { bandwidth: 2, quartiles: false } satisfies ViolinChartProps,
  { groupKey: 'g', overlap: 0.3 } satisfies RidgelineChartProps,
  { radius: 4, labelKey: (d) => String(d.name) } satisfies BeeswarmChartProps,
  { sort: 'descending' } satisfies LollipopChartProps,
  { names: ['2024', '2025'], endMarker: 'arrow' } satisfies DumbbellChartProps,
  { names: ['before', 'after'] } satisfies SlopeChartProps,
  { order: 'ascending', series: 4 } satisfies BumpChartProps,
  { reference: 0 } satisfies ErrorBarChartProps,
  { axis: 'date' } satisfies IntervalChartProps,
  { levels: ['No', 'Maybe', 'Yes'], neutral: null, percent: false } satisfies DivergingBarChartProps,
  { arrows: false } satisfies ConnectedScatterChartProps,
  { cells: 400, columns: 20 } satisfies WaffleChartProps,
  { columnKey: 'c', segmentKey: 's' } satisfies MarimekkoChartProps,
  { rootId: 'ops', depth: 2 } satisfies SquarifiedTreemapProps,
  { rootId: null } satisfies SunburstChartProps,
  { orientation: 'vertical' } satisfies TreeChartProps,
  { dimensions: ['a', 'b'], domains: { a: [0, 1] } } satisfies ParallelCoordinatesChartProps,
  { period: 12, startAngle: 90 } satisfies PolarLineChartProps,
  { period: 24 } satisfies PolarScatterChartProps,
  { binShape: 'rect', binSize: 10 } satisfies DensityBinChartProps,
  { source: 'grid', levels: [1, 2, 3], filled: false } satisfies ContourChartProps,
  { mesh: 'voronoi' } satisfies DelaunayChartProps,
  { scale: 2 } satisfies VectorFieldChartProps,
  { nodes: [{ id: 'a', x: 1, y: 2 }], iterations: 100 } satisfies NetworkChartProps,
];

// @ts-expect-error REQ-404 · the ridgeline needs its groups
export const ridgeNoGroup: RidgelineChartProps = {};
// @ts-expect-error REQ-412 · the diverging bars need their levels
export const likertNoLevels: DivergingBarChartProps = {};
// @ts-expect-error REQ-419 · parallel coordinates need their dimensions
export const parallelNoDimensions: ParallelCoordinatesChartProps = {};
// @ts-expect-error REQ-407 · two names, no more
export const threeNames: DumbbellChartProps = { names: ['a', 'b', 'c'] };
// @ts-expect-error REQ-422 · only the two bin shapes
export const triangles: DensityBinChartProps = { binShape: 'triangle' };

/** Exact equality of two unions: neither may gain or lose a member. */
type Exactly<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// REQ-450 · the drawing vocabulary of the first 33 charts, unchanged.
export const parts: Exactly<StrokePart, 'ink' | 'ink-secondary' | 'heighten' | 'rule' | 'grid' | 'axis'> = true;
export const paints: Exactly<StrokePaint, 'stroke' | 'fill' | 'tile' | 'none'> = true;
export const roles: Exactly<StrokeRole, 'encoding' | 'ornament' | 'hatch'> = true;
export const kinds: Exactly<LabelKind, 'title' | 'badge' | 'value' | 'unit' | 'footer' | 'tick' | 'empty'> = true;
