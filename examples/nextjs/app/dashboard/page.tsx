import { dashboardPage } from '@silverpoint/example-harness';
import { Hydrated } from '../hydrated';
import { ReferenceDashboard } from '../reference-dashboard';

/** The reference dashboard page (REQ-221): server-rendered, then hydrated and measured (REQ-207). */
export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  return (
    <main>
      <h1>silverpoint · Next.js (React) · dashboard</h1>
      <ReferenceDashboard dashboard={dashboardPage('linked' in params ? '?linked' : '')} />
      <Hydrated />
    </main>
  );
}
