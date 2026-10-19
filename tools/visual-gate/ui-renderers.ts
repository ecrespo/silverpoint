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
import { createElement, Fragment, type ComponentType } from 'react';
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

/** A fixture's composed parts: Glyph `all` and Avatar `group` repeat a component, Collapse holds its items (Data Model §5). */
interface Composed {
  readonly glyphs?: readonly string[];
  readonly avatars?: readonly Record<string, unknown>[];
  readonly items?: readonly (Record<string, unknown> & { readonly content?: string; readonly open?: boolean })[];
}

/** The fixture's parts, with what a consumer writes as children taken out of the props. */
function parts(fixture: UiFixture) {
  const { props, value, slots, trigger } = uiFixtureParts(fixture);
  const { glyphs, avatars, items: collapseItems, ...rest } = props as typeof props & Composed;
  const items = fixture.component === 'collapse' ? collapseItems : undefined;
  const own = fixture.component === 'collapse' ? rest : props;
  const common = { ground: props.ground, substrate: props.substrate, mode: props.mode, size: props.size };
  // A menu's fixtures show its own button (the canonical has no trigger slot).
  const triggerText = fixture.component === 'dropdown-menu' ? undefined : trigger;
  return { props: own, rest, value, slots, glyphs, avatars, items, common, trigger: triggerText };
}

/** A fixture as a React consumer writes it: an overlay's trigger as a `trigger` element, a toast's action and a footer as props. */
export function reactUiElement(fixture: UiFixture) {
  const { props, rest, value, slots, glyphs, avatars, items, common, trigger } = parts(fixture);
  const ui = ReactUi as unknown as Readonly<Record<string, ComponentType<Record<string, unknown>>>>;
  if (glyphs) return createElement(Fragment, null, ...glyphs.map((glyph) => createElement(ui.SpGlyph!, { key: glyph, ...common, glyph })));
  if (avatars) return createElement(ui.SpAvatarGroup!, rest, ...avatars.map((avatar, i) => createElement(ui.SpAvatar!, { key: i, ...common, ...avatar })));
  if (items) {
    return createElement(
      ui.SpCollapse!,
      props,
      ...items.map(({ key, content, open, ...item }) => createElement(ui.SpCollapseItem!, { key: key as string, ...common, ...item, defaultOpen: open }, content)),
    );
  }
  const bound = value === undefined ? {} : typeof value === 'boolean' ? { defaultChecked: value } : { defaultValue: value };
  const named = {
    ...(slots.extra ? { extra: slots.extra } : {}),
    ...(slots.footer ? { footer: slots.footer } : {}),
    ...(slots.action ? { action: slots.action } : {}),
    ...(trigger !== undefined ? { trigger: createElement('button', { type: 'button' }, trigger) } : {}),
  };
  return createElement(table<ComponentType<object>>(ReactUi, fixture.component), { ...props, ...bound, ...named }, slots.content);
}

/** A fixture as a Vue consumer writes it: named slots, an overlay's trigger in its `trigger` slot. */
export function vueUiNode(fixture: UiFixture) {
  const { props, rest, value, slots, glyphs, avatars, items, common, trigger } = parts(fixture);
  const ui = VueUi as unknown as Readonly<Record<string, VueComponent>>;
  if (glyphs) return h('div', glyphs.map((glyph) => h(ui.SpGlyph!, { ...common, glyph })));
  if (avatars) return h(ui.SpAvatarGroup!, rest, () => avatars.map((avatar) => h(ui.SpAvatar!, { ...common, ...avatar })));
  if (items) return h(ui.SpCollapse!, props, () => items.map(({ key, content, open, ...item }) => h(ui.SpCollapseItem!, { key: key as string, ...common, ...item, defaultOpen: open }, () => content)));
  const children = {
    ...(slots.content !== undefined ? { default: () => slots.content } : {}),
    ...(slots.extra !== undefined ? { extra: () => slots.extra } : {}),
    ...(slots.footer !== undefined ? { footer: () => slots.footer } : {}),
    ...(slots.action !== undefined ? { action: () => slots.action } : {}),
    ...(trigger !== undefined ? { trigger: () => h('button', { type: 'button' }, trigger) } : {}),
  };
  return h(table<VueComponent>(VueUi, fixture.component), { ...props, ...(value === undefined ? {} : { defaultValue: value }) }, children);
}

/** How an Angular consumer writes each component: `SpButton` and `SpSurface` decorate their own element (DD-024). */
const ANGULAR_TAGS: Readonly<Record<string, { open: string; close: string }>> = {
  button: { open: '<button spButton', close: '</button>' },
  surface: { open: '<div spSurface', close: '</div>' },
};
const escapeText = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/{/g, "{{ '{' }}");
const COMMON = ['ground', 'substrate', 'mode', 'size', 'palette'] as const;

/** A fixture as an Angular consumer writes it: a host component with its template; named slots as templates, a trigger marked `spTrigger`. */
export function angularUiHost(fixture: UiFixture): Type<unknown> {
  const { props, rest, value, slots, glyphs, avatars, items, trigger } = parts(fixture);
  const common = COMMON.filter((name) => props[name] !== undefined)
    .map((name) => `[${name}]="props.${name}"`)
    .join(' ');
  let template: string;
  if (glyphs) template = `@for (g of glyphs; track g) {<sp-glyph ${common} [glyph]="g" />}`;
  else if (avatars) {
    const own = Object.keys(rest).map((name) => `[${name}]="props.${name}"`).join(' ');
    template = `<sp-avatar-group ${own}>@for (a of avatars; track $index) {<sp-avatar ${common} [name]="a.name" [shape]="a.shape" />}</sp-avatar-group>`;
  } else if (items) {
    const own = Object.keys(props).map((name) => `[${name}]="props.${name}"`).join(' ');
    template =
      `<sp-collapse ${own}>` +
      `@for (i of items; track i['key']) {<sp-collapse-item ${common} [title]="i['title']" [disabled]="i['disabled']" [defaultOpen]="i['open']">{{ i['content'] }}</sp-collapse-item>}` +
      `</sp-collapse>`;
  } else {
    const tag = `sp-${fixture.component}`;
    const { open, close } = ANGULAR_TAGS[fixture.component] ?? { open: `<${tag}`, close: `</${tag}>` };
    const inputs = Object.keys(props).map((name) => `[${name}]="props.${name}"`);
    if (value !== undefined) inputs.push('[value]="value"');
    const named = (directive: string, text: string | undefined) => (text !== undefined ? `<ng-template ${directive}>${escapeText(text)}</ng-template>` : '');
    const button = trigger !== undefined ? `<button type="button" spTrigger>${escapeText(trigger)}</button>` : '';
    const content = slots.content !== undefined ? escapeText(slots.content) : '';
    template = `${open} ${inputs.join(' ')}>${button}${named('spExtra', slots.extra)}${named('spFooter', slots.footer)}${named('spAction', slots.action)}${content}${close}`;
  }
  const imports = Object.values(AngularUi).filter((v): v is Type<unknown> => typeof v === 'function');
  return Component({ selector: 'app-root', imports, template })(
    class Host {
      props = props;
      value = value;
      glyphs = glyphs;
      avatars = avatars;
      items = items;
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
