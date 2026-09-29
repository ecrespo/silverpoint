import { Component, type ApplicationRef, type EnvironmentProviders, type Provider, type Type } from '@angular/core';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { SpCardExtra } from '@silverpoint/angular/ui/card';
import { uiFixtureParts, type UiFixture } from '../../../tools/visual-gate/ui-matrix';

/** How a consumer writes a component in a template: `<sp-<slug>>`, but `SpButton` is an attribute component (DD-024). */
export const selectorOf = (slug: string): { open: string; close: string } =>
  slug === 'button' ? { open: '<button spButton', close: '</button>' } : { open: `<sp-${slug}`, close: `</sp-${slug}>` };

const escapeText = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/{/g, "{{ '{' }}");

/** A fixture as an Angular consumer writes it: inputs bound by property, the value by `[value]`, named slots as templates. */
export function angularFixtureTemplate(fixture: UiFixture): { template: string; props: Record<string, unknown>; value: unknown } {
  const { props, value, slots } = uiFixtureParts(fixture);
  const { open, close } = selectorOf(fixture.component);
  const inputs = Object.keys(props).map((name) => `[${name}]="props.${name}"`);
  if (value !== undefined) inputs.push('[value]="value"');
  const extra = slots.extra !== undefined ? `<ng-template spExtra>${escapeText(slots.extra)}</ng-template>` : '';
  const content = slots.content !== undefined ? escapeText(slots.content) : '';
  return { template: `${open} ${inputs.join(' ')}>${extra}${content}${close}`, props, value };
}

export function fixtureHost(fixture: UiFixture, imports: readonly Type<unknown>[]): Type<unknown> {
  const { template, props, value } = angularFixtureTemplate(fixture);
  return Component({ selector: 'app-root', imports: [...imports, SpCardExtra], template })(
    class Host {
      props = props;
      value = value;
    },
  );
}

export function ssrHost(host: Type<unknown>, providers: (Provider | EnvironmentProviders)[] = []): Promise<string> {
  return renderApplication(
    (context: BootstrapContext): Promise<ApplicationRef> => bootstrapApplication(host, { providers: [provideServerRendering(), ...providers] }, context),
    { document: '<html><head></head><body><app-root></app-root></body></html>' },
  );
}
