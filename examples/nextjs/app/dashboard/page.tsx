import { REFERENCE_DASHBOARD } from '@silverpoint/example-harness';
import { Hydrated } from '../hydrated';
import { ReferenceDashboard } from '../reference-dashboard';

/** The reference dashboard page (REQ-221): server-rendered, then hydrated and measured (REQ-207). */
export default function DashboardPage() {
  return (
    <main>
      <h1>silverpoint · Next.js (React) · dashboard</h1>
      <ReferenceDashboard dashboard={REFERENCE_DASHBOARD} />
      <Hydrated />
    </main>
  );
}
