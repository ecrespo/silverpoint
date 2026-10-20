import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import '@silverpoint/example-harness/harness.css';
import '@knight-lab/timelinejs/dist/css/timeline.css';
import '@silverpoint/grounds/timeline.css';
import { dashboardFixtureById, dashboardFixtureProps, fixtureById, LINKED_DASHBOARD, REFERENCE_DASHBOARD, uiFixtureById, wantsGallery } from '@silverpoint/example-harness';
import { createApp, createSSRApp } from 'vue';
import App from './App.vue';

/** The feature-004 pages (T-222). */
const PAGES = new Set(['/composed', '/palettes', '/timeline']);

const fixture = fixtureById(new URLSearchParams(location.search).get('fixture'));
/** A fixture page prerendered by prerender.mjs, `/ssr/<fixture id>`, to hydrate (T-179). */
const prerendered = fixtureById(/^\/ssr\/([^/]+?)(?:\.html)?$/.exec(location.pathname)?.[1] ?? null);
const dashboard = dashboardFixtureById(new URLSearchParams(location.search).get('dashboard'));
const ui = uiFixtureById(new URLSearchParams(location.search).get('ui'));

if (prerendered) {
  // A second-catalog fixture page, server-rendered into dist/ssr: hydrate it (REQ-103, REQ-435).
  createSSRApp(App, { fixture: prerendered }).mount('#app');
  document.documentElement.dataset.hydrated = 'true';
} else if (ui) {
  // A UI fixture of the pixel gate, rendered on the client.
  createApp(App, { ui }).mount('#app');
} else if (dashboard) {
  // A dashboard fixture of the pixel gate, rendered on the client.
  createApp(App, { dashboard: dashboardFixtureProps(dashboard), gate: true }).mount('#app');
} else if (location.pathname.replace(/\/$/, '') === '/dashboard' && new URLSearchParams(location.search).has('linked')) {
  // The linked dashboard (REQ-216) is client-rendered: linked state lives on the client only.
  createApp(App, { dashboard: LINKED_DASHBOARD }).mount('#app');
} else if (PAGES.has(location.pathname.replace(/\/$/, ''))) {
  // The feature-004 pages were server-rendered into composed.html, palettes.html and timeline.html: hydrate them (T-222).
  createSSRApp(App, { page: location.pathname.replace(/\/$/, '').slice(1) as 'composed' | 'palettes' | 'timeline' }).mount('#app');
  document.documentElement.dataset.hydrated = 'true';
} else if (location.pathname.replace(/\/$/, '') === '/ui') {
  // The UI reference page was server-rendered into ui.html: hydrate it (T-157).
  createSSRApp(App, { uiPage: true }).mount('#app');
  document.documentElement.dataset.hydrated = 'true';
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
