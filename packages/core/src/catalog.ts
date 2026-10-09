/**
 * `@silverpoint/core/catalog`: the recipes of the second catalog (feature-003, REQ-400..REQ-426).
 * Apart from the main entry, as `/dashboard-demos` and `/ui` are, so the core's full bundle stays
 * within its 45 kB budget; each recipe still shakes out of every build that does not use it
 * (REQ-444). Their props types are in the main entry, with every other chart's.
 */
// Wave 1 (0.4.0): distribution.
export { histogramChart } from './charts/histogram-chart/histogram-chart';
export { ecdfChart } from './charts/ecdf-chart/ecdf-chart';
export { boxPlotChart } from './charts/box-plot-chart/box-plot-chart';
export { violinChart } from './charts/violin-chart/violin-chart';
export { ridgelineChart } from './charts/ridgeline-chart/ridgeline-chart';
export { beeswarmChart } from './charts/beeswarm-chart/beeswarm-chart';
// Wave 1 (0.4.0): comparison, change, ranking, uncertainty.
export { lollipopChart } from './charts/lollipop-chart/lollipop-chart';
export { dumbbellChart } from './charts/dumbbell-chart/dumbbell-chart';
export { slopeChart } from './charts/slope-chart/slope-chart';
export { bumpChart } from './charts/bump-chart/bump-chart';
export { errorBarChart } from './charts/error-bar-chart/error-bar-chart';
export { intervalChart } from './charts/interval-chart/interval-chart';
export { divergingBarChart } from './charts/diverging-bar-chart/diverging-bar-chart';
export { connectedScatterChart } from './charts/connected-scatter-chart/connected-scatter-chart';
