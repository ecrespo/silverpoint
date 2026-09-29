import type { UiNode, UiSlot } from '@silverpoint/core/ui';
import { createElement, type ReactNode } from 'react';

/** HTML attribute names React spells differently. */
const PROPS: Readonly<Record<string, string>> = { class: 'className', for: 'htmlFor', readonly: 'readOnly', tabindex: 'tabIndex' };

/** `--a:1;b:2` as React's style object; custom properties keep their names. */
function styleObject(value: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const declaration of value.split(';')) {
    const at = declaration.indexOf(':');
    if (at > 0) out[declaration.slice(0, at).trim()] = declaration.slice(at + 1).trim();
  }
  return out;
}

export interface UiBindings {
  /** Props added to the root element: a ref, a click handler. */
  readonly root?: Readonly<Record<string, unknown>>;
  /** Props added to the element the core marks `native`: value, handlers, a ref. */
  readonly native?: Readonly<Record<string, unknown>>;
  readonly slots?: Partial<Record<UiSlot, ReactNode>>;
}

/**
 * Writes the core's view tree as React elements (API delta §4): the markup is the core's, attribute
 * for attribute; this adds only the bindings. No hooks, so a server entry uses it as well (REQ-104).
 */
export function renderUi(node: UiNode, bindings: UiBindings, root = true): ReactNode {
  if ('text' in node) return node.text;
  if ('slot' in node) return bindings.slots?.[node.slot] ?? null;
  const props: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(node.attrs)) {
    props[PROPS[name] ?? name] = name === 'style' && typeof value === 'string' ? styleObject(value) : value;
  }
  if (root) Object.assign(props, bindings.root);
  if (node.bind === 'native') Object.assign(props, bindings.native);
  return createElement(node.tag, props, ...node.children.map((child) => renderUi(child, bindings, false)));
}
