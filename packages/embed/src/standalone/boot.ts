/**
 * The script builds' one side effect (REQ-649, DD-070 as implemented): define `<silverpoint-chart>`
 * and mount every `[data-sp-embed]` once the document is parsed, so `renderToHTML`'s interactive
 * markup comes alive under `script-src 'self'` with no inline script. Never runs in a module build.
 */
import { defineElement } from '../client/element';
import { mountAll } from '../client/mount-all';

export function boot(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  defineElement();
  const all = (): void => void mountAll(document);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all, { once: true });
  else all();
}
