/**
 * Server renderers of the three adapters for a UI fixture (DD-027), over the published builds:
 * React through `renderToStaticMarkup` (the Next.js server pass), Vue through
 * `@vue/server-renderer`, Angular through `renderApplication`. Each writes the fixture as its
 * consumers would: uncontrolled, the value as its default; named slots in the framework's idiom.
 * `@angular/compiler` must be loaded first, to link the partial-compiled APF bundles.
 */
import { Component, type ApplicationRef, type Type } from '@angular/core';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import * as AngularUi from '@silverpoint/angular/ui';
import * as ReactUi from '@silverpoint/react/ui';
import * as VueUi from '@silverpoint/vue/ui';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSSRApp, h, type Component as VueComponent } from 'vue';
import { renderToString } from 'vue/server-renderer';
import type { Adapter } from './string-gate';
import { GATED_UI, uiFixtureParts, type UiFixture } from './ui-matrix';

const component = (slug: string) => GATED_UI.find((c) => c.slug === slug)!.component;
const table = <T>(module: Readonly<Record<string, unknown>>, slug: string): T => {
  const found = module[component(slug)];
  if (!found) throw new Error(`No ${component(slug)} in the published build`);
  return found as T;
};

/** A fixture as a React consumer writes it. */
export function reactUiElement(fixture: UiFixture) {
  const { props, value, slots } = uiFixtureParts(fixture);
  const bound = value === undefined ? {} : typeof value === 'boolean' ? { defaultChecked: value } : { defaultValue: value };
  return createElement(table<ComponentType<object>>(ReactUi, fixture.component), { ...props, ...bound, ...(slots.extra ? { extra: slots.extra } : {}) }, slots.content);
}

/** A fixture as a Vue consumer writes it. */
export function vueUiNode(fixture: UiFixture) {
  const { props, value, slots } = uiFixtureParts(fixture);
  const children = {
    ...(slots.content !== undefined ? { default: () => slots.content } : {}),
    ...(slots.extra !== undefined ? { extra: () => slots.extra } : {}),
  };
  return h(table<VueComponent>(VueUi, fixture.component), { ...props, ...(value === undefined ? {} : { defaultValue: value }) }, children);
}

/** How an Angular consumer writes each component: `SpButton` decorates their `<button>` (DD-024). */
const ANGULAR_TAGS: Readonly<Record<string, { open: string; close: string }>> = {
  button: { open: '<button spButton', close: '</button>' },
};
const escapeText = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/{/g, "{{ '{' }}");

/** A fixture as an Angular consumer writes it: a host component with its template. */
export function angularUiHost(fixture: UiFixture): Type<unknown> {
  const { props, value, slots } = uiFixtureParts(fixture);
  const tag = `sp-${fixture.component}`;
  const { open, close } = ANGULAR_TAGS[fixture.component] ?? { open: `<${tag}`, close: `</${tag}>` };
  const inputs = Object.keys(props).map((name) => `[${name}]="props.${name}"`);
  if (value !== undefined) inputs.push('[value]="value"');
  const extra = slots.extra !== undefined ? `<ng-template spExtra>${escapeText(slots.extra)}</ng-template>` : '';
  const content = slots.content !== undefined ? escapeText(slots.content) : '';
  const imports = Object.values(AngularUi).filter((v): v is Type<unknown> => typeof v === 'function');
  return Component({ selector: 'app-root', imports, template: `${open} ${inputs.join(' ')}>${extra}${content}${close}` })(
    class Host {
      props = props;
      value = value;
    },
  );
}

export const uiRenderers: Readonly<Record<Adapter, (fixture: UiFixture) => Promise<string>>> = {
  async react(fixture) {
    return renderToStaticMarkup(reactUiElement(fixture));
  },
  async vue(fixture) {
    return renderToString(createSSRApp({ render: () => vueUiNode(fixture) }));
  },
  async angular(fixture) {
    const Host = angularUiHost(fixture);
    return renderApplication(
      (context: BootstrapContext): Promise<ApplicationRef> => bootstrapApplication(Host, { providers: [provideServerRendering()] }, context),
      { document: '<html><head></head><body><app-root></app-root></body></html>' },
    );
  },
};
