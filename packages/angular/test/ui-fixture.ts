import { Component, type ApplicationRef, type EnvironmentProviders, type Provider, type Type } from '@angular/core';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { SpCardExtra } from '@silverpoint/angular/ui/card';
import { uiFixtureParts, type UiFixture } from '../../../tools/visual-gate/ui-matrix';

/** How a consumer writes each B1 component in a template. `SpButton` is an attribute component (DD-024). */
export const UI_SELECTORS: Readonly<Record<string, { open: string; close: string }>> = {
  button: { open: '<button spButton', close: '</button>' },
  input: { open: '<sp-input', close: '</sp-input>' },
  checkbox: { open: '<sp-checkbox', close: '</sp-checkbox>' },
  switch: { open: '<sp-switch', close: '</sp-switch>' },
  card: { open: '<sp-card', close: '</sp-card>' },
  divider: { open: '<sp-divider', close: '</sp-divider>' },
};

const escapeText = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/{/g, "{{ '{' }}");

/** A fixture as an Angular consumer writes it: inputs bound by property, the value by `[value]`, named slots as templates. */
export function angularFixtureTemplate(fixture: UiFixture): { template: string; props: Record<string, unknown>; value: unknown } {
  const { props, value, slots } = uiFixtureParts(fixture);
  const { open, close } = UI_SELECTORS[fixture.component]!;
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
