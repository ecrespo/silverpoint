/**
 * The stylesheet through the CSS object model (REQ-643, DD-063): one constructed sheet per document
 * or shadow root, adopted once; where constructable sheets are missing, one `<style data-sp-embed>`.
 * Nothing here is an inline style a page's policy forbids.
 */
import { GROUND_CSS } from '../render/assets.generated';

type Root = Document | ShadowRoot;
const adopted = new WeakMap<Root, Set<string>>();

/** Adopts the ground stylesheet (and, once, the given font text) into the root that holds `node`. */
export function adoptStyles(node: Node, fonts: string): void {
  const found = node.getRootNode() as Node & Partial<Root>;
  // A document (9) or a shadow root (11 with a host); a detached subtree has neither.
  if (found.nodeType !== 9 && !(found.nodeType === 11 && 'host' in found)) return;
  const root = found as Root;
  const done = adopted.get(root) ?? new Set<string>();
  adopted.set(root, done);
  const parts = [...(fonts && !done.has('fonts') ? [['fonts', fonts] as const] : []), ...(!done.has('ground') ? [['ground', GROUND_CSS] as const] : [])];
  if (parts.length === 0) return;
  const text = parts.map(([, css]) => css).join('');
  for (const [name] of parts) done.add(name);
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(text);
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  } catch {
    const isDocument = root.nodeType === 9;
    const owner = isDocument ? (root as Document) : (root.ownerDocument as Document);
    const style = owner.createElement('style');
    style.setAttribute('data-sp-embed', '');
    style.textContent = text;
    (isDocument ? (root as Document).head : root).append(style);
  }
}
