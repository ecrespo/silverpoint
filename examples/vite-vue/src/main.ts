import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/example-harness/harness.css';
import { fixtureById, wantsGallery } from '@silverpoint/example-harness';
import { createApp, createSSRApp } from 'vue';
import App from './App.vue';

const fixture = fixtureById(new URLSearchParams(location.search).get('fixture'));

if (fixture || wantsGallery(location.search)) {
  // Fixture and gallery pages are rendered on the client only; the prerendered page is the home page.
  createApp(App, { fixture, gallery: !fixture }).mount('#app');
} else {
  // The home page was server-rendered by @vue/server-renderer: hydrate it (REQ-109).
  createSSRApp(App).mount('#app');
  document.documentElement.dataset.hydrated = 'true';
}
