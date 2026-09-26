import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import App from './App.vue';
export { REFERENCE_DASHBOARD } from '@silverpoint/example-harness';

/** Server entry: a page rendered by @vue/server-renderer (REQ-109) — the home page, or with props another. */
export function render(props?: Record<string, unknown>): Promise<string> {
  return renderToString(createSSRApp(App, props));
}
