import type { UiElement, UiNode, UiSlot } from '@silverpoint/core/ui';
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
  /**
   * Props added to each element the core marks `native`: value, handlers, a ref. A function when a
   * composite has several (one radio per item), each told apart by its own attributes.
   */
  readonly native?: Readonly<Record<string, unknown>> | ((node: UiElement) => Readonly<Record<string, unknown>>);
  /** Props added to the close button of a Tag or an Alert. */
  readonly close?: Readonly<Record<string, unknown>>;
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
  if (node.bind === 'native') Object.assign(props, typeof bindings.native === 'function' ? bindings.native(node) : bindings.native);
  if (node.bind === 'close') Object.assign(props, bindings.close);
  return createElement(node.tag, props, ...node.children.map((child) => renderUi(child, bindings, false)));
}

/** Text content, when the children are text: what the accessible-name check reads (REQ-319). */
export function textOf(children: unknown): string | undefined {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  return children === undefined || children === null || children === false ? undefined : '·';
}
