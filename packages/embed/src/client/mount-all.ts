/** `mountAll` (REQ-646): every `[data-sp-embed]` holding a JSON spec, not mounted yet. Idempotent. */
import { MOUNTED, mount, type ChartMount, type MountOptions } from './mount';

/** The text of a host's JSON child, or `undefined`. */
export function jsonChild(host: Element): string | undefined {
  const script = host.querySelector(':scope > script[type="application/json"]');
  return script?.textContent ? script.textContent : undefined;
}

export function mountAll(root: ParentNode = document, options: MountOptions = {}): ChartMount[] {
  const handles: ChartMount[] = [];
  for (const host of root.querySelectorAll('[data-sp-embed]')) {
    if (MOUNTED.has(host)) continue;
    const text = jsonChild(host);
    if (text === undefined) continue;
    handles.push(mount(host, text, options));
  }
  return handles;
}
