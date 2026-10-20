import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import { TreemapChart } from '@silverpoint/react/treemap-chart';

export function TreemapChartView({ rows }: { rows: readonly Record<string, unknown>[] }) {
  return (
    <TreemapChart
      data={rows}
      labelKey="folder"
      shareKey="bytes"
      title="Treemap chart"
    />
  );
}
