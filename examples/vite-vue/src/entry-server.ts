import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import App from './App.vue';

/** Server entry: the home page rendered by @vue/server-renderer (REQ-109). */
export function render(): Promise<string> {
  return renderToString(createSSRApp(App));
}
