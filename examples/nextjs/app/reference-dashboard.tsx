import type { HarnessDashboard } from '@silverpoint/example-harness';
import { Dashboard, DashboardCell } from '@silverpoint/react/dashboard';
import type { ComponentType } from 'react';
import { CHARTS } from './charts';

/**
 * A reference dashboard as a consumer writes it in a Server Component: the dashboard itself adds
 * no client boundary; its charts are the client components (API Spec §7.1, REQ-104).
 */
export function ReferenceDashboard({ dashboard }: { dashboard: HarnessDashboard }) {
  return (
    <Dashboard {...dashboard.props}>
      {dashboard.children.map((child) => {
        const Chart = CHARTS[child.chart as keyof typeof CHARTS] as ComponentType<Record<string, unknown>>;
        return (
          <DashboardCell key={child.cell} cell={child.cell}>
            <Chart {...child.props} />
          </DashboardCell>
        );
      })}
    </Dashboard>
  );
}
