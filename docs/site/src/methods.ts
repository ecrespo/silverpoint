/**
 * The method behind each value a chart of the second catalog derives (REQ-449, DD-029): what the
 * core computes from the rows, in words, as the code does it. A chart page prints its statements
 * under "How it is computed"; a chart that derives nothing says so.
 */
export interface MethodStatement {
  /** The derived value, as the table or the drawing names it. */
  readonly value: string;
  readonly method: string;
}

const QUARTILES = 'Linear interpolation between order statistics, Hyndman–Fan type 7 — the default of R and NumPy.';
const DENSITY =
  'A kernel density with the Epanechnikov kernel, ¾(1 − u²) on |u| ≤ 1, evaluated at 64 evenly spaced points of the value domain every group shares. The kernel is a polynomial, so every engine computes the same curve to the last bit.';
const BANDWIDTH =
  'The `bandwidth` prop when given; otherwise the mean of the groups’ Silverman bandwidths, 0.9 · min(σ, IQR / 1.34) · n^(−1/5), falling back as R’s `bw.nrd0` does when the spread is 0. One bandwidth for every group, so the shapes compare; the description says which was used.';
const HIERARCHY_VALUE =
  'Read on the leaves; an internal node is the sum of its children (without `valueKey`, each leaf counts 1). The share is the node’s value divided by its parent’s; the table prints the path from the root with both.';
const CHANGE = 'The second value minus the first, printed with its sign (+4, −8) in the table and the announcement, so the direction never rests on the shape alone.';

export const METHODS: Readonly<Record<string, readonly MethodStatement[]>> = {
  HistogramChart: [
    {
      value: 'bins',
      method:
        'By default the Freedman–Diaconis width, 2 · IQR · n^(−1/3), snapped to the nearest 1-2-5 step so the edges fall on the axis ticks; Sturges’ count, ⌈log₂ n⌉ + 1, when the IQR is 0. A number asks for that many equal bins over the extent niced to a step; an array gives the edges, closed by the data’s extent. A bin holds its lower edge and not its upper one, except the last; at most 1 000 bins are drawn.',
    },
    { value: 'count', method: 'The finite observations in each bin; with `cumulative`, the running total from the first bin.' },
  ],
  EcdfChart: [
    { value: 'share at or below', method: 'For each distinct value, the number of observations at or below it divided by their count; the last step is exactly 1.' },
    { value: 'median and markers', method: `${QUARTILES} Each \`markers\` quantile is drawn as a rule at its share.` },
  ],
  BoxPlotChart: [
    { value: 'quartiles and median', method: QUARTILES },
    {
      value: 'whiskers and outliers',
      method:
        'Tukey’s: each whisker reaches the furthest observation within `whisker` × IQR (1.5) of its quartile, and never into the box; observations past the whiskers are outliers. A group of fewer than five observations is drawn as its points.',
    },
  ],
  ViolinChart: [
    { value: 'density', method: `${DENSITY} Each violin is as wide as its density, the widest point of all groups filling the band.` },
    { value: 'bandwidth', method: BANDWIDTH },
    { value: 'quartiles', method: QUARTILES },
  ],
  RidgelineChart: [
    { value: 'density', method: `${DENSITY} Every ridge is drawn to the same scale and reaches \`overlap\` (0.5) into the one behind it.` },
    { value: 'bandwidth', method: BANDWIDTH },
  ],
  BeeswarmChart: [
    {
      value: 'packing',
      method:
        'Points are placed in ascending value order; each takes the smallest offset across the axis at which it touches no placed point, trying the axis and its exact tangencies with each neighbour. Off-axis points alternate sides, the first side taken from the seed. A swarm taller than its band is packed again at 0.8 × the radius, at most eight times and never below 1 px, so no two points overlap.',
    },
  ],
  LollipopChart: [{ value: 'order', method: '`sort` orders the categories by value, ties in data order; `none` keeps the data order. Nothing else is derived: each head is the value as given.' }],
  DumbbellChart: [{ value: 'change', method: CHANGE }],
  SlopeChart: [{ value: 'change', method: CHANGE }],
  BumpChart: [
    {
      value: 'rank',
      method:
        'Competition ranks per x (1, 2, 2, 4): rank 1 is the highest value, or the lowest with `order: \'ascending\'`. Equal values share a rank, marked “=” in the table; on the drawing they are placed in the order the series first appear, so the result does not depend on the order of the rows.',
    },
  ],
  ErrorBarChart: [{ value: 'none', method: 'Nothing is derived: the estimate and its interval are drawn as given, and the estimate furthest from `reference` is heightened.' }],
  IntervalChart: [
    { value: 'length', method: 'The end minus the start; on a date axis, in whole days between ISO dates read in UTC, whatever the host’s time zone.' },
    { value: 'tracks', method: 'Within a lane, intervals in start order each take the first track whose last interval ends at or before their start, so overlapping intervals never cover each other.' },
  ],
  DivergingBarChart: [
    { value: 'share', method: 'With `percent` (the default), each level’s count divided by its row’s total; otherwise the counts as given.' },
    {
      value: 'side',
      method:
        'Levels before the neutral one run left of the centre and the rest right; the neutral level — the middle one of an odd count by default, none of an even count — is split in half across the centre. The axis is symmetric, to the next 1-2-5 step.',
    },
  ],
  ConnectedScatterChart: [{ value: 'none', method: 'Nothing is derived: the path joins the points in data order, and the direction marks point the way it runs.' }],
  WaffleChart: [
    {
      value: 'cells',
      method:
        'Hamilton’s largest remainder: each category gets the whole part of its share of `cells` (100), then the cells left go to the largest remainders. While there are enough cells, a category with a positive value never ends with none; the cell it needs comes from the category with the most. Filled in reading order, `columns` (10) to a row.',
    },
    { value: 'share', method: 'Each category’s value divided by the total, as the legend and the table print it.' },
  ],
  MarimekkoChart: [
    { value: 'column width', method: 'Each column’s total divided by the grand total, of the plot’s width less a 2 px gap between columns.' },
    { value: 'segment height', method: 'Each segment’s value divided by its column’s total: both axes run to 100 %.' },
  ],
  SquarifiedTreemap: [
    { value: 'value', method: HIERARCHY_VALUE },
    {
      value: 'area',
      method:
        'The squarified layout of Bruls, Huijing and van Wijk: siblings, largest first and ties by id, are laid in rows along the shorter side while the worst aspect ratio improves. There is no padding, so every tile’s area is its exact share of the plot.',
    },
  ],
  SunburstChart: [
    { value: 'value', method: HIERARCHY_VALUE },
    { value: 'angle', method: 'Each node’s share of its parent’s arc, siblings largest first and ties by id; every ring is equally deep.' },
  ],
  TreeChart: [
    { value: 'value', method: HIERARCHY_VALUE },
    { value: 'layout', method: 'Buchheim, Jünger and Leipert’s linear-time form of Walker’s tidy tree: children in data order, subtrees as close as they can be without overlapping, a parent centred over its children.' },
  ],
  ParallelCoordinatesChart: [
    {
      value: 'axes',
      method:
        'Each axis spans its dimension’s data, niced to the axis’ ticks, unless `domains` gives it; the description says which. A value outside a given domain is drawn at the axis’ end and warned SP002.',
    },
  ],
  PolarLineChart: [
    {
      value: 'angle and radius',
      method:
        'The angle is the value’s share of `period` (360 by default) of a turn, clockwise from 12 o’clock and `startAngle`; the radius is linear from 0 at the centre to the axis’ top tick. Given a `period`, the line closes.',
    },
  ],
  PolarScatterChart: [
    { value: 'angle and radius', method: 'As the polar line: the share of `period` (360) of a turn, clockwise from 12 o’clock, and a radius linear from 0.' },
    { value: 'point area', method: 'With `sizeKey`, proportional to the size: the radius goes with its square root, 7 px for the largest and never under 1.5 px.' },
  ],
};
