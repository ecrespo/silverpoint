import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import { SankeyChart } from '@silverpoint/react/sankey-chart';

export function SankeyChartView({ rows }: { rows: readonly Record<string, unknown>[] }) {
  return (
    <SankeyChart
      data={rows}
      sourceKey="from"
      targetKey="to"
      valueKey="count"
      title="Signup flow"
      height={240}
      ground="cyanotype"
    />
  );
}
