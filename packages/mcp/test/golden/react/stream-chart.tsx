import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import { sanguine } from '@silverpoint/core/palettes';
import { StreamChart } from '@silverpoint/react/stream-chart';

export function StreamChartView({ rows }: { rows: readonly Record<string, unknown>[] }) {
  return (
    <StreamChart
      data={rows}
      xKey="day"
      keys={['hits', 'misses']}
      title="Stream chart"
      mode="precision"
      palette={sanguine}
    />
  );
}
