import type { UiNode, UiSlot } from '@silverpoint/core/ui';
import { h, type VNodeChild } from 'vue';

export interface UiBindings {
  /** Props added to the root element: a click handler. */
  readonly root?: Readonly<Record<string, unknown>>;
  /** Props added to the element the core marks `native`: value, handlers. */
  readonly native?: Readonly<Record<string, unknown>>;
  /** Slot content, already rendered. */
  readonly slots?: Partial<Record<UiSlot, VNodeChild>>;
}

/**
 * Writes the core's view tree as Vue nodes (API delta §4): the markup is the core's, attribute for
 * attribute; this adds only the bindings (Art. 2).
 */
export function renderUi(node: UiNode, bindings: UiBindings, root = true): VNodeChild {
  if ('text' in node) return node.text;
  if ('slot' in node) return bindings.slots?.[node.slot] ?? null;
  const props: Record<string, unknown> = { ...node.attrs };
  if (root) Object.assign(props, bindings.root);
  if (node.bind === 'native') Object.assign(props, bindings.native);
  return h(node.tag, props, node.children.map((child) => renderUi(child, bindings, false)));
}
