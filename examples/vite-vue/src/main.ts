import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/example-harness/harness.css';
import { dashboardFixtureById, dashboardFixtureProps, fixtureById, REFERENCE_DASHBOARD, wantsGallery } from '@silverpoint/example-harness';
import { createApp, createSSRApp } from 'vue';
import App from './App.vue';

const fixture = fixtureById(new URLSearchParams(location.search).get('fixture'));
const dashboard = dashboardFixtureById(new URLSearchParams(location.search).get('dashboard'));

if (dashboard) {
  // A dashboard fixture of the pixel gate, rendered on the client.
  createApp(App, { dashboard: dashboardFixtureProps(dashboard), gate: true }).mount('#app');
} else if (location.pathname.replace(/\/$/, '') === '/dashboard') {
  // The reference dashboard was server-rendered into dashboard.html: hydrate it (REQ-221).
  createSSRApp(App, { dashboard: REFERENCE_DASHBOARD }).mount('#app');
  document.documentElement.dataset.hydrated = 'true';
} else if (fixture || wantsGallery(location.search)) {
  // Fixture and gallery pages are rendered on the client only; the prerendered page is the home page.
  createApp(App, { fixture, gallery: !fixture }).mount('#app');
} else {
  // The home page was server-rendered by @vue/server-renderer: hydrate it (REQ-109).
  createSSRApp(App).mount('#app');
  document.documentElement.dataset.hydrated = 'true';
}
